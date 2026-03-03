import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { ContactRole, RoleTemplate } from '../../../shared/types'

const ROLE_COLORS: Record<ContactRole, { text: string; bg: string; border: string }> = {
  Tenant: { text: 'text-[#818cf8]', bg: 'bg-[rgba(99,102,241,0.14)]', border: 'border-[rgba(99,102,241,0.25)]' },
  Landlord: { text: 'text-[#fbbf24]', bg: 'bg-[rgba(245,158,11,0.12)]', border: 'border-[rgba(245,158,11,0.25)]' },
  Buyer: { text: 'text-[#4ade80]', bg: 'bg-[rgba(34,197,94,0.12)]', border: 'border-[rgba(34,197,94,0.25)]' },
  Seller: { text: 'text-[#f87171]', bg: 'bg-[rgba(239,68,68,0.12)]', border: 'border-[rgba(239,68,68,0.25)]' },
  Investor: { text: 'text-[#c084fc]', bg: 'bg-[rgba(168,85,247,0.12)]', border: 'border-[rgba(168,85,247,0.25)]' }
}

interface RoleTemplateEditorProps {
  role: ContactRole
  template: RoleTemplate
  defaultTemplate: RoleTemplate
  onSave: (role: ContactRole, template: RoleTemplate) => void
  onCancel: () => void
}

/** Convert string array to newline-separated text */
function toText(items: string[]): string {
  return items.join('\n')
}

/** Convert newline-separated text back to string array (drops empty lines) */
function fromText(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

export default function RoleTemplateEditor({ role, template, defaultTemplate, onSave, onCancel }: RoleTemplateEditorProps) {
  const [questionsText, setQuestionsText] = useState(toText(template.questions))
  const [documentsText, setDocumentsText] = useState(toText(template.documents))
  const colors = ROLE_COLORS[role]

  const handleSave = () => {
    onSave(role, {
      label: template.label,
      questions: fromText(questionsText),
      documents: fromText(documentsText)
    })
  }

  const handleReset = () => {
    setQuestionsText(toText(defaultTemplate.questions))
    setDocumentsText(toText(defaultTemplate.documents))
  }

  const hasChanges = questionsText !== toText(template.questions) ||
    documentsText !== toText(template.documents)

  return (
    <div className="space-y-3">
      {/* Role badge + reset */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.text} ${colors.bg} border ${colors.border}`}>
          {role}
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] text-[#a1a1aa] hover:text-[#ededee] transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw size={10} strokeWidth={1.5} />
          Reset
        </button>
      </div>

      {/* Qualifying Questions — single textarea, one question per line */}
      <div>
        <h4 className="text-xs font-semibold text-[#ededee] mb-1.5">
          Qualifying Questions ({fromText(questionsText).length})
        </h4>
        <textarea
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
          placeholder="One question per line..."
          className="w-full h-48 px-3 py-2 text-xs bg-white/5 border border-white/[0.07] rounded-md resize-none text-[#ededee] placeholder-[#5a5a60] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
        />
      </div>

      {/* Document Checklist — single textarea, one document per line */}
      <div>
        <h4 className="text-xs font-semibold text-[#ededee] mb-1.5">
          Document Checklist ({fromText(documentsText).length})
        </h4>
        <textarea
          value={documentsText}
          onChange={(e) => setDocumentsText(e.target.value)}
          placeholder="One document per line..."
          className="w-full h-28 px-3 py-2 text-xs bg-white/5 border border-white/[0.07] rounded-md resize-none text-[#ededee] placeholder-[#5a5a60] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-[#d4d4d8] bg-white/[0.06] border border-white/[0.07] rounded-md hover:bg-white/[0.1] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
