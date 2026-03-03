import type { TransactionType } from './types'

/**
 * Static UAE document checklist definitions per transaction type.
 * Source of truth for IDs and labels — saved contact state only stores timestamps.
 * Based on RERA, DLD, and Ejari requirements (researched 2026-03-03).
 */
export const TRANSACTION_CHECKLISTS: Record<TransactionType, { id: string; label: string }[]> = {
  tenancy: [
    { id: 'tenant-passport', label: 'Tenant passport copy' },
    { id: 'tenant-emirates-id', label: 'Tenant Emirates ID' },
    { id: 'tenant-visa', label: 'Tenant UAE residence visa' },
    { id: 'landlord-passport', label: 'Landlord passport copy' },
    { id: 'landlord-emirates-id', label: 'Landlord Emirates ID' },
    { id: 'title-deed', label: 'Title deed' },
    { id: 'dewa-number', label: 'DEWA premise number' },
    { id: 'signed-contract', label: 'Signed tenancy contract' },
    { id: 'form-a', label: 'Form A (listing agreement)' }
  ],
  renewal: [
    { id: 'renewed-contract', label: 'Renewed tenancy contract' },
    { id: 'prev-ejari', label: 'Previous Ejari certificate' },
    { id: 'tenant-emirates-id', label: 'Tenant Emirates ID' },
    { id: 'landlord-passport', label: 'Landlord passport copy' },
    { id: 'dewa-number', label: 'DEWA premise number' }
  ],
  sale: [
    { id: 'seller-passport', label: 'Seller passport copy' },
    { id: 'seller-emirates-id', label: 'Seller Emirates ID' },
    { id: 'buyer-passport', label: 'Buyer passport copy' },
    { id: 'buyer-emirates-id', label: 'Buyer Emirates ID' },
    { id: 'title-deed', label: 'Title deed (original)' },
    { id: 'form-a', label: 'Form A (listing agreement)' },
    { id: 'form-b', label: 'Form B (buyer agreement)' },
    { id: 'form-f', label: 'Form F / MOU (signed)' },
    { id: 'noc-developer', label: 'NOC from developer' },
    { id: 'no-liability', label: 'Mortgage liability letter (if applicable)' }
  ],
  'off-plan': [
    { id: 'buyer-passport', label: 'Buyer passport copy' },
    { id: 'buyer-emirates-id', label: 'Buyer Emirates ID' },
    { id: 'spa', label: 'Sales and Purchase Agreement (SPA)' },
    { id: 'payment-receipts', label: 'Payment receipts to escrow' },
    { id: 'oqood', label: 'Oqood certificate' },
    { id: 'noc-developer', label: 'NOC from developer (resale)' },
    { id: 'poa', label: 'Power of Attorney (if representative)' }
  ]
}
