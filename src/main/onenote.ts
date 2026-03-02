import { Client } from '@microsoft/microsoft-graph-client'
import { shell } from 'electron'
import { microsoftGetAccessToken } from './auth/microsoft'
import { store } from './store'
import { ContactRole } from '../shared/types'
import { upsertContact } from './contacts'

/**
 * Qualifying questions for each contact role, used to generate
 * structured notes in OneNote.
 */
export const ROLE_TEMPLATES: Record<ContactRole, { label: string; questions: string[] }> = {
  Tenant: {
    label: 'Tenant Qualifying Questions',
    questions: [
      'Monthly budget (AED)',
      'Number of bedrooms',
      'Preferred areas',
      'Move-in date',
      'Pets (yes/no, type)',
      'Number of cheques'
    ]
  },
  Landlord: {
    label: 'Landlord Property Details',
    questions: [
      'Property address',
      'Property type (apartment/villa/townhouse)',
      'Number of bedrooms',
      'Rental price expectation (AED)',
      'Availability date'
    ]
  },
  Buyer: {
    label: 'Buyer Qualifying Questions',
    questions: [
      'Budget range (AED)',
      'Property type preference',
      'Preferred areas',
      'Purchase timeline',
      'Mortgage or cash buyer'
    ]
  },
  Seller: {
    label: 'Seller Property Details',
    questions: [
      'Property address',
      'Property type (apartment/villa/townhouse)',
      'Number of bedrooms',
      'Asking price (AED)',
      'Currently tenanted (yes/no)'
    ]
  },
  Investor: {
    label: 'Investor Profile',
    questions: [
      'Investment type (off-plan/ready/rental yield)',
      'Budget range (AED)',
      'Target ROI (%)',
      'Preferred areas',
      'Current units held'
    ]
  }
}

/**
 * Create a Microsoft Graph API client using the existing MSAL auth flow.
 */
function getGraphClient(): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await microsoftGetAccessToken()
        if (!token) throw new Error('Microsoft not signed in — please sign in via Settings')
        return token
      }
    }
  })
}

/**
 * Find or create the "Real Estate" notebook and "Contacts" section.
 * Caches IDs in electron-store to minimize API calls on subsequent invocations.
 */
async function ensureNotebookAndSection(
  client: Client
): Promise<{ notebookId: string; sectionId: string }> {
  const cachedNotebookId = store.get('oneNoteNotebookId')
  const cachedSectionId = store.get('oneNoteSectionId')

  if (cachedNotebookId && cachedSectionId) {
    return { notebookId: cachedNotebookId, sectionId: cachedSectionId }
  }

  // Find or create "Real Estate" notebook
  const notebooksRes = await client
    .api('/me/onenote/notebooks')
    .filter("displayName eq 'Real Estate'")
    .select('id,displayName')
    .get()

  let notebookId: string
  if (notebooksRes.value.length > 0) {
    notebookId = notebooksRes.value[0].id
  } else {
    const newNotebook = await client
      .api('/me/onenote/notebooks')
      .post({ displayName: 'Real Estate' })
    notebookId = newNotebook.id
  }

  // Find or create "Contacts" section within the notebook
  const sectionsRes = await client
    .api(`/me/onenote/notebooks/${notebookId}/sections`)
    .filter("displayName eq 'Contacts'")
    .select('id,displayName')
    .get()

  let sectionId: string
  if (sectionsRes.value.length > 0) {
    sectionId = sectionsRes.value[0].id
  } else {
    const newSection = await client
      .api(`/me/onenote/notebooks/${notebookId}/sections`)
      .post({ displayName: 'Contacts' })
    sectionId = newSection.id
  }

  // Cache both IDs for future calls
  store.set('oneNoteNotebookId', notebookId)
  store.set('oneNoteSectionId', sectionId)

  return { notebookId, sectionId }
}

/**
 * Build the HTML for a single role's qualifying template table.
 */
function buildRoleSectionHTML(role: ContactRole): string {
  const tmpl = ROLE_TEMPLATES[role]
  const rows = tmpl.questions
    .map((q) => `<tr><td>${q}</td><td></td></tr>`)
    .join('\n      ')

  return `<h2>${tmpl.label}</h2>
<table border="1">
  <tr><th>Question</th><th>Answer</th></tr>
  ${rows}
</table>`
}

/**
 * Build the full HTML page content for a new contact OneNote page.
 * The page title is the E.164 phone number — used as the lookup key.
 */
function buildPageHTML(
  e164: string,
  name: string,
  displayNumber: string,
  roles: ContactRole[]
): string {
  const roleSections = roles.map((role) => buildRoleSectionHTML(role)).join('\n')

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${e164}</title>
    <meta name="created" content="${new Date().toISOString()}" />
  </head>
  <body>
    <h1>${name || e164}</h1>
    <p><b>Phone:</b> ${displayNumber}</p>
    <p><b>Roles:</b> ${roles.join(', ')}</p>
    ${roleSections}
  </body>
</html>`
}

/**
 * Look up an existing page in the "Contacts" section by E.164 phone number title.
 * Returns the page object (with id and links) if found, or null if not found.
 */
async function findPageByPhone(
  client: Client,
  sectionId: string,
  e164: string
): Promise<{ id: string; links: { oneNoteClientUrl: { href: string } } } | null> {
  // E.164 numbers contain '+' which must be handled correctly in the OData filter.
  // The Graph SDK's .filter() handles URL encoding automatically.
  const res = await client
    .api(`/me/onenote/sections/${sectionId}/pages`)
    .filter(`title eq '${e164}'`)
    .select('id,title,links')
    .get()

  if (res.value && res.value.length > 0) {
    return res.value[0]
  }
  return null
}

/**
 * Append a new role's qualifying template section to an existing OneNote page.
 * Uses PATCH with append action — does not destroy existing content.
 */
async function appendRoleSection(
  client: Client,
  pageId: string,
  role: ContactRole
): Promise<void> {
  const roleHTML = buildRoleSectionHTML(role)
  const patchBody = [
    {
      target: 'body',
      action: 'append',
      content: roleHTML
    }
  ]

  await client
    .api(`/me/onenote/pages/${pageId}/content`)
    .header('Content-Type', 'application/json')
    .patch(JSON.stringify(patchBody))
}

/**
 * Open or create a OneNote contact page via Microsoft Graph API.
 *
 * - If the page doesn't exist: creates it with the contact header and role templates.
 * - If the page exists: checks for new roles not yet on the page and appends them,
 *   then navigates to the page in OneNote desktop.
 */
export async function openContactPage(data: {
  name: string
  displayNumber: string
  roles: ContactRole[]
  e164: string
}): Promise<{ success: boolean; error?: string; pageId?: string }> {
  try {
    const client = getGraphClient()
    const { sectionId } = await ensureNotebookAndSection(client)

    const roles = data.roles.length > 0 ? data.roles : (['Tenant'] as ContactRole[])
    const existingPage = await findPageByPhone(client, sectionId, data.e164)

    if (existingPage) {
      // Check if the contact now has roles that weren't on the page when it was built.
      // Compare current roles with roles recorded at the time the page was created
      // (stored in the contact record via oneNotePageId presence and roles at that point).
      // We use the store's contact roles as the source of truth for what was previously synced.
      const storedContact = store.get('contacts')[data.e164]
      const previousRoles: ContactRole[] = storedContact?.roles ?? []
      const newRoles = roles.filter((r) => !previousRoles.includes(r))

      for (const role of newRoles) {
        await appendRoleSection(client, existingPage.id, role)
      }

      await shell.openExternal(existingPage.links.oneNoteClientUrl.href)
      return { success: true, pageId: existingPage.id }
    } else {
      // Create a new page with the full contact header and all role templates
      const html = buildPageHTML(data.e164, data.name, data.displayNumber, roles)
      const newPage = await client
        .api(`/me/onenote/sections/${sectionId}/pages`)
        .header('Content-Type', 'text/html')
        .post(html)

      // Persist the page ID on the contact record
      upsertContact(data.e164, { oneNotePageId: newPage.id })

      await shell.openExternal(newPage.links.oneNoteClientUrl.href)
      return { success: true, pageId: newPage.id }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('Microsoft not signed in') || message.includes('401') || message.includes('Unauthorized')) {
      return { success: false, error: 'Microsoft not signed in — please sign in via Settings' }
    }
    return { success: false, error: message }
  }
}
