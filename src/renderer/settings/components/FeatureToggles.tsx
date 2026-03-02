interface FeatureTogglesProps {
  clipboardEnabled: boolean
  hotkeysEnabled: boolean
  oneNoteEnabled: boolean
  calendarEnabled: boolean
  phoneLinkEnabled: boolean
  followUpPromptEnabled: boolean
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
  }
]

export default function FeatureToggles({
  clipboardEnabled,
  hotkeysEnabled,
  oneNoteEnabled,
  calendarEnabled,
  phoneLinkEnabled,
  followUpPromptEnabled,
  onToggle
}: FeatureTogglesProps) {
  const values: Record<string, boolean> = {
    clipboardEnabled,
    hotkeysEnabled,
    oneNoteEnabled,
    calendarEnabled,
    phoneLinkEnabled,
    followUpPromptEnabled
  }

  const isWindows = navigator.userAgent.includes('Windows')

  return (
    <div className="space-y-3">
      {FEATURES.map((feature) => {
        if ('windowsOnly' in feature && feature.windowsOnly && !isWindows) return null
        return (
          <div key={feature.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{feature.label}</p>
              <p className="text-xs text-gray-500">{feature.description}</p>
            </div>
            <button
              onClick={() => onToggle(feature.key, !values[feature.key])}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                values[feature.key] ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                  values[feature.key] ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
