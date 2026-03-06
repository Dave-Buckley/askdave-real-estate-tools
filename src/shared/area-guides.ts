// Area Guides — Static Dubai community profiles with source attribution
// Pattern: follows shared/flashcards.ts (typed constants bundled at build time)

export interface AreaDataPoint {
  value: number | [number, number] // single value or range [min, max]
  source: string // e.g., "DLD Transaction Data"
  sourceUrl: string // e.g., "https://dubailand.gov.ae/en/open-data/"
  effectiveDate: string // e.g., "2025-Q4"
}

export interface CommunityProfile {
  id: string // e.g., "downtown-dubai"
  name: string // e.g., "Downtown Dubai"
  shortName: string // e.g., "Downtown" (for compact display)
  propertyTypes: ('apartment' | 'villa' | 'townhouse')[]
  freeholdStatus: 'freehold' | 'leasehold' | 'mixed'

  // Core metrics (all with source + date)
  pricePerSqft: AreaDataPoint // AED range [min, max]
  rentalYield: AreaDataPoint // gross % range [min, max]
  serviceCharges: AreaDataPoint // AED/sqft range [min, max]
  avgTransactionPrice: AreaDataPoint // AED range [min, max]
  priceGrowthYoY: AreaDataPoint // % change (single number)

  // Lifestyle / qualitative
  metroAccess: boolean
  nearestMetro?: string
  keyDevelopers: string[]
  highlights: string[] // e.g., "Burj Khalifa views", "Dubai Mall walkable"

  // For comparison matching
  priceTier: 'ultra-premium' | 'premium' | 'mid-premium' | 'mid-market'
}

/**
 * Format a single number or [min, max] range with commas and optional suffix.
 * Examples:
 *   formatRange(2100) => "2,100"
 *   formatRange([1800, 2400]) => "1,800 - 2,400"
 *   formatRange([5.2, 7.1], '%') => "5.2 - 7.1%"
 */
export function formatRange(value: number | [number, number], suffix?: string): string {
  const fmt = (n: number): string => {
    // For small numbers (likely percentages), don't add commas to decimals
    if (Math.abs(n) < 100) return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  const s = suffix ?? ''
  if (Array.isArray(value)) {
    return `${fmt(value[0])} - ${fmt(value[1])}${s}`
  }
  return `${fmt(value)}${s}`
}

// ─── Data Sources ─────────────────────────────────────────────────────
// DLD = Dubai Land Department Transaction Data (via DXBInteract)
// RERA SCI = RERA Service Charge Index (Mollak system)
// Values represent typical ranges for the community, curated from
// publicly available quarterly reports and open data portals.
// ──────────────────────────────────────────────────────────────────────

const DLD_SOURCE = 'DLD Transaction Data'
const DLD_URL = 'https://dxbinteract.com/'
const RERA_SOURCE = 'RERA Service Charge Index'
const RERA_URL = 'https://dubailand.gov.ae/en/eservices/service-charge-index-overview/'
const DATA_PERIOD = '2025-Q4'

export const AREA_GUIDES: CommunityProfile[] = [
  // ── 1. Downtown Dubai ──────────────────────────────────────────────
  {
    id: 'downtown-dubai',
    name: 'Downtown Dubai',
    shortName: 'Downtown',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [2000, 3200],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.0, 6.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [18, 30],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1800000, 4500000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 12,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'Burj Khalifa / Dubai Mall',
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Burj Khalifa views',
      'Dubai Mall walkable',
      'Dubai Fountain',
      'Souk Al Bahar',
    ],
    priceTier: 'premium',
  },

  // ── 2. Business Bay ────────────────────────────────────────────────
  {
    id: 'business-bay',
    name: 'Business Bay',
    shortName: 'Business Bay',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1400, 2400],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [6.0, 7.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [14, 25],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1000000, 3000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 15,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'Business Bay',
    keyDevelopers: ['Omniyat', 'DAMAC Properties', 'Binghatti'],
    highlights: [
      'Dubai Canal views',
      'Walking distance to Downtown',
      'High rental demand',
      'New metro station',
    ],
    priceTier: 'mid-premium',
  },

  // ── 3. Dubai Marina ────────────────────────────────────────────────
  {
    id: 'dubai-marina',
    name: 'Dubai Marina',
    shortName: 'Marina',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1600, 2800],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.5, 7.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [15, 28],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1200000, 3500000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 10,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'DMCC',
    keyDevelopers: ['Emaar Properties', 'Select Group', 'DAMAC Properties'],
    highlights: [
      'Marina Walk promenade',
      'Beach access nearby',
      'Vibrant nightlife',
      'Marina Mall',
    ],
    priceTier: 'premium',
  },

  // ── 4. Palm Jumeirah ───────────────────────────────────────────────
  {
    id: 'palm-jumeirah',
    name: 'Palm Jumeirah',
    shortName: 'Palm',
    propertyTypes: ['apartment', 'villa'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [2200, 4500],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [4.0, 6.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [20, 40],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [3000000, 15000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 18,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'Palm Jumeirah',
    keyDevelopers: ['Nakheel', 'Omniyat', 'Select Group'],
    highlights: [
      'Private beaches',
      'Atlantis The Royal',
      'Iconic island living',
      'Five-star resort lifestyle',
    ],
    priceTier: 'ultra-premium',
  },

  // ── 5. DIFC ────────────────────────────────────────────────────────
  {
    id: 'difc',
    name: 'DIFC',
    shortName: 'DIFC',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [2200, 3500],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [4.5, 6.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [22, 35],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [2500000, 6000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 14,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'Financial Centre',
    keyDevelopers: ['Brookfield', 'DIFC Authority', 'Deyaar'],
    highlights: [
      'Financial hub',
      'Gate Avenue dining',
      'Art galleries',
      'Premium office proximity',
    ],
    priceTier: 'premium',
  },

  // ── 6. Dubai Hills Estate ──────────────────────────────────────────
  {
    id: 'dubai-hills-estate',
    name: 'Dubai Hills Estate',
    shortName: 'Dubai Hills',
    propertyTypes: ['apartment', 'villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1300, 2200],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.5, 7.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [12, 22],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1200000, 5000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 16,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Dubai Hills Mall',
      '18-hole championship golf course',
      'Parks and green spaces',
      'Family-oriented community',
    ],
    priceTier: 'mid-premium',
  },

  // ── 7. JBR — Jumeirah Beach Residence ──────────────────────────────
  {
    id: 'jbr',
    name: 'JBR - Jumeirah Beach Residence',
    shortName: 'JBR',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1700, 2600],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.5, 7.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [16, 28],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1500000, 4000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 11,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'DMCC / JBR Tram',
    keyDevelopers: ['Dubai Properties Group'],
    highlights: [
      'The Walk promenade',
      'Beachfront living',
      'Ain Dubai nearby',
      'The Beach Mall',
    ],
    priceTier: 'premium',
  },

  // ── 8. City Walk ───────────────────────────────────────────────────
  {
    id: 'city-walk',
    name: 'City Walk',
    shortName: 'City Walk',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1800, 2800],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.0, 6.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [20, 32],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1800000, 4500000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 9,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Meraas'],
    highlights: [
      'Urban lifestyle district',
      'Boutique retail and dining',
      'Green spaces and play areas',
      'Near Jumeirah beaches',
    ],
    priceTier: 'premium',
  },

  // ── 9. MBR City — Mohammed Bin Rashid City ─────────────────────────
  {
    id: 'mbr-city',
    name: 'MBR City - Mohammed Bin Rashid City',
    shortName: 'MBR City',
    propertyTypes: ['apartment', 'villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1200, 2100],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.5, 7.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [12, 22],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1000000, 4000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 13,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Meydan Group', 'Azizi Developments', 'Sobha Realty'],
    highlights: [
      'Meydan Racecourse views',
      'Crystal Lagoon',
      'Large villa plots',
      'Master-planned community',
    ],
    priceTier: 'mid-premium',
  },

  // ── 10. Dubai Creek Harbour ────────────────────────────────────────
  {
    id: 'dubai-creek-harbour',
    name: 'Dubai Creek Harbour',
    shortName: 'Creek Harbour',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1500, 2500],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.5, 7.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [14, 24],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1100000, 3500000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 17,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Creek Tower landmark',
      'Waterfront promenade',
      'Wildlife sanctuary nearby',
      'Dubai Square planned',
    ],
    priceTier: 'mid-premium',
  },

  // ── 11. Jumeirah Village Circle — JVC ──────────────────────────────
  {
    id: 'jvc',
    name: 'Jumeirah Village Circle - JVC',
    shortName: 'JVC',
    propertyTypes: ['apartment', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [800, 1300],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [7.0, 9.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [10, 18],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [500000, 1200000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 20,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Nakheel', 'Binghatti', 'Danube Properties'],
    highlights: [
      'Highest rental yields in Dubai',
      'Affordable entry point',
      'Community parks and pools',
      'Circle Mall',
    ],
    priceTier: 'mid-market',
  },

  // ── 12. Jumeirah Lake Towers — JLT ─────────────────────────────────
  {
    id: 'jlt',
    name: 'Jumeirah Lake Towers - JLT',
    shortName: 'JLT',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [900, 1500],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [7.0, 8.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [12, 20],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [600000, 1500000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 14,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: true,
    nearestMetro: 'DMCC',
    keyDevelopers: ['DMCC Authority'],
    highlights: [
      'Lake views',
      'Marina-adjacent value',
      'Strong rental demand',
      'JLT Park and dining',
    ],
    priceTier: 'mid-market',
  },
]
