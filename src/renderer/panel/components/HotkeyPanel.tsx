import { useState, useCallback, useEffect } from 'react'
import { ArrowLeft, Shield } from 'lucide-react'
import type { AppSettings } from '../../../shared/types'

interface HotkeyPanelProps {
  settings: AppSettings
  onSaveHotkey: (key: string, value: string) => void
  onClearHotkey: (key: string) => void
  onBack: () => void
}

function displayAccelerator(accelerator: string): string {
  if (!accelerator) return 'Not set'
  const isMac = navigator.platform.toLowerCase().includes('mac')
  return accelerator
    .replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl')
    .replace('Command', 'Cmd')
    .replace('Control', 'Ctrl')
}

function keyEventToAccelerator(e: KeyboardEvent): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null
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

interface ShortcutRowProps {
  label: string
  description: string
  currentKey: string
  editable: boolean
  settingKey?: string
  onSave?: (key: string, value: string) => void
  onClear?: (key: string) => void
}

function ShortcutRow({ label, description, currentKey, editable, settingKey, onSave, onClear }: ShortcutRowProps) {
  const [recording, setRecording] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') {
      setRecording(false)
      setPendingKey(null)
      return
    }
    const acc = keyEventToAccelerator(e)
    if (acc) setPendingKey(acc)
  }, [])

  useEffect(() => {
    if (recording) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [recording, handleKeyDown])

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#ededee]">{label}</p>
        <p className="text-[13px] text-[#a1a1aa]">{description}</p>
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        {recording ? (
          <>
            <span className="text-[13px] font-mono text-indigo-400 bg-[rgba(99,102,241,0.14)] px-1.5 py-0.5 rounded">
              {pendingKey ? displayAccelerator(pendingKey) : 'Press keys...'}
            </span>
            <button
              onClick={() => {
                if (pendingKey && settingKey && onSave) onSave(settingKey, pendingKey)
                setRecording(false)
                setPendingKey(null)
              }}
              disabled={!pendingKey}
              className="px-1.5 py-0.5 text-[13px] text-white bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => { setRecording(false); setPendingKey(null) }}
              className="px-1.5 py-0.5 text-[13px] text-[#d4d4d8] bg-white/5 rounded hover:bg-white/10"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className={`text-[13px] font-mono px-1.5 py-0.5 rounded ${currentKey ? 'text-[#ededee] bg-white/5' : 'text-[#a1a1aa] bg-white/[0.03]'}`}>
              {displayAccelerator(currentKey)}
            </span>
            {editable && (
              <>
                <button
                  onClick={() => setRecording(true)}
                  className="px-1.5 py-0.5 text-[13px] text-indigo-400 border border-indigo-400/30 rounded hover:bg-indigo-400/10"
                >
                  Edit
                </button>
                {currentKey && onClear && settingKey && (
                  <button
                    onClick={() => onClear(settingKey)}
                    className="px-1.5 py-0.5 text-[13px] text-red-400 border border-red-400/30 rounded hover:bg-red-400/10"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function HotkeyPanel({ settings, onSaveHotkey, onClearHotkey, onBack }: HotkeyPanelProps) {
  return (
    <div className="space-y-3">
      {/* Built-in shortcuts */}
      <div className="bg-[#161617] border border-white/[0.07] rounded-lg p-3">
        <p className="text-[13px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1">Detection</p>
        <ShortcutRow
          label="Detect Phone Number"
          description="Auto-detects when you copy text (Ctrl+C)"
          currentKey="Auto"
          editable={false}
        />
      </div>

      {/* Customizable shortcuts */}
      <div className="bg-[#161617] border border-white/[0.07] rounded-lg p-3">
        <p className="text-[13px] font-medium text-[#a1a1aa] uppercase tracking-wider mb-1">Quick Actions</p>
        <ShortcutRow
          label="Dial"
          description="Call the detected number via Phone Link"
          currentKey={settings.dialHotkey}
          editable={true}
          settingKey="dialHotkey"
          onSave={onSaveHotkey}
          onClear={onClearHotkey}
        />
        <hr className="border-white/[0.07]" />
        <ShortcutRow
          label="WhatsApp"
          description="Open a WhatsApp chat with the detected number"
          currentKey={settings.whatsappHotkey}
          editable={true}
          settingKey="whatsappHotkey"
          onSave={onSaveHotkey}
          onClear={onClearHotkey}
        />
      </div>

      {/* Privacy note */}
      <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-lg p-2.5 flex items-start gap-2">
        <Shield size={16} strokeWidth={1.5} className="text-[#4ade80] mt-0.5 shrink-0" />
        <p className="text-[13px] text-[#4ade80]">
          Ask Dave Real Estate Tools does not record, store, or transmit any calls, messages, or conversations.
        </p>
      </div>
    </div>
  )
}
