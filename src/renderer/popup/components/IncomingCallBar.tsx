import { useState } from 'react'

interface IncomingCallBarProps {
  type: 'incoming' | 'ended'
  e164: string
  displayNumber: string
  contactName: string | null
  oneNoteEnabled: boolean
  onOpenOneNote: () => void
  onFollowUp: (days: number) => void
  onDismiss: () => void
}

export default function IncomingCallBar({
  type,
  displayNumber,
  contactName,
  oneNoteEnabled,
  onOpenOneNote,
  onFollowUp,
  onDismiss
}: IncomingCallBarProps) {
  const [followUpStatus, setFollowUpStatus] = useState<string | null>(null)
  const label = contactName || displayNumber

  const handleFollowUp = (days: number) => {
    onFollowUp(days)
    setFollowUpStatus(`Follow-up set for ${days} days`)
  }

  if (type === 'incoming') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-800">Incoming call</p>
            <p className="text-sm font-semibold text-blue-900">{label}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-blue-400 hover:text-blue-600 text-xs px-1"
            aria-label="Dismiss"
          >
            &#10005;
          </button>
        </div>
        {oneNoteEnabled && (
          <button
            onClick={onOpenOneNote}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
          >
            Open in OneNote
          </button>
        )}
      </div>
    )
  }

  // type === 'ended'
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-orange-800">Call ended</p>
          <p className="text-sm font-semibold text-orange-900">{label}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-orange-400 hover:text-orange-600 text-xs px-1"
          aria-label="Dismiss"
        >
          &#10005;
        </button>
      </div>
      <p className="text-xs text-orange-700">Set a follow-up?</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleFollowUp(7)}
          className="flex-1 px-2 py-1 text-[11px] font-medium text-orange-700 bg-white border border-orange-200 rounded hover:bg-orange-100 transition-colors"
        >
          7 days
        </button>
        <button
          onClick={() => handleFollowUp(15)}
          className="flex-1 px-2 py-1 text-[11px] font-medium text-orange-700 bg-white border border-orange-200 rounded hover:bg-orange-100 transition-colors"
        >
          15 days
        </button>
        <button
          onClick={() => handleFollowUp(30)}
          className="flex-1 px-2 py-1 text-[11px] font-medium text-orange-700 bg-white border border-orange-200 rounded hover:bg-orange-100 transition-colors"
        >
          30 days
        </button>
      </div>
      {followUpStatus && (
        <p className="text-xs text-green-600">{followUpStatus}</p>
      )}
    </div>
  )
}
