import { useState, useCallback } from 'react'
import { Check, X as XIcon } from 'lucide-react'

interface PhoneInputProps {
  onSubmit: (rawNumber: string) => void
}

/**
 * Phone number input field with paste detection and validation feedback.
 * Compact single-line input for the 360px tray panel.
 */
export default function PhoneInput({ onSubmit }: PhoneInputProps) {
  const [value, setValue] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)

  // Simple client-side UAE phone number check for visual feedback
  const validateNumber = useCallback((input: string) => {
    const trimmed = input.trim()
    if (!trimmed) {
      setIsValid(null)
      return
    }
    // Loose UAE regex for validation feedback
    const uaePattern = /^(?:(?:\+|00)971|0)(?:5[0-9]|[2-9])\d{7}$/
    // Also accept already-formatted numbers with spaces/dashes
    const cleaned = trimmed.replace(/[\s\-()]/g, '')
    setIsValid(uaePattern.test(cleaned))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    validateNumber(newValue)
  }

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted) {
      // Let the paste complete, then validate
      setTimeout(() => {
        validateNumber(pasted)
      }, 0)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Enter or paste a phone number"
          className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/[0.07] rounded-md text-[#ededee] placeholder-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 pr-7 tabular-nums"
        />
        {isValid !== null && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check size={16} strokeWidth={1.5} className="text-[#4ade80]" />
            ) : (
              <XIcon size={16} strokeWidth={1.5} className="text-red-400" />
            )}
          </span>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="px-2.5 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Go
      </button>
    </div>
  )
}
