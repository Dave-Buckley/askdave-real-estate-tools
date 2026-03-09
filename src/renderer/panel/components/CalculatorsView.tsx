import { useState, useCallback, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { CALCULATOR_RATES } from '../../../shared/calculator-rates'
import CommissionCalc from './CommissionCalc'
import RoiCalc from './RoiCalc'

type CalcTab = 'mortgage' | 'commission' | 'roi' | 'dld'

interface CalculatorsViewProps {
  onBack: () => void
}

const tabs: { key: CalcTab; label: string }[] = [
  { key: 'mortgage', label: 'Mortgage' },
  { key: 'commission', label: 'Commission' },
  { key: 'roi', label: 'ROI/Yield' },
  { key: 'dld', label: 'DLD Costs' },
]

export default function CalculatorsView({ onBack }: CalculatorsViewProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CalcTab>('commission')

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

      {/* Tab content — all mounted, inactive hidden via display:none to preserve state */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div style={{ display: activeTab === 'commission' ? 'block' : 'none' }}>
          <CommissionCalc onClear={registerClear('commission')} />
        </div>
        <div style={{ display: activeTab === 'roi' ? 'block' : 'none' }}>
          <RoiCalc onClear={registerClear('roi')} />
        </div>
        <div style={{ display: activeTab === 'mortgage' ? 'block' : 'none' }}>
          <div className="flex items-center justify-center h-40">
            <p className="text-[13px] text-[#5a5a60]">Mortgage calculator coming soon</p>
          </div>
        </div>
        <div style={{ display: activeTab === 'dld' ? 'block' : 'none' }}>
          <div className="flex items-center justify-center h-40">
            <p className="text-[13px] text-[#5a5a60]">DLD cost calculator coming soon</p>
          </div>
        </div>
      </div>

      {/* Disclaimer footer — always visible */}
      <div className="shrink-0 pt-2 mt-2 border-t border-white/[0.07]">
        <p className="text-[10px] text-[#a1a1aa]/70 text-center">
          Estimates only. Rates effective {effectiveDate}. Final terms subject to bank/DLD approval.
        </p>
      </div>
    </div>
  )
}
