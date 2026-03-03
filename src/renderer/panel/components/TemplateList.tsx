import { useState } from 'react'
import { Pencil, X, Plus } from 'lucide-react'
import type { Template } from '../../../shared/types'

interface TemplateListProps {
  templates: Template[]
  onSelect: (template: Template) => void
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
  onCreate: () => void
  hasActiveContact: boolean
}

/**
 * Scrollable list of message templates with select, edit, delete actions.
 */
export default function TemplateList({
  templates,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  hasActiveContact
}: TemplateListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      // Auto-cancel confirm after 3 seconds
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const categoryColors: Record<string, string> = {
    introduction: 'bg-[rgba(99,102,241,0.14)] text-[#818cf8]',
    'follow-up': 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24]',
    viewing: 'bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
    reminder: 'bg-[rgba(168,85,247,0.12)] text-[#c084fc]',
    alert: 'bg-[rgba(239,68,68,0.12)] text-[#f87171]',
    'thank-you': 'bg-[rgba(236,72,153,0.12)] text-[#f472b6]',
    other: 'bg-white/5 text-[#d4d4d8]'
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[#a1a1aa] mb-2">No templates. Create one to get started.</p>
        <button
          onClick={onCreate}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto"
        >
          <Plus size={16} strokeWidth={1.5} />
          New Template
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Templates</h2>
        <button
          onClick={onCreate}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
        >
          <Plus size={16} strokeWidth={1.5} />
          New
        </button>
      </div>

      {/* Template items */}
      {templates.map((template) => (
        <div
          key={template.id}
          className="group flex items-start gap-2 p-2 rounded-md hover:bg-white/[0.04] border border-transparent hover:border-white/[0.07] cursor-pointer transition-all"
          onClick={() => {
            if (hasActiveContact) {
              onSelect(template)
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium text-[#ededee] truncate">{template.name}</span>
              <span className={`text-[13px] px-1.5 py-0.5 rounded-full ${categoryColors[template.category] || categoryColors.other}`}>
                {template.category}
              </span>
            </div>
            <p className="text-[13px] text-[#a1a1aa] truncate">{template.body}</p>
          </div>

          {/* Action buttons (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(template) }}
              className="p-1 text-[#a1a1aa] hover:text-indigo-400 transition-colors"
              title="Edit"
            >
              <Pencil size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(template.id) }}
              className={`p-1 ${confirmDeleteId === template.id ? 'text-red-400' : 'text-[#a1a1aa] hover:text-red-400'} transition-colors`}
              title={confirmDeleteId === template.id ? 'Click again to confirm' : 'Delete'}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}

      {!hasActiveContact && (
        <p className="text-[13px] text-[#a1a1aa] text-center mt-2">
          Enter a phone number to use templates
        </p>
      )}
    </div>
  )
}
