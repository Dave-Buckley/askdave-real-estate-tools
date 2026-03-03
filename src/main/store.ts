import Store from 'electron-store'
import { AppSettings, Template, Contact, ContactRole, RoleTemplate, FormTemplateOverride } from '../shared/types'

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-001',
    name: 'Listing Introduction',
    body: 'Hi {name}, this is [Agent] from [Agency]. I have a new property listing that I think would be perfect for you. It\'s a beautifully maintained unit in a prime location. Would you like to hear more details or schedule a viewing? Let me know at your convenience.',
    category: 'introduction'
  },
  {
    id: 'tpl-002',
    name: 'Follow-Up',
    body: 'Hi {name}, this is [Agent] from [Agency]. I wanted to follow up on our recent conversation about the property. Have you had a chance to consider it? I\'m happy to answer any questions or arrange another viewing if needed. Looking forward to hearing from you.',
    category: 'follow-up'
  },
  {
    id: 'tpl-003',
    name: 'Viewing Confirmation',
    body: 'Hi {name}, just confirming your viewing appointment for tomorrow. The property is located at [Address]. Please bring a valid Emirates ID. I\'ll meet you at the building entrance. Feel free to reach out if you need directions.',
    category: 'viewing'
  },
  {
    id: 'tpl-004',
    name: 'Viewing Reminder',
    body: 'Hi {name}, a friendly reminder about your property viewing today at [Time]. The address is [Address]. If anything comes up and you need to reschedule, please let me know as soon as possible. See you there!',
    category: 'reminder'
  },
  {
    id: 'tpl-005',
    name: 'New Listing Alert',
    body: 'Hi {name}, I just came across a new listing that matches what you\'re looking for. It\'s a [Type] in [Area] with [Features]. The asking price is [Price]. Shall I send you the full details and photos? Happy to arrange a viewing this week.',
    category: 'alert'
  },
  {
    id: 'tpl-006',
    name: 'Thank You',
    body: 'Hi {name}, thank you for taking the time to view the property today. I hope it met your expectations. Please don\'t hesitate to reach out if you have any questions or would like to discuss the next steps. It was a pleasure meeting you.',
    category: 'thank-you'
  },
  {
    id: 'tpl-007',
    name: 'Request Docs — Tenant',
    body: 'Hi {name}, to proceed with the tenancy agreement I\'ll need the following documents:\n\n1. Passport copy (valid)\n2. Emirates ID (front & back)\n3. UAE residence visa copy\n4. Proof of income (salary certificate or bank statement)\n\nPlease send clear photos or scans at your earliest convenience. Let me know if you have any questions.',
    category: 'documents'
  },
  {
    id: 'tpl-008',
    name: 'Request Docs — Landlord',
    body: 'Hi {name}, to list your property and prepare the tenancy contract I\'ll need the following:\n\n1. Passport copy (valid)\n2. Emirates ID (front & back)\n3. Title deed copy\n4. DEWA premise number\n5. Form A (listing agreement) — I\'ll prepare this for your signature\n\nIf the property is under a company name, I\'ll also need the trade licence and POA. Please send clear scans when ready.',
    category: 'documents'
  },
  {
    id: 'tpl-009',
    name: 'Request Docs — Buyer',
    body: 'Hi {name}, to proceed with the purchase I\'ll need the following documents:\n\n1. Passport copy (valid)\n2. Emirates ID (front & back)\n3. UAE residence visa (if applicable)\n4. Mortgage pre-approval letter (if financing)\n5. Proof of funds / bank statement (if cash buyer)\n6. Form B (buyer agreement) — I\'ll prepare this for your review\n\nPlease send clear copies at your convenience.',
    category: 'documents'
  },
  {
    id: 'tpl-010',
    name: 'Request Docs — Seller',
    body: 'Hi {name}, to proceed with the sale I\'ll need the following:\n\n1. Passport copy (valid)\n2. Emirates ID (front & back)\n3. Original title deed\n4. Signed Form A (listing agreement)\n5. NOC from developer (I can guide you through this)\n6. Mortgage liability letter (if property has outstanding loan)\n7. Service charge clearance / DEWA final bill\n\nPlease send what you have and I\'ll help with the rest.',
    category: 'documents'
  },
  {
    id: 'tpl-011',
    name: 'Request Docs — Investor',
    body: 'Hi {name}, to move forward with the investment I\'ll need the following:\n\n1. Passport copy (valid)\n2. Emirates ID (if UAE resident)\n3. Proof of funds / bank reference letter\n4. Power of Attorney (if a representative will sign on your behalf)\n5. Company trade licence (if purchasing under a company)\n\nFor off-plan purchases, the developer may require additional KYC documents which I\'ll share once confirmed.',
    category: 'documents'
  },
  {
    id: 'tpl-viewing',
    name: 'Viewing Invitation',
    body: 'Hi {name}, I\'d like to arrange a property viewing for {unit}. Could you let me know your preferred date and time? I\'ll confirm the details shortly.',
    category: 'viewing'
  },
  {
    id: 'tpl-consultation',
    name: 'Consultation Invitation',
    body: 'Hi {name}, I\'d like to schedule a consultation to discuss your property requirements. When would be a convenient time for you?',
    category: 'other'
  }
]

export const DEFAULT_ROLE_TEMPLATES: Record<ContactRole, RoleTemplate> = {
  Tenant: {
    label: 'Tenant Qualifying Questions',
    questions: [
      'Monthly budget (AED)',
      'Number of cheques preferred',
      'Property type (apartment / villa / townhouse / studio)',
      'Number of bedrooms',
      'Furnished / unfurnished / partly furnished',
      'Preferred areas (1st, 2nd, 3rd choice)',
      'Must-have amenities (gym, pool, parking, balcony)',
      'Desired move-in date',
      'Current lease end date / notice period',
      'Visa status (employed / investor / freelance / family)',
      'Pets (yes/no — type & breed)',
      'Covered parking needed (how many)',
      'View preference (sea / marina / garden / city / open)',
      'Chiller-free preference',
      'Proximity requirements (school, metro, office)',
      'Deal-breakers (ground floor, shared gym, etc.)'
    ],
    documents: [
      'Passport copy (valid)',
      'Emirates ID (front & back)',
      'UAE residence visa copy',
      'Salary certificate or employment letter',
      'Post-dated rent cheques',
      'Security deposit cheque (5% of annual rent)',
      'Agency commission cheque (5% + VAT)',
      'Signed tenancy contract (Form Unified)',
      'Ejari certificate',
      'DEWA connection receipt',
      'Move-in condition report (signed by both parties)'
    ]
  },
  Landlord: {
    label: 'Landlord Property Details',
    questions: [
      'Property address (building, community)',
      'Property type (apartment / villa / townhouse)',
      'Number of bedrooms & bathrooms',
      'Total area (sq ft)',
      'Floor number & view',
      'Furnished / unfurnished / partly furnished',
      'Parking spaces included',
      'Title deed status (freehold / leasehold)',
      'Mortgage status (clear / outstanding — which bank)',
      'Current tenant status (vacant / tenanted — lease end date)',
      'Expected annual rent (AED)',
      'Cheques accepted (1 / 2 / 4 / 6 / 12)',
      'Service charges current (paid / outstanding)',
      'Other agents listing this property',
      'Pet policy (allowed / not allowed)'
    ],
    documents: [
      'Passport copy (valid)',
      'Emirates ID (front & back)',
      'Title deed copy',
      'NOC from mortgage bank (if mortgaged)',
      'Service charge clearance letter',
      'Form A2 (RERA rental listing agreement)',
      'Trakheesi permit number',
      'DEWA premise number',
      'Previous Ejari cancellation confirmation',
      'Floor plan / layout',
      'Tenancy contract (Form Unified — for agent to prepare)',
      'Power of Attorney (if owner is abroad)'
    ]
  },
  Buyer: {
    label: 'Buyer Qualifying Questions',
    questions: [
      'Budget range (AED)',
      'Cash buyer or mortgage',
      'Mortgage pre-approval status (bank & amount)',
      'Property type preference (apartment / villa / townhouse / penthouse)',
      'Number of bedrooms',
      'Preferred areas (1st, 2nd, 3rd choice)',
      'Purchase timeline (immediate / 1-3 months / 6+ months)',
      'First property purchase in Dubai (yes / no)',
      'Resident or non-resident buyer',
      'Golden Visa interest (AED 2M+ property)',
      'End-user or investment purpose',
      'View preference (sea / marina / garden / city / golf)',
      'Service charge tolerance (AED/sq ft)',
      'Developer preferences (Emaar, DAMAC, Nakheel, etc.)',
      'Must-have features (maid room, study, private pool, etc.)'
    ],
    documents: [
      'Passport copy (valid)',
      'Emirates ID (front & back)',
      'Visa copy (if UAE resident)',
      'Mortgage pre-approval letter',
      'Proof of funds / bank statement (cash buyers)',
      'Form B (RERA buyer agreement)',
      'Form F / MOU (Memorandum of Understanding)',
      'NOC from developer',
      'DLD transfer certificate',
      'Trustee office receipt (4% DLD fee + admin)',
      'Manager\'s cheques (seller, agent, DLD)',
      'Agent commission receipt',
      'Mortgage registration (if financed)',
      'DEWA transfer / new connection'
    ]
  },
  Seller: {
    label: 'Seller Property Details',
    questions: [
      'Property type (apartment / villa / townhouse)',
      'Community / building name',
      'Number of bedrooms & bathrooms',
      'Total area (sq ft)',
      'Title deed in hand (yes / no)',
      'Mortgage status (clear / outstanding — bank name)',
      'Currently tenanted (yes / no — lease end date)',
      'Service charges current (paid / outstanding amount)',
      'Asking price (AED)',
      'Minimum acceptable price (AED)',
      'Original purchase date & price',
      'Reason for selling',
      'Other agents listing this property',
      'Timeline to sell (urgent / flexible / 6+ months)'
    ],
    documents: [
      'Passport copy (valid)',
      'Emirates ID (front & back)',
      'Original title deed',
      'Form A (RERA listing agreement)',
      'Form F / MOU (Memorandum of Understanding)',
      'NOC from developer',
      'Service charge clearance letter',
      'Mortgage clearance certificate (if mortgaged)',
      'Bank consent to sell (if mortgage outstanding)',
      'Trakheesi permit number',
      'DEWA final bill / clearance',
      'Property condition report',
      'Power of Attorney (if owner is abroad)'
    ]
  },
  Investor: {
    label: 'Investor Profile',
    questions: [
      'Total investment budget (AED)',
      'Investment goal (capital appreciation / rental yield / both)',
      'Target ROI (%)',
      'Cash or mortgage financing',
      'Off-plan or ready property preference',
      'Preferred developers (Emaar, DAMAC, Sobha, etc.)',
      'Preferred areas / communities',
      'Investment horizon (short-term flip / 3-5 years / long-term hold)',
      'Current Dubai property portfolio (number of units)',
      'Golden Visa interest (AED 2M+ threshold)',
      'Payment plan comfort (40/60, 50/50, post-handover)',
      'Rental management service needed (yes / no)',
      'Tax residency / international tax awareness',
      'Interest in assignment / off-plan resale before handover'
    ],
    documents: [
      'Passport copy (valid)',
      'Emirates ID (if UAE resident)',
      'Proof of funds / bank reference letter',
      'EOI / reservation form',
      'SPA (Sale & Purchase Agreement)',
      'Oqood registration (off-plan)',
      'Payment schedule receipts',
      'NOC from developer (resale)',
      'DLD transfer receipt',
      'Escrow account details',
      'Handover certificate (ready properties)',
      'Snagging report',
      'Golden Visa application documents (if applicable)',
      'Power of Attorney (if representative signs)'
    ]
  }
}

export const store = new Store<AppSettings>({
  defaults: {
    clipboardEnabled: false,
    hotkeysEnabled: true,
    selectionHotkey: 'CommandOrControl+Space',
    dialHotkey: 'CommandOrControl+Shift+D',
    whatsappHotkey: 'CommandOrControl+Shift+W',
    whatsappMode: 'web',
    popupAutoShow: true,
    oneNoteEnabled: true,
    calendarEnabled: true,
    phoneLinkEnabled: process.platform === 'win32',
    followUpPromptEnabled: true,
    newsEnabled: true,
    viewingTemplateId: 'tpl-viewing',
    consultationTemplateId: 'tpl-consultation',
    templates: DEFAULT_TEMPLATES,
    contacts: {},
    oneNoteRoleTemplates: DEFAULT_ROLE_TEMPLATES,
    formOverrides: {}
  }
})
