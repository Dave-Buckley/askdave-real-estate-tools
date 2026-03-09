import { useState, useCallback, useRef } from 'react'
import { RotateCcw, ChevronDown } from 'lucide-react'
import { CALCULATOR_RATES } from '../../../shared/calculator-rates'
import CommissionCalc from './CommissionCalc'
import RoiCalc from './RoiCalc'
import MortgageCalc from './MortgageCalc'
import DldCostCalc from './DldCostCalc'
import CalcSharePreview from './CalcSharePreview'

type CalcTab = 'mortgage' | 'commission' | 'roi' | 'dld'

interface CalculatorsViewProps {
  onBack: () => void
}

interface HistoryEntry {
  summary: string
  fullText: string
  timestamp: Date
}

const tabs: { key: CalcTab; label: string }[] = [
  { key: 'mortgage', label: 'Mortgage' },
  { key: 'commission', label: 'Commission' },
  { key: 'roi', label: 'ROI/Yield' },
  { key: 'dld', label: 'DLD Costs' },
]

const MAX_HISTORY = 5

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

/** Extract a one-line summary from WhatsApp share text for history display */
function extractSummary(text: string, tab: CalcTab): string {
  const lines = text.split('\n').filter((l) => l.trim())
  if (tab === 'mortgage') {
    const price = lines.find((l) => l.startsWith('Property Price:'))
    const monthly = lines.find((l) => l.includes('Monthly Payment:'))
    if (price && monthly) {
      return `${price.replace('Property Price: ', '')} = ${monthly.replace('*Monthly Payment: ', '').replace('*', '')}/mo`
    }
  }
  if (tab === 'commission') {
    const price = lines.find((l) => l.startsWith('Property Price:'))
    const total = lines.find((l) => l.startsWith('Total Commission:'))
    if (price && total) {
      return `${price.replace('Property Price: ', '')} = ${total.replace('Total Commission: ', '')}`
    }
  }
  if (tab === 'roi') {
    const price = lines.find((l) => l.startsWith('Purchase Price:'))
    const gross = lines.find((l) => l.startsWith('Gross Yield:'))
    if (price && gross) {
      return `${price.replace('Purchase Price: ', '')} = ${gross.replace('Gross Yield: ', '')} gross`
    }
  }
  if (tab === 'dld') {
    const price = lines.find((l) => l.startsWith('Property Price:'))
    const total = lines.find((l) => l.includes('Total Closing Costs:'))
    if (price && total) {
      return `${price.replace('Property Price: ', '')} costs ${total.replace('*Total Closing Costs: ', '').replace('*', '')}`
    }
  }
  // Fallback: first non-empty line without asterisks
  return lines[0]?.replace(/\*/g, '') || 'Calculation'
}

export default function CalculatorsView({ onBack }: CalculatorsViewProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CalcTab>('commission')
  const [shareText, setShareText] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<CalcTab, HistoryEntry[]>>({
    mortgage: [],
    commission: [],
    roi: [],
    dld: [],
  })
  const [historyOpen, setHistoryOpen] = useState<Record<CalcTab, boolean>>({
    mortgage: false,
    commission: false,
    roi: false,
    dld: false,
  })

  // Store clear functions from each calculator
  const clearFnRef = useRef<Record<CalcTab, (() => void) | null>>({
    mortgage: null,
    commission: null,
    roi: null,
    dld: null,
  })

  const registerClear = useCallback((tab: CalcTab) => {
    return (clearFn: () => void) => {
      clearFnRef.current[tab] = clearFn
    }
  }, [])

  const handleClear = useCallback(() => {
    const fn = clearFnRef.current[activeTab]
    if (fn) fn()
  }, [activeTab])

  // Share handler for each tab -- opens modal and saves to history
  const makeShareHandler = useCallback(
    (tab: CalcTab) => (text: string) => {
      setShareText(text)
      const summary = extractSummary(text, tab)
      setHistory((prev) => {
        const tabHistory = [{ summary, fullText: text, timestamp: new Date() }, ...prev[tab]]
        return { ...prev, [tab]: tabHistory.slice(0, MAX_HISTORY) }
      })
    },
    [],
  )

  // Clicking a history entry opens the share modal with that text
  const handleHistoryClick = useCallback((entry: HistoryEntry) => {
    setShareText(entry.fullText)
  }, [])

  // Build the most recent effective date from rates for the disclaimer
  const effectiveDate = CALCULATOR_RATES.commission.defaultRate.effectiveDate

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar + Clear button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#818cf8]/20 text-[#818cf8]'
                  : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04] rounded-md transition-colors"
          title="Clear all inputs"
        >
          <RotateCcw size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* Tab content -- all mounted, inactive hidden via display:none to preserve state */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div style={{ display: activeTab === 'commission' ? 'block' : 'none' }}>
          <CommissionCalc onClear={registerClear('commission')} onShare={makeShareHandler('commission')} />
          <HistorySection
            entries={history.commission}
            isOpen={historyOpen.commission}
            onToggle={() => setHistoryOpen((p) => ({ ...p, commission: !p.commission }))}
            onEntryClick={handleHistoryClick}
          />
        </div>
        <div style={{ display: activeTab === 'roi' ? 'block' : 'none' }}>
          <RoiCalc onClear={registerClear('roi')} onShare={makeShareHandler('roi')} />
          <HistorySection
            entries={history.roi}
            isOpen={historyOpen.roi}
            onToggle={() => setHistoryOpen((p) => ({ ...p, roi: !p.roi }))}
            onEntryClick={handleHistoryClick}
          />
        </div>
        <div style={{ display: activeTab === 'mortgage' ? 'block' : 'none' }}>
          <MortgageCalc onClear={registerClear('mortgage')} onShare={makeShareHandler('mortgage')} />
          <HistorySection
            entries={history.mortgage}
            isOpen={historyOpen.mortgage}
            onToggle={() => setHistoryOpen((p) => ({ ...p, mortgage: !p.mortgage }))}
            onEntryClick={handleHistoryClick}
          />
        </div>
        <div style={{ display: activeTab === 'dld' ? 'block' : 'none' }}>
          <DldCostCalc onClear={registerClear('dld')} onShare={makeShareHandler('dld')} />
          <HistorySection
            entries={history.dld}
            isOpen={historyOpen.dld}
            onToggle={() => setHistoryOpen((p) => ({ ...p, dld: !p.dld }))}
            onEntryClick={handleHistoryClick}
          />
        </div>
      </div>

      {/* Disclaimer footer -- always visible */}
      <div className="shrink-0 pt-2 mt-2 border-t border-white/[0.07]">
        <p className="text-[10px] text-[#a1a1aa]/70 text-center">
          Estimates only. Rates effective {effectiveDate}. Final terms subject to bank/DLD approval.
        </p>
      </div>

      {/* Share modal overlay */}
      {shareText !== null && (
        <CalcSharePreview initialText={shareText} onClose={() => setShareText(null)} />
      )}
    </div>
  )
}

// ── History Section ──────────────────────────────────────────────────────

function HistorySection({
  entries,
  isOpen,
  onToggle,
  onEntryClick,
}: {
  entries: HistoryEntry[]
  isOpen: boolean
  onToggle: () => void
  onEntryClick: (entry: HistoryEntry) => void
}): React.JSX.Element | null {
  if (entries.length === 0) return null

  return (
    <div className="mt-4 border-t border-white/[0.07] pt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[11px] text-[#a1a1aa] hover:text-[#ededee] transition-colors w-full"
      >
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className={`transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        Recent Calculations ({entries.length})
      </button>
      {isOpen && (
        <div className="mt-2 space-y-1">
          {entries.map((entry, i) => (
            <button
              key={i}
              onClick={() => onEntryClick(entry)}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors group"
              title="Click to re-share this calculation"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#ededee] group-hover:text-[#818cf8] transition-colors truncate pr-2">
                  {entry.summary}
                </span>
                <span className="text-[10px] text-[#5a5a60] shrink-0">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
