import type { Template, AppSettings, ContactRole, Contact, RoleTemplate, FormTemplateOverride } from '../shared/types'

export interface ElectronAPI {
  // Panel window controls
  closePanel: () => void
  minimizePanel: () => void
  maximizePanel: () => void
  openSettings: () => void

  // Actions
  actionDone: () => void
  copyNumber: (e164: string) => void
  dial: (e164: string) => void
  openWhatsApp: (e164: string, mode: 'web' | 'desktop') => void
  sendWhatsAppMessage: (e164: string, message: string, mode: 'web' | 'desktop') => void

  // Store
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  getTemplates: () => Promise<Template[]>
  saveTemplates: (templates: Template[]) => Promise<Template[]>
  addTemplate: (template: Template) => Promise<Template[]>
  deleteTemplate: (id: string) => Promise<Template[]>
  updateTemplate: (template: Template) => Promise<Template[]>

  // Form template overrides
  getFormOverrides: () => Promise<Record<string, FormTemplateOverride>>
  saveFormOverride: (formId: string, override: FormTemplateOverride) => Promise<Record<string, FormTemplateOverride>>
  resetFormOverride: (formId: string) => Promise<Record<string, FormTemplateOverride>>

  // Role templates (OneNote)
  getRoleTemplates: () => Promise<Record<ContactRole, RoleTemplate>>
  saveRoleTemplate: (role: ContactRole, template: RoleTemplate) => Promise<Record<ContactRole, RoleTemplate>>

  // Name sync
  setName: (e164: string, name: string) => void
  onNameUpdated: (cb: (e164: string, name: string) => void) => void

  // Contacts
  getContact: (e164: string) => Promise<Contact | null>
  upsertContact: (e164: string, data: Partial<Contact>) => Promise<Contact>
  addRole: (e164: string, role: ContactRole) => Promise<Contact>
  removeRole: (e164: string, role: ContactRole) => Promise<Contact | null>
  listContacts: () => Promise<Contact[]>
  deleteContact: (e164: string) => Promise<void>

  // OneNote
  openInOneNote: (data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string; unit?: string; email?: string }) => Promise<{ success: boolean; error?: string; pageId?: string }>
  openOneNoteSection: () => Promise<{ success: boolean; error?: string }>

  // Calendar
  bookCalendar: (data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string; unit?: string; email?: string }, type: 'viewing' | 'consultation', templateBody?: string) => Promise<void>
  createFollowUp: (data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string; email?: string }, days: number) => Promise<{ success: boolean; error?: string; eventDate?: string }>

  // Panel mode
  onModeChange: (cb: (mode: 'compact' | 'expanded') => void) => void
  expandPanel: () => void

  // Events
  onPhoneDetected: (cb: (e164: string, displayNumber: string) => void) => void
  onEmailDetected: (cb: (email: string) => void) => void
  onContactExtracted: (cb: (info: { e164?: string; displayNumber?: string; email?: string; name?: string; unit?: string }) => void) => void
  onTemplatesUpdated: (cb: (templates: Template[]) => void) => void
  removePhoneDetectedListener: () => void
  removeEmailDetectedListener: () => void

  // News
  getNews: () => Promise<{ items: Array<{ title: string; link: string; pubDate: string; source: string }>; lastFetched: number }>

  // Forms
  getFormsDir: () => Promise<string>
  saveFormAs: (subFolder: string, fileName: string) => Promise<{ success: boolean; path?: string }>

  // Shell
  openExternal: (url: string) => Promise<void>
  showItemInFolder: (filePath: string) => Promise<void>

  // Phone Link events
  onIncomingCall: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) => void
  onCallEnded: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) => void

  // Transcriber
  openRecorder: () => void
  closeRecorder: () => void
  onTranscriberState: (cb: (state: { state: string; elapsed?: number }) => void) => void
  removeTranscriberStateListener: () => void
  transcribeComplete: (transcript: string) => void
}

export interface SettingsAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    settingsAPI: SettingsAPI
  }
}
