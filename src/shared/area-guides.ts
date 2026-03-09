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
  description?: string // 1-2 sentence agent-oriented summary
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
  typicalBuyers?: string // e.g., "End-users, HNW investors, expat families"
  agentTips?: string[] // 2-3 practical tips for agents showing this area

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
    description: 'Dubai\'s flagship address built around Burj Khalifa and Dubai Mall. Premium apartments with strong capital appreciation — the benchmark area every client asks about.',
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
    typicalBuyers: 'HNW investors, end-users seeking prestige, Golden Visa applicants',
    agentTips: [
      'Emaar units hold resale value best — third-party buildings vary widely',
      'Fountain-view units command 15-25% premium over city-view',
      'High service charges are the main objection — know the exact figures per building',
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

  // ── 13. Arabian Ranches ──────────────────────────────────────────────
  {
    id: 'arabian-ranches',
    name: 'Arabian Ranches',
    shortName: 'Arabian Ranches',
    description: 'Emaar\'s original master-planned villa community with a championship golf course. Mature landscaping, established schools, and a loyal resident base make it a perennial agent favourite.',
    propertyTypes: ['villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1200, 2000],
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
      value: [2, 4],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [3000000, 8000000],
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
    metroAccess: false,
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Established villa community',
      'Championship golf course',
      'Community retail centre',
      'Family-friendly with parks and schools',
    ],
    typicalBuyers: 'End-user families, long-term residents upgrading, expat professionals',
    agentTips: [
      'AR1 villas are older but larger plots — renovation potential is the pitch',
      'Service charges are among the lowest in Dubai for villas (AED 2-4/sqft)',
      'Golf course proximity commands a 10-15% premium on resale',
    ],
    priceTier: 'mid-premium',
  },

  // ── 14. Arabian Ranches 2 ────────────────────────────────────────────
  {
    id: 'arabian-ranches-2',
    name: 'Arabian Ranches 2',
    shortName: 'AR 2',
    description: 'Second phase of Emaar\'s Arabian Ranches with modern villa designs and upgraded community facilities. Newer infrastructure and strong demand from families.',
    propertyTypes: ['villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1300, 2100],
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
      value: [2, 4],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [3500000, 9000000],
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
      'Modern villa designs',
      'Community parks and pools',
      'Near Arabian Ranches Golf Club',
      'Newer infrastructure vs AR 1',
    ],
    typicalBuyers: 'Young families, upgraders from apartments, school-proximity seekers',
    agentTips: [
      'Highlight the newer build quality vs AR1 — less renovation needed',
      'Palma and Lila sub-communities have the best resale liquidity',
      'Walking distance to Ranches Souk is a key selling point for families',
    ],
    priceTier: 'mid-premium',
  },

  // ── 15. Arabian Ranches 3 ────────────────────────────────────────────
  {
    id: 'arabian-ranches-3',
    name: 'Arabian Ranches 3',
    shortName: 'AR 3',
    description: 'Newest phase of Arabian Ranches with contemporary designs and the strongest capital appreciation in the trilogy. Sun, Caya and Bliss sub-communities are in high demand.',
    propertyTypes: ['villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1480, 2450],
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
      value: [3, 5],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [2800000, 7000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 22,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Newest Arabian Ranches phase',
      'Contemporary villa designs',
      'Strong capital appreciation',
      'Sun, Caya & Bliss sub-communities',
    ],
    typicalBuyers: 'First-time villa buyers, young families, off-plan investors',
    agentTips: [
      'Bliss 1 commands highest PSF in the trilogy — emphasise premium finishes',
      '17-28% price growth in 2025 makes this the hottest AR phase for investors',
      'Still some handover units available — good for clients wanting move-in ready',
    ],
    priceTier: 'mid-premium',
  },

  // ── 16. DAMAC Hills ──────────────────────────────────────────────────
  {
    id: 'damac-hills',
    name: 'DAMAC Hills',
    shortName: 'DAMAC Hills',
    description: 'DAMAC\'s flagship golf community anchored by Trump International Golf Club. Diverse unit mix from studio apartments to mega-mansions with strong investor appeal.',
    propertyTypes: ['apartment', 'villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1100, 1900],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [6.5, 8.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [4, 12],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [560000, 5500000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 21,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['DAMAC Properties'],
    highlights: [
      'Trump International Golf Club',
      'Golf course community living',
      'Diverse unit mix (studio to mansion)',
      'Strong investor demand',
    ],
    typicalBuyers: 'Investors seeking golf-community yields, end-users wanting lifestyle amenities',
    agentTips: [
      'Golf-facing villas command 15-20% PSF premium — always check orientation',
      'Service charges vary wildly by sub-project (AED 4 to AED 19/sqft) — verify per building',
      'Villa prices surged 20.7% in Q1 2025 alone — use momentum in pitch',
    ],
    priceTier: 'mid-premium',
  },

  // ── 17. Al Furjan ────────────────────────────────────────────────────
  {
    id: 'al-furjan',
    name: 'Al Furjan',
    shortName: 'Al Furjan',
    description: 'Rapidly maturing community near Ibn Battuta with no chiller fees and a strong mix of villas and apartments. Azizi and Danube are driving heavy new apartment supply.',
    propertyTypes: ['apartment', 'villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1100, 1700],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [6.5, 8.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [8, 16],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [550000, 5500000],
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
    metroAccess: true,
    nearestMetro: 'Discovery Gardens (Route 2020)',
    keyDevelopers: ['Azizi Developments', 'Danube Properties', 'Nakheel'],
    highlights: [
      'No chiller fees (cost advantage)',
      'Near Ibn Battuta & Metro',
      'Mix of villas and apartments',
      'Rapidly maturing community',
    ],
    typicalBuyers: 'Young professionals, small families, studio/1-bed yield investors',
    agentTips: [
      'No chiller fees = lower running costs — quantify the annual saving for clients',
      'Studio yields hit 8.75% — top-tier for small-unit investors',
      'Villas at AED 1,100-1,500/sqft offer value vs Arabian Ranches at double',
    ],
    priceTier: 'mid-market',
  },

  // ── 18. Jumeirah Islands ─────────────────────────────────────────────
  {
    id: 'jumeirah-islands',
    name: 'Jumeirah Islands',
    shortName: 'Jumeirah Islands',
    description: 'Nakheel\'s exclusive gated villa community on private islands surrounded by lakes. Average transaction AED 21M+ with 22% YoY growth. Near JLT and Dubai Marina.',
    propertyTypes: ['villa'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1800, 2500],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [4.0, 5.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [3, 7],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [17000000, 42000000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    priceGrowthYoY: {
      value: 22,
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    metroAccess: false,
    keyDevelopers: ['Nakheel'],
    highlights: [
      'Private island villa plots',
      'Lake and garden views',
      'Exclusive gated community',
      'Near Jumeirah Lake Towers',
    ],
    typicalBuyers: 'HNW families upgrading from apartments, luxury villa seekers, long-term investors',
    agentTips: [
      'Average AED 21M transaction — qualify budget before showing',
      'Service charges AED 3-7/sqft are low for luxury — use as a cost advantage vs Palm',
      '22% YoY growth — strong capital appreciation story for investors',
    ],
    priceTier: 'premium',
  },

  // ── 19. Emirates Hills ───────────────────────────────────────────────
  {
    id: 'emirates-hills',
    name: 'Emirates Hills',
    shortName: 'Emirates Hills',
    description: 'Dubai\'s most exclusive villa address — custom-built mansions averaging AED 82M around Montgomerie Golf Club. Cash-buyer market with ultra-low service charges.',
    propertyTypes: ['villa'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [2500, 5000],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [3.0, 5.0],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [1, 3],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [30000000, 200000000],
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
      "Dubai's most exclusive address",
      'Montgomerie Golf Club',
      'Custom-built mega mansions',
      'Cash-buyer ultra-luxury market',
    ],
    typicalBuyers: 'UHNW individuals, celebrity buyers, royal families, billionaire investors',
    agentTips: [
      'Cash sales are standard — mortgage clients are rare at this price point',
      'Service charges at AED 1.53/sqft are the lowest in Dubai — always mention',
      '7-bed+ villas yield 7.56% — surprisingly strong for ultra-premium',
    ],
    priceTier: 'ultra-premium',
  },

  // ── 20. The Springs / Meadows / Lakes ────────────────────────────────
  {
    id: 'springs-meadows-lakes',
    name: 'The Springs / Meadows / Lakes',
    shortName: 'Springs/Meadows',
    description: 'Emaar\'s classic villa trilogy near Emirates Golf Club. Springs offers townhouses, Meadows has larger villas, Lakes is the premium tier. 25% YoY appreciation in 2024-2025.',
    propertyTypes: ['villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1500, 2300],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [4.0, 5.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [3, 6],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [3500000, 14000000],
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
    metroAccess: false,
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Established Emaar villa trilogy',
      'Lakes, parks and landscaped streets',
      'Near Emirates Golf Club',
      'Strong capital appreciation',
    ],
    typicalBuyers: 'Families upgrading to villas, long-term residents, capital growth investors',
    agentTips: [
      'Springs PSF rose from AED 1,883 to AED 2,107 in one year — 13.6% growth',
      'Meadows villas average AED 11.78M — qualify budget carefully',
      'Springs 5-6% yield is strong for established villa — better than Emirates Hills',
    ],
    priceTier: 'mid-premium',
  },

  // ── 21. Tilal Al Ghaf ────────────────────────────────────────────────
  {
    id: 'tilal-al-ghaf',
    name: 'Tilal Al Ghaf',
    shortName: 'Tilal Al Ghaf',
    description: 'Majid Al Futtaim\'s sustainable lagoon community with Harmony and Elan villa collections. 38% capital appreciation since 2022 with an eco-friendly positioning.',
    propertyTypes: ['villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1600, 2400],
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
      value: [4, 8],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [2800000, 7500000],
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
    keyDevelopers: ['Majid Al Futtaim'],
    highlights: [
      'Crystal lagoon centrepiece',
      'Sustainable eco-community',
      'Harmony & Elan villa collections',
      '38% capital appreciation since 2022',
    ],
    typicalBuyers: 'Eco-conscious families, villa upgraders, premium end-users',
    agentTips: [
      'Lagoon proximity commands premium — always check plot orientation',
      'Majid Al Futtaim brand carries retail credibility (City Centre malls)',
      'Ghaf Woods (Distrikt) is the newest phase — off-plan opportunity',
    ],
    priceTier: 'mid-premium',
  },

  // ── 22. Sobha Hartland ───────────────────────────────────────────────
  {
    id: 'sobha-hartland',
    name: 'Sobha Hartland',
    shortName: 'Sobha Hartland',
    description: 'Sobha Realty\'s waterfront community within MBR City known for premium finishes. Lagoon-facing units command higher ROI. International schools nearby.',
    propertyTypes: ['apartment', 'villa', 'townhouse'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [1400, 2200],
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
      value: [10, 22],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [1100000, 5000000],
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
    metroAccess: false,
    keyDevelopers: ['Sobha Realty'],
    highlights: [
      'Waterfront within MBR City',
      'Lagoon-facing premium units',
      'Sobha quality finishes',
      'International schools nearby',
    ],
    typicalBuyers: 'Quality-conscious end-users, Indian investors (Sobha brand loyalty), families',
    agentTips: [
      'Sobha build quality is the USP — emphasise fit-and-finish vs competitors',
      'Hartland 2 is the newer expansion — more off-plan inventory available',
      'Lagoon-facing units see premium pricing — verify view before showing',
    ],
    priceTier: 'mid-premium',
  },

  // ── 23. Bluewaters Island ────────────────────────────────────────────
  {
    id: 'bluewaters-island',
    name: 'Bluewaters Island',
    shortName: 'Bluewaters',
    description: 'Meraas\' exclusive island development off JBR featuring Ain Dubai and Caesars Palace. Average PSF of AED 5,482 with low-density luxury living.',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [2800, 5500],
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
      value: [22, 38],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [3000000, 12000000],
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
    metroAccess: false,
    keyDevelopers: ['Meraas'],
    highlights: [
      'Ain Dubai observation wheel',
      'Island living off JBR',
      'Caesars Palace resort',
      'Exclusive low-density community',
    ],
    typicalBuyers: 'HNW lifestyle buyers, resort-style living seekers, trophy-home investors',
    agentTips: [
      'PSF doubled from AED 2,100 to AED 5,000+ in five years — capital growth story',
      '4-bed apartments yield 7.1% — unusually high for ultra-premium',
      'No car access for visitors — bridge-only is either a feature or dealbreaker',
    ],
    priceTier: 'ultra-premium',
  },

  // ── 24. La Mer / Jumeirah Bay ────────────────────────────────────────
  {
    id: 'la-mer-jumeirah-bay',
    name: 'La Mer / Jumeirah Bay',
    shortName: 'La Mer',
    description: 'Meraas\' ultra-premium beachfront district with Jumeirah Bay Island (home to Bvlgari Resort). New Solaya La Mer by Foster + Partners starts at AED 6,154/sqft.',
    propertyTypes: ['apartment', 'villa'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [3000, 6500],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [4.0, 5.5],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    serviceCharges: {
      value: [25, 45],
      source: RERA_SOURCE,
      sourceUrl: RERA_URL,
      effectiveDate: '2025',
    },
    avgTransactionPrice: {
      value: [5000000, 30000000],
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
    metroAccess: false,
    keyDevelopers: ['Meraas', 'Brookfield Properties'],
    highlights: [
      'Beachfront lifestyle district',
      'Foster + Partners architecture',
      'Ultra-exclusive Jumeirah Bay Island',
      'Bvlgari Resort neighbour',
    ],
    typicalBuyers: 'UHNW individuals, trophy-home buyers, celebrity clientele',
    agentTips: [
      'Jumeirah Bay Island PSF is 82% higher than Dubai Islands — true ultra-premium',
      'Solaya La Mer (Foster + Partners) has only 234 units — scarcity pitch',
      'Bvlgari Resort proximity is the lifestyle anchor — mention in every showing',
    ],
    priceTier: 'ultra-premium',
  },

  // ── 25. Emaar Beachfront ─────────────────────────────────────────────
  {
    id: 'emaar-beachfront',
    name: 'Emaar Beachfront',
    shortName: 'Emaar Beachfront',
    description: 'Emaar\'s private beachfront community at Dubai Harbour. Average PSF surged from AED 2,500 to AED 4,250 between 2021-2025 with Palm and marina views.',
    propertyTypes: ['apartment'],
    freeholdStatus: 'freehold',
    pricePerSqft: {
      value: [2500, 4300],
      source: DLD_SOURCE,
      sourceUrl: DLD_URL,
      effectiveDate: DATA_PERIOD,
    },
    rentalYield: {
      value: [5.0, 7.0],
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
      value: [1500000, 8000000],
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
    keyDevelopers: ['Emaar Properties'],
    highlights: [
      'Private beach access',
      'Dubai Harbour marina views',
      'Near Palm Jumeirah gateway',
      'Premium beachfront apartments',
    ],
    typicalBuyers: 'Beach lifestyle seekers, premium investors, short-stay rental operators',
    agentTips: [
      'PSF nearly doubled since 2021 — strong capital appreciation narrative',
      '1-bed ROI at 6.9% is high for beachfront premium — competitive vs Palm',
      'Short-stay rental potential boosts yields during peak season',
    ],
    priceTier: 'premium',
  },
]
