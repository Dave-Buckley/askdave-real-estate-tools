interface WhatsAppModeSelectorProps {
  mode: 'web' | 'desktop'
  onChange: (mode: 'web' | 'desktop') => void
}

const OPTIONS = [
  {
    value: 'web' as const,
    label: 'Web / Phone',
    description: 'Opens WhatsApp in your browser (works on all devices)'
  },
  {
    value: 'desktop' as const,
    label: 'Desktop App',
    description: 'Opens WhatsApp desktop app directly (must be installed)'
  }
]

/**
 * Radio button selector for default WhatsApp open mode.
 */
export default function WhatsAppModeSelector({ mode, onChange }: WhatsAppModeSelectorProps) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
            mode === option.value
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="whatsappMode"
            value={option.value}
            checked={mode === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 accent-green-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-800">{option.label}</p>
            <p className="text-xs text-gray-500">{option.description}</p>
          </div>
        </label>
      ))}
    </div>
  )
}
