import { execFile } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { shell } from 'electron'
import { store, DEFAULT_ROLE_TEMPLATES } from './store'
import { ContactRole } from '../shared/types'
import { upsertContact } from './contacts'

/** Escape a string for safe embedding in a PowerShell single-quoted string */
function psEscape(s: string): string {
  return s.replace(/'/g, "''")
}

/**
 * Get the role templates from store, falling back to defaults.
 */
function getRoleTemplates() {
  return store.get('oneNoteRoleTemplates') ?? DEFAULT_ROLE_TEMPLATES
}

/**
 * Run a PowerShell script via temp .ps1 file (avoids CLIXML stderr encoding).
 */
async function runPowerShell(script: string): Promise<string> {
  const ts = Date.now()
  const scriptFile = join(tmpdir(), `askdave-ps-${ts}.ps1`)
  const resultFile = join(tmpdir(), `askdave-ps-result-${ts}.txt`)

  const wrapper = `
$ErrorActionPreference = 'Stop'
try {
${script}
} catch {
  $msg = $_.Exception.Message
  if ($_.Exception.InnerException) { $msg = $_.Exception.InnerException.Message }
  [System.IO.File]::WriteAllText('${resultFile.replace(/\\/g, '\\\\')}', "ERROR: $msg")
  exit 1
}
`
  await writeFile(scriptFile, '\ufeff' + wrapper, 'utf-8')

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptFile],
      { windowsHide: true, timeout: 30000 },
      async (err, stdout) => {
        unlink(scriptFile).catch(() => {})

        if (err) {
          try {
            const { readFile } = await import('fs/promises')
            const errText = await readFile(resultFile, 'utf-8')
            unlink(resultFile).catch(() => {})
            reject(new Error(errText.replace(/^ERROR:\s*/, '')))
          } catch {
            reject(new Error(stdout?.trim() || err.message))
          }
          return
        }
        unlink(resultFile).catch(() => {})
        resolve(stdout.trim())
      }
    )
  })
}

/**
 * Build PowerShell string-concatenation code for a role's qualifying questions,
 * rapport notes section, and document checklist as Outline elements.
 * All XML is built as PowerShell strings — no DOM parsing, no temp files.
 */
function buildRolePsOutlines(role: ContactRole, varPrefix: string): string {
  const templates = getRoleTemplates()
  const tmpl = templates[role] ?? DEFAULT_ROLE_TEMPLATES[role]

  const qLines = tmpl.questions
    .map((q) => `$${varPrefix} += '<one:OE><one:T><![CDATA[${psEscape(q)}: ]]></one:T></one:OE>'`)
    .join('\n  ')

  const dLines = tmpl.documents
    .map((d) => `$${varPrefix} += '<one:OE><one:T><![CDATA[\u2610 ${psEscape(d)}]]></one:T></one:OE>'`)
    .join('\n  ')

  return `
  # ${role} — Qualifying Questions
  $${varPrefix} += '<one:OE><one:T><![CDATA[${psEscape(tmpl.label)}]]></one:T></one:OE>'
  ${qLines}

  # Spacer between sections
  $${varPrefix} += '<one:OE><one:T><![CDATA[ ]]></one:T></one:OE>'

  # ${role} — Rapport Notes
  $${varPrefix} += '<one:OE><one:T><![CDATA[Rapport Notes]]></one:T></one:OE>'
  $${varPrefix} += '<one:OE><one:T><![CDATA[Family: ]]></one:T></one:OE>'
  $${varPrefix} += '<one:OE><one:T><![CDATA[Interests: ]]></one:T></one:OE>'
  $${varPrefix} += '<one:OE><one:T><![CDATA[Personal notes: ]]></one:T></one:OE>'

  # Spacer between sections
  $${varPrefix} += '<one:OE><one:T><![CDATA[ ]]></one:T></one:OE>'

  # ${role} — Document Checklist
  $${varPrefix} += '<one:OE><one:T><![CDATA[Document Checklist]]></one:T></one:OE>'
  ${dLines}
`
}

/**
 * Core PowerShell script: find/create notebook+section, find/create page.
 * Builds ALL XML as PowerShell strings — never parses XML with [xml] to avoid
 * encoding corruption that causes 0x80042014 errors.
 */
/** Map role to section name (plural) */
const ROLE_SECTIONS: Record<ContactRole, string> = {
  Tenant: 'Tenants',
  Landlord: 'Landlords',
  Buyer: 'Buyers',
  Seller: 'Sellers',
  Investor: 'Investors'
}

function buildOneNoteScript(
  e164: string,
  title: string,
  heading: string,
  displayNumber: string,
  roles: ContactRole[],
  sectionName: string,
  unit?: string,
  email?: string
): string {
  const roleOutlines = roles.map((r) => buildRolePsOutlines(r, `outlines`)).join('\n')

  return `
  $onenote = New-Object -ComObject OneNote.Application

  # Get the default notebooks folder
  $defaultFolder = ''
  $onenote.GetSpecialLocation(2, [ref]$defaultFolder)

  # Get hierarchy and detect namespace
  $xml = ''
  $onenote.GetHierarchy('', 2, [ref]$xml)
  $doc = [xml]$xml
  $ns = $doc.DocumentElement.NamespaceURI

  # Find or create "Real Estate" notebook
  $notebookPath = Join-Path $defaultFolder 'Real Estate'
  $notebookId = ''
  $onenote.OpenHierarchy($notebookPath, '', [ref]$notebookId, 1)

  # Find or create role-specific section (e.g., Tenants, Buyers)
  $sectionPath = Join-Path $notebookPath '${psEscape(sectionName)}.one'
  $sectionId = ''
  $onenote.OpenHierarchy($sectionPath, '', [ref]$sectionId, 3)

  # Search for existing page by E.164 in title (may fail if section is brand new)
  $e164 = '${psEscape(e164)}'
  $existingPage = $null
  try {
    $onenote.GetHierarchy($sectionId, 2, [ref]$xml)
    $doc = [xml]$xml
    $nsm = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
    $nsm.AddNamespace('one', $ns)
    $pages = $doc.SelectNodes("//one:Page", $nsm)
    foreach ($p in $pages) {
      if ($p.name -match [regex]::Escape($e164)) {
        $existingPage = $p
        break
      }
    }
  } catch {
    # Section is new or not synced yet
  }

  if ($existingPage) {
    $pageId = $existingPage.ID
    $onenote.NavigateTo($pageId)
    @{ action = 'existing'; pageId = $pageId; notebookId = $notebookId; sectionId = $sectionId } | ConvertTo-Json -Compress
  } else {
    # Create blank page
    $newPageId = ''
    $onenote.CreateNewPage($sectionId, [ref]$newPageId, 0)

    # Step 1: Set the title (Name — Number — Unit)
    $titleXml = '<one:Page xmlns:one="' + $ns + '" ID="' + $newPageId + '">'
    $titleXml += '<one:Title><one:OE><one:T><![CDATA[${psEscape(title)}]]></one:T></one:OE></one:Title>'
    $titleXml += '</one:Page>'
    $onenote.UpdatePageContent($titleXml)

    # Step 2: Add outlines via partial update
    $outlines = ''

    # Single outline: contact info + role templates
    $outlines += '<one:Outline><one:OEChildren>'
    $outlines += '<one:OE><one:T><![CDATA[${psEscape(heading)}]]></one:T></one:OE>'
    $outlines += '<one:OE><one:T><![CDATA[Phone: ${psEscape(displayNumber)}]]></one:T></one:OE>'
    ${email ? `$outlines += '<one:OE><one:T><![CDATA[Email: ${psEscape(email)}]]></one:T></one:OE>'` : '# no email'}
    ${unit ? `$outlines += '<one:OE><one:T><![CDATA[Unit: ${psEscape(unit)}]]></one:T></one:OE>'` : '# no unit'}
    $outlines += '<one:OE><one:T><![CDATA[Roles: ${roles.join(', ')}]]></one:T></one:OE>'

    # Spacer before role content
    $outlines += '<one:OE><one:T><![CDATA[ ]]></one:T></one:OE>'

    # Role-specific content (questions + rapport + documents)
${roleOutlines}

    $outlines += '</one:OEChildren></one:Outline>'

    $contentXml = '<one:Page xmlns:one="' + $ns + '" ID="' + $newPageId + '">'
    $contentXml += $outlines
    $contentXml += '</one:Page>'
    $onenote.UpdatePageContent($contentXml)

    $onenote.NavigateTo($newPageId)
    @{ action = 'created'; pageId = $newPageId; notebookId = $notebookId; sectionId = $sectionId } | ConvertTo-Json -Compress
  }
`
}

/**
 * PowerShell script to append a role section to an existing page.
 * Uses partial update — sends only the new outlines wrapped in <one:Page>.
 */
function buildAppendScript(pageId: string, role: ContactRole): string {
  const outlineCode = buildRolePsOutlines(role, 'outlines')

  return `
  $onenote = New-Object -ComObject OneNote.Application

  # Detect namespace from hierarchy
  $xml = ''
  $onenote.GetHierarchy('', 0, [ref]$xml)
  $doc = [xml]$xml
  $ns = $doc.DocumentElement.NamespaceURI

  $outlines = ''
  $outlines += '<one:Outline><one:OEChildren>'
${outlineCode}
  $outlines += '</one:OEChildren></one:Outline>'

  $contentXml = '<one:Page xmlns:one="' + $ns + '" ID="' + '${psEscape(pageId)}' + '">'
  $contentXml += $outlines
  $contentXml += '</one:Page>'
  $onenote.UpdatePageContent($contentXml)
  $onenote.NavigateTo('${psEscape(pageId)}')
  Write-Output 'ok'
`
}

/**
 * Open the "Real Estate > Contacts" section in OneNote.
 */
export async function openNotebookSection(): Promise<{ success: boolean; error?: string }> {
  try {
    const script = `
  $onenote = New-Object -ComObject OneNote.Application
  $xml = ''
  $onenote.GetHierarchy('', 2, [ref]$xml)
  $doc = [xml]$xml
  $ns = $doc.DocumentElement.NamespaceURI
  $nsm = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
  $nsm.AddNamespace('one', $ns)

  $notebook = $doc.SelectSingleNode("//one:Notebook[@name='Real Estate']", $nsm)
  if ($notebook) {
    $onenote.NavigateTo($notebook.ID)
  } else {
    Write-Output 'no-notebook'
  }
  Write-Output 'ok'
`
    const result = await runPowerShell(script)
    if (result.includes('no-notebook')) {
      await shell.openExternal('onenote:')
    }
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('80040154') || message.includes('CLSID') || message.includes('not registered')) {
      try {
        await shell.openExternal('onenote:')
        return { success: true }
      } catch {
        return { success: false, error: 'OneNote desktop app not found. Install the full OneNote app (not the UWP version) for integration.' }
      }
    }
    try {
      await shell.openExternal('onenote:')
      return { success: true }
    } catch {
      return { success: false, error: message }
    }
  }
}

/**
 * Open or create a OneNote contact page via COM API.
 * No login required — uses the locally signed-in OneNote desktop app.
 */
export async function openContactPage(data: {
  name: string
  displayNumber: string
  roles: ContactRole[]
  e164: string
  unit?: string
  email?: string
}): Promise<{ success: boolean; error?: string; pageId?: string }> {
  try {
    const roles = data.roles.length > 0 ? data.roles : (['Tenant'] as ContactRole[])
    const heading = [data.name || data.e164, data.displayNumber, data.unit].filter(Boolean).join(' \u2014 ')
    // Page title includes name + number so it's readable in OneNote sidebar
    const pageTitle = [data.name, data.displayNumber, data.unit].filter(Boolean).join(' \u2014 ') || data.e164
    // Each role gets its own section (Tenants, Buyers, etc.)
    const sectionName = ROLE_SECTIONS[roles[0]] || 'Contacts'

    const script = buildOneNoteScript(data.e164, pageTitle, heading, data.displayNumber, roles, sectionName, data.unit, data.email)
    const output = await runPowerShell(script)
    const result = JSON.parse(output) as { action: string; pageId: string; notebookId: string; sectionId: string }

    if (result.action === 'created') {
      upsertContact(data.e164, { oneNotePageId: result.pageId })
    } else if (result.action === 'existing') {
      const storedContact = store.get('contacts')[data.e164]
      const previousRoles: ContactRole[] = storedContact?.roles ?? []
      const newRoles = roles.filter((r) => !previousRoles.includes(r))

      for (const role of newRoles) {
        const appendScript = buildAppendScript(result.pageId, role)
        await runPowerShell(appendScript)
      }
    }

    if (result.notebookId) store.set('oneNoteNotebookId', result.notebookId)
    if (result.sectionId) store.set('oneNoteSectionId', result.sectionId)

    return { success: true, pageId: result.pageId }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('80040154') || message.includes('CLSID') || message.includes('not registered')) {
      return { success: false, error: 'OneNote desktop app not found. Install the full OneNote app (not the UWP version) for COM integration.' }
    }
    // Write debug info for troubleshooting
    const debugInfo = `Error: ${message}\nData: ${JSON.stringify(data)}\nTimestamp: ${new Date().toISOString()}`
    writeFile(join(tmpdir(), 'askdave-onenote-error.txt'), debugInfo, 'utf-8').catch(() => {})
    return { success: false, error: message }
  }
}
