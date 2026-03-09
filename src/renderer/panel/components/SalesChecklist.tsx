import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, FileCheck, FolderOpen, FolderPlus, Check } from 'lucide-react'

const SELLER_DOCS = [
  'Title Deed (original)',
  'Passport (original + copy)',
  'Emirates ID (original + copy)',
  'Form A (listing agreement)',
  'NOC from Developer',
  'Service Charge Clearance',
  'DEWA Final Bill Clearance',
  'UAE Bank Account (2026 rule)',
  'Liability Letter (if mortgaged)',
  'POA (if applicable, court-approved)',
]

const BUYER_DOCS = [
  'Passport (original + copy)',
  'Emirates ID (original + copy)',
  'Form B (buyer-agent agreement)',
  'Proof of Funds / Pre-approval',
  'Manager\'s Cheque (deposit 10%)',
  'Manager\'s Cheque (balance)',
  'Bank Valuation Report (if mortgage)',
  'Salary Cert + 6mo Statements (if mortgage)',
  'POA (if applicable)',
]

const TRANSACTION_DOCS = [
  'Form F / MOU (signed at trustee)',
  'Form A (seller listing)',
  'Form B (buyer agreement)',
  'Form I (agent commission split)',
  'Developer NOC',
  'DLD Transfer Certificate',
  'New Title Deed (issued same day)',
  'Oqood Transfer (off-plan only)',
]

const FEES_TABLE = [
  { item: 'DLD Transfer Fee', amount: '4% of price', payer: 'Buyer (negotiable)' },
  { item: 'Trustee Fee', amount: 'AED 4,200 (inc. VAT)', payer: 'Buyer' },
  { item: 'Title Deed Fee', amount: 'AED 580', payer: 'Buyer' },
  { item: 'Knowledge + Innovation', amount: 'AED 20', payer: 'Buyer' },
  { item: 'Agent Commission', amount: '2% + VAT each', payer: 'Both parties' },
  { item: 'Developer NOC', amount: 'AED 500–5,000', payer: 'Seller' },
  { item: 'Mortgage Reg.', amount: '0.25% + AED 290', payer: 'Buyer (if financed)' },
  { item: 'Bank Valuation', amount: 'AED 2,500–3,500', payer: 'Buyer (if financed)' },
]

const FOLDER_CATEGORIES = [
  { id: 'Tenants', label: 'Tenant' },
  { id: 'Buyers', label: 'Buyer' },
  { id: 'Off-Plan', label: 'Off-Plan' },
  { id: 'Secondary Sales', label: 'Secondary' },
]

interface SalesChecklistProps {
  contactName?: string
}

export default function SalesChecklist({ contactName }: SalesChecklistProps) {
  const [expanded, setExpanded] = useState(false)
  const [showFees, setShowFees] = useState(false)
  const [folderName, setFolderName] = useState(contactName || '')
  const [selectedCategory, setSelectedCategory] = useState('Buyers')
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

  const totalDocs = SELLER_DOCS.length + BUYER_DOCS.length + TRANSACTION_DOCS.length

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
        <FileCheck size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
        <h3 className="text-sm font-semibold text-[#ededee]">Sales Checklist</h3>
        <span className="ml-auto text-[10px] text-[#5a5a60]">
          {totalDocs} items
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-2">
          {/* Seller documents */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#f87171]">Seller</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0 pl-3">
              {SELLER_DOCS.map((item) => (
                <div key={item} className="flex items-center gap-1.5 py-[3px]">
                  <div className="w-1 h-1 rounded-full bg-[#5a5a60] flex-shrink-0" />
                  <span className="text-[11px] text-[#d4d4d8] leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer documents */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">Buyer</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0 pl-3">
              {BUYER_DOCS.map((item) => (
                <div key={item} className="flex items-center gap-1.5 py-[3px]">
                  <div className="w-1 h-1 rounded-full bg-[#5a5a60] flex-shrink-0" />
                  <span className="text-[11px] text-[#d4d4d8] leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction documents */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#818cf8]">Transaction</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0 pl-3">
              {TRANSACTION_DOCS.map((item) => (
                <div key={item} className="flex items-center gap-1.5 py-[3px]">
                  <div className="w-1 h-1 rounded-full bg-[#5a5a60] flex-shrink-0" />
                  <span className="text-[11px] text-[#d4d4d8] leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fees toggle */}
          <div className="border-t border-white/[0.07] pt-1.5">
            <button
              onClick={() => setShowFees(!showFees)}
              className="flex items-center gap-1.5 w-full"
            >
              {showFees ? (
                <ChevronDown size={11} strokeWidth={1.5} className="text-[#5a5a60]" />
              ) : (
                <ChevronRight size={11} strokeWidth={1.5} className="text-[#5a5a60]" />
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#fbbf24]">Fees & Costs</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </button>
            {showFees && (
              <div className="mt-1.5 pl-1">
                {FEES_TABLE.map((fee) => (
                  <div key={fee.item} className="flex items-baseline gap-2 py-[3px]">
                    <span className="text-[11px] text-[#d4d4d8] w-[110px] flex-shrink-0">{fee.item}</span>
                    <span className="text-[11px] text-[#ededee] font-medium flex-shrink-0">{fee.amount}</span>
                    <span className="text-[10px] text-[#5a5a60] ml-auto">{fee.payer}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client folder section */}
          <div className="border-t border-white/[0.07] pt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FolderOpen size={11} className="text-[#5a5a60]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a]">Client Folder</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

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
