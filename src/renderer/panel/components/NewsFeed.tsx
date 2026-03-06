import { useState, useEffect } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { NewsItem } from '../../../shared/types'

interface NewsFeedProps {
  onBack: () => void
}

/**
 * Format a pubDate string as a relative time string.
 * Returns "Xh ago" if within the last 24 hours, otherwise "Mon DD".
 */
function formatDate(pubDate: string): string {
  if (!pubDate) return ''
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 24) {
    const hours = Math.floor(diffHours)
    if (hours < 1) return 'Just now'
    return `${hours}h ago`
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format lastFetched epoch as "X min ago" for the subtitle.
 */
function formatLastFetched(lastFetched: number | null): string {
  if (!lastFetched) return ''
  const diffMs = Date.now() - lastFetched
  const diffMin = Math.floor(diffMs / (1000 * 60))
  if (diffMin < 1) return 'Updated just now'
  if (diffMin === 1) return 'Updated 1 min ago'
  if (diffMin < 60) return `Updated ${diffMin} min ago`
  const hours = Math.floor(diffMin / 60)
  return `Updated ${hours}h ago`
}

/** Source badge colors — semi-transparent rgba on dark */
const SOURCE_COLORS: Record<string, string> = {
  'PropertyNews.ae': 'bg-[rgba(99,102,241,0.14)] text-[#818cf8]',
  'Property24.ae': 'bg-[rgba(34,197,94,0.12)] text-[#4ade80]'
}

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? 'bg-white/5 text-[#d4d4d8]'
}

export default function NewsFeed({ onBack }: NewsFeedProps) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetched, setLastFetched] = useState<number | null>(null)

  useEffect(() => {
    window.electronAPI.getNews()
      .then((result) => {
        setItems(result.items)
        setLastFetched(result.lastFetched)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleArticleClick = (link: string) => {
    if (link) {
      window.electronAPI.openExternal(link)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Last updated subtitle */}
      {lastFetched ? (
        <p className="text-[13px] text-[#a1a1aa] mb-2 text-right">
          {formatLastFetched(lastFetched)}
        </p>
      ) : null}

      {/* Article list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[#a1a1aa]">Loading...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-sm text-[#a1a1aa]">No news available</p>
            <p className="text-[13px] text-[#a1a1aa]">Check your internet connection</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="space-y-0">
              {items.map((item, index) => (
                <button
                  key={`${item.link}-${index}`}
                  onClick={() => handleArticleClick(item.link)}
                  className="w-full text-left px-0 py-2.5 border-b border-white/[0.07] last:border-b-0 hover:bg-white/[0.04] transition-colors rounded group"
                >
                  {/* Title */}
                  <p className="text-sm font-medium text-[#ededee] leading-tight line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </p>

                  {/* Source + Date row */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] px-1.5 py-0.5 rounded-full font-medium ${getSourceColor(item.source)}`}>
                      {item.source}
                    </span>
                    <span className="text-[13px] text-[#a1a1aa]">
                      {formatDate(item.pubDate)}
                    </span>
                    <ExternalLink size={14} strokeWidth={1.5} className="text-[#a1a1aa] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>

            {/* Attribution */}
            <p className="text-[10px] text-[#5a5a60] text-center mt-3 px-2 leading-relaxed">
              Headlines sourced from public RSS feeds. Tap to read at original source. All content remains the property of its respective publishers.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
