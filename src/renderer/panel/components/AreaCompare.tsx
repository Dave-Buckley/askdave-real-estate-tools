import { useState, useMemo } from 'react'
import { ArrowLeft, Check, Search } from 'lucide-react'
import { AREA_GUIDES, formatRange } from '../../../shared/area-guides'
import type { CommunityProfile, AreaDataPoint } from '../../../shared/area-guides'

// ── Types ─────────────────────────────────────────────────────────────

type ComparePhase = 'picking' | 'table'

interface AreaCompareProps {
  currentArea: CommunityProfile
  onBack: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Get midpoint of a data point value for numeric comparison */
function getMidpoint(dp: AreaDataPoint): number {
  if (Array.isArray(dp.value)) return (dp.value[0] + dp.value[1]) / 2
  return dp.value
}

/** Price tier adjacency for expanding suggestions */
const TIER_ORDER: CommunityProfile['priceTier'][] = [
  'mid-market', 'mid-premium', 'premium', 'ultra-premium',
]

function getAdjacentTiers(tier: CommunityProfile['priceTier']): CommunityProfile['priceTier'][] {
  const idx = TIER_ORDER.indexOf(tier)
  const result: CommunityProfile['priceTier'][] = []
  if (idx > 0) result.push(TIER_ORDER[idx - 1])
  if (idx < TIER_ORDER.length - 1) result.push(TIER_ORDER[idx + 1])
  return result
}

function findSuggestedAreas(current: CommunityProfile): CommunityProfile[] {
  const others = AREA_GUIDES.filter(a => a.id !== current.id)

  // Strict match: same priceTier AND at least one overlapping propertyType
  const strict = others.filter(
    a =>
      a.priceTier === current.priceTier &&
      a.propertyTypes.some(pt => current.propertyTypes.includes(pt)),
  )

  if (strict.length >= 3) return strict.slice(0, 5)

  // Expand to adjacent tiers if fewer than 3 strict matches
  const adjacentTiers = getAdjacentTiers(current.priceTier)
  const expanded = others.filter(
    a =>
      (a.priceTier === current.priceTier || adjacentTiers.includes(a.priceTier)) &&
      a.propertyTypes.some(pt => current.propertyTypes.includes(pt)),
  )

  return expanded.slice(0, 5)
}

// ── Metric Row Types ──────────────────────────────────────────────────

interface MetricRowConfig {
  label: string
  getValue: (area: CommunityProfile) => string
  getNumeric: (area: CommunityProfile) => number | null
  highlight: 'higher-better' | 'lower-better' | 'none'
  getSource: (area: CommunityProfile) => AreaDataPoint
}

const METRIC_ROWS: MetricRowConfig[] = [
  {
    label: 'Price/sqft (AED)',
    getValue: (a) => `AED ${formatRange(a.pricePerSqft.value)}`,
    getNumeric: (a) => getMidpoint(a.pricePerSqft),
    highlight: 'none', // depends on client budget
    getSource: (a) => a.pricePerSqft,
  },
  {
    label: 'Rental Yield',
    getValue: (a) => `${formatRange(a.rentalYield.value, '%')}`,
    getNumeric: (a) => getMidpoint(a.rentalYield),
    highlight: 'higher-better',
    getSource: (a) => a.rentalYield,
  },
  {
    label: 'Service Charges',
    getValue: (a) => `AED ${formatRange(a.serviceCharges.value)}/sqft`,
    getNumeric: (a) => getMidpoint(a.serviceCharges),
    highlight: 'lower-better',
    getSource: (a) => a.serviceCharges,
  },
  {
    label: 'Avg Transaction',
    getValue: (a) => `AED ${formatRange(a.avgTransactionPrice.value)}`,
    getNumeric: (a) => getMidpoint(a.avgTransactionPrice),
    highlight: 'none',
    getSource: (a) => a.avgTransactionPrice,
  },
  {
    label: 'Price Growth YoY',
    getValue: (a) => `${formatRange(a.priceGrowthYoY.value, '%')}`,
    getNumeric: (a) => getMidpoint(a.priceGrowthYoY),
    highlight: 'higher-better',
    getSource: (a) => a.priceGrowthYoY,
  },
  {
    label: 'Freehold',
    getValue: (a) =>
      a.freeholdStatus === 'freehold' ? 'Yes' : a.freeholdStatus === 'mixed' ? 'Mixed' : 'No',
    getNumeric: () => null,
    highlight: 'none',
    getSource: (a) => a.pricePerSqft, // use general source
  },
  {
    label: 'Metro Access',
    getValue: (a) => (a.metroAccess ? `Yes - ${a.nearestMetro || 'Available'}` : 'No'),
    getNumeric: () => null,
    highlight: 'none',
    getSource: (a) => a.pricePerSqft,
  },
  {
    label: 'Property Types',
    getValue: (a) => a.propertyTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', '),
    getNumeric: () => null,
    highlight: 'none',
    getSource: (a) => a.pricePerSqft,
  },
]

// ── Area Picker ───────────────────────────────────────────────────────

function AreaPicker({
  currentArea,
  selected,
  onToggle,
  onCompare,
  onBack,
}: {
  currentArea: CommunityProfile
  selected: CommunityProfile[]
  onToggle: (area: CommunityProfile) => void
  onCompare: () => void
  onBack: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const suggested = useMemo(() => findSuggestedAreas(currentArea), [currentArea])
  const allOthers = useMemo(
    () => AREA_GUIDES.filter(a => a.id !== currentArea.id),
    [currentArea],
  )

  const filteredAll = useMemo(() => {
    if (!searchQuery.trim()) return allOthers
    const q = searchQuery.toLowerCase()
    return allOthers.filter(
      a => a.name.toLowerCase().includes(q) || a.shortName.toLowerCase().includes(q),
    )
  }, [allOthers, searchQuery])

  const isSelected = (area: CommunityProfile) => selected.some(s => s.id === area.id)
  const canAddMore = selected.length < 2 // current area + up to 2 more = 3 total

  const renderAreaRow = (area: CommunityProfile) => {
    const checked = isSelected(area)
    const disabled = !checked && !canAddMore

    return (
      <button
        key={area.id}
        onClick={() => !disabled && onToggle(area)}
        disabled={disabled}
        className={`w-full text-left px-2.5 py-2 rounded-md transition-colors flex items-center gap-2 ${
          checked
            ? 'bg-[rgba(129,140,248,0.1)] border border-[rgba(129,140,248,0.2)]'
            : disabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            checked
              ? 'bg-[#818cf8] border-[#818cf8]'
              : 'border-white/[0.15] bg-transparent'
          }`}
        >
          {checked && <Check size={10} className="text-white" strokeWidth={2.5} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#ededee] truncate">{area.name}</p>
          <p className="text-[11px] text-[#a1a1aa]">
            AED {formatRange(area.pricePerSqft.value)}/sqft
            {' | '}
            {formatRange(area.rentalYield.value, '%')} yield
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] rounded transition-colors shrink-0"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-[#ededee]">Compare with {currentArea.shortName}</h2>
          <p className="text-[11px] text-[#a1a1aa]">{selected.length} of 2 additional areas selected</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5a60]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search areas..."
          className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white/[0.06] border border-white/[0.07] rounded-md text-[#ededee] placeholder-[#5a5a60] outline-none focus:border-[#818cf8]/40 transition-colors"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        {/* Suggested similar areas */}
        {!searchQuery.trim() && suggested.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
              Suggested similar areas
            </h3>
            <div className="space-y-1">{suggested.map(renderAreaRow)}</div>
          </div>
        )}

        {/* All areas */}
        <div>
          <h3 className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
            {searchQuery.trim() ? 'Search results' : 'All areas'}
          </h3>
          {filteredAll.length === 0 ? (
            <p className="text-xs text-[#5a5a60] text-center py-4">No areas match your search</p>
          ) : (
            <div className="space-y-1">{filteredAll.map(renderAreaRow)}</div>
          )}
        </div>
      </div>

      {/* Compare button */}
      <div className="pt-3 mt-2 border-t border-white/[0.07]">
        <button
          onClick={onCompare}
          disabled={selected.length === 0}
          className={`w-full py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
            selected.length > 0
              ? 'bg-[#818cf8] text-white hover:bg-[#6366f1]'
              : 'bg-white/[0.06] text-[#5a5a60] cursor-not-allowed'
          }`}
        >
          Compare {selected.length + 1} areas
        </button>
      </div>
    </div>
  )
}

// ── Comparison Table ──────────────────────────────────────────────────

function ComparisonTable({
  areas,
  onBack,
}: {
  areas: CommunityProfile[]
  onBack: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.08] rounded transition-colors shrink-0"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <h2 className="text-sm font-semibold text-[#ededee]">
          Comparing {areas.length} areas
        </h2>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse">
            {/* Column headers — community names */}
            <thead>
              <tr>
                <th className="text-left text-[10px] font-semibold text-[#5a5a60] uppercase tracking-wider py-2 pr-2 w-[90px] align-bottom">
                  Metric
                </th>
                {areas.map(area => (
                  <th
                    key={area.id}
                    className="text-left text-[11px] font-semibold text-[#ededee] py-2 px-1.5 align-bottom"
                  >
                    {area.shortName}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {METRIC_ROWS.map((metric, idx) => {
                // Compute highlight indexes
                let bestIdx = -1
                let worstIdx = -1

                if (metric.highlight !== 'none') {
                  const numerics = areas.map(a => metric.getNumeric(a))
                  const validNumerics = numerics.filter((n): n is number => n !== null)

                  if (validNumerics.length >= 2) {
                    const maxVal = Math.max(...validNumerics)
                    const minVal = Math.min(...validNumerics)

                    if (maxVal !== minVal) {
                      if (metric.highlight === 'higher-better') {
                        bestIdx = numerics.indexOf(maxVal)
                        worstIdx = numerics.indexOf(minVal)
                      } else {
                        // lower-better (service charges)
                        bestIdx = numerics.indexOf(minVal)
                        worstIdx = numerics.indexOf(maxVal)
                      }
                    }
                  }
                }

                return (
                  <tr
                    key={metric.label}
                    className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}
                  >
                    <td className="text-[10px] font-medium text-[#a1a1aa] py-2 pr-2 align-top whitespace-nowrap">
                      {metric.label}
                    </td>
                    {areas.map((area, areaIdx) => {
                      const isBest = areaIdx === bestIdx
                      const isWorst = areaIdx === worstIdx
                      const source = metric.getSource(area)
                      const isNumericRow = metric.getNumeric(area) !== null

                      return (
                        <td key={area.id} className="py-2 px-1.5 align-top">
                          <span
                            className={`text-[12px] font-medium inline-block ${
                              isBest
                                ? 'text-[#4ade80] bg-[rgba(74,222,128,0.08)] px-1 py-0.5 rounded'
                                : isWorst
                                  ? 'text-[#f87171] bg-[rgba(248,113,113,0.08)] px-1 py-0.5 rounded'
                                  : 'text-[#ededee]'
                            }`}
                          >
                            {metric.getValue(area)}
                          </span>
                          {isNumericRow && (
                            <p className="text-[8px] text-[#5a5a60] mt-0.5 leading-tight">
                              {source.source}, {source.effectiveDate}
                            </p>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer source */}
      <div className="pt-2 mt-2 border-t border-white/[0.07]">
        <p className="text-[8px] text-[#5a5a60] text-center">
          All data sourced from DLD / DXBInteract. Effective dates shown per metric.
        </p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────

export default function AreaCompare({ currentArea, onBack }: AreaCompareProps) {
  const [comparePhase, setComparePhase] = useState<ComparePhase>('picking')
  const [selected, setSelected] = useState<CommunityProfile[]>([])

  const handleToggle = (area: CommunityProfile) => {
    setSelected(prev => {
      const exists = prev.some(s => s.id === area.id)
      if (exists) return prev.filter(s => s.id !== area.id)
      if (prev.length >= 2) return prev // max 2 additional
      return [...prev, area]
    })
  }

  const handleCompare = () => {
    setComparePhase('table')
  }

  const handleBackToPicker = () => {
    setComparePhase('picking')
  }

  if (comparePhase === 'table') {
    return (
      <ComparisonTable
        areas={[currentArea, ...selected]}
        onBack={handleBackToPicker}
      />
    )
  }

  return (
    <AreaPicker
      currentArea={currentArea}
      selected={selected}
      onToggle={handleToggle}
      onCompare={handleCompare}
      onBack={onBack}
    />
  )
}
