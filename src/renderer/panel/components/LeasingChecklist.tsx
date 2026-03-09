import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, ClipboardCheck, FolderOpen, FolderPlus, Check } from 'lucide-react'

// Leasing transaction document requirements grouped by party
const CHECKLIST_SECTIONS = [
  {
    label: 'Landlord',
    accent: '#fbbf24',
    items: [
      'Title Deed',
      'Passport (copy)',
      'Emirates ID (copy)',
      'Visa (copy)',
      'KYC Form',
    ],
  },
  {
    label: 'Tenant',
    accent: '#818cf8',
    items: [
      'Passport (copy)',
      'Emirates ID (copy)',
      'Visa (copy)',
      'KYC Form',
    ],
  },
  {
    label: 'Transaction',
    accent: '#4ade80',
    items: [
      'Tenancy Contract (Ejari)',
      'Closing Page (signed)',
      'Security Deposit Copy',
      'Rental Cheque(s) Copy',
      'Commission Proof of Payment',
    ],
  },
]

const FOLDER_CATEGORIES = [
  { id: 'Tenants', label: 'Tenant' },
  { id: 'Buyers', label: 'Buyer' },
  { id: 'Off-Plan', label: 'Off-Plan' },
  { id: 'Secondary Sales', label: 'Secondary' },
]

interface LeasingChecklistProps {
  contactName?: string
}

export default function LeasingChecklist({ contactName }: LeasingChecklistProps) {
  const [expanded, setExpanded] = useState(false)
  const [folderName, setFolderName] = useState(contactName || '')
  const [selectedCategory, setSelectedCategory] = useState('Tenants')
  const [folderExists, setFolderExists] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (contactName) setFolderName(contactName)
  }, [contactName])

  useEffect(() => {
    if (!folderName.trim()) {
      setFolderExists(false)
      return
    }
    const timer = setTimeout(async () => {
      const result = await window.electronAPI.checkClientFolder(selectedCategory, folderName.trim())
      setFolderExists(result.exists)
    }, 300)
    return () => clearTimeout(timer)
  }, [folderName, selectedCategory])

  const handleCreateOrOpen = async () => {
    if (!folderName.trim()) return
    const result = await window.electronAPI.createClientFolder(selectedCategory, folderName.trim())
    if (result.success) {
      setFeedback(result.created ? 'Folder created' : 'Folder opened')
      setFolderExists(true)
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  return (
    <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full"
      >
        {expanded ? (
          <ChevronDown size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
        ) : (
          <ChevronRight size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
        )}
        <ClipboardCheck size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
        <h3 className="text-sm font-semibold text-[#ededee]">Leasing Checklist</h3>
        <span className="ml-auto text-[10px] text-[#5a5a60]">
          {CHECKLIST_SECTIONS.reduce((n, s) => n + s.items.length, 0)} items
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-2">
          {/* Document sections */}
          {CHECKLIST_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: section.accent }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: section.accent }}>
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0 pl-3">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center gap-1.5 py-[3px]">
                    <div className="w-1 h-1 rounded-full bg-[#5a5a60] flex-shrink-0" />
                    <span className="text-[11px] text-[#d4d4d8] leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Client folder section */}
          <div className="border-t border-white/[0.07] pt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FolderOpen size={11} className="text-[#5a5a60]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a]">Client Folder</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            {/* Category selector */}
            <div className="flex gap-1 mb-1.5">
              {FOLDER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-1 px-1.5 py-1 text-[10px] font-medium rounded border transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-white/[0.08] border-white/[0.15] text-[#ededee]'
                      : 'bg-transparent border-white/[0.07] text-[#5a5a60] hover:text-[#a1a1aa]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Name input + action */}
            <div className="flex gap-1.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Client name..."
                  className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-2 py-1.5 text-xs text-[#ededee] placeholder-[#5a5a60] focus:outline-none focus:border-white/[0.2]"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateOrOpen() }}
                />
                {folderExists && folderName.trim() && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Check size={12} className="text-[#4ade80]" />
                  </span>
                )}
              </div>
              <button
                onClick={handleCreateOrOpen}
                disabled={!folderName.trim()}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-md border transition-colors disabled:opacity-30 ${
                  folderExists
                    ? 'bg-white/[0.06] border-white/[0.12] text-[#a1a1aa] hover:text-[#ededee]'
                    : 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.25)] text-[#4ade80]'
                }`}
                title={folderExists ? 'Open existing folder' : 'Create new folder'}
              >
                {folderExists ? <FolderOpen size={12} /> : <FolderPlus size={12} />}
                {folderExists ? 'Open' : 'Create'}
              </button>
            </div>

            {feedback && (
              <p className="text-[10px] text-[#4ade80] mt-1">{feedback}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
