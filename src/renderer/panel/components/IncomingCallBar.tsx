import { useState } from 'react'
import { X } from 'lucide-react'

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
      <div className="bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#818cf8]">Incoming call</p>
            <p className="text-sm font-semibold text-[#ededee]">{label}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        {oneNoteEnabled && (
          <button
            onClick={onOpenOneNote}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c084fc] bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.25)] rounded-md hover:bg-[rgba(168,85,247,0.2)] transition-colors"
          >
            Open in OneNote
          </button>
        )}
      </div>
    )
  }

  // type === 'ended'
  return (
    <div className="bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#fbbf24]">Call ended</p>
          <p className="text-sm font-semibold text-[#ededee]">{label}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <p className="text-xs text-[#fbbf24]">Set a follow-up?</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleFollowUp(7)}
          className="flex-1 px-2 py-1 text-[13px] font-medium text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded hover:bg-[rgba(245,158,11,0.16)] transition-colors"
        >
          7 days
        </button>
        <button
          onClick={() => handleFollowUp(15)}
          className="flex-1 px-2 py-1 text-[13px] font-medium text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded hover:bg-[rgba(245,158,11,0.16)] transition-colors"
        >
          15 days
        </button>
        <button
          onClick={() => handleFollowUp(30)}
          className="flex-1 px-2 py-1 text-[13px] font-medium text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded hover:bg-[rgba(245,158,11,0.16)] transition-colors"
        >
          30 days
        </button>
      </div>
      {followUpStatus && (
        <p className="text-xs text-[#4ade80]">{followUpStatus}</p>
      )}
    </div>
  )
}
