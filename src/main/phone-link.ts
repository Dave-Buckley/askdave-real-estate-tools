import { execFile } from 'child_process'
import { store } from './store'
import { normalizePhone } from './phone'
import { getContact } from './contacts'
import { getPopupWindow } from './tray'

// PowerShell script that uses WinRT UserNotificationListener to poll Phone Link notifications
const PHONE_LINK_POLL_SCRIPT = `
$ErrorActionPreference = "SilentlyContinue"
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
  Function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
  }
  [Windows.UI.Notifications.Management.UserNotificationListener,Windows.UI.Notifications.Management,ContentType=WindowsRuntime] | Out-Null
  [Windows.UI.Notifications.NotificationKinds,Windows.UI.Notifications,ContentType=WindowsRuntime] | Out-Null
  $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
  $accessStatus = Await ($listener.RequestAccessAsync()) ([Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus])
  if ($accessStatus -ne 'Allowed') {
    Write-Output '{"status":"denied"}'
    exit
  }
  $notifs = Await ($listener.GetNotificationsAsync([Windows.UI.Notifications.NotificationKinds]::Toast)) ([System.Collections.Generic.IReadOnlyList[Windows.UI.Notifications.UserNotification]])
  $results = @()
  foreach ($n in $notifs) {
    $pkg = $n.AppInfo.AppUserModelId
    if ($pkg -like '*YourPhone*' -or $pkg -like '*PhoneLink*' -or $pkg -like '*Phone Link*') {
      $binding = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
      if ($binding) {
        $texts = @()
        foreach ($t in $binding.GetTextElements()) { $texts += $t.Text }
        $id = $n.Id
        $results += @{ id=$id; texts=$texts }
      }
    }
  }
  $json = @{ status='ok'; notifications=$results } | ConvertTo-Json -Depth 3 -Compress
  Write-Output $json
} catch {
  Write-Output ('{"status":"error","message":"' + ($_.Exception.Message -replace '"','\\"') + '"}')
}
`

// State tracking
let pollTimer: ReturnType<typeof setInterval> | null = null
let lastSeenNotificationIds: Set<number> = new Set()
let callInProgress = false
let lastCallE164: string | null = null
let lastCallDisplayNumber: string | null = null
let lastCallContactName: string | null = null

/**
 * Run the PowerShell polling script and process results.
 */
function pollPhoneLinkNotifications(): void {
  execFile(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', PHONE_LINK_POLL_SCRIPT],
    { timeout: 5000 },
    (err, stdout) => {
      if (err) {
        // Timeout or process error — log and continue polling
        console.warn('[phone-link] Poll error:', err.message)
        return
      }

      let result: { status: string; notifications?: Array<{ id: number; texts: string[] }>; message?: string }
      try {
        result = JSON.parse(stdout.trim())
      } catch {
        console.warn('[phone-link] Failed to parse PowerShell output:', stdout.slice(0, 200))
        return
      }

      if (result.status === 'denied') {
        console.warn('[phone-link] UserNotificationListener access denied — stopping watcher')
        stopPhoneLinkWatcher()
        const popup = getPopupWindow()
        if (popup && !popup.isDestroyed()) {
          popup.webContents.send('phone-link:access-denied')
        }
        return
      }

      if (result.status === 'error') {
        console.warn('[phone-link] PowerShell error:', result.message)
        return
      }

      if (result.status !== 'ok' || !Array.isArray(result.notifications)) {
        return
      }

      for (const notif of result.notifications) {
        if (lastSeenNotificationIds.has(notif.id)) continue

        lastSeenNotificationIds.add(notif.id)

        const textsLower = notif.texts.map((t) => t.toLowerCase())
        const allText = notif.texts.join(' ')

        // Detect incoming call
        const isIncoming = textsLower.some(
          (t) => t.includes('calling') || t.includes('incoming call')
        )
        // Detect call ended / missed call
        const isEnded = textsLower.some(
          (t) => t.includes('call ended') || t.includes('missed call')
        )

        // Extract phone number from notification text
        const phoneMatch = allText.match(/\+?\d[\d\s\-()\u202A\u202C]{7,}/)
        let e164: string | null = null
        let displayNumber = ''

        if (phoneMatch) {
          // Strip unicode direction marks and normalize
          const rawNumber = phoneMatch[0].replace(/[\u202A\u202C]/g, '').trim()
          e164 = normalizePhone(rawNumber)
          displayNumber = rawNumber
        }

        if (isIncoming && e164) {
          callInProgress = true
          const contact = getContact(e164)
          const contactName = contact?.name || null

          // Store for call-ended follow-up
          lastCallE164 = e164
          lastCallDisplayNumber = displayNumber
          lastCallContactName = contactName

          const popup = getPopupWindow()
          if (popup && !popup.isDestroyed()) {
            popup.show()
            popup.webContents.send('phone-link:incoming-call', { e164, displayNumber, contactName })
          }
        } else if (isEnded) {
          callInProgress = false

          // Use last known call data if this notification doesn't have a phone number
          const callE164 = e164 || lastCallE164
          const callDisplay = e164 ? displayNumber : (lastCallDisplayNumber || '')
          const callContactName = e164
            ? (getContact(e164)?.name || null)
            : lastCallContactName

          if (callE164) {
            const popup = getPopupWindow()
            if (popup && !popup.isDestroyed()) {
              popup.show()
              popup.webContents.send('phone-link:call-ended', {
                e164: callE164,
                displayNumber: callDisplay,
                contactName: callContactName
              })
            }
          }
        }
      }

      // Trim lastSeenNotificationIds to prevent memory leak (keep last 50)
      if (lastSeenNotificationIds.size > 50) {
        const entries = Array.from(lastSeenNotificationIds)
        lastSeenNotificationIds = new Set(entries.slice(entries.length - 50))
      }
    }
  )
}

/**
 * Start polling for Phone Link notifications.
 * Only runs on Windows when phoneLinkEnabled is true.
 */
export function startPhoneLinkWatcher(): void {
  if (process.platform !== 'win32') return
  if (!store.get('phoneLinkEnabled')) return

  // Run initial poll immediately
  pollPhoneLinkNotifications()

  // Poll every 2 seconds
  pollTimer = setInterval(pollPhoneLinkNotifications, 2000)
}

/**
 * Stop the Phone Link notification watcher.
 */
export function stopPhoneLinkWatcher(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  lastSeenNotificationIds = new Set()
  callInProgress = false
  lastCallE164 = null
  lastCallDisplayNumber = null
  lastCallContactName = null
}
