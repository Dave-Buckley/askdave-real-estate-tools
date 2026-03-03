import { clipboard } from 'electron'
import { exec } from 'child_process'
import { extractPhoneNumber } from './clipboard'
import { formatForDisplay } from './phone'

/**
 * Simulate Ctrl+C (or Cmd+C on macOS) to copy the current OS-level text selection
 * to the clipboard. Uses platform-native scripting for reliability.
 */
function simulateCopy(): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = process.platform

    if (platform === 'win32') {
      // PowerShell: simulate Ctrl+C keypress
      exec(
        'powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"',
        { timeout: 2000 },
        (err) => (err ? reject(err) : resolve())
      )
    } else if (platform === 'darwin') {
      exec(
        'osascript -e \'tell application "System Events" to keystroke "c" using command down\'',
        { timeout: 2000 },
        (err) => (err ? reject(err) : resolve())
      )
    } else {
      // Linux: xdotool
      exec('xdotool key ctrl+c', { timeout: 2000 }, (err) =>
        err ? reject(err) : resolve()
      )
    }
  })
}

/**
 * Grab the currently selected text from any application.
 *
 * Flow:
 * 1. Save current clipboard content
 * 2. Simulate Ctrl+C to copy selection
 * 3. Wait for clipboard to update
 * 4. Read the new clipboard content
 * 5. Restore original clipboard content
 * 6. Return the selected text (or null if nothing was selected)
 */
export async function grabSelection(): Promise<string | null> {
  const savedClipboard = clipboard.readText()

  // Clear clipboard so we can detect if anything was actually copied
  clipboard.writeText('')

  try {
    await simulateCopy()
  } catch (err) {
    // Restore clipboard on error
    clipboard.writeText(savedClipboard)
    console.error('Failed to simulate copy:', err)
    return null
  }

  // Wait for the simulated keypress to be processed by the target app
  await new Promise((r) => setTimeout(r, 150))

  const selected = clipboard.readText()

  // Restore original clipboard content
  clipboard.writeText(savedClipboard)

  // If clipboard is still empty, nothing was selected
  if (!selected || selected.trim().length === 0) {
    return null
  }

  return selected.trim()
}

/**
 * Email regex — matches email addresses within a line.
 */
const EMAIL_INLINE_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

/**
 * Extract structured contact info from a block of text.
 * Pulls phone, email, and guesses name from remaining lines.
 */
export interface ExtractedContact {
  e164?: string
  displayNumber?: string
  email?: string
  name?: string
  unit?: string
}

function extractContactInfo(text: string): ExtractedContact {
  const result: ExtractedContact = {}

  // Extract phone
  const e164 = extractPhoneNumber(text)
  if (e164) {
    result.e164 = e164
    result.displayNumber = formatForDisplay(e164)
  }

  // Extract email
  const emailMatch = text.match(EMAIL_INLINE_REGEX)
  if (emailMatch) {
    result.email = emailMatch[0]
  }

  // Parse each line for name, unit/address
  const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean)
  const emailTest = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  for (const line of lines) {
    // Skip lines that contain an email address
    if (emailTest.test(line)) continue
    // Skip lines that are a phone number
    if (extractPhoneNumber(line)) continue

    // Extract unit/address lines (check before name so addresses aren't mistaken for names)
    // Handles: "Unit: 1204", "Property Interest: 2BR", "Current Address: ...", etc.
    const unitLabelMatch = line.match(
      /^(?:(?:current\s+)?(?:unit|apt|apartment|address|property(?:\s+(?:interest|address|type))?|villa|building|tower|flat|location|suite|floor))\s*[:：]\s*(.+)/i
    )
    if (unitLabelMatch && !result.unit) {
      result.unit = unitLabelMatch[1].trim()
      continue
    }
    // Handle "Unit 1204, Marina Heights Tower" (no colon, number follows keyword)
    const unitInlineMatch = line.match(/^(?:unit|apt|suite|flat|villa)\s+(\d.+)/i)
    if (unitInlineMatch && !result.unit) {
      result.unit = unitInlineMatch[0].trim() // keep "Unit 1204, ..." as-is
      continue
    }

    // Skip CRM/contact labels that aren't name, phone, email, or unit
    if (/^(phone|tel|mobile|email|e-?mail|fax|role|website|url|http|company|job\s*title|budget|timeline|nationality|preferred|alternate|secondary|current\s+address)/i.test(line)) continue

    // Extract name — first remaining line that looks like a name
    if (!result.name) {
      // Skip very long lines (likely descriptions, not names)
      if (line.length > 80) continue
      // Skip lines that are mostly digits
      if (line.replace(/\D/g, '').length > line.length / 2) continue
      // Strip "Name:", "Full Name:", "Contact:" prefix if present
      result.name = line.replace(/^((?:full\s+)?name|contact|client)\s*[:：]\s*/i, '')
    }
  }

  return result
}

/**
 * Grab selection, extract all contact fields (phone, email, name) from the text.
 * Supports single fields, multiple fields, and full text blocks.
 */
export async function grabSelectionAndDetectPhone(
  onPhoneDetected: (e164: string, displayNumber: string) => void,
  onEmailDetected?: (email: string) => void,
  onContactExtracted?: (info: ExtractedContact) => void
): Promise<void> {
  const text = await grabSelection()
  if (!text) return

  // For very long text (>2000 chars), skip — likely not a contact block
  if (text.length > 2000) return

  const info = extractContactInfo(text)

  // If we got multiple fields, use the batch callback
  const fieldCount = (info.e164 ? 1 : 0) + (info.email ? 1 : 0) + (info.name ? 1 : 0)
  if (fieldCount > 1 && onContactExtracted) {
    onContactExtracted(info)
    return
  }

  // Single field — use existing callbacks
  if (info.e164) {
    onPhoneDetected(info.e164, info.displayNumber!)
    return
  }
  if (info.email && onEmailDetected) {
    onEmailDetected(info.email)
  }
}
