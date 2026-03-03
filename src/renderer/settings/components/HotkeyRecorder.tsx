import { useState, useCallback, useEffect, useRef } from 'react'

interface HotkeyRecorderProps {
  label: string
  currentKey: string
  onKeyChange: (newKey: string) => void
  onClear?: () => void
}

/**
 * Convert a KeyboardEvent to Electron accelerator format.
 */
function keyEventToAccelerator(e: KeyboardEvent): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return null
  }

  const parts: string[] = []

  if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  if (parts.length === 0) return null

  let key = e.key
  if (key.length === 1) {
    key = key.toUpperCase()
  } else {
    const keyMap: Record<string, string> = {
      ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
      ' ': 'Space', Escape: 'Escape', Enter: 'Return', Backspace: 'Backspace',
      Delete: 'Delete', Tab: 'Tab', Home: 'Home', End: 'End',
      PageUp: 'PageUp', PageDown: 'PageDown',
      F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6',
      F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12'
    }
    key = keyMap[key] || key
  }

  parts.push(key)
  return parts.join('+')
}

/**
 * Convert Electron accelerator to human-readable display.
 */
export function displayAccelerator(accelerator: string): string {
  if (!accelerator) return 'Not set'
  const isMac = navigator.platform.toLowerCase().includes('mac')
  return accelerator
    .replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl')
    .replace('Command', 'Cmd')
    .replace('Control', 'Ctrl')
}

/**
 * Keyboard shortcut recorder with change and clear buttons.
 */
export default function HotkeyRecorder({
  label,
  currentKey,
  onKeyChange,
  onClear
}: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const recorderRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') {
      setRecording(false)
      setPendingKey(null)
      return
    }

    const accelerator = keyEventToAccelerator(e)
    if (accelerator) {
      setPendingKey(accelerator)
    }
  }, [])

  useEffect(() => {
    if (recording) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [recording, handleKeyDown])

  const handleSave = () => {
    if (pendingKey) {
      onKeyChange(pendingKey)
    }
    setRecording(false)
    setPendingKey(null)
  }

  const handleCancel = () => {
    setRecording(false)
    setPendingKey(null)
  }

  return (
    <div ref={recorderRef} className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-[#ededee]">{label}</p>
        <p className="text-xs text-[#a1a1aa] font-mono">
          {recording
            ? (pendingKey ? displayAccelerator(pendingKey) : 'Press new shortcut...')
            : displayAccelerator(currentKey)
          }
        </p>
      </div>
      <div className="flex items-center gap-1">
        {recording ? (
          <>
            <button
              onClick={handleSave}
              disabled={!pendingKey}
              className="px-2 py-0.5 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-0.5 text-xs text-[#d4d4d8] bg-white/5 rounded hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setRecording(true)}
              className="px-2 py-0.5 text-xs text-indigo-400 border border-indigo-400/30 rounded hover:bg-indigo-400/10 transition-colors"
            >
              Change
            </button>
            {onClear && currentKey && (
              <button
                onClick={onClear}
                className="px-2 py-0.5 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors"
              >
                Clear
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
