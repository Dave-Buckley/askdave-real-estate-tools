import { useState, useMemo } from 'react'
import { Copy, Check, Save, FilePlus } from 'lucide-react'
import type { Template } from '../../../shared/types'

interface TemplatePreviewProps {
  template: Template
  e164: string
  contactName: string
  contactUnit?: string
  onBack: () => void
  onUpdateTemplate?: (updatedBody: string) => void
  onSaveAsNew?: (name: string, body: string, category: string) => void
}

/**
 * Template preview with {name}/{unit} substitution, editable message area,
 * "Send via WhatsApp" (primary) and "Copy" (secondary) actions.
 */
export default function TemplatePreview({
  template,
  e164,
  contactName,
  contactUnit,
  onBack,
  onUpdateTemplate,
  onSaveAsNew
}: TemplatePreviewProps) {
  // Apply name and unit substitution if provided, otherwise leave placeholders
  const filledBody = useMemo(() => {
    let body = template.body
    if (contactName.trim()) {
      body = body.replace(/\{name\}/g, contactName.trim())
    }
    if (contactUnit?.trim()) {
      body = body.replace(/\{unit\}/g, contactUnit.trim())
    }
    return body
  }, [template.body, contactName, contactUnit])

  const [editableMessage, setEditableMessage] = useState(filledBody)
  const [copied, setCopied] = useState(false)
  const [showSaveAsNew, setShowSaveAsNew] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSendWhatsApp = (mode: 'web' | 'desktop') => {
    window.electronAPI.sendWhatsAppMessage(e164, editableMessage, mode)
    window.electronAPI.actionDone()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Clipboard write failed')
    }
  }

  const handleUpdate = () => {
    if (onUpdateTemplate) {
      // Reverse substitutions to save with placeholders
      let bodyToSave = editableMessage
      if (contactName.trim()) {
        bodyToSave = bodyToSave.replace(new RegExp(contactName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{name}')
      }
      if (contactUnit?.trim()) {
        bodyToSave = bodyToSave.replace(new RegExp(contactUnit.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{unit}')
      }
      onUpdateTemplate(bodyToSave)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleSaveAsNew = () => {
    if (onSaveAsNew && newTemplateName.trim()) {
      let bodyToSave = editableMessage
      if (contactName.trim()) {
        bodyToSave = bodyToSave.replace(new RegExp(contactName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{name}')
      }
      if (contactUnit?.trim()) {
        bodyToSave = bodyToSave.replace(new RegExp(contactUnit.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{unit}')
      }
      onSaveAsNew(newTemplateName.trim(), bodyToSave, template.category)
      setShowSaveAsNew(false)
      setNewTemplateName('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="space-y-3">
      {/* Substitution hint */}
      {!contactName.trim() && template.body.includes('{name}') && (
        <p className="text-[13px] text-[#fbbf24] bg-[rgba(245,158,11,0.1)] px-2 py-1 rounded border border-[rgba(245,158,11,0.2)]">
          Tip: Add a contact name to replace {'{name}'} placeholder
        </p>
      )}

      {/* Editable message area */}
      <textarea
        value={editableMessage}
        onChange={(e) => setEditableMessage(e.target.value)}
        className="w-full h-40 px-3 py-2 text-sm text-[#ededee] bg-white/5 border border-white/[0.07] rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
      />

      {/* Character count */}
      <p className="text-[13px] text-[#a1a1aa] text-right">
        {editableMessage.length} characters
      </p>

      {/* Send buttons */}
      <div className="flex gap-1.5">
        <button
          onClick={() => handleSendWhatsApp('desktop')}
          className="flex-1 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#25D366' }}
        >
          WhatsApp Desktop
        </button>
        <button
          onClick={() => handleSendWhatsApp('web')}
          className="flex-1 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#128C7E' }}
        >
          WhatsApp Web
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs text-[#d4d4d8] bg-white/5 border border-white/[0.07] rounded-md hover:bg-white/10 transition-colors flex items-center gap-1"
        >
          {copied ? <Check size={14} strokeWidth={1.5} className="text-[#4ade80]" /> : <Copy size={14} strokeWidth={1.5} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Save / Update buttons */}
      {(onUpdateTemplate || onSaveAsNew) && (
        <div className="flex gap-1.5">
          {onUpdateTemplate && (
            <button
              onClick={handleUpdate}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded-md hover:bg-[rgba(99,102,241,0.22)] transition-colors"
            >
              {saved ? <Check size={14} strokeWidth={1.5} className="text-[#4ade80]" /> : <Save size={14} strokeWidth={1.5} />}
              {saved ? 'Saved!' : 'Update Template'}
            </button>
          )}
          {onSaveAsNew && (
            <button
              onClick={() => setShowSaveAsNew(!showSaveAsNew)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#d4d4d8] bg-white/5 border border-white/[0.07] rounded-md hover:bg-white/10 transition-colors"
            >
              <FilePlus size={14} strokeWidth={1.5} />
              Save as New
            </button>
          )}
        </div>
      )}

      {/* Save as New inline input */}
      {showSaveAsNew && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAsNew() }}
            placeholder="Template name"
            className="flex-1 px-2 py-1.5 text-xs text-[#ededee] bg-white/5 border border-white/[0.07] rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            autoFocus
          />
          <button
            onClick={handleSaveAsNew}
            disabled={!newTemplateName.trim()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
