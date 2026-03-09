import { useState, useMemo, useEffect, useCallback } from 'react'
import { formatAED, formatAEDDecimal } from '../../../shared/calculator-rates'

interface RoiCalcProps {
  onClear: (clearFn: () => void) => void
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Strip non-numeric chars for parsing */
function parseNum(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

/** Format a raw numeric string with thousand separators for display */
function formatInputDisplay(raw: string): string {
  const cleaned = raw.replace(/[^0-9]/g, '')
  if (!cleaned) return ''
  return parseInt(cleaned).toLocaleString('en-US')
}

// ── ROI/Yield Calculator ───────────────────────────────────────────────

export default function RoiCalc({ onClear }: RoiCalcProps): React.JSX.Element {
  const [purchasePrice, setPurchasePrice] = useState('')
  const [annualRent, setAnnualRent] = useState('')
  const [serviceCharge, setServiceCharge] = useState('')
  const [maintenance, setMaintenance] = useState('')

  // Register clear function with parent
  const clearAll = useCallback(() => {
    setPurchasePrice('')
    setAnnualRent('')
    setServiceCharge('')
    setMaintenance('')
  }, [])

  useEffect(() => {
    onClear(clearAll)
  }, [onClear, clearAll])

  // Live calculation
  const results = useMemo(() => {
    const price = parseNum(purchasePrice)
    const rent = parseNum(annualRent)
    if (price <= 0) return null

    const sc = parseNum(serviceCharge)
    const maint = parseNum(maintenance)

    const grossYield = (rent / price) * 100
    const netAnnualIncome = rent - sc - maint
    const netYield = (netAnnualIncome / price) * 100
    const monthlyNetIncome = netAnnualIncome / 12

    return {
      grossYield: Math.round(grossYield * 10) / 10,
      netYield: Math.round(netYield * 10) / 10,
      netAnnualIncome,
      monthlyNetIncome,
    }
  }, [purchasePrice, annualRent, serviceCharge, maintenance])

  return (
    <div className="space-y-4">
      {/* Purchase Price */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Purchase Price (AED)</label>
        <input
          type="text"
          value={formatInputDisplay(purchasePrice)}
          onChange={(e) => setPurchasePrice(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="e.g., 1,500,000"
          className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
        />
      </div>

      {/* Annual Rental Income */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Annual Rental Income (AED)</label>
        <input
          type="text"
          value={formatInputDisplay(annualRent)}
          onChange={(e) => setAnnualRent(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="e.g., 80,000"
          className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
        />
      </div>

      {/* Service Charge + Maintenance — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Annual Service Charge (AED)</label>
          <input
            type="text"
            value={formatInputDisplay(serviceCharge)}
            onChange={(e) => setServiceCharge(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Optional"
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Annual Maintenance (AED)</label>
          <input
            type="text"
            value={formatInputDisplay(maintenance)}
            onChange={(e) => setMaintenance(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Optional"
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      {!results ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-[12px] text-[#5a5a60]">Enter purchase price and rental income to calculate</p>
        </div>
      ) : (
        <div className="bg-[#0d0d0e] rounded-lg p-3 space-y-3">
          {/* Gross Yield */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#a1a1aa]">Gross Yield</span>
            <span className="text-[14px] text-[#ededee] font-medium">{results.grossYield.toFixed(1)}%</span>
          </div>

          {/* Net Yield */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#a1a1aa]">Net Yield</span>
            <span className="text-[14px] text-[#ededee] font-medium">{results.netYield.toFixed(1)}%</span>
          </div>

          <div className="border-t border-white/[0.07]" />

          {/* Monthly Net Income */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#a1a1aa]">Monthly Net Income</span>
            <span className="text-[13px] text-[#ededee]">{formatAEDDecimal(results.monthlyNetIncome)}</span>
          </div>

          {/* Annual Net Income */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#ededee] font-semibold">Annual Net Income</span>
            <span className="text-[14px] text-[#ededee] font-bold">{formatAED(results.netAnnualIncome)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
