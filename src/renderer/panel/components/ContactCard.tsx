import { useState } from 'react'
import type { AppSettings, ContactRole } from '../../../shared/types'

const ALL_ROLES: ContactRole[] = ['Tenant', 'Landlord', 'Buyer', 'Seller', 'Investor']

const ROLE_COLORS: Record<ContactRole, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }> = {
  Tenant: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', activeBg: 'bg-blue-50', activeBorder: 'border-blue-300', activeText: 'text-blue-700' },
  Landlord: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', activeBg: 'bg-amber-50', activeBorder: 'border-amber-300', activeText: 'text-amber-700' },
  Buyer: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', activeBg: 'bg-green-50', activeBorder: 'border-green-300', activeText: 'text-green-700' },
  Seller: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', activeBg: 'bg-red-50', activeBorder: 'border-red-300', activeText: 'text-red-700' },
  Investor: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', activeBg: 'bg-purple-50', activeBorder: 'border-purple-300', activeText: 'text-purple-700' }
}

interface ContactCardProps {
  e164: string
  displayNumber: string
  contactName: string
  onNameChange: (name: string) => void
  onClear: () => void
  whatsappMode: AppSettings['whatsappMode']
  oneNoteEnabled: boolean
  calendarEnabled: boolean
  followUpPromptEnabled: boolean
  roles: ContactRole[]
  onRolesChange: (roles: ContactRole[]) => void
}

export default function ContactCard({
  e164,
  displayNumber,
  contactName,
  onNameChange,
  onClear,
  whatsappMode,
  oneNoteEnabled,
  calendarEnabled,
  followUpPromptEnabled,
  roles,
  onRolesChange
}: ContactCardProps) {
  const [showNameInput, setShowNameInput] = useState(!!contactName)
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false)
  const [oneNoteError, setOneNoteError] = useState<string | null>(null)
  const [followUpStatus, setFollowUpStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleDial = () => {
    window.electronAPI.dial(e164)
    // Auto-open OneNote alongside dial if enabled (per CONTEXT.md decision)
    if (oneNoteEnabled) {
      window.electronAPI.openInOneNote(sessionData).catch(() => {
        // Silently fail — dial is the primary action, OneNote is secondary
      })
    }
  }

  const handleWhatsApp = (mode?: 'web' | 'desktop') => {
    window.electronAPI.openWhatsApp(e164, mode || whatsappMode)
    setShowWhatsAppMenu(false)
  }

  const toggleRole = (role: ContactRole) => {
    const next = roles.includes(role)
      ? roles.filter((r) => r !== role)
      : [...roles, role]
    onRolesChange(next)
  }

  const sessionData = { name: contactName, displayNumber, roles, e164 }

  const handleOneNote = async () => {
    setOneNoteError(null)
    const result = await window.electronAPI.openInOneNote(sessionData)
    if (!result.success) {
      setOneNoteError(result.error || 'Failed to open OneNote')
      setTimeout(() => setOneNoteError(null), 5000)
    }
  }

  const handleBookViewing = () => window.electronAPI.bookCalendar(sessionData, 'viewing')
  const handleBookConsult = () => window.electronAPI.bookCalendar(sessionData, 'consultation')

  const handleFollowUp = async (days: number) => {
    setFollowUpStatus(null)
    const result = await window.electronAPI.createFollowUp(sessionData, days)
    if (result.success) {
      setFollowUpStatus({ type: 'success', message: `Follow-up set for ${result.eventDate}` })
    } else {
      setFollowUpStatus({ type: 'error', message: result.error || 'Failed to create follow-up' })
    }
    setTimeout(() => setFollowUpStatus(null), 4000)
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

      {/* Action buttons - Dial + WhatsApp */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDial}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <span>&#128222;</span>
          <span>Dial</span>
        </button>

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

      {/* Role pills */}
      <div className="flex flex-wrap gap-1">
        {ALL_ROLES.map((role) => {
          const active = roles.includes(role)
          const colors = ROLE_COLORS[role]
          return (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-full border transition-colors ${
                active
                  ? `${colors.activeBg} ${colors.activeBorder} ${colors.activeText}`
                  : `${colors.bg} ${colors.border} ${colors.text} hover:bg-gray-100`
              }`}
            >
              {role}
            </button>
          )
        })}
      </div>

      {/* Integration buttons */}
      {(oneNoteEnabled || calendarEnabled) && (
        <div className="flex items-center gap-2 pt-1">
          {oneNoteEnabled && (
            <div className="flex-1">
              <button
                onClick={handleOneNote}
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                title="Open contact profile in OneNote"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 1.5h8a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z" />
                  <path d="M4 4v4M4 4l2.5 4M6.5 4v4" />
                </svg>
                <span>OneNote</span>
              </button>
              {oneNoteError && (
                <p className="text-xs text-red-500 mt-1">{oneNoteError}</p>
              )}
            </div>
          )}
          {calendarEnabled && (
            <>
              <button
                onClick={handleBookViewing}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                title="Book a property viewing in Google Calendar"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="2" width="10" height="9" rx="1" />
                  <path d="M1 5h10M4 0.5v2.5M8 0.5v2.5" />
                </svg>
                <span>Viewing</span>
              </button>
              <button
                onClick={handleBookConsult}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                title="Book a consultation in Google Calendar"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="2" width="10" height="9" rx="1" />
                  <path d="M1 5h10M4 0.5v2.5M8 0.5v2.5" />
                </svg>
                <span>Consult</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Follow-up reminder buttons */}
      {calendarEnabled && followUpPromptEnabled && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] text-gray-400 font-medium">Follow-up reminder</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleFollowUp(7)}
              className="flex-1 px-2 py-1 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
            >
              7 days
            </button>
            <button
              onClick={() => handleFollowUp(15)}
              className="flex-1 px-2 py-1 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
            >
              15 days
            </button>
            <button
              onClick={() => handleFollowUp(30)}
              className="flex-1 px-2 py-1 text-[11px] font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
            >
              30 days
            </button>
          </div>
          {followUpStatus && (
            <p className={`text-xs ${followUpStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {followUpStatus.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
