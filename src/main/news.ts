import Parser from 'rss-parser'
import { NewsItem } from '../shared/types'

const FEEDS = [
  { url: 'https://propertynews.ae/feed/', source: 'PropertyNews.ae' },
  { url: 'http://www.arabianbusiness.com/feed', source: 'Arabian Business' },
  { url: 'https://www.zawya.com/rss/real-estate', source: 'Zawya' }
]

// Custom User-Agent to improve feed compatibility and avoid 403 responses
const parser = new Parser({ headers: { 'User-Agent': 'AgentKit/1.0' } })

let cachedItems: NewsItem[] = []
let lastFetched: number = 0

/**
 * Fetch news from all configured RSS feeds.
 * Partial results are OK — failure of one feed does not break others.
 * Top 10 items per feed are taken, then sorted by pubDate descending.
 */
export async function fetchNews(): Promise<NewsItem[]> {
  const results: NewsItem[] = []

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 10)) {
        results.push({
          title: item.title ?? '',
          link: item.link ?? '',
          pubDate: item.pubDate ?? '',
          source: feed.source
        })
      }
    } catch (err) {
      console.error(`[news] Failed to fetch ${feed.source}:`, err)
      // Continue with other feeds — partial results are acceptable
    }
  }

  cachedItems = results.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime()
    const dateB = new Date(b.pubDate).getTime()
    // Handle invalid dates by pushing them to the end
    if (isNaN(dateA)) return 1
    if (isNaN(dateB)) return -1
    return dateB - dateA
  })

  lastFetched = Date.now()
  return cachedItems
}

/**
 * Return cached news items (may be empty if fetchNews has not been called yet).
 */
export function getCachedNews(): NewsItem[] {
  return cachedItems
}

/**
 * Return the epoch timestamp of the last successful fetch (0 if never fetched).
 */
export function getLastFetched(): number {
  return lastFetched
}
