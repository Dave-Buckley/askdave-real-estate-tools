interface ActionBarProps {
  e164: string
  displayNumber: string
}

/**
 * Compact horizontal action bar for the clipboard popup.
 * Shows formatted phone number + Dial + WhatsApp + Dismiss buttons.
 * Styled as a lightweight floating toolbar.
 */
export default function ActionBar({ e164, displayNumber }: ActionBarProps) {
  const handleDial = () => {
    window.popupAPI.dial(e164)
  }

  const handleWhatsApp = () => {
    window.popupAPI.openWhatsApp(e164)
  }

  const handleDismiss = () => {
    window.popupAPI.dismiss()
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
      {/* Phone number */}
      <span className="text-xs font-medium text-gray-800 truncate min-w-0 flex-shrink">
        {displayNumber}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dial button */}
      <button
        onClick={handleDial}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
        title="Open in dialler"
      >
        <span>&#128222;</span>
        <span>Dial</span>
      </button>

      {/* WhatsApp button */}
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white rounded-md hover:opacity-90 transition-colors whitespace-nowrap"
        style={{ backgroundColor: '#25D366' }}
        title="Open in WhatsApp"
      >
        <span>WA</span>
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Dismiss"
      >
        <span className="text-xs">&#10005;</span>
      </button>
    </div>
  )
}
