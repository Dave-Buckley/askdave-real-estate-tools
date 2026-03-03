import { useState, useEffect } from 'react'
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

/** Source badge colors — cycle through a small set */
const SOURCE_COLORS: Record<string, string> = {
  'PropertyNews.ae': 'bg-blue-100 text-blue-700',
  'Arabian Business': 'bg-orange-100 text-orange-700',
  'Zawya': 'bg-green-100 text-green-700'
}

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? 'bg-gray-100 text-gray-600'
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
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>&larr;</span>
          <span>Back</span>
        </button>
        <span className="text-xs font-semibold text-gray-700">News</span>
      </div>

      {/* Last updated subtitle */}
      {lastFetched ? (
        <p className="text-[10px] text-gray-400 mb-2 text-right">
          {formatLastFetched(lastFetched)}
        </p>
      ) : null}

      {/* Article list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-sm text-gray-400">No news available</p>
            <p className="text-[10px] text-gray-300">Check your internet connection</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-0">
            {items.map((item, index) => (
              <button
                key={`${item.link}-${index}`}
                onClick={() => handleArticleClick(item.link)}
                className="w-full text-left px-0 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded"
              >
                {/* Title */}
                <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2 mb-1">
                  {item.title}
                </p>

                {/* Source + Date row */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getSourceColor(item.source)}`}>
                    {item.source}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatDate(item.pubDate)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
