export interface Template {
  id: string
  name: string        // Display name (e.g., "Listing Introduction")
  body: string        // Message body with {name} placeholder
  category: string    // e.g., "introduction", "follow-up", "viewing"
}

export interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

export interface FormTemplateOverride {
  whatsappMessage?: string
  emailSubject?: string
  emailBody?: string
}

export interface FlashCard {
  id: string
  question: string
  type: 'flashcard' | 'multiple-choice'
  answer: string
  options?: string[] // 4 options for multiple-choice (one is the correct answer)
}

export interface FlashcardDeck {
  id: string
  name: string
  description: string
  cardCount: number
  cards: FlashCard[]
}

export interface CardProgress {
  confidence: 1 | 2 | 3
  timesSeen: number
  lastSeen: string // ISO timestamp
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
  newsEnabled: boolean         // UAE real estate news feed
  viewingTemplateId: string    // Template ID for viewing invitation
  consultationTemplateId: string  // Template ID for consultation invitation
  templates: Template[]
  contacts: Record<string, Contact>  // Keyed by E.164 phone number
  oneNoteRoleTemplates?: Record<ContactRole, RoleTemplate>
  formOverrides?: Record<string, FormTemplateOverride>
  flashcardProgress: Record<string, CardProgress>
  whisperModel: WhisperModelId
}

export type ContactRole = 'Tenant' | 'Landlord' | 'Buyer' | 'Seller' | 'Investor'

export interface RoleTemplate {
  label: string
  questions: string[]
  documents: string[]
}

export interface HotkeyConfig {
  dialEnabled: boolean
  dialKey: string
  whatsappEnabled: boolean
  whatsappKey: string
}

// --- Meeting Transcriber ---

export type WhisperModelId =
  | 'onnx-community/whisper-tiny.en'
  | 'onnx-community/whisper-base.en'
  | 'onnx-community/whisper-small.en'
  | 'onnx-community/whisper-small'

export type TranscriberState =
  | 'idle'
  | 'waiting'              // server running, QR displayed, waiting for phone
  | 'recording'
  | 'paused'
  | 'transcribing'
  | 'done'
  | 'error'

export interface TranscriberStatus {
  state: TranscriberState
  elapsed?: number          // seconds recorded so far
  transcript?: string       // result text (when state=done)
  error?: string            // error message (when state=error)
  modelLoading?: boolean    // true while downloading/loading model
  modelProgress?: number    // 0-100 download progress
  phoneConnected?: boolean  // true when phone WebSocket is connected
  serverPort?: number       // local server port
  serverUrl?: string        // full URL for QR code (http://192.168.x.x:PORT)
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
  email: string             // Contact email address
  roles: ContactRole[]      // Assigned roles (multi-role support)
  notes: string             // Quick notes
  oneNotePageId?: string    // OneNote page ID if linked
  createdAt: string         // ISO timestamp
  updatedAt: string         // ISO timestamp
}
