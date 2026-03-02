import { useState, useEffect, useCallback } from 'react'
import type { Template, AppSettings, ContactInfo } from '../../shared/types'
import PhoneInput from './components/PhoneInput'
import ContactCard from './components/ContactCard'
import TemplateList from './components/TemplateList'
import TemplatePreview from './components/TemplatePreview'
import TemplateEditor from './components/TemplateEditor'

type View = 'main' | 'template-editor' | 'template-preview'

function App(): React.JSX.Element {
  const [activeContact, setActiveContact] = useState<ContactInfo | null>(null)
  const [contactName, setContactName] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [view, setView] = useState<View>('main')

  // Load templates and settings on mount
  useEffect(() => {
    window.electronAPI.getTemplates().then(setTemplates)
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  // Subscribe to phone:detected events from clipboard
  useEffect(() => {
    window.electronAPI.onPhoneDetected((e164, displayNumber) => {
      setActiveContact({ e164, displayNumber })
    })
    return () => {
      window.electronAPI.removePhoneDetectedListener()
    }
  }, [])

  const handlePhoneSubmit = useCallback((rawNumber: string) => {
    // For manual input, we use the raw number as both e164 and display
    // The main process will normalize it when actions are triggered
    // Simple client-side formatting: just clean and use as-is
    const cleaned = rawNumber.replace(/[\s\-()]/g, '')
    setActiveContact({
      e164: cleaned,
      displayNumber: rawNumber
    })
  }, [])

  const handleClearContact = useCallback(() => {
    setActiveContact(null)
    setContactName('')
    setSelectedTemplate(null)
    setView('main')
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

  // Main view
  return (
    <div className="h-screen bg-gray-50 flex flex-col p-3 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-700">Agent Kit</h1>
      </div>

      {/* Phone input — always visible */}
      <PhoneInput onSubmit={handlePhoneSubmit} />

      {/* Contact card — shown when a number is active */}
      {activeContact && settings && (
        <ContactCard
          e164={activeContact.e164}
          displayNumber={activeContact.displayNumber}
          contactName={contactName}
          onNameChange={setContactName}
          onClear={handleClearContact}
          whatsappMode={settings.whatsappMode}
        />
      )}

      {/* Template list — always visible, scrollable */}
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
