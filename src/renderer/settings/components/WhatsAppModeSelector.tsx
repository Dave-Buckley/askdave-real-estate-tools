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
              ? 'border-[rgba(37,211,102,0.3)] bg-[rgba(37,211,102,0.08)]'
              : 'border-white/[0.07] hover:border-white/[0.14]'
          }`}
        >
          <input
            type="radio"
            name="whatsappMode"
            value={option.value}
            checked={mode === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 accent-[#25D366]"
          />
          <div>
            <p className="text-sm font-medium text-[#ededee]">{option.label}</p>
            <p className="text-xs text-[#a1a1aa]">{option.description}</p>
          </div>
        </label>
      ))}
    </div>
  )
}
