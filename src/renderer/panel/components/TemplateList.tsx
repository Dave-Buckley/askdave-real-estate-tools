import { useState } from 'react'
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
    introduction: 'bg-blue-100 text-blue-700',
    'follow-up': 'bg-amber-100 text-amber-700',
    viewing: 'bg-green-100 text-green-700',
    reminder: 'bg-purple-100 text-purple-700',
    alert: 'bg-red-100 text-red-700',
    'thank-you': 'bg-pink-100 text-pink-700',
    other: 'bg-gray-100 text-gray-700'
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-gray-400 mb-2">No templates. Create one to get started.</p>
        <button
          onClick={onCreate}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          + New Template
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Templates</h2>
        <button
          onClick={onCreate}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          + New
        </button>
      </div>

      {/* Template items */}
      {templates.map((template) => (
        <div
          key={template.id}
          className="group flex items-start gap-2 p-2 rounded-md hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 cursor-pointer transition-all"
          onClick={() => {
            if (hasActiveContact) {
              onSelect(template)
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium text-gray-800 truncate">{template.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColors[template.category] || categoryColors.other}`}>
                {template.category}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">{template.body}</p>
          </div>

          {/* Action buttons (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(template) }}
              className="p-1 text-gray-400 hover:text-gray-600 text-xs"
              title="Edit"
            >
              &#9998;
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(template.id) }}
              className={`p-1 text-xs ${confirmDeleteId === template.id ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
              title={confirmDeleteId === template.id ? 'Click again to confirm' : 'Delete'}
            >
              {confirmDeleteId === template.id ? '?' : '\u2717'}
            </button>
          </div>
        </div>
      ))}

      {!hasActiveContact && (
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Enter a phone number to use templates
        </p>
      )}
    </div>
  )
}
