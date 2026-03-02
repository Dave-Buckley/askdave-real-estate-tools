interface FeatureTogglesProps {
  clipboardEnabled: boolean
  hotkeysEnabled: boolean
  onToggle: (key: string, value: boolean) => void
}

const FEATURES = [
  {
    key: 'clipboardEnabled',
    label: 'Clipboard Detection',
    description: 'Automatically detect phone numbers when you copy them'
  },
  {
    key: 'hotkeysEnabled',
    label: 'Global Hotkeys',
    description: 'Use keyboard shortcuts to quickly dial or open WhatsApp'
  }
]

/**
 * Toggle switches for clipboard detection and global hotkeys.
 */
export default function FeatureToggles({
  clipboardEnabled,
  hotkeysEnabled,
  onToggle
}: FeatureTogglesProps) {
  const values: Record<string, boolean> = {
    clipboardEnabled,
    hotkeysEnabled
  }

  return (
    <div className="space-y-3">
      {FEATURES.map((feature) => (
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
      ))}
    </div>
  )
}
