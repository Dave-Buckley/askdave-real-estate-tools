import { useState, useMemo } from 'react'
import type { Template } from '../../../shared/types'

interface TemplatePreviewProps {
  template: Template
  e164: string
  contactName: string
  onBack: () => void
}

/**
 * Template preview with {name} substitution, editable message area,
 * "Send via WhatsApp" (primary) and "Copy" (secondary) actions.
 */
export default function TemplatePreview({
  template,
  e164,
  contactName,
  onBack
}: TemplatePreviewProps) {
  // Apply name substitution if name provided, otherwise leave placeholder
  const filledBody = useMemo(() => {
    if (contactName.trim()) {
      return template.body.replace(/\{name\}/g, contactName.trim())
    }
    return template.body
  }, [template.body, contactName])

  const [editableMessage, setEditableMessage] = useState(filledBody)
  const [copied, setCopied] = useState(false)

  // Update editable message when substitution changes
  // (This is the initial fill — user edits override)

  const handleSendWhatsApp = () => {
    window.electronAPI.sendWhatsAppMessage(e164, editableMessage)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: use the text selection approach
      console.error('Clipboard write failed')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>&larr;</span>
          <span>Back</span>
        </button>
        <span className="text-xs font-medium text-gray-700">{template.name}</span>
      </div>

      {/* Substitution hint */}
      {!contactName.trim() && template.body.includes('{name}') && (
        <p className="text-[10px] text-amber-500 bg-amber-50 px-2 py-1 rounded">
          Tip: Add a contact name to replace {'{name}'} placeholder
        </p>
      )}

      {/* Editable message area */}
      <textarea
        value={editableMessage}
        onChange={(e) => setEditableMessage(e.target.value)}
        className="w-full h-40 px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-300 leading-relaxed"
      />

      {/* Character count */}
      <p className="text-[10px] text-gray-400 text-right">
        {editableMessage.length} characters
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSendWhatsApp}
          className="flex-1 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#25D366' }}
        >
          Send via WhatsApp
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
