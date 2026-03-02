import type { Template, AppSettings, ContactRole, Contact } from '../shared/types'

export interface ElectronAPI {
  // Panel
  closePanel: () => void
  openSettings: () => void

  // Actions
  dial: (e164: string) => void
  openWhatsApp: (e164: string, mode: 'web' | 'desktop') => void
  sendWhatsAppMessage: (e164: string, message: string) => void

  // Store
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  getTemplates: () => Promise<Template[]>
  saveTemplates: (templates: Template[]) => Promise<Template[]>
  addTemplate: (template: Template) => Promise<Template[]>
  deleteTemplate: (id: string) => Promise<Template[]>
  updateTemplate: (template: Template) => Promise<Template[]>

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
  openInOneNote: (data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string }) => Promise<{ success: boolean; error?: string; pageId?: string }>

  // Calendar
  bookCalendar: (data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string }, type: 'viewing' | 'consultation') => Promise<void>
  createFollowUp: (data: { name: string; displayNumber: string; roles: ContactRole[]; e164: string }, days: number) => Promise<{ success: boolean; error?: string; eventDate?: string }>

  // Events
  onPhoneDetected: (cb: (e164: string, displayNumber: string) => void) => void
  onTemplatesUpdated: (cb: (templates: Template[]) => void) => void
  removePhoneDetectedListener: () => void

  // Phone Link events
  onIncomingCall: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) => void
  onCallEnded: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) => void
}

export interface PopupAPI {
  dial: (e164: string) => void
  copyNumber: (e164: string) => void
  openWhatsApp: (e164: string) => void
  openWhatsAppWithMessage: (e164: string, message: string) => void
  dismiss: () => void
  getTemplates: () => Promise<Template[]>
  addTemplate: (template: Template) => Promise<Template[]>
  updateTemplate: (template: Template) => Promise<Template[]>
  deleteTemplate: (id: string) => Promise<Template[]>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  openSettings: () => void
  getContact: (e164: string) => Promise<Contact | null>
  upsertContact: (e164: string, data: Partial<Contact>) => Promise<Contact>
  addRole: (e164: string, role: string) => Promise<Contact>
  removeRole: (e164: string, role: string) => Promise<Contact | null>
  setName: (e164: string, name: string) => void
  onNameUpdated: (cb: (e164: string, name: string) => void) => void
  minimize: () => void
  restore: () => void
  showPanel: () => void
  openInOneNote: (data: { name: string; displayNumber: string; roles: string[]; e164: string }) => Promise<{ success: boolean; error?: string; pageId?: string }>
  bookCalendar: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, type: 'viewing' | 'consultation') => Promise<void>
  createFollowUp: (data: { name: string; displayNumber: string; roles: string[]; e164: string }, days: number) => Promise<{ success: boolean; error?: string; eventDate?: string }>
  onShow: (cb: (e164: string, displayNumber: string) => void) => void
  onTemplatesUpdated: (cb: (templates: Template[]) => void) => void
  onSettingsUpdated: (cb: (settings: AppSettings) => void) => void
  onMinimized: (cb: () => void) => void
  onRestored: (cb: () => void) => void

  // Phone Link events
  onIncomingCall: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) => void
  onCallEnded: (cb: (data: { e164: string; displayNumber: string; contactName: string | null }) => void) => void
  onPhoneLinkAccessDenied: (cb: () => void) => void
}

export interface SettingsAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  getAuthState: () => Promise<import('../shared/types').AuthState>
  microsoftSignIn: () => Promise<{ connected: boolean; account: string | null }>
  microsoftSignOut: () => Promise<{ connected: boolean; account: string | null }>
  googleSignIn: () => Promise<{ connected: boolean; account: string | null }>
  googleSignOut: () => Promise<{ connected: boolean; account: string | null }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    popupAPI: PopupAPI
    settingsAPI: SettingsAPI
  }
}
