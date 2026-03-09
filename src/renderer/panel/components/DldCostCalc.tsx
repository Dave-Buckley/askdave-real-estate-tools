import { useState, useMemo, useEffect, useCallback } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  CALCULATOR_RATES,
  formatAED,
  getFreshness,
  FRESHNESS_COLORS,
} from '../../../shared/calculator-rates'
import type { RateEntry } from '../../../shared/calculator-rates'

interface DldCostCalcProps {
  onClear: (clearFn: () => void) => void
  onShare: (text: string) => void
}

type PropertyType = 'apartment' | 'land' | 'villa'

// ── Helpers ────────────────────────────────────────────────────────────

function parseNum(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

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

// ── Fee Line ───────────────────────────────────────────────────────────

function FeeLine({
  label,
  amount,
  rate,
}: {
  label: string
  amount: number
  rate?: RateEntry
}): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#a1a1aa]">{label}</span>
        <span className="text-[13px] text-[#ededee]">{formatAED(amount)}</span>
      </div>
      {rate && (
        <div className="mt-0.5">
          <RateAttribution rate={rate} isCustom={false} />
        </div>
      )}
    </div>
  )
}

// ── DLD Cost Calculator ───────────────────────────────────────────────

export default function DldCostCalc({ onClear, onShare }: DldCostCalcProps): React.JSX.Element {
  const dldRates = CALCULATOR_RATES.dld
  const commissionRate = CALCULATOR_RATES.commission.defaultRate
  const vatRate = CALCULATOR_RATES.vat

  const [propertyPrice, setPropertyPrice] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment')
  const [hasMortgage, setHasMortgage] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [agencyFeePct, setAgencyFeePct] = useState(String(commissionRate.value))

  // Register clear function
  const clearAll = useCallback(() => {
    setPropertyPrice('')
    setPropertyType('apartment')
    setHasMortgage(false)
    setLoanAmount('')
    setAgencyFeePct(String(commissionRate.value))
  }, [commissionRate.value])

  useEffect(() => {
    onClear(clearAll)
  }, [onClear, clearAll])

  // Live calculation
  const results = useMemo(() => {
    const price = parseNum(propertyPrice)
    if (price <= 0) return null

    const transferFee = price * (dldRates.transferFee.value / 100)
    const adminFee = propertyType === 'land'
      ? dldRates.adminFeeLand.value
      : dldRates.adminFeeApartment.value
    const trusteeFee = price < 500_000
      ? dldRates.trusteeFeeUnder500k.value
      : dldRates.trusteeFeeOver500k.value
    const trusteeVat = trusteeFee * (dldRates.trusteeVat.value / 100)
    const titleDeedFee = dldRates.titleDeedFee.value

    const agencyPct = parseFloat(agencyFeePct) || 0
    const agencyFee = price * (agencyPct / 100)
    const agencyVat = agencyFee * (vatRate.value / 100)

    let mortgageRegistration = 0
    let mortgageAdminFee = 0
    if (hasMortgage) {
      const loan = parseNum(loanAmount)
      if (loan > 0) {
        mortgageRegistration = loan * (dldRates.mortgageRegistration.value / 100)
        mortgageAdminFee = dldRates.mortgageAdminFee.value
      }
    }

    const totalCosts =
      transferFee +
      adminFee +
      trusteeFee +
      trusteeVat +
      titleDeedFee +
      agencyFee +
      agencyVat +
      mortgageRegistration +
      mortgageAdminFee

    const totalToClose = price + totalCosts

    return {
      transferFee,
      adminFee,
      trusteeFee,
      trusteeVat,
      titleDeedFee,
      agencyFee,
      agencyPct,
      agencyVat,
      mortgageRegistration,
      mortgageAdminFee,
      totalCosts,
      totalToClose,
    }
  }, [propertyPrice, propertyType, hasMortgage, loanAmount, agencyFeePct, dldRates, vatRate.value])

  const isAgencyCustom = agencyFeePct !== String(commissionRate.value)

  // Build WhatsApp summary
  const buildDldSummary = useCallback((): string => {
    if (!results) return ''
    const price = parseNum(propertyPrice)
    const typeLabel = propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
    const lines = [
      '*DLD Cost Breakdown*',
      '',
      `Property Price: ${formatAED(price)}`,
      `Property Type: ${typeLabel}`,
      '',
      `DLD Transfer Fee (${dldRates.transferFee.value}%): ${formatAED(results.transferFee)}`,
      `Admin Fee: ${formatAED(results.adminFee)}`,
      `Trustee Fee: ${formatAED(results.trusteeFee)}`,
      `Trustee VAT: ${formatAED(results.trusteeVat)}`,
      `Title Deed Fee: ${formatAED(results.titleDeedFee)}`,
      `Agency Fee (${results.agencyPct}%): ${formatAED(results.agencyFee)}`,
      `Agency VAT: ${formatAED(results.agencyVat)}`,
    ]

    if (hasMortgage && results.mortgageRegistration > 0) {
      lines.push(`Mortgage Registration: ${formatAED(results.mortgageRegistration)}`)
      if (results.mortgageAdminFee > 0) {
        lines.push(`Mortgage Admin Fee: ${formatAED(results.mortgageAdminFee)}`)
      }
    }

    lines.push(
      '',
      `*Total Closing Costs: ${formatAED(results.totalCosts)}*`,
      `*Total to Close: ${formatAED(results.totalToClose)}*`,
      '',
      `_Estimate only. Fees effective ${dldRates.transferFee.effectiveDate}. Subject to DLD approval._`,
    )
    return lines.join('\n')
  }, [results, propertyPrice, propertyType, hasMortgage, dldRates])

  const propertyTypes: { key: PropertyType; label: string }[] = [
    { key: 'apartment', label: 'Apartment' },
    { key: 'villa', label: 'Villa' },
    { key: 'land', label: 'Land' },
  ]

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

      {/* Property Type toggle */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Property Type</label>
        <div className="flex rounded-md border border-white/[0.07] overflow-hidden">
          {propertyTypes.map((pt, i) => (
            <button
              key={pt.key}
              onClick={() => setPropertyType(pt.key)}
              className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors ${
                i > 0 ? 'border-l border-white/[0.07]' : ''
              } ${
                propertyType === pt.key
                  ? 'bg-[#818cf8]/20 text-[#818cf8]'
                  : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Has Mortgage toggle */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Mortgage</label>
        <div className="flex rounded-md border border-white/[0.07] overflow-hidden">
          <button
            onClick={() => setHasMortgage(false)}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors ${
              !hasMortgage
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            Cash
          </button>
          <button
            onClick={() => setHasMortgage(true)}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors border-l border-white/[0.07] ${
              hasMortgage
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            Mortgage
          </button>
        </div>
      </div>

      {/* Loan Amount -- only when mortgage */}
      {hasMortgage && (
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Loan Amount (AED)</label>
          <input
            type="text"
            value={formatInputDisplay(loanAmount)}
            onChange={(e) => setLoanAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g., 1,600,000"
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
        </div>
      )}

      {/* Agency Fee */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Agency Fee (%)</label>
        <input
          type="text"
          value={agencyFeePct}
          onChange={(e) => setAgencyFeePct(e.target.value.replace(/[^0-9.]/g, ''))}
          className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
        />
        <RateAttribution rate={commissionRate} isCustom={isAgencyCustom} defaultLabel={`${commissionRate.value}%`} />
      </div>

      {/* Results */}
      {!results ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-[12px] text-[#5a5a60]">Enter property price to calculate</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-[#0d0d0e] rounded-lg p-3 space-y-2">
            <FeeLine label={`DLD Transfer Fee (${dldRates.transferFee.value}%)`} amount={results.transferFee} rate={dldRates.transferFee} />
            <FeeLine
              label="Admin Fee"
              amount={results.adminFee}
              rate={propertyType === 'land' ? dldRates.adminFeeLand : dldRates.adminFeeApartment}
            />
            <FeeLine
              label="Trustee Fee"
              amount={results.trusteeFee}
              rate={parseNum(propertyPrice) < 500_000 ? dldRates.trusteeFeeUnder500k : dldRates.trusteeFeeOver500k}
            />
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Trustee VAT ({dldRates.trusteeVat.value}%)</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.trusteeVat)}</span>
            </div>
            <FeeLine label="Title Deed Fee" amount={results.titleDeedFee} rate={dldRates.titleDeedFee} />

            <div className="border-t border-white/[0.07] my-1" />

            {/* Agency Fee */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#a1a1aa]">Agency Fee ({results.agencyPct}%)</span>
                <span className="text-[13px] text-[#ededee]">{formatAED(results.agencyFee)}</span>
              </div>
              <div className="mt-0.5">
                <RateAttribution rate={commissionRate} isCustom={isAgencyCustom} defaultLabel={`${commissionRate.value}%`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Agency VAT ({vatRate.value}%)</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.agencyVat)}</span>
            </div>

            {/* Mortgage registration -- only if mortgage */}
            {hasMortgage && results.mortgageRegistration > 0 && (
              <>
                <div className="border-t border-white/[0.07] my-1" />
                <FeeLine
                  label={`Mortgage Reg. (${dldRates.mortgageRegistration.value}%)`}
                  amount={results.mortgageRegistration}
                  rate={dldRates.mortgageRegistration}
                />
                <FeeLine
                  label="Mortgage Admin Fee"
                  amount={results.mortgageAdminFee}
                  rate={dldRates.mortgageAdminFee}
                />
              </>
            )}

            <div className="border-t border-white/[0.07] my-1" />

            {/* Total Closing Costs */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#ededee] font-semibold">Total Closing Costs</span>
              <span className="text-[14px] text-[#ededee] font-bold">{formatAED(results.totalCosts)}</span>
            </div>

            {/* Total to Close */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#ededee] font-semibold">Total to Close</span>
              <span className="text-[15px] text-[#ededee] font-bold">{formatAED(results.totalToClose)}</span>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={() => onShare(buildDldSummary())}
            className="w-full py-2 text-[12px] font-medium text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04] border border-white/[0.07] rounded-md transition-colors"
          >
            Share via WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}
