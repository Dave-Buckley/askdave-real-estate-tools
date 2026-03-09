// Calculator Rate Data — UAE real estate financial rates with source attribution
// Pattern: follows shared/area-guides.ts (typed constants with source, sourceUrl, effectiveDate)

export interface RateEntry {
  value: number
  source: string
  sourceUrl: string
  effectiveDate: string // e.g., "2025-Q4" or "March 2025"
}

export interface LtvEntry {
  maxLtv: number
  minDown: number
  label: string
  source: string
  sourceUrl: string
  effectiveDate: string
}

export interface CalculatorRates {
  mortgage: {
    defaultInterestRate: RateEntry
    maxTermYears: RateEntry
    ltvRules: {
      residentFirst_under5M: LtvEntry
      residentFirst_over5M: LtvEntry
      residentSecondPlus: LtvEntry
      nonResident: LtvEntry
    }
  }
  dld: {
    transferFee: RateEntry
    adminFeeApartment: RateEntry
    adminFeeLand: RateEntry
    trusteeFeeUnder500k: RateEntry
    trusteeFeeOver500k: RateEntry
    trusteeVat: RateEntry
    mortgageRegistration: RateEntry
    mortgageAdminFee: RateEntry
    titleDeedFee: RateEntry
  }
  commission: {
    defaultRate: RateEntry
  }
  vat: RateEntry
}

export const CALCULATOR_RATES: CalculatorRates = {
  mortgage: {
    defaultInterestRate: {
      value: 4.99,
      source: 'Average UAE variable mortgage rate',
      sourceUrl: 'https://www.mortgagefinder.ae/rates',
      effectiveDate: '2025-Q4',
    },
    maxTermYears: {
      value: 25,
      source: 'UAE Central Bank',
      sourceUrl: 'https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans',
      effectiveDate: '2025-Q4',
    },
    ltvRules: {
      residentFirst_under5M: {
        maxLtv: 80,
        minDown: 20,
        label: 'Resident, 1st property <=5M',
        source: 'UAE Central Bank',
        sourceUrl: 'https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans',
        effectiveDate: '2025-Q4',
      },
      residentFirst_over5M: {
        maxLtv: 70,
        minDown: 30,
        label: 'Resident, 1st property >5M',
        source: 'UAE Central Bank',
        sourceUrl: 'https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans',
        effectiveDate: '2025-Q4',
      },
      residentSecondPlus: {
        maxLtv: 65,
        minDown: 35,
        label: 'Resident, 2nd+ property',
        source: 'UAE Central Bank',
        sourceUrl: 'https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans',
        effectiveDate: '2025-Q4',
      },
      nonResident: {
        maxLtv: 50,
        minDown: 50,
        label: 'Non-resident',
        source: 'UAE Central Bank',
        sourceUrl: 'https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans',
        effectiveDate: '2025-Q4',
      },
    },
  },
  dld: {
    transferFee: {
      value: 4,
      source: 'Dubai Land Department',
      sourceUrl: 'https://www.propertyfinder.ae/blog/dld-fees-dubai/',
      effectiveDate: '2025-Q4',
    },
    adminFeeApartment: {
      value: 580,
      source: 'Dubai Land Department',
      sourceUrl: 'https://www.propertyfinder.ae/blog/dld-fees-dubai/',
      effectiveDate: '2025-Q4',
    },
    adminFeeLand: {
      value: 430,
      source: 'Dubai Land Department',
      sourceUrl: 'https://www.propertyfinder.ae/blog/dld-fees-dubai/',
      effectiveDate: '2025-Q4',
    },
    trusteeFeeUnder500k: {
      value: 2000,
      source: 'Dubai Land Department',
      sourceUrl: 'https://www.propertyfinder.ae/blog/dld-fees-dubai/',
      effectiveDate: '2025-Q4',
    },
    trusteeFeeOver500k: {
      value: 4000,
      source: 'Dubai Land Department',
      sourceUrl: 'https://www.propertyfinder.ae/blog/dld-fees-dubai/',
      effectiveDate: '2025-Q4',
    },
    trusteeVat: {
      value: 5,
      source: 'Federal Tax Authority',
      sourceUrl: 'https://tax.gov.ae/en/taxes/vat.aspx',
      effectiveDate: '2025-Q4',
    },
    mortgageRegistration: {
      value: 0.25,
      source: 'Dubai Land Department',
      sourceUrl: 'https://properita.com/read-blog/90_dld-mortgage-registration-2025-fees-process-documents-amp-complete-guide.html',
      effectiveDate: '2025-Q4',
    },
    mortgageAdminFee: {
      value: 290,
      source: 'Dubai Land Department',
      sourceUrl: 'https://properita.com/read-blog/90_dld-mortgage-registration-2025-fees-process-documents-amp-complete-guide.html',
      effectiveDate: '2025-Q4',
    },
    titleDeedFee: {
      value: 250,
      source: 'Dubai Land Department',
      sourceUrl: 'https://www.propertyfinder.ae/blog/dld-fees-dubai/',
      effectiveDate: '2025-Q4',
    },
  },
  commission: {
    defaultRate: {
      value: 2,
      source: 'Dubai market standard',
      sourceUrl: 'https://www.propertyfinder.ae/blog/real-estate-agent-commission-dubai/',
      effectiveDate: '2025-Q4',
    },
  },
  vat: {
    value: 5,
    source: 'Federal Tax Authority',
    sourceUrl: 'https://tax.gov.ae/en/taxes/vat.aspx',
    effectiveDate: '2025-Q4',
  },
}

// ── Formatting helpers ────────────────────────────────────────────────

/** Format AED amount with commas, no decimals (e.g., "AED 1,234,567") */
export function formatAED(amount: number): string {
  return `AED ${Math.round(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

/** Format AED amount with 2 decimal places (e.g., "AED 11,572.33") */
export function formatAEDDecimal(amount: number): string {
  return `AED ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ── Freshness indicator ───────────────────────────────────────────────

/**
 * Determine freshness of a rate based on its effective date.
 * Parses "2025-Q4", "March 2025", "2025-01" style dates.
 */
export function getFreshness(effectiveDate: string): 'fresh' | 'aging' | 'stale' {
  const now = new Date()
  const parsed = parseEffectiveDate(effectiveDate)
  const monthsDiff = (now.getFullYear() - parsed.year) * 12 + (now.getMonth() - parsed.month)
  if (monthsDiff < 6) return 'fresh'
  if (monthsDiff < 12) return 'aging'
  return 'stale'
}

function parseEffectiveDate(dateStr: string): { year: number; month: number } {
  // "2025-Q4" -> Oct (month 9)
  const quarterMatch = dateStr.match(/(\d{4})-Q(\d)/)
  if (quarterMatch) {
    const year = parseInt(quarterMatch[1])
    const quarter = parseInt(quarterMatch[2])
    const month = (quarter - 1) * 3 // Q1=0, Q2=3, Q3=6, Q4=9
    return { year, month }
  }

  // "March 2025" or "Jan 2025"
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const monthNameMatch = dateStr.match(/([A-Za-z]+)\s+(\d{4})/)
  if (monthNameMatch) {
    const year = parseInt(monthNameMatch[2])
    const monthIdx = monthNames.findIndex((m) => monthNameMatch[1].toLowerCase().startsWith(m))
    return { year, month: monthIdx >= 0 ? monthIdx : 0 }
  }

  // "2025-01" or "2025-1"
  const isoMatch = dateStr.match(/(\d{4})-(\d{1,2})/)
  if (isoMatch) {
    return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]) - 1 }
  }

  // Fallback: try parsing just a year
  const yearMatch = dateStr.match(/(\d{4})/)
  if (yearMatch) {
    return { year: parseInt(yearMatch[1]), month: 0 }
  }

  // Can't parse — treat as stale
  return { year: 2020, month: 0 }
}

export const FRESHNESS_COLORS: Record<'fresh' | 'aging' | 'stale', string> = {
  fresh: '#4ade80',
  aging: '#fbbf24',
  stale: '#f87171',
}
