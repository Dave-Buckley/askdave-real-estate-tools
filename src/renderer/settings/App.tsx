import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../../shared/types'
import FeatureToggles from './components/FeatureToggles'
import HotkeyRecorder from './components/HotkeyRecorder'
import WhatsAppModeSelector from './components/WhatsAppModeSelector'

function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.settingsAPI.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
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

  const handleDialHotkeyChange = useCallback((newKey: string) => {
    saveAndUpdate({ dialHotkey: newKey })
  }, [saveAndUpdate])

  const handleWhatsAppHotkeyChange = useCallback((newKey: string) => {
    saveAndUpdate({ whatsappHotkey: newKey })
  }, [saveAndUpdate])

  const handleWhatsAppModeChange = useCallback((mode: 'web' | 'desktop') => {
    saveAndUpdate({ whatsappMode: mode })
  }, [saveAndUpdate])

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
        {saved && (
          <span className="text-xs text-green-500 animate-pulse">Saved</span>
        )}
      </div>

      {/* Features section */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Features</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <FeatureToggles
            clipboardEnabled={settings.clipboardEnabled}
            hotkeysEnabled={settings.hotkeysEnabled}
            onToggle={handleToggle}
          />
        </div>
      </section>

      {/* Hotkeys section */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Hotkeys</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <HotkeyRecorder
            label="Dial"
            currentKey={settings.dialHotkey}
            onKeyChange={handleDialHotkeyChange}
          />
          <hr className="border-gray-100" />
          <HotkeyRecorder
            label="WhatsApp"
            currentKey={settings.whatsappHotkey}
            onKeyChange={handleWhatsAppHotkeyChange}
          />
        </div>
      </section>

      {/* WhatsApp section */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">WhatsApp</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <WhatsAppModeSelector
            mode={settings.whatsappMode}
            onChange={handleWhatsAppModeChange}
          />
        </div>
      </section>

      {/* Version info */}
      <p className="text-[10px] text-gray-400 text-center">
        Agent Kit v1.0.0
      </p>
    </div>
  )
}

export default App
