interface FeatureTogglesProps {
  clipboardEnabled: boolean
  hotkeysEnabled: boolean
  oneNoteEnabled: boolean
  calendarEnabled: boolean
  phoneLinkEnabled: boolean
  followUpPromptEnabled: boolean
  newsEnabled: boolean
  onToggle: (key: string, value: boolean) => void
}

const FEATURES = [
  {
    key: 'clipboardEnabled',
    label: 'Phone Detection',
    description: 'Auto-detect phone numbers when you copy text (Ctrl+C)'
  },
  {
    key: 'hotkeysEnabled',
    label: 'Global Hotkeys',
    description: 'Use keyboard shortcuts to quickly dial or open WhatsApp'
  },
  {
    key: 'oneNoteEnabled',
    label: 'OneNote Integration',
    description: 'Create notebooks and pages in OneNote desktop app per role'
  },
  {
    key: 'calendarEnabled',
    label: 'Google Calendar',
    description: 'Book viewings and consultations in Google Calendar'
  },
  {
    key: 'phoneLinkEnabled',
    label: 'Phone Link Detection',
    description: 'Detect incoming calls via Windows Phone Link',
    windowsOnly: true
  },
  {
    key: 'followUpPromptEnabled',
    label: 'Follow-up Reminders',
    description: 'Show follow-up reminder buttons (7, 15, 30 days) on contact cards'
  },
  {
    key: 'newsEnabled',
    label: 'News Feed',
    description: 'Show UAE real estate news from industry sources'
  }
]

export default function FeatureToggles({
  clipboardEnabled,
  hotkeysEnabled,
  oneNoteEnabled,
  calendarEnabled,
  phoneLinkEnabled,
  followUpPromptEnabled,
  newsEnabled,
  onToggle
}: FeatureTogglesProps) {
  const values: Record<string, boolean> = {
    clipboardEnabled,
    hotkeysEnabled,
    oneNoteEnabled,
    calendarEnabled,
    phoneLinkEnabled,
    followUpPromptEnabled,
    newsEnabled
  }

  const isWindows = navigator.userAgent.includes('Windows')

  return (
    <div className="space-y-3">
      {FEATURES.map((feature) => {
        if ('windowsOnly' in feature && feature.windowsOnly && !isWindows) return null
        return (
          <div key={feature.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#ededee]">{feature.label}</p>
              <p className="text-xs text-[#a1a1aa]">{feature.description}</p>
            </div>
            <button
              onClick={() => onToggle(feature.key, !values[feature.key])}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                values[feature.key] ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  values[feature.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
