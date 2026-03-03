import { useState, useRef } from 'react'
import type { Template } from '../../../shared/types'

interface TemplateEditorProps {
  template: Template | null // null = creating new
  onSave: (template: Template) => void
  onCancel: () => void
  hideCategory?: boolean
}

const CATEGORIES = [
  { value: 'introduction', label: 'Introduction' },
  { value: 'follow-up', label: 'Follow-Up' },
  { value: 'viewing', label: 'Viewing' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'alert', label: 'Alert' },
  { value: 'thank-you', label: 'Thank You' },
  { value: 'other', label: 'Other' }
]

/**
 * Template editor for creating and editing message templates.
 * Fields: name, category, body (with {name} placeholder hint).
 */
export default function TemplateEditor({ template, onSave, onCancel, hideCategory }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [category, setCategory] = useState(template?.category || 'other')
  const [body, setBody] = useState(template?.body || '')
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({})
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const insertPlaceholder = (placeholder: string) => {
    const el = bodyRef.current
    if (!el) { setBody(body + placeholder); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    const newBody = body.slice(0, start) + placeholder + body.slice(end)
    setBody(newBody)
    setTimeout(() => { el.focus(); el.setSelectionRange(start + placeholder.length, start + placeholder.length) }, 0)
  }

  const handleSave = () => {
    const newErrors: { name?: string; body?: string } = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!body.trim()) newErrors.body = 'Message body is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const id = template?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

    onSave({
      id,
      name: name.trim(),
      category,
      body: body.trim()
    })
  }

  return (
    <div className="space-y-3">
      {/* Name */}
      <div>
        <label className="block text-xs text-[#d4d4d8] mb-1">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: undefined }) }}
          placeholder="e.g., Listing Introduction"
          className={`w-full px-3 py-1.5 text-sm bg-white/5 border rounded-md text-[#ededee] placeholder-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${errors.name ? 'border-red-400/50' : 'border-white/[0.07]'}`}
        />
        {errors.name && <p className="text-[13px] text-red-400 mt-0.5">{errors.name}</p>}
      </div>

      {/* Category */}
      {!hideCategory && (
        <div>
          <label className="block text-xs text-[#d4d4d8] mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/[0.07] rounded-md text-[#ededee] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-[#1f1f21]">{cat.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Body */}
      <div>
        <label className="block text-xs text-[#d4d4d8] mb-1">Message Body</label>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-[#a1a1aa]">Insert:</span>
          <button
            type="button"
            onClick={() => insertPlaceholder('{name}')}
            className="px-1.5 py-0.5 text-[10px] font-medium text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded hover:bg-[rgba(99,102,241,0.22)] transition-colors"
          >
            {'{name}'}
          </button>
          <button
            type="button"
            onClick={() => insertPlaceholder('{number}')}
            className="px-1.5 py-0.5 text-[10px] font-medium text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded hover:bg-[rgba(99,102,241,0.22)] transition-colors"
          >
            {'{number}'}
          </button>
          <button
            type="button"
            onClick={() => insertPlaceholder('{unit}')}
            className="px-1.5 py-0.5 text-[10px] font-medium text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded hover:bg-[rgba(99,102,241,0.22)] transition-colors"
          >
            {'{unit}'}
          </button>
        </div>
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => { setBody(e.target.value); setErrors({ ...errors, body: undefined }) }}
          placeholder="Hi {name}, I wanted to reach out about {unit}..."
          className={`w-full h-32 px-3 py-2 text-sm bg-white/5 border rounded-md resize-none text-[#ededee] placeholder-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed ${errors.body ? 'border-red-400/50' : 'border-white/[0.07]'}`}
        />
        <div className="flex justify-between">
          {errors.body && <p className="text-[13px] text-red-400">{errors.body}</p>}
          <p className="text-[13px] text-[#a1a1aa] ml-auto">{body.length} characters</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm text-[#d4d4d8] bg-white/5 border border-white/[0.07] rounded-md hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
