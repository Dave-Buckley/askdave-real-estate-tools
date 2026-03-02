import { useState } from 'react'
import type { AppSettings } from '../../../shared/types'

interface ContactCardProps {
  e164: string
  displayNumber: string
  contactName: string
  onNameChange: (name: string) => void
  onClear: () => void
  whatsappMode: AppSettings['whatsappMode']
}

/**
 * Contact card showing formatted phone number, action buttons (Dial + WhatsApp),
 * and an optional "Add name" field for template substitution.
 */
export default function ContactCard({
  e164,
  displayNumber,
  contactName,
  onNameChange,
  onClear,
  whatsappMode
}: ContactCardProps) {
  const [showNameInput, setShowNameInput] = useState(!!contactName)
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false)

  const handleDial = () => {
    window.electronAPI.dial(e164)
  }

  const handleWhatsApp = (mode?: 'web' | 'desktop') => {
    window.electronAPI.openWhatsApp(e164, mode || whatsappMode)
    setShowWhatsAppMenu(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      {/* Phone number and clear button */}
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-900 tracking-wide">
          {displayNumber}
        </span>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 text-xs px-1"
          title="Clear"
        >
          &#10005;
        </button>
      </div>

      {/* Contact name (if entered) */}
      {contactName && (
        <p className="text-xs text-gray-500">{contactName}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Dial button */}
        <button
          onClick={handleDial}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <span>&#128222;</span>
          <span>Dial</span>
        </button>

        {/* WhatsApp button with dropdown */}
        <div className="relative flex-1">
          <div className="flex">
            <button
              onClick={() => handleWhatsApp()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-white rounded-l-md hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#25D366' }}
            >
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setShowWhatsAppMenu(!showWhatsAppMenu)}
              className="px-1.5 py-1.5 text-sm text-white rounded-r-md border-l border-white/30 hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#25D366' }}
            >
              <span className="text-xs">&#9660;</span>
            </button>
          </div>

          {/* Dropdown menu */}
          {showWhatsAppMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <button
                onClick={() => handleWhatsApp('web')}
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Open in Browser
              </button>
              <button
                onClick={() => handleWhatsApp('desktop')}
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Open Desktop App
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add name link / name input */}
      {!showNameInput ? (
        <button
          onClick={() => setShowNameInput(true)}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          + Add name
        </button>
      ) : (
        <input
          type="text"
          value={contactName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Contact name (for templates)"
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
          autoFocus
        />
      )}
    </div>
  )
}
