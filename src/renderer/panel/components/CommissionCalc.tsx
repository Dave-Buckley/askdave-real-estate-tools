import { useState, useMemo, useEffect, useCallback } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  CALCULATOR_RATES,
  formatAED,
  formatAEDDecimal,
  getFreshness,
  FRESHNESS_COLORS,
} from '../../../shared/calculator-rates'
import type { RateEntry } from '../../../shared/calculator-rates'

interface CommissionCalcProps {
  onClear: (clearFn: () => void) => void
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Strip non-numeric chars (except decimal point) for parsing */
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

// ── Rate Attribution ───────────────────────────────────────────────────

function RateAttribution({
  rate,
  isCustom,
  defaultLabel,
}: {
  rate: RateEntry
  isCustom: boolean
  defaultLabel?: string
}): React.JSX.Element {
  const freshness = getFreshness(rate.effectiveDate)
  const color = FRESHNESS_COLORS[freshness]

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#5a5a60]">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={`Data freshness: ${freshness}`}
      />
      {isCustom ? (
        <span>Custom value (default: {defaultLabel || `${rate.value}%`})</span>
      ) : (
        <span>
          {rate.source}, {rate.effectiveDate}
        </span>
      )}
      {!isCustom && (
        <button
          onClick={() => window.electronAPI.openExternal(rate.sourceUrl)}
          className="text-[#5a5a60] hover:text-[#a1a1aa] transition-colors"
          title="Verify source"
        >
          <ExternalLink size={10} strokeWidth={1.5} />
        </button>
      )}
    </span>
  )
}

// ── Commission Calculator ──────────────────────────────────────────────

export default function CommissionCalc({ onClear }: CommissionCalcProps): React.JSX.Element {
  const defaultRate = CALCULATOR_RATES.commission.defaultRate
  const vatRate = CALCULATOR_RATES.vat

  const [propertyPrice, setPropertyPrice] = useState('')
  const [commissionRate, setCommissionRate] = useState(String(defaultRate.value))
  const [listingPercent, setListingPercent] = useState('50')
  const [buyerPercent, setBuyerPercent] = useState('50')
  const [lastEdited, setLastEdited] = useState<'listing' | 'buyer'>('listing')

  // Register clear function with parent
  const clearAll = useCallback(() => {
    setPropertyPrice('')
    setCommissionRate(String(defaultRate.value))
    setListingPercent('50')
    setBuyerPercent('50')
    setLastEdited('listing')
  }, [defaultRate.value])

  useEffect(() => {
    onClear(clearAll)
  }, [onClear, clearAll])

  // Auto-adjust the complementary share
  const handleListingChange = useCallback((val: string) => {
    const num = parseFloat(val) || 0
    setListingPercent(val)
    setBuyerPercent(String(Math.max(0, 100 - num)))
    setLastEdited('listing')
  }, [])

  const handleBuyerChange = useCallback((val: string) => {
    const num = parseFloat(val) || 0
    setBuyerPercent(val)
    setListingPercent(String(Math.max(0, 100 - num)))
    setLastEdited('buyer')
  }, [])

  // Live calculation
  const results = useMemo(() => {
    const price = parseNum(propertyPrice)
    const rate = parseFloat(commissionRate) || 0
    if (price <= 0) return null

    const totalCommission = price * (rate / 100)
    const listingPct = parseFloat(listingPercent) || 0
    const buyerPct = parseFloat(buyerPercent) || 0
    const listingShare = totalCommission * (listingPct / 100)
    const buyerShare = totalCommission * (buyerPct / 100)
    const vatOnListing = listingShare * (vatRate.value / 100)
    const vatOnBuyer = buyerShare * (vatRate.value / 100)
    const totalVat = vatOnListing + vatOnBuyer
    const totalInclVat = totalCommission + totalVat

    return {
      totalCommission,
      listingShare,
      buyerShare,
      vatOnListing,
      vatOnBuyer,
      totalVat,
      totalInclVat,
      listingPct,
      buyerPct,
    }
  }, [propertyPrice, commissionRate, listingPercent, buyerPercent, vatRate.value])

  const isCommissionCustom = commissionRate !== String(defaultRate.value)

  return (
    <div className="space-y-4">
      {/* Property Price */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Property Price (AED)</label>
        <input
          type="text"
          value={formatInputDisplay(propertyPrice)}
          onChange={(e) => setPropertyPrice(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="e.g., 2,000,000"
          className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
        />
      </div>

      {/* Commission Rate */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Commission Rate (%)</label>
        <input
          type="text"
          value={commissionRate}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, '')
            setCommissionRate(val)
          }}
          className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
        />
        <RateAttribution rate={defaultRate} isCustom={isCommissionCustom} defaultLabel={`${defaultRate.value}%`} />
      </div>

      {/* Agent Split */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Listing Agent (%)</label>
          <input
            type="text"
            value={listingPercent}
            onChange={(e) => handleListingChange(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Buyer's Agent (%)</label>
          <input
            type="text"
            value={buyerPercent}
            onChange={(e) => handleBuyerChange(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      {!results ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-[12px] text-[#5a5a60]">Enter property price to calculate</p>
        </div>
      ) : (
        <div className="bg-[#0d0d0e] rounded-lg p-3 space-y-3">
          {/* Total Commission */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#a1a1aa]">Total Commission</span>
            <span className="text-[13px] text-[#ededee] font-medium">{formatAED(results.totalCommission)}</span>
          </div>

          <div className="border-t border-white/[0.07]" />

          {/* Listing Agent */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Listing Agent ({results.listingPct}%)</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.listingShare)}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-[#5a5a60] flex items-center gap-1">
                VAT ({vatRate.value}%)
                <RateAttribution rate={vatRate} isCustom={false} />
              </span>
              <span className="text-[10px] text-[#5a5a60]">{formatAEDDecimal(results.vatOnListing)}</span>
            </div>
          </div>

          {/* Buyer's Agent */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Buyer's Agent ({results.buyerPct}%)</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.buyerShare)}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-[#5a5a60] flex items-center gap-1">
                VAT ({vatRate.value}%)
                <RateAttribution rate={vatRate} isCustom={false} />
              </span>
              <span className="text-[10px] text-[#5a5a60]">{formatAEDDecimal(results.vatOnBuyer)}</span>
            </div>
          </div>

          <div className="border-t border-white/[0.07]" />

          {/* Total incl. VAT */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#ededee] font-semibold">Total incl. VAT</span>
            <span className="text-[14px] text-[#ededee] font-bold">{formatAEDDecimal(results.totalInclVat)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
