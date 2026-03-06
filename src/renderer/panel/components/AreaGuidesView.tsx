import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, ChevronRight, ExternalLink, ArrowLeft, Share2 } from 'lucide-react'
import { AREA_GUIDES, formatRange } from '../../../shared/area-guides'
import type { CommunityProfile, AreaDataPoint } from '../../../shared/area-guides'

interface AreaGuidesViewProps {
  onBack: () => void
}

type AreaGuidePhase = 'list' | 'detail' | 'compare'
type SortBy = 'name' | 'price' | 'yield'

// ── Helpers ──────────────────────────────────────────────────────────

/** Get the midpoint of a data point value for sorting */
function getMidpoint(dp: AreaDataPoint): number {
  if (Array.isArray(dp.value)) return (dp.value[0] + dp.value[1]) / 2
  return dp.value
}

// ── MetricBar ────────────────────────────────────────────────────────

function MetricBar({ label, value, suffix, color, max, dataPoint }: {
  label: string
  value: number | [number, number]
  suffix?: string
  color: string
  max: number
  dataPoint: AreaDataPoint
}) {
  const mid = Array.isArray(value) ? (value[0] + value[1]) / 2 : value
  const pct = Math.min((mid / max) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-[#a1a1aa]">{label}</span>
        <span className="text-[#ededee] font-medium">{formatRange(value, suffix)}</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[9px] text-[#5a5a60]">
        Source: {dataPoint.source}, {dataPoint.effectiveDate}
      </p>
    </div>
  )
}

// ── SourceAttribution ────────────────────────────────────────────────

function SourceAttribution({ dataPoint }: { dataPoint: AreaDataPoint }) {
  return (
    <p className="text-[9px] text-[#5a5a60] mt-0.5">
      Source: {dataPoint.source}, {dataPoint.effectiveDate}
    </p>
  )
}

// ── Badges ───────────────────────────────────────────────────────────

function FreeholdBadge({ status }: { status: CommunityProfile['freeholdStatus'] }) {
  if (status !== 'freehold') return null
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-[rgba(74,222,128,0.12)] text-[#4ade80]">
      Freehold
    </span>
  )
}

function PropertyTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/[0.06] text-[#a1a1aa] capitalize">
      {type}
    </span>
  )
}

function PriceTierBadge({ tier }: { tier: CommunityProfile['priceTier'] }) {
  const colors: Record<string, string> = {
    'ultra-premium': 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24]',
    premium: 'bg-[rgba(129,140,248,0.12)] text-[#818cf8]',
    'mid-premium': 'bg-[rgba(34,211,238,0.12)] text-[#22d3ee]',
    'mid-market': 'bg-[rgba(74,222,128,0.12)] text-[#4ade80]',
  }
  const label = tier.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${colors[tier]}`}>
      {label}
    </span>
  )
}

// ── AreaList ─────────────────────────────────────────────────────────

function AreaList({ areas, searchQuery, sortBy, onSearchChange, onSortChange, onSelect }: {
  areas: CommunityProfile[]
  searchQuery: string
  sortBy: SortBy
  onSearchChange: (q: string) => void
  onSortChange: (s: SortBy) => void
  onSelect: (area: CommunityProfile) => void
}) {
  const filtered = useMemo(() => {
    let list = areas.filter(a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.shortName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price') return getMidpoint(b.pricePerSqft) - getMidpoint(a.pricePerSqft)
      // yield — highest first
      return getMidpoint(b.rentalYield) - getMidpoint(a.rentalYield)
    })
    return list
  }, [areas, searchQuery, sortBy])

  const sortButtons: { key: SortBy; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price' },
    { key: 'yield', label: 'Yield' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-2">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a5a60]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search communities..."
          className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white/[0.06] border border-white/[0.07] rounded-md text-[#ededee] placeholder-[#5a5a60] outline-none focus:border-[#818cf8]/40 transition-colors"
        />
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-1 mb-3">
        <ArrowUpDown size={11} className="text-[#5a5a60] mr-1" />
        {sortButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => onSortChange(btn.key)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              sortBy === btn.key
                ? 'bg-[#818cf8]/20 text-[#818cf8]'
                : 'text-[#a1a1aa] hover:text-[#ededee] hover:bg-white/[0.04]'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <p className="text-xs text-[#5a5a60] text-center py-6">No communities match your search</p>
        ) : (
          filtered.map(area => (
            <button
              key={area.id}
              onClick={() => onSelect(area)}
              className="w-full text-left px-2 py-2.5 border-b border-white/[0.07] last:border-b-0 hover:bg-white/[0.04] transition-colors rounded group"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#ededee] leading-tight">
                  {area.name}
                </p>
                <ChevronRight size={13} className="text-[#3f3f46] group-hover:text-[#a1a1aa] transition-colors shrink-0 ml-2" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[12px] text-[#a1a1aa]">
                  AED {formatRange(area.pricePerSqft.value)}/sqft
                </span>
                <span className="text-[12px] text-[#4ade80]">
                  {formatRange(area.rentalYield.value, '%')} yield
                </span>
                <FreeholdBadge status={area.freeholdStatus} />
              </div>
              <p className="text-[9px] text-[#5a5a60] mt-1">
                Data: {area.pricePerSqft.effectiveDate}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 mt-2 border-t border-white/[0.07]">
        <p className="text-[9px] text-[#5a5a60] text-center">
          Source: DLD / DXBInteract | Data as of {AREA_GUIDES[0]?.pricePerSqft.effectiveDate ?? 'N/A'}
        </p>
      </div>
    </div>
  )
}

// ── AreaDetail ────────────────────────────────────────────────────────

function AreaDetail({ area, onBack, onCompare }: {
  area: CommunityProfile
  onBack: () => void
  onCompare: () => void
}) {
  // Max values for bar charts (across all communities for context)
  const maxPrice = Math.max(...AREA_GUIDES.map(a => {
    const v = a.pricePerSqft.value
    return Array.isArray(v) ? v[1] : v
  }))
  const maxYield = Math.max(...AREA_GUIDES.map(a => {
    const v = a.rentalYield.value
    return Array.isArray(v) ? v[1] : v
  }))
  const maxServiceCharge = Math.max(...AREA_GUIDES.map(a => {
    const v = a.serviceCharges.value
    return Array.isArray(v) ? v[1] : v
  }))

  const growthValue = Array.isArray(area.priceGrowthYoY.value) ? area.priceGrowthYoY.value[0] : area.priceGrowthYoY.value
  const growthPositive = growthValue >= 0

  const handleRefreshData = () => {
    window.electronAPI.openExternal('https://dxbinteract.com/')
  }

  const handleShareWhatsApp = () => {
    const lines = [
      `*${area.name} - Area Guide*`,
      '',
      `Price/sqft: AED ${formatRange(area.pricePerSqft.value)}`,
      `Gross Yield: ${formatRange(area.rentalYield.value, '%')}`,
      `Service Charges: AED ${formatRange(area.serviceCharges.value, '/sqft')}`,
      `Avg Transaction: AED ${formatRange(area.avgTransactionPrice.value)}`,
      `YoY Growth: ${formatRange(area.priceGrowthYoY.value, '%')}`,
      `Freehold: ${area.freeholdStatus === 'freehold' ? 'Yes' : area.freeholdStatus === 'mixed' ? 'Mixed' : 'No'}`,
      `Metro: ${area.metroAccess ? area.nearestMetro || 'Yes' : 'No'}`,
      '',
      `Data effective: ${area.pricePerSqft.effectiveDate}`,
      `Source: ${area.pricePerSqft.source}`,
      area.pricePerSqft.sourceUrl,
    ]
    const message = lines.join('\n')
    window.electronAPI.openExternal(`https://wa.me/?text=${encodeURIComponent(message)}`)
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
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[#ededee] leading-tight truncate">{area.name}</h2>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {area.propertyTypes.map(pt => <PropertyTypeBadge key={pt} type={pt} />)}
            <FreeholdBadge status={area.freeholdStatus} />
            <PriceTierBadge tier={area.priceTier} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">

        {/* Price Overview */}
        <section className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 space-y-3">
          <h3 className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Price Overview</h3>
          <MetricBar
            label="Price/sqft (AED)"
            value={area.pricePerSqft.value}
            color="#818cf8"
            max={maxPrice}
            dataPoint={area.pricePerSqft}
          />
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[#a1a1aa]">Avg Transaction</span>
            <span className="text-[13px] font-medium text-[#ededee]">AED {formatRange(area.avgTransactionPrice.value)}</span>
          </div>
          <SourceAttribution dataPoint={area.avgTransactionPrice} />
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[#a1a1aa]">YoY Growth</span>
            <span className={`text-[13px] font-medium ${growthPositive ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {growthPositive ? '+' : ''}{formatRange(area.priceGrowthYoY.value, '%')}
            </span>
          </div>
          <SourceAttribution dataPoint={area.priceGrowthYoY} />
        </section>

        {/* Rental & Yield */}
        <section className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 space-y-3">
          <h3 className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Rental & Yield</h3>
          <MetricBar
            label="Gross Yield"
            value={area.rentalYield.value}
            suffix="%"
            color="#4ade80"
            max={maxYield}
            dataPoint={area.rentalYield}
          />
        </section>

        {/* Service Charges */}
        <section className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 space-y-3">
          <h3 className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Service Charges</h3>
          <MetricBar
            label="AED/sqft"
            value={area.serviceCharges.value}
            color="#fbbf24"
            max={maxServiceCharge}
            dataPoint={area.serviceCharges}
          />
        </section>

        {/* Location & Transport */}
        <section className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 space-y-3">
          <h3 className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Location & Transport</h3>
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[#a1a1aa]">Metro Access</span>
            <span className={`text-[13px] font-medium ${area.metroAccess ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {area.metroAccess ? `Yes - ${area.nearestMetro}` : 'No'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {area.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.06] text-[#d4d4d8]"
              >
                {h}
              </span>
            ))}
          </div>
        </section>

        {/* Key Developers */}
        <section className="bg-[#161617] border border-white/[0.07] rounded-lg p-3 space-y-2">
          <h3 className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Key Developers</h3>
          <div className="space-y-1">
            {area.keyDevelopers.map((dev, i) => (
              <p key={i} className="text-[13px] text-[#ededee]">{dev}</p>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-2 pb-2">
          <button
            onClick={onCompare}
            className="w-full py-2 text-[12px] font-medium text-[#818cf8] bg-[rgba(129,140,248,0.1)] border border-[rgba(129,140,248,0.2)] rounded-lg hover:bg-[rgba(129,140,248,0.18)] transition-colors"
          >
            Compare with...
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2 text-[12px] font-medium text-white rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#25D366' }}
          >
            <Share2 size={12} />
            Share via WhatsApp
          </button>

          <button
            onClick={handleRefreshData}
            className="w-full py-2 text-[12px] font-medium text-[#a1a1aa] bg-white/[0.04] border border-white/[0.07] rounded-lg hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink size={11} />
            Refresh Data - current as of {area.pricePerSqft.effectiveDate}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export default function AreaGuidesView({ onBack }: AreaGuidesViewProps) {
  const [phase, setPhase] = useState<AreaGuidePhase>('list')
  const [selectedArea, setSelectedArea] = useState<CommunityProfile | null>(null)
  const [compareAreas, setCompareAreas] = useState<CommunityProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('name')

  const handleSelectArea = (area: CommunityProfile) => {
    setSelectedArea(area)
    setPhase('detail')
  }

  const handleBackToList = () => {
    setSelectedArea(null)
    setCompareAreas([])
    setPhase('list')
  }

  const handleCompare = () => {
    // Compare UI will be wired in Plan 02
    setPhase('compare')
  }

  if (phase === 'detail' && selectedArea) {
    return (
      <AreaDetail
        area={selectedArea}
        onBack={handleBackToList}
        onCompare={handleCompare}
      />
    )
  }

  if (phase === 'compare') {
    // Placeholder for Plan 02 comparison feature
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-[#a1a1aa]">Comparison view coming in the next update</p>
        <button
          onClick={handleBackToList}
          className="text-[12px] text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
        >
          Back to list
        </button>
      </div>
    )
  }

  return (
    <AreaList
      areas={AREA_GUIDES}
      searchQuery={searchQuery}
      sortBy={sortBy}
      onSearchChange={setSearchQuery}
      onSortChange={setSortBy}
      onSelect={handleSelectArea}
    />
  )
}
