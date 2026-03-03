import { useState, useRef } from 'react'
import type { FormEntry } from '../../../shared/forms'
import type { FormTemplateOverride } from '../../../shared/types'

interface FormEditorProps {
  form: FormEntry
  override?: FormTemplateOverride
  onSave: (formId: string, override: FormTemplateOverride) => void
  onReset: (formId: string) => void
  onCancel: () => void
}

export default function FormEditor({ form, override, onSave, onReset, onCancel }: FormEditorProps) {
  const [whatsappMessage, setWhatsappMessage] = useState(override?.whatsappMessage ?? form.whatsappMessage)
  const [emailSubject, setEmailSubject] = useState(override?.emailSubject ?? form.emailSubject)
  const [emailBody, setEmailBody] = useState(override?.emailBody ?? form.emailBody)
  const waRef = useRef<HTMLTextAreaElement>(null)
  const emailBodyRef = useRef<HTMLTextAreaElement>(null)
  const [activeField, setActiveField] = useState<'whatsapp' | 'subject' | 'body'>('whatsapp')

  const hasChanges =
    whatsappMessage !== form.whatsappMessage ||
    emailSubject !== form.emailSubject ||
    emailBody !== form.emailBody

  const isOverridden = !!override

  const insertPlaceholder = (placeholder: string) => {
    if (activeField === 'whatsapp') {
      insertAt(waRef, whatsappMessage, setWhatsappMessage, placeholder)
    } else if (activeField === 'body') {
      insertAt(emailBodyRef, emailBody, setEmailBody, placeholder)
    } else {
      setEmailSubject(emailSubject + placeholder)
    }
  }

  const insertAt = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    value: string,
    setter: (v: string) => void,
    placeholder: string
  ) => {
    const el = ref.current
    if (!el) { setter(value + placeholder); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    const newValue = value.slice(0, start) + placeholder + value.slice(end)
    setter(newValue)
    setTimeout(() => { el.focus(); el.setSelectionRange(start + placeholder.length, start + placeholder.length) }, 0)
  }

  const handleSave = () => {
    const o: FormTemplateOverride = {}
    if (whatsappMessage !== form.whatsappMessage) o.whatsappMessage = whatsappMessage
    if (emailSubject !== form.emailSubject) o.emailSubject = emailSubject
    if (emailBody !== form.emailBody) o.emailBody = emailBody
    onSave(form.id, o)
  }

  const handleReset = () => {
    setWhatsappMessage(form.whatsappMessage)
    setEmailSubject(form.emailSubject)
    setEmailBody(form.emailBody)
    onReset(form.id)
  }

  return (
    <div className="space-y-3">
      {/* Form name (read-only) */}
      <div>
        <label className="block text-xs text-[#d4d4d8] mb-1">Form</label>
        <p className="text-sm text-[#ededee] font-medium">{form.name}</p>
        <p className="text-[10px] text-[#71717a] mt-0.5">{form.description}</p>
      </div>

      {/* Placeholder buttons */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#a1a1aa]">Insert:</span>
        {['{name}', '{number}', '{email}', '{unit}'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => insertPlaceholder(p)}
            className="px-1.5 py-0.5 text-[10px] font-medium text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded hover:bg-[rgba(99,102,241,0.22)] transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* WhatsApp message */}
      <div>
        <label className="block text-xs text-[#d4d4d8] mb-1">WhatsApp Message</label>
        <textarea
          ref={waRef}
          value={whatsappMessage}
          onChange={(e) => setWhatsappMessage(e.target.value)}
          onFocus={() => setActiveField('whatsapp')}
          className="w-full h-28 px-3 py-2 text-sm bg-white/5 border border-white/[0.07] rounded-md resize-none text-[#ededee] placeholder-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
        />
      </div>

      {/* Gmail subject */}
      <div>
        <label className="block text-xs text-[#d4d4d8] mb-1">Gmail Subject</label>
        <input
          type="text"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          onFocus={() => setActiveField('subject')}
          className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/[0.07] rounded-md text-[#ededee] placeholder-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Gmail body */}
      <div>
        <label className="block text-xs text-[#d4d4d8] mb-1">Gmail Body</label>
        <textarea
          ref={emailBodyRef}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          onFocus={() => setActiveField('body')}
          className="w-full h-36 px-3 py-2 text-sm bg-white/5 border border-white/[0.07] rounded-md resize-none text-[#ededee] placeholder-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${hasChanges ? 'text-white bg-indigo-600 hover:bg-indigo-500' : 'text-[#71717a] bg-white/5 cursor-not-allowed'}`}
        >
          Save
        </button>
        {isOverridden && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-md hover:bg-[rgba(245,158,11,0.16)] transition-colors"
          >
            Reset
          </button>
        )}
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
