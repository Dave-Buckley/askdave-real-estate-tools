import { useState, useEffect, useCallback } from 'react'
import type { Template, AppSettings, ContactInfo, ContactRole } from '../../shared/types'
import PhoneInput from './components/PhoneInput'
import ContactCard from './components/ContactCard'
import TemplateList from './components/TemplateList'
import TemplatePreview from './components/TemplatePreview'
import TemplateEditor from './components/TemplateEditor'
import HotkeyPanel from './components/HotkeyPanel'

type View = 'main' | 'template-editor' | 'template-preview' | 'hotkeys'

function App(): React.JSX.Element {
  const [activeContact, setActiveContact] = useState<ContactInfo | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactRoles, setContactRoles] = useState<ContactRole[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [view, setView] = useState<View>('main')

  // Load templates and settings on mount, listen for sync from popup
  useEffect(() => {
    window.electronAPI.getTemplates().then(setTemplates)
    window.electronAPI.getSettings().then(setSettings)
    window.electronAPI.onTemplatesUpdated((updated) => setTemplates(updated))
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
  useEffect(() => {
    window.electronAPI.onPhoneDetected((e164, displayNumber) => {
      setActiveContact({ e164, displayNumber })
      setContactName('')
      setContactRoles([])
    })
    return () => {
      window.electronAPI.removePhoneDetectedListener()
    }
  }, [])

  const handlePhoneSubmit = useCallback((rawNumber: string) => {
    const cleaned = rawNumber.replace(/[\s\-()]/g, '')
    setActiveContact({ e164: cleaned, displayNumber: rawNumber })
    setContactName('')
    setContactRoles([])
  }, [])

  const handleClearContact = useCallback(() => {
    setActiveContact(null)
    setContactName('')
    setContactRoles([])
    setSelectedTemplate(null)
    setView('main')
  }, [])

  const handleNameChange = useCallback((name: string) => {
    setContactName(name)
    if (activeContact) {
      window.electronAPI.setName(activeContact.e164, name)
    }
  }, [activeContact])

  const handleRolesChange = useCallback((roles: ContactRole[]) => {
    setContactRoles(roles)
  }, [])

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
    setView('template-editor')
  }, [])

  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null)
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

  // Template editor view
  if (view === 'template-editor') {
    return (
      <div className="h-screen bg-gray-50 p-3 overflow-y-auto">
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEditor}
        />
      </div>
    )
  }

  // Template preview view
  if (view === 'template-preview' && selectedTemplate && activeContact) {
    return (
      <div className="h-screen bg-gray-50 p-3 overflow-y-auto">
        <TemplatePreview
          template={selectedTemplate}
          e164={activeContact.e164}
          contactName={contactName}
          onBack={handleBackFromPreview}
        />
      </div>
    )
  }

  // Hotkey reference view
  if (view === 'hotkeys' && settings) {
    return (
      <div className="h-screen bg-gray-50 p-3 overflow-y-auto">
        <HotkeyPanel
          settings={settings}
          onSaveHotkey={handleSaveHotkey}
          onClearHotkey={handleClearHotkey}
          onBack={() => setView('main')}
        />
      </div>
    )
  }

  // Main view
  return (
    <div className="h-screen bg-gray-50 flex flex-col p-3 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-700">Agent Kit</h1>
        <div className="flex items-center gap-1">
          {/* Hotkeys button */}
          <button
            onClick={() => setView('hotkeys')}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-200"
            title="Keyboard shortcuts"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="12" height="8" rx="1.5" />
              <line x1="4" y1="7" x2="4" y2="7.01" />
              <line x1="7" y1="7" x2="7" y2="7.01" />
              <line x1="10" y1="7" x2="10" y2="7.01" />
              <line x1="4" y1="9.5" x2="10" y2="9.5" />
            </svg>
          </button>
          {/* Settings button */}
          <button
            onClick={() => window.electronAPI.openSettings()}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-200"
            title="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.068.727c.243-.97 1.62-.97 1.864 0l.071.286a.96.96 0 001.622.434l.205-.211c.695-.719 1.888-.03 1.613.931l-.084.295a.96.96 0 001.187 1.187l.295-.084c.961-.275 1.65.918.931 1.613l-.211.205a.96.96 0 00.434 1.622l.286.071c.97.243.97 1.62 0 1.864l-.286.071a.96.96 0 00-.434 1.622l.211.205c.719.695.03 1.888-.931 1.613l-.295-.084a.96.96 0 00-1.187 1.187l.084.295c.275.961-.918 1.65-1.613.931l-.205-.211a.96.96 0 00-1.622.434l-.071.286c-.243.97-1.62.97-1.864 0l-.071-.286a.96.96 0 00-1.622-.434l-.205.211c-.695.719-1.888.03-1.613-.931l.084-.295a.96.96 0 00-1.187-1.187l-.295.084c-.961.275-1.65-.918-.931-1.613l.211-.205a.96.96 0 00-.434-1.622l-.286-.071c-.97-.243-.97-1.62 0-1.864l.286-.071a.96.96 0 00.434-1.622L.48 4.17c-.719-.695-.03-1.888.931-1.613l.295.084A.96.96 0 002.893 1.454l-.084-.295C2.534.198 3.727-.491 4.422.228l.205.211a.96.96 0 001.622-.434zM8 11a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={() => window.electronAPI.closePanel()}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-200"
            title="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Phone input */}
      <PhoneInput onSubmit={handlePhoneSubmit} />

      {/* Contact card */}
      {activeContact && settings && (
        <ContactCard
          e164={activeContact.e164}
          displayNumber={activeContact.displayNumber}
          contactName={contactName}
          onNameChange={handleNameChange}
          onClear={handleClearContact}
          whatsappMode={settings.whatsappMode}
          oneNoteEnabled={settings.oneNoteEnabled}
          calendarEnabled={settings.calendarEnabled}
          followUpPromptEnabled={settings.followUpPromptEnabled}
          roles={contactRoles}
          onRolesChange={handleRolesChange}
        />
      )}

      {/* Template list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TemplateList
          templates={templates}
          onSelect={handleSelectTemplate}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          onCreate={handleCreateTemplate}
          hasActiveContact={!!activeContact}
        />
      </div>
    </div>
  )
}

export default App
