import { useState, useEffect, useCallback } from 'react'
import { Shield, FolderOpen } from 'lucide-react'
import type { AppSettings } from '../../shared/types'
import FeatureToggles from './components/FeatureToggles'
import HotkeyRecorder from './components/HotkeyRecorder'
import WhatsAppModeSelector from './components/WhatsAppModeSelector'

function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [formsDir, setFormsDir] = useState('')

  useEffect(() => {
    window.settingsAPI.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
    window.settingsAPI.getCompletedFormsDir().then(setFormsDir)
  }, [])

  const saveAndUpdate = useCallback(async (partial: Partial<AppSettings>) => {
    if (!settings) return
    await window.settingsAPI.saveSettings(partial)
    setSettings({ ...settings, ...partial })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [settings])

  const handleToggle = useCallback((key: string, value: boolean) => {
    saveAndUpdate({ [key]: value } as Partial<AppSettings>)
  }, [saveAndUpdate])

  const handleSelectionHotkeyChange = useCallback((newKey: string) => {
    saveAndUpdate({ selectionHotkey: newKey })
  }, [saveAndUpdate])

  const handleSelectionHotkeyClear = useCallback(() => {
    saveAndUpdate({ selectionHotkey: '' })
  }, [saveAndUpdate])

  const handleDialHotkeyChange = useCallback((newKey: string) => {
    saveAndUpdate({ dialHotkey: newKey })
  }, [saveAndUpdate])

  const handleDialHotkeyClear = useCallback(() => {
    saveAndUpdate({ dialHotkey: '' })
  }, [saveAndUpdate])

  const handleWhatsAppHotkeyChange = useCallback((newKey: string) => {
    saveAndUpdate({ whatsappHotkey: newKey })
  }, [saveAndUpdate])

  const handleWhatsAppHotkeyClear = useCallback(() => {
    saveAndUpdate({ whatsappHotkey: '' })
  }, [saveAndUpdate])

  const handleWhatsAppModeChange = useCallback((mode: 'web' | 'desktop') => {
    saveAndUpdate({ whatsappMode: mode })
  }, [saveAndUpdate])


  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0e]">
        <p className="text-sm text-[#a1a1aa]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 bg-[#0d0d0e] min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#ededee]">Settings</h1>
        {saved && (
          <span className="text-xs text-[#4ade80] animate-pulse">Saved</span>
        )}
      </div>

      {/* Features section */}
      <section>
        <h2 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-3">Features</h2>
        <div className="bg-[#161617] rounded-lg border border-white/[0.07] p-4">
          <FeatureToggles
            clipboardEnabled={settings.clipboardEnabled}
            hotkeysEnabled={settings.hotkeysEnabled}
            oneNoteEnabled={settings.oneNoteEnabled}
            calendarEnabled={settings.calendarEnabled}
            phoneLinkEnabled={settings.phoneLinkEnabled}
            followUpPromptEnabled={settings.followUpPromptEnabled}
            newsEnabled={settings.newsEnabled}
            onToggle={handleToggle}
          />
        </div>
      </section>

      {/* Hotkeys section */}
      <section>
        <h2 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-3">Hotkeys</h2>
        <div className="bg-[#161617] rounded-lg border border-white/[0.07] p-4 space-y-2">
          <HotkeyRecorder
            label="Scan Selection"
            currentKey={settings.selectionHotkey}
            onKeyChange={handleSelectionHotkeyChange}
            onClear={handleSelectionHotkeyClear}
          />
          <hr className="border-white/[0.07]" />
          <HotkeyRecorder
            label="Dial"
            currentKey={settings.dialHotkey}
            onKeyChange={handleDialHotkeyChange}
            onClear={handleDialHotkeyClear}
          />
          <hr className="border-white/[0.07]" />
          <HotkeyRecorder
            label="WhatsApp"
            currentKey={settings.whatsappHotkey}
            onKeyChange={handleWhatsAppHotkeyChange}
            onClear={handleWhatsAppHotkeyClear}
          />
        </div>
      </section>

      {/* WhatsApp section */}
      <section>
        <h2 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-3">WhatsApp</h2>
        <div className="bg-[#161617] rounded-lg border border-white/[0.07] p-4">
          <WhatsAppModeSelector
            mode={settings.whatsappMode}
            onChange={handleWhatsAppModeChange}
          />
        </div>
      </section>

      {/* Folders section */}
      <section>
        <h2 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-3">Folders</h2>
        <div className="bg-[#161617] rounded-lg border border-white/[0.07] p-4 space-y-2">
          <div>
            <label className="text-xs text-[#a1a1aa] block mb-1">Completed Forms Folder</label>
            <div className="flex gap-2">
              <span className="flex-1 bg-[#0d0d0e] border border-white/[0.07] rounded-md px-2 py-1.5 text-[11px] text-[#ededee] truncate" title={formsDir}>
                {formsDir || 'Not set (using default)'}
              </span>
              <button
                onClick={async () => {
                  const result = await window.settingsAPI.pickCompletedFormsDir()
                  if (result.success && result.path) {
                    setFormsDir(result.path)
                    setSaved(true)
                    setTimeout(() => setSaved(false), 1500)
                  }
                }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-400 bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.3)] rounded-md hover:bg-[rgba(99,102,241,0.22)] transition-colors"
              >
                <FolderOpen size={13} />
                Browse
              </button>
            </div>
            <p className="text-[10px] text-[#5a5a60] mt-1">Where client document folders are created (Tenants, Buyers, Off-Plan, Secondary Sales)</p>
          </div>
        </div>
      </section>

      {/* Privacy note */}
      <section>
        <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-lg p-3 flex items-start gap-2">
          <Shield size={18} strokeWidth={1.5} className="text-[#4ade80] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-[#4ade80] font-medium">Privacy</p>
            <p className="text-xs text-[#4ade80]/80 mt-1">
              Ask Dave Real Estate Tools does not record, store, or transmit any calls, messages, or conversations. Your data stays on your device.
            </p>
          </div>
        </div>
      </section>

      {/* Legal disclaimer */}
      <section className="bg-[#161617] border border-white/[0.07] rounded-xl p-3">
        <p className="text-[10px] text-[#5a5a60] leading-relaxed">
          News headlines are sourced from publicly available RSS feeds and remain the intellectual property of their respective publishers. This app is not a media outlet and does not produce original news content. Meeting recordings are processed locally on your device using Whisper — no audio or transcripts are transmitted externally. Users are responsible for obtaining consent from all participants before recording, in accordance with UAE Federal Decree-Law No. 34 of 2021.
        </p>
      </section>

      {/* Version info */}
      <p className="text-[13px] text-[#a1a1aa] text-center">
        Ask Dave Real Estate Tools v1.0.0 &copy; 2026
      </p>
    </div>
  )
}

export default App
