import { store } from './store'
import { Contact, ContactRole } from '../shared/types'

/**
 * Get a contact by E.164 phone number, or null if not found.
 */
export function getContact(e164: string): Contact | null {
  const contacts = store.get('contacts')
  return contacts[e164] ?? null
}

/**
 * Create or update a contact. Merges with existing data.
 */
export function upsertContact(
  e164: string,
  data: Partial<Omit<Contact, 'e164' | 'createdAt' | 'updatedAt'>>
): Contact {
  const contacts = store.get('contacts')
  const existing = contacts[e164]
  const now = new Date().toISOString()

  const contact: Contact = {
    e164,
    displayNumber: data.displayNumber ?? existing?.displayNumber ?? e164,
    name: data.name ?? existing?.name ?? '',
    email: data.email ?? existing?.email ?? '',
    roles: data.roles ?? existing?.roles ?? [],
    notes: data.notes ?? existing?.notes ?? '',
    oneNotePageId: data.oneNotePageId ?? existing?.oneNotePageId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }

  contacts[e164] = contact
  store.set('contacts', contacts)
  return contact
}

/**
 * Add a role to a contact. Creates the contact if it doesn't exist.
 */
export function addRole(e164: string, role: ContactRole): Contact {
  const contact = getContact(e164)
  const roles = contact?.roles ?? []
  if (roles.includes(role)) return contact!

  return upsertContact(e164, { roles: [...roles, role] })
}

/**
 * Remove a role from a contact.
 */
export function removeRole(e164: string, role: ContactRole): Contact | null {
  const contact = getContact(e164)
  if (!contact) return null

  return upsertContact(e164, {
    roles: contact.roles.filter((r) => r !== role)
  })
}

/**
 * List all contacts, sorted by most recently updated.
 */
export function listContacts(): Contact[] {
  const contacts = store.get('contacts')
  return Object.values(contacts).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

/**
 * Delete a contact by E.164 phone number.
 */
export function deleteContact(e164: string): void {
  const contacts = store.get('contacts')
  delete contacts[e164]
  store.set('contacts', contacts)
}
