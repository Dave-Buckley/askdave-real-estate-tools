import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  CALCULATOR_RATES,
  formatAED,
  formatAEDDecimal,
  getFreshness,
  FRESHNESS_COLORS,
} from '../../../shared/calculator-rates'
import type { RateEntry, LtvEntry } from '../../../shared/calculator-rates'

interface MortgageCalcProps {
  onClear: (clearFn: () => void) => void
  onShare: (text: string) => void
}

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

function LtvAttribution({ rule }: { rule: LtvEntry }): React.JSX.Element {
  const freshness = getFreshness(rule.effectiveDate)
  const color = FRESHNESS_COLORS[freshness]

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#5a5a60]">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={`Data freshness: ${freshness}`}
      />
      <span>{rule.source}, {rule.effectiveDate}</span>
      <button
        onClick={() => window.electronAPI.openExternal(rule.sourceUrl)}
        className="text-[#5a5a60] hover:text-[#a1a1aa] transition-colors"
        title="Verify source"
      >
        <ExternalLink size={10} strokeWidth={1.5} />
      </button>
    </span>
  )
}

// ── Mortgage Calculator ───────────────────────────────────────────────

export default function MortgageCalc({ onClear, onShare }: MortgageCalcProps): React.JSX.Element {
  const mortgageRates = CALCULATOR_RATES.mortgage

  const [propertyPrice, setPropertyPrice] = useState('')
  const [interestRate, setInterestRate] = useState(String(mortgageRates.defaultInterestRate.value))
  const [termYears, setTermYears] = useState(String(mortgageRates.maxTermYears.value))
  const [isResident, setIsResident] = useState(true)
  const [isFirstProperty, setIsFirstProperty] = useState(true)
  const [downPaymentPct, setDownPaymentPct] = useState('')
  const isDownPaymentOverridden = useRef(false)

  // Determine active LTV rule
  const activeLtvRule = useMemo((): LtvEntry => {
    if (!isResident) return mortgageRates.ltvRules.nonResident
    if (!isFirstProperty) return mortgageRates.ltvRules.residentSecondPlus
    const price = parseNum(propertyPrice)
    if (price > 5_000_000) return mortgageRates.ltvRules.residentFirst_over5M
    return mortgageRates.ltvRules.residentFirst_under5M
  }, [isResident, isFirstProperty, propertyPrice, mortgageRates.ltvRules])

  // Auto-adjust down payment when LTV rule changes
  useEffect(() => {
    const requiredMin = activeLtvRule.minDown
    if (isDownPaymentOverridden.current) {
      const currentPct = parseFloat(downPaymentPct) || 0
      if (currentPct < requiredMin) {
        // User's custom value is below the new minimum -- override it
        setDownPaymentPct(String(requiredMin))
      }
      // If custom value >= minimum, keep it
    } else {
      // Not overridden -- auto-set to the rule minimum
      setDownPaymentPct(String(requiredMin))
    }
  }, [activeLtvRule]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownPaymentChange = useCallback((val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    setDownPaymentPct(cleaned)
    isDownPaymentOverridden.current = true
  }, [])

  // Register clear function
  const clearAll = useCallback(() => {
    setPropertyPrice('')
    setInterestRate(String(mortgageRates.defaultInterestRate.value))
    setTermYears(String(mortgageRates.maxTermYears.value))
    setIsResident(true)
    setIsFirstProperty(true)
    setDownPaymentPct('')
    isDownPaymentOverridden.current = false
  }, [mortgageRates.defaultInterestRate.value, mortgageRates.maxTermYears.value])

  useEffect(() => {
    onClear(clearAll)
  }, [onClear, clearAll])

  // PMT calculation
  const results = useMemo(() => {
    const price = parseNum(propertyPrice)
    if (price <= 0) return null

    const rate = parseFloat(interestRate) || 0
    const years = parseFloat(termYears) || 0
    const dpPct = parseFloat(downPaymentPct) || 0
    if (years <= 0) return null

    const downPaymentAmount = price * (dpPct / 100)
    const principal = price - downPaymentAmount
    if (principal <= 0) return null

    const monthlyRate = rate / 100 / 12
    const totalPayments = years * 12
    let monthlyPayment: number

    if (monthlyRate === 0) {
      monthlyPayment = principal / totalPayments
    } else {
      const factor = Math.pow(1 + monthlyRate, totalPayments)
      monthlyPayment = principal * (monthlyRate * factor) / (factor - 1)
    }

    const totalRepayment = monthlyPayment * totalPayments
    const totalInterest = totalRepayment - principal

    return {
      downPaymentAmount,
      downPaymentPct: dpPct,
      principal,
      monthlyPayment,
      totalRepayment,
      totalInterest,
      ltvApplied: 100 - dpPct,
    }
  }, [propertyPrice, interestRate, termYears, downPaymentPct])

  const isInterestCustom = interestRate !== String(mortgageRates.defaultInterestRate.value)
  const isTermCustom = termYears !== String(mortgageRates.maxTermYears.value)

  // Build WhatsApp summary
  const buildMortgageSummary = useCallback((): string => {
    if (!results) return ''
    const price = parseNum(propertyPrice)
    const lines = [
      '*Mortgage Estimate*',
      '',
      `Property Price: ${formatAED(price)}`,
      `Down Payment: ${formatAED(results.downPaymentAmount)} (${results.downPaymentPct}%)`,
      `Loan Amount: ${formatAED(results.principal)}`,
      '',
      `Interest Rate: ${interestRate}%`,
      `Term: ${termYears} years`,
      '',
      `*Monthly Payment: ${formatAEDDecimal(results.monthlyPayment)}*`,
      `Total Repayment: ${formatAED(results.totalRepayment)}`,
      `Total Interest: ${formatAED(results.totalInterest)}`,
      '',
      '_Estimate only. Final terms subject to bank approval._',
    ]
    return lines.join('\n')
  }, [results, propertyPrice, interestRate, termYears])

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

      {/* Resident / Non-resident toggle */}
      <div className="space-y-2">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Buyer Status</label>
        <div className="flex rounded-md border border-white/[0.07] overflow-hidden">
          <button
            onClick={() => setIsResident(true)}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors ${
              isResident
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            Resident
          </button>
          <button
            onClick={() => setIsResident(false)}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors border-l border-white/[0.07] ${
              !isResident
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            Non-resident
          </button>
        </div>

        {/* First / 2nd+ Property toggle */}
        <div className={`flex rounded-md border border-white/[0.07] overflow-hidden ${!isResident ? 'opacity-40 pointer-events-none' : ''}`}>
          <button
            onClick={() => setIsFirstProperty(true)}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors ${
              isFirstProperty
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            First Property
          </button>
          <button
            onClick={() => setIsFirstProperty(false)}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium transition-colors border-l border-white/[0.07] ${
              !isFirstProperty
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            2nd+ Property
          </button>
        </div>

        {/* Active LTV rule label */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#818cf8]/80">
            {activeLtvRule.label}: max {activeLtvRule.maxLtv}% LTV
          </span>
          <LtvAttribution rule={activeLtvRule} />
        </div>
      </div>

      {/* Interest Rate + Term side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Interest Rate (%)</label>
          <input
            type="text"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
          <RateAttribution
            rate={mortgageRates.defaultInterestRate}
            isCustom={isInterestCustom}
            defaultLabel={`${mortgageRates.defaultInterestRate.value}%`}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-[#a1a1aa] font-medium">Term (years)</label>
          <input
            type="text"
            value={termYears}
            onChange={(e) => setTermYears(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
          />
          <RateAttribution
            rate={mortgageRates.maxTermYears}
            isCustom={isTermCustom}
            defaultLabel={`${mortgageRates.maxTermYears.value} years`}
          />
        </div>
      </div>

      {/* Down Payment */}
      <div className="space-y-1">
        <label className="text-[11px] text-[#a1a1aa] font-medium">Down Payment (%)</label>
        <input
          type="text"
          value={downPaymentPct}
          onChange={(e) => handleDownPaymentChange(e.target.value)}
          placeholder={`Min ${activeLtvRule.minDown}%`}
          className="w-full bg-[#0d0d0e] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#ededee] placeholder:text-[#5a5a60] focus:outline-none focus:border-[#818cf8]/50 transition-colors"
        />
        <span className="text-[10px] text-[#5a5a60]">
          Minimum {activeLtvRule.minDown}% required ({activeLtvRule.label})
        </span>
      </div>

      {/* Results */}
      {!results ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-[12px] text-[#5a5a60]">Enter property price to calculate</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-[#0d0d0e] rounded-lg p-3 space-y-3">
            {/* Down Payment */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Down Payment ({results.downPaymentPct}%)</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.downPaymentAmount)}</span>
            </div>

            {/* Loan Amount */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Loan Amount</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.principal)}</span>
            </div>

            <div className="border-t border-white/[0.07]" />

            {/* Monthly Payment -- headline */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#ededee] font-semibold">Monthly Payment</span>
              <span className="text-[15px] text-[#ededee] font-bold">{formatAEDDecimal(results.monthlyPayment)}</span>
            </div>

            <div className="border-t border-white/[0.07]" />

            {/* Total Repayment */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Total Repayment</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.totalRepayment)}</span>
            </div>

            {/* Total Interest */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">Total Interest</span>
              <span className="text-[13px] text-[#ededee]">{formatAED(results.totalInterest)}</span>
            </div>

            {/* LTV Applied */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#a1a1aa]">LTV Applied</span>
              <span className="text-[12px] text-[#a1a1aa]">{results.ltvApplied}% ({activeLtvRule.label})</span>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={() => onShare(buildMortgageSummary())}
            className="w-full py-2 text-[12px] font-medium text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04] border border-white/[0.07] rounded-md transition-colors"
          >
            Share via WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}
