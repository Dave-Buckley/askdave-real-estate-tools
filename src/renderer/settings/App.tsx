import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../../shared/types'
import FeatureToggles from './components/FeatureToggles'
import HotkeyRecorder from './components/HotkeyRecorder'
import WhatsAppModeSelector from './components/WhatsAppModeSelector'

interface AuthAccount {
  connected: boolean
  account: string | null
}

function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [microsoft, setMicrosoft] = useState<AuthAccount>({ connected: false, account: null })
  const [google, setGoogle] = useState<AuthAccount>({ connected: false, account: null })
  const [authLoading, setAuthLoading] = useState<string | null>(null)

  useEffect(() => {
    window.settingsAPI.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
    window.settingsAPI.getAuthState().then((state) => {
      setMicrosoft({ connected: state.microsoftConnected, account: state.microsoftAccount })
      setGoogle({ connected: state.googleConnected, account: state.googleAccount })
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

  const handleMicrosoftAuth = useCallback(async () => {
    if (microsoft.connected) {
      setAuthLoading('microsoft')
      const result = await window.settingsAPI.microsoftSignOut()
      setMicrosoft(result)
      setAuthLoading(null)
    } else {
      setAuthLoading('microsoft')
      try {
        const result = await window.settingsAPI.microsoftSignIn()
        setMicrosoft(result)
      } catch (err) {
        console.error('Microsoft sign-in failed:', err)
      }
      setAuthLoading(null)
    }
  }, [microsoft.connected])

  const handleGoogleAuth = useCallback(async () => {
    if (google.connected) {
      setAuthLoading('google')
      const result = await window.settingsAPI.googleSignOut()
      setGoogle(result)
      setAuthLoading(null)
    } else {
      setAuthLoading('google')
      try {
        const result = await window.settingsAPI.googleSignIn()
        setGoogle(result)
      } catch (err) {
        console.error('Google sign-in failed:', err)
      }
      setAuthLoading(null)
    }
  }, [google.connected])

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

      {/* Accounts section */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Accounts</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {/* Microsoft */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${microsoft.connected ? 'bg-green-400' : 'bg-gray-300'}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">Microsoft</p>
                <p className="text-xs text-gray-500">
                  {microsoft.connected ? microsoft.account ?? 'Connected' : 'OneNote integration'}
                </p>
              </div>
            </div>
            <button
              onClick={handleMicrosoftAuth}
              disabled={authLoading === 'microsoft'}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                microsoft.connected
                  ? 'text-red-600 border border-red-200 hover:bg-red-50'
                  : 'text-blue-600 border border-blue-200 hover:bg-blue-50'
              } ${authLoading === 'microsoft' ? 'opacity-50' : ''}`}
            >
              {authLoading === 'microsoft' ? '...' : microsoft.connected ? 'Sign Out' : 'Sign In'}
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Google */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${google.connected ? 'bg-green-400' : 'bg-gray-300'}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">Google</p>
                <p className="text-xs text-gray-500">
                  {google.connected ? google.account ?? 'Connected' : 'Calendar integration'}
                </p>
              </div>
            </div>
            <button
              onClick={handleGoogleAuth}
              disabled={authLoading === 'google'}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                google.connected
                  ? 'text-red-600 border border-red-200 hover:bg-red-50'
                  : 'text-blue-600 border border-blue-200 hover:bg-blue-50'
              } ${authLoading === 'google' ? 'opacity-50' : ''}`}
            >
              {authLoading === 'google' ? '...' : google.connected ? 'Sign Out' : 'Sign In'}
            </button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Features</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <FeatureToggles
            clipboardEnabled={settings.clipboardEnabled}
            hotkeysEnabled={settings.hotkeysEnabled}
            oneNoteEnabled={settings.oneNoteEnabled}
            calendarEnabled={settings.calendarEnabled}
            phoneLinkEnabled={settings.phoneLinkEnabled}
            followUpPromptEnabled={settings.followUpPromptEnabled}
            onToggle={handleToggle}
          />
        </div>
      </section>

      {/* Hotkeys section */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Hotkeys</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <HotkeyRecorder
            label="Scan Selection"
            currentKey={settings.selectionHotkey}
            onKeyChange={handleSelectionHotkeyChange}
            onClear={handleSelectionHotkeyClear}
          />
          <hr className="border-gray-100" />
          <HotkeyRecorder
            label="Dial"
            currentKey={settings.dialHotkey}
            onKeyChange={handleDialHotkeyChange}
            onClear={handleDialHotkeyClear}
          />
          <hr className="border-gray-100" />
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
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">WhatsApp</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <WhatsAppModeSelector
            mode={settings.whatsappMode}
            onChange={handleWhatsAppModeChange}
          />
        </div>
      </section>

      {/* Privacy note */}
      <section>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800 font-medium">Privacy</p>
          <p className="text-xs text-green-700 mt-1">
            Agent Kit does not record, store, or transmit any calls, messages, or conversations. Your data stays on your device.
          </p>
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
