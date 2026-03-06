import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings2, X, Keyboard, BookOpen, Phone, Copy, Minus, Square, ChevronLeft, ChevronDown, Mic } from 'lucide-react'
import type { Template, AppSettings, ContactInfo, ContactRole } from '../../shared/types'
import PhoneInput from './components/PhoneInput'
import ContactCard from './components/ContactCard'
import TemplatePreview from './components/TemplatePreview'
import TemplateEditor from './components/TemplateEditor'
import RoleTemplateEditor from './components/RoleTemplateEditor'
import FormEditor from './components/FormEditor'
import HotkeyPanel from './components/HotkeyPanel'
import FlashcardView from './components/FlashcardView'
import IncomingCallBar from './components/IncomingCallBar'
import TranscriberView from './components/TranscriberView'
import type { RoleTemplate, FormTemplateOverride } from '../../shared/types'
import type { FormEntry } from '../../shared/forms'

type View = 'main' | 'template-editor' | 'template-preview' | 'hotkeys' | 'role-template-editor' | 'form-editor' | 'education' | 'transcriber'
type PanelMode = 'compact' | 'expanded'

/** Custom draggable title bar for the frameless window.
 *  Uses a background drag layer to avoid the Electron drag-sticking bug. */
function TitleBar({ title, onBack, children }: { title: string; onBack?: () => void; children?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="relative flex items-center justify-between h-8 bg-[#161617] select-none shrink-0">
      {/* Drag layer — covers entire bar, sits behind content */}
      <div className="absolute inset-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Left: back button + title (title is non-interactive, passes clicks to drag layer) */}
      <div className="flex items-center pointer-events-none relative">
        {onBack && (
          <button
            onClick={onBack}
            className="pointer-events-auto w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
        )}
        <span className={`text-xs font-semibold text-[#ededee] ${onBack ? '' : 'pl-3'}`}>{title}</span>
      </div>

      {/* Right: nav buttons + window controls (all interactive, block drag) */}
      <div className="flex items-center relative pointer-events-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {children}
        <button
          onClick={() => window.electronAPI.minimizePanel()}
          className="w-11 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
          title="Minimize"
        >
          <Minus size={12} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => window.electronAPI.maximizePanel()}
          className="w-11 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
          title="Maximize"
        >
          <Square size={10} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => window.electronAPI.closePanel()}
          className="w-11 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-red-500/80 hover:text-white transition-colors"
          title="Close"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  const [activeContact, setActiveContact] = useState<ContactInfo | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactUnit, setContactUnit] = useState('')
  const [contactRoles, setContactRoles] = useState<ContactRole[]>([])
  const [oneNotePageId, setOneNotePageId] = useState<string | undefined>(undefined)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [hideCategoryInEditor, setHideCategoryInEditor] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [view, setView] = useState<View>('main')
  const [mode, setMode] = useState<PanelMode>('expanded')
  const [editingRole, setEditingRole] = useState<ContactRole | null>(null)
  const [roleTemplates, setRoleTemplates] = useState<Record<ContactRole, RoleTemplate> | null>(null)
  const [defaultRoleTemplates, setDefaultRoleTemplates] = useState<Record<ContactRole, RoleTemplate> | null>(null)
  const [formOverrides, setFormOverrides] = useState<Record<string, FormTemplateOverride>>({})
  const [editingForm, setEditingForm] = useState<FormEntry | null>(null)
  const [callEvent, setCallEvent] = useState<{ type: 'incoming' | 'ended'; e164: string; displayNumber: string; contactName: string | null } | null>(null)
  const [showCompactWAMenu, setShowCompactWAMenu] = useState(false)
  const compactWARef = useRef<HTMLDivElement>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load templates and settings on mount, listen for sync
  useEffect(() => {
    window.electronAPI.getTemplates().then(setTemplates)
    window.electronAPI.getSettings().then(setSettings)
    window.electronAPI.getFormOverrides().then(setFormOverrides)
    window.electronAPI.getRoleTemplates().then((rt) => {
      setRoleTemplates(rt)
      setDefaultRoleTemplates(rt) // snapshot defaults on first load
    })
    window.electronAPI.onTemplatesUpdated((updated) => setTemplates(updated))
    window.electronAPI.onModeChange((m) => setMode(m))
    window.electronAPI.onNameUpdated((e164, name) => {
      setActiveContact((prev) => {
        if (prev && prev.e164 === e164) {
          setContactName(name)
        }
        return prev
      })
    })
  }, [])

  // Subscribe to phone:detected events from clipboard
  // If a contact card is already showing (e.g. email was detected first), just fill the phone — don't reset
  useEffect(() => {
    window.electronAPI.onPhoneDetected((e164, displayNumber) => {
      setView('main')
      setActiveContact((prev) => {
        if (prev) {
          // Contact card already open — just update the phone number, keep other fields
          return { ...prev, e164, displayNumber }
        }
        // Fresh contact
        setContactName('')
        setContactEmail('')
        setContactUnit('')
        setContactRoles([])
        return { e164, displayNumber }
      })
    })
    return () => {
      window.electronAPI.removePhoneDetectedListener()
    }
  }, [])

  // Load oneNotePageId from stored contact when active contact changes
  useEffect(() => {
    if (activeContact?.e164) {
      window.electronAPI.getContact(activeContact.e164).then((contact) => {
        if (contact?.oneNotePageId) setOneNotePageId(contact.oneNotePageId)
        else setOneNotePageId(undefined)
      })
    } else {
      setOneNotePageId(undefined)
    }
  }, [activeContact?.e164])

  // Subscribe to email:detected events from clipboard
  // If a contact card is already showing (e.g. phone was detected first), just fill the email
  useEffect(() => {
    window.electronAPI.onEmailDetected((email) => {
      setView('main')
      setContactEmail(email)
      setActiveContact((prev) => {
        if (prev) return prev // card already open, just update email state above
        // No card yet — create one for email-only
        setContactName('')
        setContactUnit('')
        setContactRoles([])
        return { e164: '', displayNumber: '' }
      })
      window.electronAPI.expandPanel()
    })
    return () => {
      window.electronAPI.removeEmailDetectedListener()
    }
  }, [])

  // Subscribe to contact:extracted events (multi-field from text block)
  useEffect(() => {
    window.electronAPI.onContactExtracted((info) => {
      setView('main')
      if (info.e164) setActiveContact({ e164: info.e164, displayNumber: info.displayNumber || info.e164 })
      else setActiveContact((prev) => prev || { e164: '', displayNumber: '' })
      if (info.email) setContactEmail(info.email)
      if (info.name) setContactName(info.name)
      if (info.unit) setContactUnit(info.unit)
      window.electronAPI.expandPanel()
    })
  }, [])

  // Subscribe to Phone Link incoming call / call ended events
  useEffect(() => {
    window.electronAPI.onIncomingCall((data) => {
      setCallEvent({ type: 'incoming', ...data })
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = setTimeout(() => setCallEvent(null), 30000)
    })
    window.electronAPI.onCallEnded((data) => {
      setCallEvent({ type: 'ended', ...data })
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = setTimeout(() => setCallEvent(null), 15000)
    })
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const handleDismissCallEvent = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setCallEvent(null)
  }, [])

  const handleCallOpenOneNote = useCallback(() => {
    if (!callEvent) return
    window.electronAPI.openInOneNote({
      name: callEvent.contactName || '',
      displayNumber: callEvent.displayNumber,
      roles: [],
      e164: callEvent.e164
    }).catch(() => {/* silent failure */})
  }, [callEvent])

  const handleCallFollowUp = useCallback(async (days: number) => {
    if (!callEvent) return
    const result = await window.electronAPI.createFollowUp(
      {
        name: callEvent.contactName || '',
        displayNumber: callEvent.displayNumber,
        roles: [],
        e164: callEvent.e164
      },
      days
    )
    if (result.success) {
      setTimeout(() => setCallEvent(null), 2000)
    }
  }, [callEvent])

  const handlePhoneSubmit = useCallback((rawNumber: string) => {
    const cleaned = rawNumber.replace(/[\s\-()]/g, '')
    setActiveContact({ e164: cleaned, displayNumber: rawNumber })
    setContactName('')
    setContactEmail('')
    setContactUnit('')
    setContactRoles([])
  }, [])

  const handleClearContact = useCallback(() => {
    setActiveContact(null)
    setContactName('')
    setContactEmail('')
    setContactUnit('')
    setContactRoles([])
    setOneNotePageId(undefined)
    setSelectedTemplate(null)
    setView('main')
  }, [])

  const handleNumberChange = useCallback((number: string) => {
    if (activeContact) {
      const cleaned = number.replace(/[\s\-()]/g, '')
      setActiveContact({ ...activeContact, displayNumber: number, e164: cleaned })
    }
  }, [activeContact])

  const handleNameChange = useCallback((name: string) => {
    setContactName(name)
    if (activeContact) {
      window.electronAPI.setName(activeContact.e164, name)
    }
  }, [activeContact])

  const handleEmailChange = useCallback((email: string) => {
    setContactEmail(email)
    if (activeContact) {
      window.electronAPI.upsertContact(activeContact.e164, { email })
    }
  }, [activeContact])

  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template)
    setView('template-preview')
  }, [])

  const handleDeleteTemplate = useCallback(async (id: string) => {
    const updated = await window.electronAPI.deleteTemplate(id)
    setTemplates(updated)
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null)
      setView('main')
    }
  }, [selectedTemplate])

  const handleEditTemplate = useCallback((template: Template) => {
    setEditingTemplate(template)
    setHideCategoryInEditor(false)
    setView('template-editor')
  }, [])

  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null)
    setHideCategoryInEditor(false)
    setView('template-editor')
  }, [])

  const handleSaveTemplate = useCallback(async (template: Template) => {
    let updated: Template[]
    if (editingTemplate) {
      updated = await window.electronAPI.updateTemplate(template)
    } else {
      updated = await window.electronAPI.addTemplate(template)
    }
    setTemplates(updated)
    setEditingTemplate(null)
    setView('main')
  }, [editingTemplate])

  const handleCancelEditor = useCallback(() => {
    setEditingTemplate(null)
    setView('main')
  }, [])

  const handleBackFromPreview = useCallback(() => {
    setSelectedTemplate(null)
    setView('main')
  }, [])

  const handleUpdateTemplateFromPreview = useCallback(async (updatedBody: string) => {
    if (!selectedTemplate) return
    const updated = await window.electronAPI.updateTemplate({ ...selectedTemplate, body: updatedBody })
    setTemplates(updated)
    setSelectedTemplate({ ...selectedTemplate, body: updatedBody })
  }, [selectedTemplate])

  const handleSaveAsNewTemplate = useCallback(async (name: string, body: string, category: string) => {
    const newTemplate: Template = {
      id: `tpl-${Date.now()}`,
      name,
      body,
      category
    }
    const updated = await window.electronAPI.addTemplate(newTemplate)
    setTemplates(updated)
  }, [])

  const handleEditRoleTemplate = useCallback((role: ContactRole) => {
    setEditingRole(role)
    setView('role-template-editor')
  }, [])

  const handleSaveRoleTemplate = useCallback(async (role: ContactRole, template: RoleTemplate) => {
    const updated = await window.electronAPI.saveRoleTemplate(role, template)
    setRoleTemplates(updated)
    setEditingRole(null)
    setView('main')
  }, [])

  const handleCancelRoleEditor = useCallback(() => {
    setEditingRole(null)
    setView('main')
  }, [])

  const handleEditForm = useCallback((form: FormEntry) => {
    setEditingForm(form)
    setView('form-editor')
  }, [])

  const handleSaveFormOverride = useCallback(async (formId: string, override: FormTemplateOverride) => {
    const updated = await window.electronAPI.saveFormOverride(formId, override)
    setFormOverrides(updated)
    setEditingForm(null)
    setView('main')
  }, [])

  const handleResetFormOverride = useCallback(async (formId: string) => {
    const updated = await window.electronAPI.resetFormOverride(formId)
    setFormOverrides(updated)
  }, [])

  const handleCancelFormEditor = useCallback(() => {
    setEditingForm(null)
    setView('main')
  }, [])

  const handleEnsureTemplate = useCallback(async (templateId: string, defaults: Template) => {
    // Check if template exists
    const existing = templates.find((t) => t.id === templateId)
    setHideCategoryInEditor(true)
    if (existing) {
      setEditingTemplate(existing)
      setView('template-editor')
    } else {
      // Auto-create the template with defaults
      const updated = await window.electronAPI.addTemplate(defaults)
      setTemplates(updated)
      setEditingTemplate(defaults)
      setView('template-editor')
    }
  }, [templates])

  const handleSaveHotkey = useCallback(async (key: string, value: string) => {
    await window.electronAPI.saveSettings({ [key]: value })
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }, [settings])

  const handleClearHotkey = useCallback(async (key: string) => {
    await window.electronAPI.saveSettings({ [key]: '' })
    if (settings) {
      setSettings({ ...settings, [key]: '' })
    }
  }, [settings])

  // Compact actions: perform action + hide panel (task done)
  const handleCompactDial = useCallback(() => {
    if (activeContact) {
      window.electronAPI.dial(activeContact.e164)
    }
    window.electronAPI.actionDone()
  }, [activeContact])

  const handleCompactWhatsApp = useCallback(() => {
    if (activeContact) {
      window.electronAPI.openWhatsApp(activeContact.e164, 'desktop')
    }
    window.electronAPI.actionDone()
  }, [activeContact])

  const handleCompactWhatsAppExpand = useCallback(() => {
    window.electronAPI.expandPanel()
  }, [])

  const handleCompactOneNote = useCallback(() => {
    if (activeContact) {
      window.electronAPI.openInOneNote({
        name: contactName,
        displayNumber: activeContact.displayNumber,
        roles: contactRoles,
        e164: activeContact.e164,
        unit: contactUnit,
        email: contactEmail
      }).catch(() => {/* silent */})
    }
    window.electronAPI.actionDone()
  }, [activeContact, contactName, contactEmail, contactRoles, contactUnit])

  const handleCompactCalendar = useCallback(() => {
    if (activeContact) {
      window.electronAPI.bookCalendar(
        { name: contactName, displayNumber: activeContact.displayNumber, roles: contactRoles, e164: activeContact.e164, email: contactEmail },
        'viewing'
      )
    }
    window.electronAPI.actionDone()
  }, [activeContact, contactName, contactEmail, contactRoles])

  // Close compact WA menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showCompactWAMenu && compactWARef.current && !compactWARef.current.contains(e.target as Node)) {
        setShowCompactWAMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCompactWAMenu])

  // ── Compact mode (title bar + action toolbar) ──────────────────────────
  if (mode === 'compact' && view === 'main') {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col">
        <TitleBar title="Ask Dave Real Estate" />

        <div className="flex-1 flex flex-col p-2.5 gap-2">
          {activeContact ? (
            <>
              {/* Phone number + copy + clear */}
              <div className="flex items-center justify-between bg-[#161617] border border-white/[0.07] rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-[#ededee] tracking-wider tabular-nums">
                  {activeContact.displayNumber}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => window.electronAPI.copyNumber(activeContact.e164)}
                    className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors"
                    title="Copy number"
                  >
                    <Copy size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={handleClearContact}
                    className="text-[#a1a1aa] hover:text-[#ededee] px-1 transition-colors"
                    title="Clear"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Action buttons — Dial + WhatsApp (with dropdown) + Expand */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCompactDial}
                  className="flex-1 flex items-center justify-center py-1.5 text-xs bg-[rgba(99,102,241,0.14)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] rounded-md hover:bg-[rgba(99,102,241,0.22)] transition-colors"
                >
                  Dial
                </button>
                <div className="relative flex flex-1" ref={compactWARef}>
                  <button
                    onClick={handleCompactWhatsApp}
                    className="flex-1 flex items-center justify-center px-2 py-1.5 text-xs text-white rounded-l-md hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setShowCompactWAMenu(!showCompactWAMenu)}
                    className="px-1.5 py-1.5 text-xs text-white rounded-r-md border-l border-white/20 hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <ChevronDown size={10} strokeWidth={1.5} />
                  </button>
                  {showCompactWAMenu && activeContact && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-[#1f1f21] border border-white/[0.07] rounded-md shadow-2xl z-10">
                      <button
                        onClick={() => { window.electronAPI.openWhatsApp(activeContact.e164, 'desktop'); setShowCompactWAMenu(false); window.electronAPI.actionDone() }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]"
                      >
                        WhatsApp Desktop
                      </button>
                      <button
                        onClick={() => { window.electronAPI.openWhatsApp(activeContact.e164, 'web'); setShowCompactWAMenu(false); window.electronAPI.actionDone() }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]"
                      >
                        WhatsApp Web
                      </button>
                      <div className="border-t border-white/[0.07] my-0.5" />
                      <button
                        onClick={() => { setShowCompactWAMenu(false); window.electronAPI.expandPanel() }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#ededee]"
                      >
                        WhatsApp Templates
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => window.electronAPI.expandPanel()}
                  className="flex-1 flex items-center justify-center py-1.5 text-xs text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded-md hover:bg-[rgba(99,102,241,0.22)] transition-colors"
                >
                  Expand
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => window.electronAPI.expandPanel()}
                className="text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
              >
                Open full panel
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Template editor view ──────────────────────────────────────────────
  if (view === 'template-editor') {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title={editingTemplate ? 'Edit Template' : 'New Template'} onBack={handleCancelEditor} />
        <div className="flex-1 p-3 overflow-y-auto">
          <TemplateEditor
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={handleCancelEditor}
            hideCategory={hideCategoryInEditor}
          />
        </div>
      </div>
    )
  }

  // ── Role template editor view ────────────────────────────────────────
  if (view === 'role-template-editor' && editingRole && roleTemplates && defaultRoleTemplates) {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title={`${editingRole} Template`} onBack={handleCancelRoleEditor} />
        <div className="flex-1 p-3 overflow-y-auto">
          <RoleTemplateEditor
            role={editingRole}
            template={roleTemplates[editingRole]}
            defaultTemplate={defaultRoleTemplates[editingRole]}
            onSave={handleSaveRoleTemplate}
            onCancel={handleCancelRoleEditor}
          />
        </div>
      </div>
    )
  }

  // ── Form editor view ─────────────────────────────────────────────────
  if (view === 'form-editor' && editingForm) {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title="Edit Form Template" onBack={handleCancelFormEditor} />
        <div className="flex-1 p-3 overflow-y-auto">
          <FormEditor
            form={editingForm}
            override={formOverrides[editingForm.id]}
            onSave={handleSaveFormOverride}
            onReset={handleResetFormOverride}
            onCancel={handleCancelFormEditor}
          />
        </div>
      </div>
    )
  }

  // ── Template preview view ─────────────────────────────────────────────
  if (view === 'template-preview' && selectedTemplate && activeContact) {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title={selectedTemplate.name} onBack={handleBackFromPreview} />
        <div className="flex-1 p-3 overflow-y-auto">
          <TemplatePreview
            template={selectedTemplate}
            e164={activeContact.e164}
            contactName={contactName}
            contactUnit={contactUnit}
            onBack={handleBackFromPreview}
            onUpdateTemplate={handleUpdateTemplateFromPreview}
            onSaveAsNew={handleSaveAsNewTemplate}
          />
        </div>
      </div>
    )
  }

  // ── Education / Flashcards view ──────────────────────────────────────
  if (view === 'education') {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title="Education" onBack={() => setView('main')} />
        <div className="flex-1 p-3 overflow-y-auto min-h-0">
          <FlashcardView onBack={() => setView('main')} />
        </div>
      </div>
    )
  }

  // ── Transcriber view ─────────────────────────────────────────────────
  if (view === 'transcriber') {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title="Meeting Transcriber" onBack={() => setView('main')} />
        <div className="flex-1 p-3 overflow-y-auto min-h-0">
          <TranscriberView onBack={() => setView('main')} />
        </div>
      </div>
    )
  }

  // ── Hotkey reference view ─────────────────────────────────────────────
  if (view === 'hotkeys' && settings) {
    return (
      <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
        <TitleBar title="Keyboard Shortcuts" onBack={() => setView('main')} />
        <div className="flex-1 p-3 overflow-y-auto">
          <HotkeyPanel
            settings={settings}
            onSaveHotkey={handleSaveHotkey}
            onClearHotkey={handleClearHotkey}
            onBack={() => setView('main')}
          />
        </div>
      </div>
    )
  }

  // ── Main expanded view ────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0d0d0e] flex flex-col overflow-hidden">
      <TitleBar title="Ask Dave Real Estate">
        <button
          onClick={() => setView('hotkeys')}
          className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
          title="Keyboard shortcuts"
        >
          <Keyboard size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setView('education')}
          className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
          title="Education"
        >
          <BookOpen size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setView('transcriber')}
          className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
          title="Meeting Transcriber"
        >
          <Mic size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => window.electronAPI.openSettings()}
          className="w-8 h-8 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] transition-colors"
          title="Settings"
        >
          <Settings2 size={14} strokeWidth={1.5} />
        </button>
        <div className="w-px h-4 bg-white/[0.07] mx-0.5" />
      </TitleBar>

      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        {/* Incoming call / call ended notification */}
        {callEvent && settings && (
          <IncomingCallBar
            type={callEvent.type}
            e164={callEvent.e164}
            displayNumber={callEvent.displayNumber}
            contactName={callEvent.contactName}
            oneNoteEnabled={settings.oneNoteEnabled}
            onOpenOneNote={handleCallOpenOneNote}
            onFollowUp={handleCallFollowUp}
            onDismiss={handleDismissCallEvent}
          />
        )}

        {/* Phone input */}
        <PhoneInput onSubmit={handlePhoneSubmit} />

        {/* Shortcut reminder — always visible below phone input */}
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] rounded-md">
          <span className="text-xs text-[#9b9ba3]">Select a number, email, or block of text, then</span>
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded">
            Ctrl
          </kbd>
          <span className="text-[11px] text-[#5a5a60]">+</span>
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold text-[#818cf8] bg-[rgba(99,102,241,0.14)] border border-[rgba(99,102,241,0.25)] rounded">
            Space
          </kbd>
        </div>

        {/* Empty state hint — shown when no contact is active */}
        {!activeContact && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-[#5a5a60] text-center">
              Enter or select a phone number to get started
            </p>
          </div>
        )}

        {/* Contact card */}
        {activeContact && settings && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <ContactCard
              e164={activeContact.e164}
              displayNumber={activeContact.displayNumber}
              contactName={contactName}
              contactEmail={contactEmail}
              contactUnit={contactUnit}
              onNumberChange={handleNumberChange}
              onNameChange={handleNameChange}
              onEmailChange={handleEmailChange}
              onUnitChange={setContactUnit}
              onClear={handleClearContact}
              whatsappMode={settings.whatsappMode}
              oneNoteEnabled={settings.oneNoteEnabled}
              calendarEnabled={settings.calendarEnabled}
              followUpPromptEnabled={settings.followUpPromptEnabled}
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onCreateTemplate={handleCreateTemplate}
              onEnsureTemplate={handleEnsureTemplate}
              onEditRoleTemplate={handleEditRoleTemplate}
              viewingTemplateId={settings.viewingTemplateId}
              consultationTemplateId={settings.consultationTemplateId}
              contactRoles={contactRoles}
              oneNotePageId={oneNotePageId}
              onOneNotePageCreated={(pageId) => setOneNotePageId(pageId)}
              newsEnabled={settings.newsEnabled}
              formOverrides={formOverrides}
              onEditForm={handleEditForm}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
