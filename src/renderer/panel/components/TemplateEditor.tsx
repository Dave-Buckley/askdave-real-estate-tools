import { useState } from 'react'
import type { Template } from '../../../shared/types'

interface TemplateEditorProps {
  template: Template | null // null = creating new
  onSave: (template: Template) => void
  onCancel: () => void
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
export default function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [category, setCategory] = useState(template?.category || 'other')
  const [body, setBody] = useState(template?.body || '')
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({})

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
      {/* Header */}
      <h2 className="text-sm font-semibold text-gray-700">
        {template ? 'Edit Template' : 'New Template'}
      </h2>

      {/* Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: undefined }) }}
          placeholder="e.g., Listing Introduction"
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
        />
        {errors.name && <p className="text-[10px] text-red-400 mt-0.5">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Message Body
          <span className="text-gray-400 ml-1">
            (use {'{name}'} for contact name)
          </span>
        </label>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setErrors({ ...errors, body: undefined }) }}
          placeholder="Hi {name}, I wanted to reach out about..."
          className={`w-full h-32 px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-300 leading-relaxed ${errors.body ? 'border-red-300' : 'border-gray-300'}`}
        />
        <div className="flex justify-between">
          {errors.body && <p className="text-[10px] text-red-400">{errors.body}</p>}
          <p className="text-[10px] text-gray-400 ml-auto">{body.length} characters</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
