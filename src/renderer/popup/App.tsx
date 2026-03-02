import { useState, useEffect, useRef } from 'react'
import ActionBar from './components/ActionBar'
import MinimizedBar from './components/MinimizedBar'
import IncomingCallBar from './components/IncomingCallBar'

interface PhoneData {
  e164: string
  display: string
}

interface CallEvent {
  type: 'incoming' | 'ended'
  e164: string
  displayNumber: string
  contactName: string | null
}

function App(): React.JSX.Element {
  const [phoneNumber, setPhoneNumber] = useState<PhoneData | null>(null)
  const [contactName, setContactName] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [callEvent, setCallEvent] = useState<CallEvent | null>(null)
  const [oneNoteEnabled, setOneNoteEnabled] = useState(true)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load initial settings to get oneNoteEnabled
  useEffect(() => {
    window.popupAPI.getSettings().then((settings) => {
      const s = settings as { oneNoteEnabled?: boolean }
      setOneNoteEnabled(s.oneNoteEnabled ?? true)
    })
  }, [])

  // Schedule auto-dismiss for call events
  const scheduleCallEventDismiss = (type: 'incoming' | 'ended') => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
    }
    const timeout = type === 'incoming' ? 30000 : 15000
    dismissTimerRef.current = setTimeout(() => {
      setCallEvent(null)
    }, timeout)
  }

  useEffect(() => {
    window.popupAPI.onShow((e164, displayNumber) => {
      setPhoneNumber({ e164, display: displayNumber })
      setContactName('')
      setIsMinimized(false)
    })
    window.popupAPI.onMinimized(() => setIsMinimized(true))
    window.popupAPI.onRestored(() => setIsMinimized(false))
    window.popupAPI.onNameUpdated((e164, name) => {
      setPhoneNumber((prev) => {
        if (prev && prev.e164 === e164) {
          setContactName(name)
        }
        return prev
      })
    })

    // Phone Link incoming call events
    window.popupAPI.onIncomingCall((data) => {
      setCallEvent({ type: 'incoming', ...data })
      scheduleCallEventDismiss('incoming')
    })
    window.popupAPI.onCallEnded((data) => {
      setCallEvent({ type: 'ended', ...data })
      scheduleCallEventDismiss('ended')
    })

    // Settings updates (e.g., oneNoteEnabled toggled)
    window.popupAPI.onSettingsUpdated((settings) => {
      const s = settings as { oneNoteEnabled?: boolean }
      setOneNoteEnabled(s.oneNoteEnabled ?? true)
    })
  }, [])

  // Cleanup dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
      }
    }
  }, [])

  const handleDismissCallEvent = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setCallEvent(null)
  }

  const handleOpenOneNote = () => {
    if (!callEvent) return
    window.popupAPI.openInOneNote({
      name: callEvent.contactName || '',
      displayNumber: callEvent.displayNumber,
      roles: [],
      e164: callEvent.e164
    }).catch(() => {/* silent failure */})
  }

  const handleFollowUp = async (days: number) => {
    if (!callEvent) return
    const result = await window.popupAPI.createFollowUp(
      {
        name: callEvent.contactName || '',
        displayNumber: callEvent.displayNumber,
        roles: [],
        e164: callEvent.e164
      },
      days
    )
    if (result.success) {
      // Auto-dismiss after brief delay to show the status message
      setTimeout(() => setCallEvent(null), 2000)
    }
  }

  // Render: if no phone number and no call event, show empty
  if (!phoneNumber && !callEvent) {
    return <div className="h-screen bg-white" />
  }

  if (isMinimized) {
    return (
      <div className="h-screen bg-white flex flex-col">
        <MinimizedBar
          displayNumber={phoneNumber?.display ?? callEvent?.displayNumber ?? ''}
          onRestore={() => window.popupAPI.restore()}
        />
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      {/* Incoming call / call ended notification bar */}
      {callEvent && (
        <div className="px-3 pt-3 shrink-0">
          <IncomingCallBar
            type={callEvent.type}
            e164={callEvent.e164}
            displayNumber={callEvent.displayNumber}
            contactName={callEvent.contactName}
            oneNoteEnabled={oneNoteEnabled}
            onOpenOneNote={handleOpenOneNote}
            onFollowUp={handleFollowUp}
            onDismiss={handleDismissCallEvent}
          />
        </div>
      )}

      {/* Main action bar — only shown when a phone number is active */}
      {phoneNumber && (
        <ActionBar
          e164={phoneNumber.e164}
          displayNumber={phoneNumber.display}
          contactName={contactName}
          onNameChange={(name) => {
            setContactName(name)
            window.popupAPI.setName(phoneNumber.e164, name)
          }}
        />
      )}

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 opacity-30 hover:opacity-60 transition-opacity"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="8" r="1.5" />
          <circle cx="8" cy="12" r="1.5" />
        </svg>
      </div>
    </div>
  )
}

export default App
