export interface Template {
  id: string
  name: string        // Display name (e.g., "Listing Introduction")
  body: string        // Message body with {name} placeholder
  category: string    // e.g., "introduction", "follow-up", "viewing"
}

export interface AppSettings {
  clipboardEnabled: boolean
  hotkeysEnabled: boolean
  dialHotkey: string           // Electron accelerator format, e.g., "CommandOrControl+Shift+D"
  whatsappHotkey: string
  whatsappMode: 'web' | 'desktop'
  templates: Template[]
}

export interface HotkeyConfig {
  dialEnabled: boolean
  dialKey: string
  whatsappEnabled: boolean
  whatsappKey: string
}

export interface ContactInfo {
  e164: string         // Normalized phone number (+971XXXXXXXXX)
  displayNumber: string // Formatted for display (e.g., "+971 50 123 4567")
  name?: string        // Optional contact name for template substitution
}
