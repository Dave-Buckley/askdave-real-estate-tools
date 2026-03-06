/**
 * Real estate forms with pre-written WhatsApp and Gmail message templates.
 * Forms are organized by category: Sales, Rentals, Off-plan.
 * File originals stored in: Documents/Real Estate/Forms/
 */

export type FormCategory = 'sales' | 'rentals' | 'offplan'

export interface FormEntry {
  id: string
  name: string                // Display name
  fileName: string            // Actual file name (for reference / Signable upload)
  subFolder: string           // Subfolder inside Forms directory (Sales/Rentals/KYC/Other)
  categories: FormCategory[]  // Which tabs this form appears under
  description: string         // Brief description shown in UI
  signable: boolean           // Whether this form needs e-signature
  whatsappMessage: string     // Pre-filled WhatsApp message (supports {name}, {unit}, {number}, {email})
  emailSubject: string        // Gmail compose subject
  emailBody: string           // Gmail compose body
}

export const FORMS: FormEntry[] = [
  // ── Sales Forms ────────────────────────────────────────────────────────

  {
    id: 'form-a',
    name: 'RERA Form A — Listing Agreement',
    fileName: 'RERA-Form-A. dean pdf.pdf',
    subFolder: 'Sales',
    categories: ['sales', 'offplan'],
    description: 'Seller authorizes agent to list and market property (RERA-mandated)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached RERA Form A — the listing agreement authorizing Paragon Properties to market your property.\n\nPlease review, sign, and return at your earliest convenience. Let me know if you have any questions.',
    emailSubject: 'RERA Form A — Listing Agreement for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached RERA Form A, the official listing agreement authorizing Paragon Properties to market your property.\n\nThis is a RERA-mandated document required before we can list and advertise the property. Please review all terms carefully, sign, and return at your earliest convenience.\n\nRequired along with this form:\n- Passport copy (valid)\n- Emirates ID (front & back)\n- Title deed copy\n\nIf you have any questions or require clarification, please don\'t hesitate to reach out.\n\nBest regards'
  },
  {
    id: 'form-a-contract',
    name: 'RERA Form A — Contract Terms',
    fileName: 'RERA Form Contract A.pdf',
    subFolder: 'Sales',
    categories: ['sales'],
    description: 'Contract terms of the RERA listing agreement',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the RERA Form A Contract outlining the listing agreement terms. Please review alongside Form A and sign both documents.',
    emailSubject: 'RERA Form A Contract — Listing Terms for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the RERA Form A Contract, which outlines the full terms and conditions of the listing agreement.\n\nThis should be reviewed and signed alongside Form A. Please return both signed documents at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'form-b',
    name: 'RERA Form B — Buyer Agreement',
    fileName: 'RERA-Form-B.pdf',
    subFolder: 'Sales',
    categories: ['sales', 'offplan'],
    description: 'Buyer authorizes agent to act on their behalf (RERA-mandated)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached RERA Form B — the buyer\'s agent agreement authorizing Paragon Properties to act on your behalf in finding suitable properties.\n\nPlease review, sign, and return. Let me know if you have any questions.',
    emailSubject: 'RERA Form B — Buyer Agreement',
    emailBody: 'Dear {name},\n\nPlease find attached RERA Form B, the buyer\'s agent agreement. This authorizes Paragon Properties to act on your behalf in sourcing and negotiating suitable properties.\n\nThis is a RERA-mandated document required before we can proceed with property viewings and negotiations.\n\nPlease review, sign, and return at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'form-f',
    name: 'RERA Form F — MOU',
    fileName: 'FORM F_editable.pdf',
    subFolder: 'Sales',
    categories: ['sales', 'offplan'],
    description: 'Memorandum of Understanding between buyer and seller',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached RERA Form F — the Memorandum of Understanding (MOU) outlining the agreed terms of the sale for {unit}.\n\nPlease review all terms carefully before signing. I\'m available to walk you through any sections.',
    emailSubject: 'RERA Form F — MOU for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached RERA Form F, the Memorandum of Understanding (MOU) between buyer and seller.\n\nThis document outlines the agreed sale price, payment terms, transfer timeline, and obligations of both parties for {unit}. Please review all sections carefully.\n\nKey items to note:\n- Agreed sale price and deposit amount\n- Transfer date and conditions\n- Additional obligations and fees\n\nPlease sign and return at your earliest convenience. I\'m available to walk you through any sections if needed.\n\nBest regards'
  },
  {
    id: 'form-i-seller',
    name: 'Form I — Sales (Seller)',
    fileName: 'Form I - Sales (Seller).pdf',
    subFolder: 'Sales',
    categories: ['sales'],
    description: 'Agent-to-agent commission split agreement for sales (seller side)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached Form I for our commission split on the sale of {unit}. This outlines the agreed commission sharing terms between our brokerages. Please review, sign, and return.',
    emailSubject: 'Form I — Commission Split Agreement (Seller Side) for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached Form I, the commission split agreement for the seller side of the sale of {unit}.\n\nThis RERA-mandated document outlines the agreed commission sharing arrangement between our brokerages for this transaction. Please review all terms, sign, and return at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'form-i-buyer',
    name: 'Form I — Sales (Buyer)',
    fileName: 'Form I - Sales (Buyer).pdf',
    subFolder: 'Sales',
    categories: ['sales', 'offplan'],
    description: 'Agent-to-agent commission split agreement for sales (buyer side)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached Form I for our commission split on the purchase of {unit}. This outlines the agreed commission sharing terms between our brokerages. Please review, sign, and return.',
    emailSubject: 'Form I — Commission Split Agreement (Buyer Side) for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached Form I, the commission split agreement for the buyer side of the purchase of {unit}.\n\nThis RERA-mandated document outlines the agreed commission sharing arrangement between our brokerages for this transaction. Please review all terms, sign, and return at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'form-u',
    name: 'Form U — Termination Notice',
    fileName: 'Form-U-2.pdf',
    subFolder: 'Sales',
    categories: ['sales', 'rentals'],
    description: 'Notice of termination for any RERA agreement (Form A, B, F, etc.)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached Form U — the notice of termination for the existing agreement. Please review, sign, and return.',
    emailSubject: 'Form U — Notice of Termination',
    emailBody: 'Dear {name},\n\nPlease find attached Form U, the official notice of termination for the existing RERA agreement.\n\nAll original agreement terms and conditions shall remain in effect until this notice becomes effective. Please review, sign, and return.\n\nBest regards'
  },
  {
    id: 'clauses-cash-cash',
    name: 'Contract Clauses — Cash/Cash',
    fileName: 'Cash Buyer to Cash Seller.docx',
    subFolder: 'Sales',
    categories: ['sales'],
    description: 'Additional clauses for Form F: cash buyer purchasing from cash seller',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the additional contract clauses for the sale of {unit}. These accompany Form F and outline obligations for both buyer and seller. Please review carefully.',
    emailSubject: 'Contract Clauses — Cash Buyer to Cash Seller for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the additional contract clauses that accompany Form F for the sale of {unit}.\n\nThese clauses cover:\n- Buyer & seller additional obligations and fees\n- Deposit terms and forfeiture conditions\n- Transfer process and timeline\n- AML compliance requirements\n\nPlease review carefully and sign alongside Form F.\n\nBest regards'
  },
  {
    id: 'clauses-cash-mortgage',
    name: 'Contract Clauses — Cash/Mortgage Seller',
    fileName: 'Cash Buyer to Mortgage Seller.docx',
    subFolder: 'Sales',
    categories: ['sales'],
    description: 'Additional clauses for Form F: cash buyer, seller has existing mortgage',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the additional contract clauses for the sale of {unit}. These cover the mortgage release process and obligations. Please review carefully.',
    emailSubject: 'Contract Clauses — Cash Buyer to Mortgage Seller for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the additional contract clauses for the sale of {unit}.\n\nAs the seller has an existing mortgage, these clauses include provisions for:\n- Mortgage liability letter and release process\n- Buyer & seller additional obligations and fees\n- Transfer conditions and deposit terms\n- AML compliance requirements\n\nPlease review carefully and sign alongside Form F.\n\nBest regards'
  },
  {
    id: 'clauses-mortgage-cash',
    name: 'Contract Clauses — Mortgage/Cash',
    fileName: 'Mortgage Buyer to Cash Seller.docx',
    subFolder: 'Sales',
    categories: ['sales'],
    description: 'Additional clauses for Form F: buyer financing with mortgage, cash seller',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the additional contract clauses for the sale of {unit}. These cover mortgage approval conditions and property valuation terms. Please review carefully.',
    emailSubject: 'Contract Clauses — Mortgage Buyer to Cash Seller for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the additional contract clauses for the sale of {unit}.\n\nAs the buyer is financing with a mortgage, these clauses include provisions for:\n- Mortgage pre-approval and final approval conditions\n- Property valuation requirements\n- Buyer & seller additional obligations and fees\n- Transfer conditions and deposit terms\n- AML compliance requirements\n\nPlease review carefully and sign alongside Form F.\n\nBest regards'
  },
  {
    id: 'clauses-mortgage-mortgage',
    name: 'Contract Clauses — Mortgage/Mortgage',
    fileName: 'Mortgage Buyer to Mortgage Seller.docx',
    subFolder: 'Sales',
    categories: ['sales'],
    description: 'Additional clauses for Form F: buyer financing with mortgage, seller has mortgage',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the additional contract clauses for the sale of {unit}. These cover mortgage conditions for both parties. Please review carefully.',
    emailSubject: 'Contract Clauses — Mortgage Buyer to Mortgage Seller for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the additional contract clauses for the sale of {unit}.\n\nAs both parties have mortgage considerations, these clauses include provisions for:\n- Buyer mortgage approval and valuation conditions\n- Seller mortgage liability letter and release process\n- Handover property provisions (if applicable)\n- Buyer & seller additional obligations and fees\n- Transfer conditions and deposit terms\n- AML compliance requirements\n\nPlease review carefully and sign alongside Form F.\n\nBest regards'
  },
  {
    id: 'listing-form',
    name: 'Listing Form — Paragon',
    fileName: 'Listing form - Paragon_Editable 2024 (new).pdf',
    subFolder: 'Sales',
    categories: ['sales', 'rentals'],
    description: 'Paragon Properties listing form with property details for marketing',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the Paragon Properties Listing Form. Kindly fill in all property details and sign to authorize us to list and market your property.',
    emailSubject: 'Listing Form — Property Details for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the Paragon Properties Listing Form.\n\nKindly fill in all property details including:\n- Property address and type\n- Bedrooms, bathrooms, and area (sq ft)\n- Rental/sale amount\n- Current occupancy status\n\nPlease sign and return along with a copy of your passport/EID. This information is required to list and market your property.\n\nBest regards'
  },
  {
    id: 'board-form',
    name: 'Board Authorization Form',
    fileName: 'Board Form.docx',
    subFolder: 'Sales',
    categories: ['sales', 'rentals'],
    description: 'Owner authorization for property boards and viewings access',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the Board Authorization Form. This authorizes Paragon Properties to place a For Sale/Rent board and conduct viewings at {unit}. Please sign and return.',
    emailSubject: 'Board Authorization Form — {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the Board Authorization Form for {unit}.\n\nThis document authorizes Paragon Properties to:\n- Place a For Sale / For Rent board on the premises\n- Access the property for viewings during agreed hours\n- Present identification to community security\n\nRequired documents:\n- Copy of this signed authorization\n- Photo ID card of homeowner\n- Apartment key and access card\n\nPlease sign and return at your earliest convenience.\n\nBest regards'
  },

  // ── Rental Forms ───────────────────────────────────────────────────────

  {
    id: 'form-i-landlord',
    name: 'Form I — Leasing (Landlord)',
    fileName: 'Form I - Leasing (Landlord).pdf',
    subFolder: 'Rentals',
    categories: ['rentals'],
    description: 'Agent-to-agent commission split agreement for leasing (landlord side)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached Form I for our commission split on the lease of {unit}. This outlines the agreed commission sharing terms between our brokerages. Please review, sign, and return.',
    emailSubject: 'Form I — Commission Split Agreement (Landlord Side) for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached Form I, the commission split agreement for the landlord side of the lease of {unit}.\n\nThis RERA-mandated document outlines the agreed commission sharing arrangement between our brokerages for this transaction. Please review all terms, sign, and return at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'form-i-tenant',
    name: 'Form I — Leasing (Tenant)',
    fileName: 'Form I - Leasing (Tenant).pdf',
    subFolder: 'Rentals',
    categories: ['rentals'],
    description: 'Agent-to-agent commission split agreement for leasing (tenant side)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached Form I for our commission split on the tenancy of {unit}. This outlines the agreed commission sharing terms between our brokerages. Please review, sign, and return.',
    emailSubject: 'Form I — Commission Split Agreement (Tenant Side) for {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached Form I, the commission split agreement for the tenant side of the lease of {unit}.\n\nThis RERA-mandated document outlines the agreed commission sharing arrangement between our brokerages for this transaction. Please review all terms, sign, and return at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'tenancy-contract',
    name: 'Tenancy Contract',
    fileName: 'Tenancy Contract Editable.pdf',
    subFolder: 'Rentals',
    categories: ['rentals'],
    description: 'Editable tenancy contract (Unified Form)',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the Tenancy Contract for {unit}. Please review all terms carefully and ensure all details are correct before signing.\n\nRequired cheques and documents will need to be submitted alongside the signed contract.',
    emailSubject: 'Tenancy Contract — {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the Tenancy Contract for {unit}.\n\nPlease review all terms carefully, including:\n- Rental amount and payment schedule\n- Contract duration and renewal terms\n- Maintenance responsibilities\n- Security deposit details\n\nRequired alongside the signed contract:\n- Passport copy (valid)\n- Emirates ID (front & back)\n- UAE residence visa copy\n- Post-dated rent cheques\n- Security deposit cheque (5% of annual rent)\n\nPlease sign and return at your earliest convenience.\n\nBest regards'
  },
  {
    id: 'addendum',
    name: 'Tenancy Contract Addendum',
    fileName: 'Addendum2025.docx',
    subFolder: 'Rentals',
    categories: ['rentals'],
    description: 'Additional terms and conditions for the tenancy contract',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the Tenancy Contract Addendum for {unit}. This outlines additional terms regarding security deposit, use of premises, maintenance, and end-of-tenancy conditions. Please review and sign alongside the main contract.',
    emailSubject: 'Tenancy Contract Addendum — {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the Tenancy Contract Addendum for {unit}.\n\nThis document outlines additional terms including:\n- Security deposit conditions and refund process\n- Use of premises (residential only)\n- Maintenance responsibilities (major vs minor)\n- End-of-tenancy notice periods and conditions\n- Utility and community charge responsibilities\n\nThis addendum must be read in conjunction with the main Tenancy Contract. Please review, sign, and return both documents.\n\nBest regards'
  },
  {
    id: 'ejari-termination',
    name: 'Ejari Termination (NOC)',
    fileName: 'Ejari Termination request form (NOC) Template.pdf',
    subFolder: 'Rentals',
    categories: ['rentals'],
    description: 'Request form for cancelling Ejari registration',
    signable: true,
    whatsappMessage: 'Hi {name}, please find attached the Ejari Termination Request Form. Please complete and sign this form to cancel the existing Ejari registration for {unit}.\n\nThis can be submitted at most typing centers in Dubai.',
    emailSubject: 'Ejari Termination Request Form (NOC) — {unit}',
    emailBody: 'Dear {name},\n\nPlease find attached the Ejari Termination Request Form (NOC) for {unit}.\n\nPlease complete and sign this form to cancel the existing Ejari registration. You can submit the form at most typing centers in Dubai.\n\nRequired documents:\n- Completed and signed NOC form\n- Copy of current Ejari certificate\n- Passport copy\n- Emirates ID\n\nPlease let me know if you need any assistance.\n\nBest regards'
  },
  {
    id: 'closing-mail',
    name: 'Closing Mail — Post-Signing',
    fileName: 'Closing Mail.docx',
    subFolder: 'Rentals',
    categories: ['rentals'],
    description: 'Post-lease-signing introduction email between landlord and tenant with move-in instructions',
    signable: false,
    whatsappMessage: 'Hi {name}, congratulations on signing the tenancy contract for {unit}! I\'ve sent you an email with all the move-in details including Ejari registration, DEWA setup, and move-in permit information. Please check your inbox.',
    emailSubject: 'Congratulations — Move-In Details for {unit}',
    emailBody: 'Dear {name},\n\nCongratulations on signing the tenancy contract for {unit}!\n\nHere are your next steps for moving in:\n\n1. EJARI REGISTRATION\nRegister your lease with Ejari at most typing centers (cost ~AED 220). You\'ll need the tenancy contract, passport, and Emirates ID.\n\n2. DEWA CONNECTION\nOnce you have a valid Ejari and Emirates ID, visit your nearest DEWA office or register online at http://e-services.dewa.gov.ae/\nSecurity deposit: ~AED 2,000 (apartments) / AED 4,000 (villas)\nYou\'ll need the DEWA premise number from the front page of your contract.\n\n3. MOVE-IN PERMIT\nSubmit your documents to the community management office for a move-in permit. Please note this can take up to 5 business days to process.\n\nPlease register Ejari and DEWA as soon as possible to avoid delays.\n\nWe wish you all the best in your new home. Don\'t hesitate to reach out if you need anything.\n\nBest regards'
  },

]

/** Get forms filtered by category */
export function getFormsByCategory(category: FormCategory): FormEntry[] {
  return FORMS.filter((f) => f.categories.includes(category))
}
