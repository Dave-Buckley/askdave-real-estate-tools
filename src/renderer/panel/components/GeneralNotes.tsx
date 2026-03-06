import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { ContactRole } from '../../../shared/types'

const ALL_ROLES: ContactRole[] = ['Tenant', 'Landlord', 'Buyer', 'Seller', 'Investor']

interface GeneralNotesProps {
  e164: string
  displayNumber: string
  contactName: string
  contactEmail: string
  contactUnit: string
  contactRoles: ContactRole[]
  oneNotePageId?: string
  onPageCreated?: (pageId: string) => void
}

export default function GeneralNotes({
  e164,
  displayNumber,
  contactName,
  contactEmail,
  contactUnit,
  contactRoles,
  oneNotePageId,
  onPageCreated
}: GeneralNotesProps) {
  const [notes, setNotes] = useState('')
  const [pushing, setPushing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedRole, setSelectedRole] = useState<ContactRole>(contactRoles[0] || 'Tenant')
  const [focused, setFocused] = useState(false)

  const handlePush = async () => {
    if (!notes.trim() || pushing) return

    setPushing(true)
    setFeedback(null)

    try {
      const result = await window.electronAPI.pushNotesToOneNote({
        e164,
        name: contactName,
        displayNumber,
        notes: notes.trim(),
        role: oneNotePageId ? undefined : selectedRole,
        unit: contactUnit,
        email: contactEmail
      })

      if (result.success) {
        setNotes('')
        setFeedback({ type: 'success', message: 'Notes pushed to OneNote' })
        if (result.created && result.pageId && onPageCreated) {
          onPageCreated(result.pageId)
        }
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to push notes' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to push notes' })
    } finally {
      setPushing(false)
      setTimeout(() => setFeedback(null), 5000)
    }
  }

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-[13px] text-[#a1a1aa] font-medium">General Notes</p>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={focused || notes.length > 0 ? 5 : 2}
        placeholder="Quick notes..."
        disabled={pushing}
        className="w-full px-3 py-2 text-sm bg-white/[0.06] text-[#ededee] placeholder-[#5a5a60] border border-white/[0.1] rounded-md resize-none transition-all focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent focus:outline-none disabled:opacity-50"
      />

      {/* Role dropdown — only when no OneNote page exists yet */}
      {!oneNotePageId && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#71717a] whitespace-nowrap">OneNote page role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as ContactRole)}
            disabled={pushing}
            className="flex-1 px-2 py-1 text-xs bg-white/[0.06] text-[#ededee] border border-white/[0.1] rounded-md focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent focus:outline-none disabled:opacity-50"
          >
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      )}

      {/* Push button */}
      <button
        onClick={handlePush}
        disabled={!notes.trim() || pushing}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-sm font-medium text-[#c084fc] bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.25)] rounded-md hover:bg-[rgba(168,85,247,0.2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pushing ? (
          <>
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            <span>Pushing...</span>
          </>
        ) : (
          <>
            <Send size={14} strokeWidth={1.5} />
            <span>Push to OneNote</span>
          </>
        )}
      </button>

      {/* Inline feedback */}
      {feedback && (
        <p className={`text-xs ${feedback.type === 'success' ? 'text-[#4ade80]' : 'text-red-400'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
