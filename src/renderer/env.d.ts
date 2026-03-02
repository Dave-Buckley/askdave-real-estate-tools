import type { Template, AppSettings } from '../shared/types'

export interface ElectronAPI {
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

  // Events
  onPhoneDetected: (cb: (e164: string, displayNumber: string) => void) => void
  removePhoneDetectedListener: () => void
}

export interface PopupAPI {
  dial: (e164: string) => void
  openWhatsApp: (e164: string) => void
  dismiss: () => void
  onShow: (cb: (e164: string, displayNumber: string) => void) => void
}

export interface SettingsAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    popupAPI: PopupAPI
    settingsAPI: SettingsAPI
  }
}
