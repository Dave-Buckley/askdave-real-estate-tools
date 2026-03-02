export interface Template {
  id: string
  name: string        // Display name (e.g., "Listing Introduction")
  body: string        // Message body with {name} placeholder
  category: string    // e.g., "introduction", "follow-up", "viewing"
}

export interface AppSettings {
  clipboardEnabled: boolean
  hotkeysEnabled: boolean
  selectionHotkey: string      // Hotkey to grab selected text and detect phone number
  dialHotkey: string           // Electron accelerator format, e.g., "CommandOrControl+Shift+D"
  whatsappHotkey: string
  whatsappMode: 'web' | 'desktop'
  popupAutoShow: boolean       // Show popup automatically when a phone number is detected
  oneNoteEnabled: boolean      // OneNote integration
  calendarEnabled: boolean     // Google Calendar integration
  phoneLinkEnabled: boolean    // Phone Link incoming call detection (Windows only)
  oneNoteNotebookId?: string   // Cached "Real Estate" notebook ID (Graph API)
  oneNoteSectionId?: string    // Cached "Contacts" section ID (Graph API)
  followUpPromptEnabled: boolean  // Show follow-up reminder buttons on ContactCard
  templates: Template[]
  contacts: Record<string, Contact>  // Keyed by E.164 phone number
}

export interface AuthState {
  microsoftConnected: boolean
  microsoftAccount: string | null   // email or display name
  googleConnected: boolean
  googleAccount: string | null
}

export type ContactRole = 'Tenant' | 'Landlord' | 'Buyer' | 'Seller' | 'Investor'

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

export interface Contact {
  e164: string              // Primary key — E.164 normalized phone number
  displayNumber: string     // Formatted display number
  name: string              // Contact name
  roles: ContactRole[]      // Assigned roles (multi-role support)
  notes: string             // Quick notes
  oneNotePageId?: string    // OneNote page ID if linked
  createdAt: string         // ISO timestamp
  updatedAt: string         // ISO timestamp
}
