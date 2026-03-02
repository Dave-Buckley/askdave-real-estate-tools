import { useState, useCallback, useEffect, useRef } from 'react'

interface HotkeyRecorderProps {
  label: string
  currentKey: string
  onKeyChange: (newKey: string) => void
}

/**
 * Convert a KeyboardEvent to Electron accelerator format.
 * e.g., Ctrl+Shift+D or CommandOrControl+Shift+W
 */
function keyEventToAccelerator(e: KeyboardEvent): string | null {
  // Ignore modifier-only presses
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return null
  }

  const parts: string[] = []

  if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  // Require at least one modifier
  if (parts.length === 0) return null

  // Get the key name
  let key = e.key
  if (key.length === 1) {
    key = key.toUpperCase()
  } else {
    // Map special keys to Electron names
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
 * e.g., "CommandOrControl+Shift+D" -> "Ctrl+Shift+D" (Windows) or "Cmd+Shift+D" (macOS)
 */
function displayAccelerator(accelerator: string): string {
  const isMac = navigator.platform.toLowerCase().includes('mac')
  return accelerator
    .replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl')
    .replace('Command', 'Cmd')
    .replace('Control', 'Ctrl')
}

/**
 * Keyboard shortcut recorder component.
 * Allows user to press a new key combination to customize hotkeys.
 */
export default function HotkeyRecorder({
  label,
  currentKey,
  onKeyChange
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
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 font-mono">
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
              className="px-2 py-0.5 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-40 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setRecording(true)}
            className="px-2 py-0.5 text-xs text-blue-500 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
          >
            Change
          </button>
        )}
      </div>
    </div>
  )
}
