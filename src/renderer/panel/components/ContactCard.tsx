import { useState, useEffect, useRef } from 'react'
import { X, Phone, ChevronDown, ChevronRight, FileText, Calendar, Copy, Pencil, Plus, Newspaper, Mail, MessageCircle, ClipboardList, Download, ShieldCheck } from 'lucide-react'
import type { AppSettings, ContactRole, Template, FormTemplateOverride } from '../../../shared/types'
import { getFormsByCategory, type FormCategory, type FormEntry } from '../../../shared/forms'
import GeneralNotes from './GeneralNotes'
import LeasingChecklist from './LeasingChecklist'
import SalesChecklist from './SalesChecklist'
import NewsFeed from './NewsFeed'

// News source favicons
import iconGulfNews from '../assets/news/gulfnews.png'
import iconNational from '../assets/news/national.png'
import iconKhaleej from '../assets/news/khaleej.png'
import iconArabianBiz from '../assets/news/arabianbiz.png'
import iconZawya from '../assets/news/zawya.png'
import iconPropNews from '../assets/news/propnews.png'
import iconPropTime from '../assets/news/proptime.png'
import iconGulfProp from '../assets/news/gulfprop.png'
import iconREMTimes from '../assets/news/remtimes.png'
import iconProp24 from '../assets/news/prop24.png'
import iconAGBI from '../assets/news/agbi.png'
import iconEconomyME from '../assets/news/economyme.png'

const ALL_ROLES: ContactRole[] = ['Tenant', 'Landlord', 'Buyer', 'Seller', 'Investor']

const ROLE_COLORS: Record<ContactRole, string> = {
  Tenant: 'text-[#818cf8]',
  Landlord: 'text-[#fbbf24]',
  Buyer: 'text-[#4ade80]',
  Seller: 'text-[#f87171]',
  Investor: 'text-[#c084fc]'
}

const FORM_TAB_STYLES: Record<FormCategory, { active: string; inactive: string }> = {
  sales: {
    active: 'bg-[rgba(99,102,241,0.22)] text-[#818cf8] border-[rgba(99,102,241,0.4)]',
    inactive: 'bg-white/[0.03] text-[#71717a] border-white/[0.07] hover:bg-white/[0.06]'
  },
  rentals: {
    active: 'bg-[rgba(34,197,94,0.18)] text-[#4ade80] border-[rgba(34,197,94,0.35)]',
    inactive: 'bg-white/[0.03] text-[#71717a] border-white/[0.07] hover:bg-white/[0.06]'
  },
  offplan: {
    active: 'bg-[rgba(245,158,11,0.15)] text-[#fbbf24] border-[rgba(245,158,11,0.3)]',
    inactive: 'bg-white/[0.03] text-[#71717a] border-white/[0.07] hover:bg-white/[0.06]'
  }
}

const NEWS_SOURCES = [
  { label: 'Gulf News', title: 'Gulf News Property', url: 'https://gulfnews.com/business/property', icon: iconGulfNews },
  { label: 'National', title: 'The National — Property', url: 'https://www.thenationalnews.com/business/property/', icon: iconNational },
  { label: 'Khaleej', title: 'Khaleej Times Property', url: 'https://www.khaleejtimes.com/business/property', icon: iconKhaleej },
  { label: 'Arabian Biz', title: 'Arabian Business Real Estate', url: 'https://www.arabianbusiness.com/industries/real-estate', icon: iconArabianBiz },
  { label: 'Zawya', title: 'Zawya UAE Real Estate', url: 'https://www.zawya.com/en/business/real-estate', icon: iconZawya },
  { label: 'PropNews', title: 'PropertyNews.ae', url: 'https://propertynews.ae/', icon: iconPropNews },
  { label: 'Prop Time', title: 'Property Time', url: 'https://www.propertytime.ae/', icon: iconPropTime },
  { label: 'Gulf Prop', title: 'Gulf Property', url: 'https://gulfproperty.media/', icon: iconGulfProp },
  { label: 'REMTimes', title: 'REMTimes', url: 'https://www.remtimes.com/', icon: iconREMTimes },
  { label: 'Prop24', title: 'Property24.ae', url: 'https://property24.ae/', icon: iconProp24 },
  { label: 'AGBI', title: 'Arabian Gulf Business Insight — Real Estate', url: 'https://www.agbi.com/sectors/real-estate/', icon: iconAGBI },
  { label: 'Economy ME', title: 'Economy Middle East — Real Estate', url: 'https://economymiddleeast.com/newscategories/real-estate/', icon: iconEconomyME }
]

interface ContactCardProps {
  e164: string
  displayNumber: string
  contactName: string
  contactEmail: string
  contactUnit: string
  onNumberChange: (number: string) => void
  onNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onUnitChange: (unit: string) => void
  onClear: () => void
  whatsappMode: AppSettings['whatsappMode']
  oneNoteEnabled: boolean
  calendarEnabled: boolean
  followUpPromptEnabled: boolean
  templates: Template[]
  onSelectTemplate: (template: Template) => void
  onEditTemplate: (template: Template) => void
  onDeleteTemplate: (id: string) => void
  onCreateTemplate: () => void
  onEnsureTemplate: (templateId: string, defaults: Template) => void
  onEditRoleTemplate: (role: ContactRole) => void
  viewingTemplateId?: string
  consultationTemplateId?: string
  contactRoles: ContactRole[]
  oneNotePageId?: string
  onOneNotePageCreated?: (pageId: string) => void
  newsEnabled: boolean
  formOverrides: Record<string, FormTemplateOverride>
  onEditForm: (form: FormEntry) => void
}

export default function ContactCard({
  e164,
  displayNumber,
  contactName,
  contactEmail,
  contactUnit,
  onNumberChange,
  onNameChange,
  onEmailChange,
  onUnitChange,
  onClear,
  whatsappMode,
  oneNoteEnabled,
  calendarEnabled,
  followUpPromptEnabled,
  templates,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate,
  onEnsureTemplate,
  onEditRoleTemplate,
  viewingTemplateId,
  consultationTemplateId,
  contactRoles,
  oneNotePageId,
  onOneNotePageCreated,
  newsEnabled,
  formOverrides,
  onEditForm
}: ContactCardProps) {
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false)
  const [showViewingMenu, setShowViewingMenu] = useState(false)
  const [showConsultMenu, setShowConsultMenu] = useState(false)
  const [oneNoteError, setOneNoteError] = useState<string | null>(null)
  const [followUpStatus, setFollowUpStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [templatesExpanded, setTemplatesExpanded] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formsDir, setFormsDir] = useState<string>('')

  const waDropdownRef = useRef<HTMLDivElement>(null)
  const viewingDropdownRef = useRef<HTMLDivElement>(null)
  const consultDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showWhatsAppMenu && waDropdownRef.current && !waDropdownRef.current.contains(e.target as Node)) {
        setShowWhatsAppMenu(false)
      }
      if (showViewingMenu && viewingDropdownRef.current && !viewingDropdownRef.current.contains(e.target as Node)) {
        setShowViewingMenu(false)
      }
      if (showConsultMenu && consultDropdownRef.current && !consultDropdownRef.current.contains(e.target as Node)) {
        setShowConsultMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showWhatsAppMenu, showViewingMenu, showConsultMenu])

  const [oneNoteTemplatesExpanded, setOneNoteTemplatesExpanded] = useState(false)
  const [gmailTemplatesExpanded, setGmailTemplatesExpanded] = useState(false)
  const [formsExpanded, setFormsExpanded] = useState(false)
  const [formsTab, setFormsTab] = useState<FormCategory>('sales')
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [kycExpanded, setKycExpanded] = useState(false)

  useEffect(() => {
    window.electronAPI.getFormsDir().then(setFormsDir)
  }, [])

  const sessionData = { name: contactName, displayNumber, roles: [] as ContactRole[], e164, unit: contactUnit, email: contactEmail }

  // ── Handlers ──────────────────────────────────────────────────────────

  const fillPlaceholders = (text: string): string => {
    const name = contactName || displayNumber
    return text
      .replace(/\{name\}/gi, name)
      .replace(/\{number\}/gi, displayNumber)
      .replace(/\{email\}/gi, contactEmail)
      .replace(/\{unit\}/gi, contactUnit)
  }

  const handleGmailCompose = (subject?: string, body?: string) => {
    const filledSubject = fillPlaceholders(subject || '')
    const filledBody = fillPlaceholders(body || '')
    const params = new URLSearchParams()
    if (contactEmail) params.set('to', contactEmail)
    if (filledSubject) params.set('su', filledSubject)
    if (filledBody) params.set('body', filledBody)
    params.set('view', 'cm')
    window.electronAPI.openExternal(`https://mail.google.com/mail/?${params.toString()}`)
    window.electronAPI.actionDone()
  }

  const openFormFile = (form: FormEntry) => {
    if (!formsDir) return
    const filePath = `${formsDir}/${form.subFolder}/${form.fileName}`
    window.electronAPI.showItemInFolder(filePath)
  }

  const handleFormWhatsApp = (form: FormEntry) => {
    const override = formOverrides[form.id]
    const message = fillPlaceholders(override?.whatsappMessage ?? form.whatsappMessage)
    window.electronAPI.sendWhatsAppMessage(e164, message, whatsappMode)
    openFormFile(form)
    window.electronAPI.actionDone()
  }

  const handleFormGmail = (form: FormEntry) => {
    const override = formOverrides[form.id]
    handleGmailCompose(override?.emailSubject ?? form.emailSubject, override?.emailBody ?? form.emailBody)
    openFormFile(form)
  }


  const handleDial = () => {
    window.electronAPI.dial(e164)
    window.electronAPI.actionDone()
  }

  const handleWhatsApp = () => {
    window.electronAPI.openWhatsApp(e164, whatsappMode)
    setShowWhatsAppMenu(false)
    window.electronAPI.actionDone()
  }

  const handleOneNoteOpen = async () => {
    setOneNoteError(null)
    const result = await window.electronAPI.openOneNoteSection()
    if (!result.success) {
      setOneNoteError(result.error || 'Failed to open OneNote')
      setTimeout(() => setOneNoteError(null), 5000)
    } else {
      window.electronAPI.actionDone()
    }
  }

  const handleOneNoteRole = async (role: ContactRole) => {
    setOneNoteError(null)
    const result = await window.electronAPI.openInOneNote({
      name: contactName, displayNumber, roles: [role], e164, unit: contactUnit, email: contactEmail
    })
    if (result.success) {
      window.electronAPI.actionDone()
    } else {
      setOneNoteError(result.error || 'Failed to open OneNote')
      setTimeout(() => setOneNoteError(null), 5000)
    }
  }

  const VIEWING_DEFAULTS: Template = {
    id: 'tpl-viewing', name: 'Viewing Invitation',
    body: 'Hi {name}, I\'d like to arrange a property viewing for {unit}. Could you let me know your preferred date and time? I\'ll confirm the details shortly.',
    category: 'viewing'
  }
  const CONSULTATION_DEFAULTS: Template = {
    id: 'tpl-consultation', name: 'Consultation Invitation',
    body: 'Hi {name}, I\'d like to schedule a consultation to discuss your property requirements. When would be a convenient time for you?',
    category: 'other'
  }

  const handleViewingClick = () => {
    const tpl = viewingTemplateId ? templates.find((t) => t.id === viewingTemplateId) : null
    window.electronAPI.bookCalendar(sessionData, 'viewing', tpl?.body)
    window.electronAPI.actionDone()
  }
  const handleConsultClick = () => {
    const tpl = consultationTemplateId ? templates.find((t) => t.id === consultationTemplateId) : null
    window.electronAPI.bookCalendar(sessionData, 'consultation', tpl?.body)
    window.electronAPI.actionDone()
  }
  const handleEditViewingTemplate = () => { onEnsureTemplate(viewingTemplateId || 'tpl-viewing', VIEWING_DEFAULTS); setShowViewingMenu(false) }
  const handleEditConsultTemplate = () => { onEnsureTemplate(consultationTemplateId || 'tpl-consultation', CONSULTATION_DEFAULTS); setShowConsultMenu(false) }

  const handleFollowUp = async (days: number) => {
    setFollowUpStatus(null)
    const result = await window.electronAPI.createFollowUp(sessionData, days)
    if (result.success) {
      setFollowUpStatus({ type: 'success', message: `Follow-up set for ${result.eventDate}` })
    } else {
      setFollowUpStatus({ type: 'error', message: result.error || 'Failed to create follow-up' })
    }
    setTimeout(() => setFollowUpStatus(null), 4000)
  }

  const handleDeleteTemplate = (id: string) => {
    if (confirmDeleteId === id) { onDeleteTemplate(id); setConfirmDeleteId(null) }
    else { setConfirmDeleteId(id); setTimeout(() => setConfirmDeleteId(null), 3000) }
  }

  const categoryColors: Record<string, string> = {
    introduction: 'bg-[rgba(99,102,241,0.14)] text-[#818cf8]',
    'follow-up': 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24]',
    viewing: 'bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
    reminder: 'bg-[rgba(168,85,247,0.12)] text-[#c084fc]',
    alert: 'bg-[rgba(239,68,68,0.12)] text-[#f87171]',
    'thank-you': 'bg-[rgba(236,72,153,0.12)] text-[#f472b6]',
    documents: 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24]',
    other: 'bg-white/5 text-[#d4d4d8]'
  }

  const currentForms = getFormsByCategory(formsTab)

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 space-y-2">

      {/* 1. Phone number (editable) + copy + clear */}
      {e164 ? (
        <div className="flex items-center justify-between gap-1">
          <input
            type="text"
            value={displayNumber}
            onChange={(e) => onNumberChange(e.target.value)}
            className="flex-1 min-w-0 text-base font-medium text-[#ededee] tracking-wider tabular-nums bg-transparent border-none outline-none focus:ring-0 p-0"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => window.electronAPI.copyNumber(e164)} className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors" title="Copy number">
              <Copy size={14} strokeWidth={1.5} />
            </button>
            <button onClick={onClear} className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors" title="Clear">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm text-[#a1a1aa]">Email contact</span>
          <button onClick={onClear} className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors" title="Clear">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* 2. Name + Email + Unit inputs — right below phone number */}
      <input
        type="text" value={contactName} onChange={(e) => onNameChange(e.target.value)}
        placeholder="Name"
        className="w-full px-3 py-1.5 text-sm bg-white text-[#1a1a1a] placeholder-[#9ca3af] rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />
      <input
        type="email" value={contactEmail} onChange={(e) => onEmailChange(e.target.value)}
        placeholder="Email"
        className="w-full px-3 py-1.5 text-sm bg-white text-[#1a1a1a] placeholder-[#9ca3af] rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />
      <input
        type="text" value={contactUnit} onChange={(e) => onUnitChange(e.target.value)}
        placeholder="Unit (e.g. 507 Burj Vista)"
        className="w-full px-3 py-1.5 text-sm bg-white text-[#1a1a1a] placeholder-[#9ca3af] rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />

      {/* 3. Action buttons — two rows, equal width via grid */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleDial}
            disabled={!e164}
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors ${e164 ? 'bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] hover:bg-[rgba(99,102,241,0.22)]' : 'bg-white/[0.03] text-[#3f3f46] border border-white/[0.04] cursor-not-allowed'}`}
          >
            <Phone size={14} strokeWidth={1.5} />
            <span>Dial</span>
          </button>

          {/* WhatsApp split button */}
          <div className="relative" ref={waDropdownRef}>
            <div className="flex">
              <button
                onClick={handleWhatsApp}
                disabled={!e164}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm rounded-l-md transition-colors ${e164 ? 'text-white hover:opacity-90' : 'text-[#3f3f46] cursor-not-allowed'}`}
                style={{ backgroundColor: e164 ? '#25D366' : 'rgba(255,255,255,0.03)' }}
              >
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => e164 && setShowWhatsAppMenu(!showWhatsAppMenu)}
                disabled={!e164}
                className={`px-1.5 py-1.5 text-sm rounded-r-md border-l transition-colors ${e164 ? 'text-white border-white/20 hover:opacity-90' : 'text-[#3f3f46] border-white/[0.04] cursor-not-allowed'}`}
                style={{ backgroundColor: e164 ? '#25D366' : 'rgba(255,255,255,0.03)' }}
              >
                <ChevronDown size={12} strokeWidth={1.5} />
              </button>
            </div>
            {showWhatsAppMenu && e164 && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-[#1f1f21] border border-white/[0.07] rounded-md shadow-2xl z-10">
                <button onClick={() => { window.electronAPI.openWhatsApp(e164, 'desktop'); setShowWhatsAppMenu(false); window.electronAPI.actionDone() }} className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]">WhatsApp Desktop</button>
                <button onClick={() => { window.electronAPI.openWhatsApp(e164, 'web'); setShowWhatsAppMenu(false); window.electronAPI.actionDone() }} className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]">WhatsApp Web</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {oneNoteEnabled && (
            <button
              onClick={handleOneNoteOpen}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-[#c084fc] bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.25)] rounded-md hover:bg-[rgba(168,85,247,0.2)] transition-colors"
              title="Open notes folder"
            >
              <FileText size={14} strokeWidth={1.5} />
              <span>Notes</span>
            </button>
          )}
          <button
            onClick={() => handleGmailCompose()}
            className={`flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-[#f87171] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] rounded-md hover:bg-[rgba(239,68,68,0.2)] transition-colors ${!oneNoteEnabled ? 'col-span-2' : ''}`}
            title="Compose email in Gmail"
          >
            <Mail size={14} strokeWidth={1.5} />
            <span>Gmail</span>
          </button>
        </div>
      </div>

      {/* OneNote error */}
      {oneNoteError && <p className="text-xs text-red-400">{oneNoteError}</p>}

      {/* 4. Schedule — right after action buttons */}
      {calendarEnabled && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[13px] text-[#a1a1aa] font-medium">Schedule</p>
          <div className="grid grid-cols-2 gap-1.5">
            {/* Viewing split button */}
            <div className="relative" ref={viewingDropdownRef}>
              <div className="flex">
                <button onClick={handleViewingClick} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded-l-md hover:bg-[rgba(99,102,241,0.22)] transition-colors" title="Send viewing invitation">
                  <Calendar size={16} strokeWidth={1.5} /><span>Viewing</span>
                </button>
                <button onClick={() => { setShowViewingMenu(!showViewingMenu); setShowConsultMenu(false) }} className="px-1.5 py-1.5 text-xs text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] border-l-0 rounded-r-md hover:bg-[rgba(99,102,241,0.22)] transition-colors">
                  <ChevronDown size={10} strokeWidth={1.5} />
                </button>
              </div>
              {showViewingMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f1f21] border border-white/[0.07] rounded-md shadow-2xl z-10">
                  <button onClick={handleEditViewingTemplate} className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]">Edit Template</button>
                </div>
              )}
            </div>

            {/* Consultation split button */}
            <div className="relative" ref={consultDropdownRef}>
              <div className="flex">
                <button onClick={handleConsultClick} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-[#4ade80] bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] rounded-l-md hover:bg-[rgba(34,197,94,0.2)] transition-colors" title="Send consultation invitation">
                  <Calendar size={16} strokeWidth={1.5} /><span>Consultation</span>
                </button>
                <button onClick={() => { setShowConsultMenu(!showConsultMenu); setShowViewingMenu(false) }} className="px-1.5 py-1.5 text-xs text-[#4ade80] bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] border-l-0 rounded-r-md hover:bg-[rgba(34,197,94,0.2)] transition-colors">
                  <ChevronDown size={10} strokeWidth={1.5} />
                </button>
              </div>
              {showConsultMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f1f21] border border-white/[0.07] rounded-md shadow-2xl z-10">
                  <button onClick={handleEditConsultTemplate} className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]">Edit Template</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Follow-up reminder — right after schedule */}
      {calendarEnabled && followUpPromptEnabled && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[13px] text-[#a1a1aa] font-medium">Follow-up reminder</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleFollowUp(7)} className="flex-1 px-2 py-1 text-[13px] font-medium text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded hover:bg-[rgba(245,158,11,0.16)] transition-colors">7 days</button>
            <button onClick={() => handleFollowUp(15)} className="flex-1 px-2 py-1 text-[13px] font-medium text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded hover:bg-[rgba(245,158,11,0.16)] transition-colors">15 days</button>
            <button onClick={() => handleFollowUp(30)} className="flex-1 px-2 py-1 text-[13px] font-medium text-[#fbbf24] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded hover:bg-[rgba(245,158,11,0.16)] transition-colors">30 days</button>
          </div>
          {followUpStatus && (
            <p className={`text-xs ${followUpStatus.type === 'success' ? 'text-[#4ade80]' : 'text-red-400'}`}>{followUpStatus.message}</p>
          )}
        </div>
      )}

      {/* 5b. WhatsApp Templates */}
      <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setTemplatesExpanded(!templatesExpanded)} className="flex items-center gap-1.5">
            {templatesExpanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />}
            <MessageCircle size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
            <h3 className="text-sm font-semibold text-[#ededee]">WhatsApp Templates</h3>
          </button>
          {templatesExpanded && (
            <button onClick={onCreateTemplate} className="flex items-center gap-0.5 text-xs text-indigo-400 hover:text-indigo-300">
              <Plus size={14} strokeWidth={1.5} />New
            </button>
          )}
        </div>
        {templatesExpanded && (
          templates.length === 0 ? (
            <p className="text-xs text-[#5a5a60] text-center py-2 mt-2">No templates yet. Create one to get started.</p>
          ) : (
            <div className="space-y-0.5 max-h-44 overflow-y-auto mt-2">
              {templates.map((template) => (
                <div key={template.id} className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors" onClick={() => onSelectTemplate(template)}>
                  <span className="text-xs text-[#ededee] truncate flex-1">{template.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${categoryColors[template.category] || categoryColors.other}`}>{template.category}</span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEditTemplate(template) }} className="p-0.5 text-[#d4d4d8] hover:text-indigo-400 transition-colors" title="Edit"><Pencil size={12} strokeWidth={1.5} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id) }} className={`p-0.5 ${confirmDeleteId === template.id ? 'text-red-400' : 'text-[#d4d4d8] hover:text-red-400'} transition-colors`} title={confirmDeleteId === template.id ? 'Click again to confirm' : 'Delete'}><X size={12} strokeWidth={1.5} /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 5c. OneNote Templates */}
      {oneNoteEnabled && (
        <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
          <button onClick={() => setOneNoteTemplatesExpanded(!oneNoteTemplatesExpanded)} className="flex items-center gap-1.5">
            {oneNoteTemplatesExpanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />}
            <FileText size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
            <h3 className="text-sm font-semibold text-[#ededee]">OneNote Templates</h3>
          </button>
          {oneNoteTemplatesExpanded && (
            <div className="space-y-0.5 mt-2">
              {ALL_ROLES.map((role) => (
                <div key={role} className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors" onClick={() => handleOneNoteRole(role)}>
                  <span className={`text-xs font-medium flex-1 ${ROLE_COLORS[role]}`}>{role}</span>
                  <button onClick={(e) => { e.stopPropagation(); onEditRoleTemplate(role) }} className="p-0.5 text-[#d4d4d8] hover:text-indigo-400 transition-colors" title={`Edit ${role} template`}><Pencil size={12} strokeWidth={1.5} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5c. General Notes -- scratchpad with OneNote push */}
      {oneNoteEnabled && (
        <GeneralNotes
          e164={e164}
          displayNumber={displayNumber}
          contactName={contactName}
          contactEmail={contactEmail}
          contactUnit={contactUnit}
          contactRoles={contactRoles}
          oneNotePageId={oneNotePageId}
          onPageCreated={onOneNotePageCreated}
        />
      )}

      {/* 6. Checklists + Client Folders */}
      <LeasingChecklist contactName={contactName} />
      <SalesChecklist contactName={contactName} />

      {/* 7. Forms — Sales / Rentals / Off-plan tabs */}
      <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
        <button onClick={() => setFormsExpanded(!formsExpanded)} className="flex items-center gap-1.5">
          {formsExpanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />}
          <ClipboardList size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
          <h3 className="text-sm font-semibold text-[#ededee]">Forms</h3>
        </button>

        {formsExpanded && (
          <div className="mt-2 space-y-2">
            {/* Category tabs */}
            <div className="grid grid-cols-3 gap-1">
              {(['sales', 'rentals', 'offplan'] as FormCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormsTab(cat)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${formsTab === cat ? FORM_TAB_STYLES[cat].active : FORM_TAB_STYLES[cat].inactive}`}
                >
                  {cat === 'offplan' ? 'Off-plan' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Form list */}
            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {currentForms.map((form) => (
                <div key={form.id} className="group px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#ededee] truncate flex-1">
                      {form.name}
                      {formOverrides[form.id] && <span className="ml-1 text-[9px] text-[#fbbf24]" title="Custom template">*</span>}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {/* Edit template */}
                      <button
                        onClick={() => onEditForm(form)}
                        className="p-1 text-[#d4d4d8] hover:text-indigo-400 rounded transition-colors"
                        title="Edit template"
                      >
                        <Pencil size={12} strokeWidth={1.5} />
                      </button>
                      {/* WhatsApp send */}
                      {e164 && (
                        <button
                          onClick={() => handleFormWhatsApp(form)}
                          className="p-1 rounded transition-colors hover:opacity-80"
                          style={{ color: '#25D366' }}
                          title="Send via WhatsApp"
                        >
                          <MessageCircle size={13} strokeWidth={1.5} />
                        </button>
                      )}
                      {/* Gmail send */}
                      <button
                        onClick={() => handleFormGmail(form)}
                        className="p-1 text-[#f87171] rounded transition-colors hover:opacity-80"
                        title="Send via Gmail"
                      >
                        <Mail size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#d4d4d8] mt-0.5 leading-tight">{form.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7b. KYC Forms — internal, open-only (no send) */}
      <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
        <button onClick={() => setKycExpanded(!kycExpanded)} className="flex items-center gap-1.5">
          {kycExpanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />}
          <ShieldCheck size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
          <h3 className="text-sm font-semibold text-[#ededee]">KYC Forms</h3>
          <span className="text-[10px] text-[#71717a] ml-1">(internal)</span>
        </button>

        {kycExpanded && (
          <div className="mt-2 space-y-0.5">
            {[
              { name: 'KYC — Individual (Editable)', fileName: 'PRAGON PROPERTIES_KYC NEW 2025_Individual_Editable.pdf', description: 'Know Your Customer form for individual clients' },
              { name: 'KYC — Company (Editable)', fileName: 'PRAGON PROPERTIES_KYC NEW 2025_Company_Editable.pdf', description: 'Know Your Customer form for corporate clients' },
              { name: 'KYC with Notes', fileName: 'New KYC with Notes (1).pdf', description: 'KYC reference form with explanatory notes' },
            ].map((kyc) => (
              <div key={kyc.fileName} className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#ededee] truncate block">{kyc.name}</span>
                  <p className="text-[10px] text-[#d4d4d8] mt-0.5 leading-tight">{kyc.description}</p>
                </div>
                <button
                  onClick={() => window.electronAPI.saveFormAs('KYC', kyc.fileName)}
                  className="p-1 text-[#a1a1aa] hover:text-indigo-400 rounded transition-colors flex-shrink-0"
                  title="Save to..."
                >
                  <Download size={13} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. Gmail Templates */}
      <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setGmailTemplatesExpanded(!gmailTemplatesExpanded)} className="flex items-center gap-1.5">
            {gmailTemplatesExpanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />}
            <Mail size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
            <h3 className="text-sm font-semibold text-[#ededee]">Gmail Templates</h3>
          </button>
          {gmailTemplatesExpanded && (
            <button onClick={onCreateTemplate} className="flex items-center gap-0.5 text-xs text-indigo-400 hover:text-indigo-300">
              <Plus size={14} strokeWidth={1.5} />New
            </button>
          )}
        </div>
        {gmailTemplatesExpanded && (
          templates.length === 0 ? (
            <p className="text-xs text-[#5a5a60] text-center py-2 mt-2">No templates yet. Create one to get started.</p>
          ) : (
            <div className="space-y-0.5 max-h-44 overflow-y-auto mt-2">
              {templates.map((template) => (
                <div key={template.id} className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors" onClick={() => handleGmailCompose(template.name, template.body)}>
                  <span className="text-xs text-[#ededee] truncate flex-1">{template.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${categoryColors[template.category] || categoryColors.other}`}>{template.category}</span>
                  <button onClick={(e) => { e.stopPropagation(); onEditTemplate(template) }} className="p-0.5 text-[#d4d4d8] hover:text-indigo-400 transition-colors" title="Edit"><Pencil size={12} strokeWidth={1.5} /></button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 11. News feed */}
      {newsEnabled && (
        <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
          <button onClick={() => setNewsExpanded(!newsExpanded)} className="flex items-center gap-1.5">
            {newsExpanded ? <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" /> : <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />}
            <Newspaper size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
            <h3 className="text-sm font-semibold text-[#ededee]">UAE Real Estate News</h3>
          </button>
          {newsExpanded && (
            <div className="mt-2 space-y-3">
              {/* News source quick-links */}
              <div>
                <p className="text-[11px] text-[#a1a1aa] font-medium mb-1.5">News</p>
                <div className="grid grid-cols-4 gap-1">
                  {NEWS_SOURCES.map((src) => (
                    <button
                      key={src.label}
                      onClick={() => { window.electronAPI.openExternal(src.url); window.electronAPI.actionDone() }}
                      className="flex flex-col items-center gap-0.5 px-1 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded hover:bg-white/[0.1] hover:border-white/[0.15] transition-colors group"
                      title={src.title}
                    >
                      <img src={src.icon} alt={src.label} className="w-4 h-4 rounded-sm" />
                      <span className="text-[8px] font-medium leading-none text-[#a1a1aa] group-hover:text-[#ededee] transition-colors truncate w-full text-center">{src.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RSS feed */}
              <div className="max-h-64 overflow-y-auto">
                <NewsFeed onBack={() => setNewsExpanded(false)} />
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
