import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, RotateCcw, Shuffle, Trophy, Flame, Zap } from 'lucide-react'
import type { FlashCard, FlashcardDeck, CardProgress } from '../../../shared/types'
import { FLASHCARD_DECKS } from '../../../shared/flashcards'

interface FlashcardViewProps {
  onBack: () => void
}

type StudyPhase = 'deck-select' | 'studying'

/** Deck theme config: emoji, gradient colors, accent */
const DECK_THEMES: Record<string, { icon: string; gradient: string; accent: string; accentRgb: string }> = {
  rera:      { icon: '\u{1F3DB}',  gradient: 'from-blue-500/20 to-cyan-500/10',     accent: '#38bdf8', accentRgb: '56,189,248' },
  law:       { icon: '\u{2696}',   gradient: 'from-amber-500/20 to-orange-500/10',   accent: '#f59e0b', accentRgb: '245,158,11' },
  mort:      { icon: '\u{1F3E6}',  gradient: 'from-emerald-500/20 to-teal-500/10',   accent: '#34d399', accentRgb: '52,211,153' },
  sales:     { icon: '\u{1F4DD}',  gradient: 'from-violet-500/20 to-purple-500/10',  accent: '#a78bfa', accentRgb: '167,139,250' },
  rent:      { icon: '\u{1F3E0}',  gradient: 'from-rose-500/20 to-pink-500/10',      accent: '#fb7185', accentRgb: '251,113,133' },
  skill:     { icon: '\u{1F3AF}',  gradient: 'from-indigo-500/20 to-blue-500/10',    accent: '#818cf8', accentRgb: '129,140,248' },
  market:    { icon: '\u{1F4CA}',  gradient: 'from-cyan-500/20 to-sky-500/10',       accent: '#22d3ee', accentRgb: '34,211,238' },
  mktg:      { icon: '\u{1F4F8}',  gradient: 'from-fuchsia-500/20 to-pink-500/10',   accent: '#e879f9', accentRgb: '232,121,249' },
  objection: { icon: '\u{1F6E1}',  gradient: 'from-orange-500/20 to-amber-500/10',   accent: '#fb923c', accentRgb: '251,146,60' },
  dubai:     { icon: '\u{1F30D}',  gradient: 'from-yellow-500/20 to-amber-500/10',   accent: '#fbbf24', accentRgb: '251,191,36' },
}

const DEFAULT_THEME = { icon: '\u{1F4DA}', gradient: 'from-slate-500/20 to-gray-500/10', accent: '#94a3b8', accentRgb: '148,163,184' }

function getTheme(deckId: string) {
  return DECK_THEMES[deckId] || DEFAULT_THEME
}

/** Pick next card using weighted random: red=3x, yellow=2x, green=1x, unseen=2x */
function pickNextCard(cards: FlashCard[], progress: Record<string, CardProgress>, lastCardId?: string): FlashCard {
  const weights = cards.map(card => {
    const p = progress[card.id]
    if (!p) return 2 // unseen
    if (p.confidence === 1) return 3
    if (p.confidence === 2) return 2
    return 1 // green
  })
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  // Weighted random pick (retry if same as last card and deck has >1 card)
  for (let attempt = 0; attempt < 10; attempt++) {
    let rand = Math.random() * totalWeight
    for (let i = 0; i < cards.length; i++) {
      rand -= weights[i]
      if (rand <= 0) {
        if (cards[i].id !== lastCardId || cards.length === 1) return cards[i]
        break
      }
    }
  }
  // fallback
  return cards[Math.floor(Math.random() * cards.length)]
}

function DeckCard({ deck, progress, onClick }: {
  deck: FlashcardDeck
  progress: Record<string, CardProgress>
  onClick: () => void
}) {
  const theme = getTheme(deck.id)

  const stats = useMemo(() => {
    let seen = 0, green = 0, yellow = 0, red = 0
    deck.cards.forEach(card => {
      const p = progress[card.id]
      if (p) {
        seen++
        if (p.confidence === 3) green++
        else if (p.confidence === 2) yellow++
        else red++
      }
    })
    const total = deck.cards.length
    const greenPct = total > 0 ? (green / total) * 100 : 0
    const yellowPct = total > 0 ? (yellow / total) * 100 : 0
    const redPct = total > 0 ? (red / total) * 100 : 0
    const masteryPct = total > 0 ? Math.round(((green + yellow * 0.5) / total) * 100) : 0
    return { seen, green, yellow, red, total, greenPct, yellowPct, redPct, masteryPct }
  }, [deck, progress])

  const isMastered = stats.greenPct >= 80

  return (
    <button
      onClick={onClick}
      className={`relative text-left p-4 bg-gradient-to-br ${theme.gradient} bg-[#1f1f21] border border-white/[0.07] rounded-xl hover:border-[rgba(${theme.accentRgb},0.4)] transition-all group overflow-hidden`}
      style={{ borderColor: `rgba(${theme.accentRgb}, 0.1)` }}
    >
      {/* Subtle glow effect */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-[0.06] rounded-full blur-2xl pointer-events-none"
        style={{ background: theme.accent }}
      />

      <div className="flex items-start gap-3">
        {/* Deck icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `rgba(${theme.accentRgb}, 0.12)` }}
        >
          {theme.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[#ededee] group-hover:text-white leading-tight truncate">{deck.name}</h3>
            {isMastered && <Trophy size={12} className="text-[#fbbf24] shrink-0" />}
          </div>
          <p className="text-[11px] text-[#71717a] mt-0.5 leading-relaxed line-clamp-1">{deck.description}</p>
        </div>

        {/* Card count badge */}
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `rgba(${theme.accentRgb}, 0.12)`, color: theme.accent }}
        >
          {deck.cardCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full flex">
          <div className="bg-[#4ade80] transition-all duration-500" style={{ width: `${stats.greenPct}%` }} />
          <div className="bg-[#fbbf24] transition-all duration-500" style={{ width: `${stats.yellowPct}%` }} />
          <div className="bg-[#f87171] transition-all duration-500" style={{ width: `${stats.redPct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-[#52525b]">{stats.seen} / {stats.total} studied</span>
        {stats.masteryPct > 0 && (
          <span className="text-[10px] font-medium" style={{ color: theme.accent }}>
            {stats.masteryPct}% mastery
          </span>
        )}
      </div>
    </button>
  )
}

function StudyCard({ card, onRate, cardIndex, totalCards, sessionStats, deckId }: {
  card: FlashCard
  onRate: (confidence: 1 | 2 | 3) => void
  cardIndex: number
  totalCards: number
  sessionStats: { studied: number; correct: number; streak: number }
  deckId: string
}) {
  const [revealed, setRevealed] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const theme = getTheme(deckId)

  // Reset state when card changes + trigger slide-in animation
  useEffect(() => {
    setRevealed(false)
    setSelectedOption(null)
    setShowRating(false)
    setAnimateIn(false)
    requestAnimationFrame(() => setAnimateIn(true))
  }, [card.id])

  const handleFlip = useCallback(() => {
    if (card.type === 'flashcard' && !revealed) {
      setRevealed(true)
      setShowRating(true)
    }
  }, [card.type, revealed])

  const handleOptionSelect = useCallback((option: string) => {
    if (selectedOption) return // already selected
    setSelectedOption(option)
    setShowRating(true)
  }, [selectedOption])

  const isCorrect = selectedOption === card.answer
  const progressPct = totalCards > 0 ? ((cardIndex + 1) / totalCards) * 100 : 0

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${animateIn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
      {/* Session stats bar */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] text-[#52525b]">
          Card {cardIndex + 1} <span className="text-[#3f3f46]">of</span> {totalCards}
        </span>
        <div className="flex items-center gap-2">
          {sessionStats.streak >= 3 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#fb923c]">
              <Flame size={11} className="text-[#fb923c]" />
              {sessionStats.streak}
            </span>
          )}
          <span className="text-[11px] text-[#52525b]">
            {sessionStats.studied} studied
            {sessionStats.studied > 0 && (
              <> · <span className={sessionStats.correct / sessionStats.studied >= 0.7 ? 'text-[#4ade80]' : 'text-[#fbbf24]'}>
                {Math.round((sessionStats.correct / sessionStats.studied) * 100)}%
              </span></>
            )}
          </span>
        </div>
      </div>

      {/* Progress bar with accent color */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${theme.accent}, rgba(${theme.accentRgb}, 0.6))`
          }}
        />
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Question card */}
        <div
          className={`rounded-xl border p-5 flex-1 flex flex-col relative overflow-hidden ${
            card.type === 'flashcard' && !revealed
              ? 'cursor-pointer active:scale-[0.99]'
              : ''
          } transition-all duration-200`}
          style={{
            background: revealed || selectedOption
              ? `linear-gradient(135deg, rgba(${theme.accentRgb}, 0.04), #1a1a1c)`
              : `linear-gradient(135deg, rgba(${theme.accentRgb}, 0.06), #1f1f21)`,
            borderColor: revealed || selectedOption
              ? `rgba(${theme.accentRgb}, 0.15)`
              : `rgba(${theme.accentRgb}, 0.08)`
          }}
          onClick={handleFlip}
        >
          {/* Corner accent glow */}
          <div
            className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-[0.08]"
            style={{ background: theme.accent }}
          />

          {/* Card type badge */}
          <div className="flex items-center gap-1.5 mb-3">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${theme.accentRgb}, 0.12)`, color: theme.accent }}
            >
              {card.type === 'multiple-choice' ? 'Multiple Choice' : 'Flashcard'}
            </span>
          </div>

          {/* Question text */}
          <div className={`${revealed || selectedOption ? '' : 'flex-1 flex items-center justify-center'}`}>
            <p className={`text-[#ededee] leading-relaxed ${
              revealed || selectedOption ? 'text-sm mb-4' : 'text-[15px] text-center font-medium'
            }`}>
              {card.question}
            </p>
          </div>

          {/* Flashcard: tap to reveal hint */}
          {card.type === 'flashcard' && !revealed && (
            <div className="text-center mt-3">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full"
                style={{ background: `rgba(${theme.accentRgb}, 0.08)`, color: `rgba(${theme.accentRgb}, 0.7)` }}
              >
                <Zap size={10} /> Tap to reveal
              </span>
            </div>
          )}

          {/* Flashcard: revealed answer */}
          {card.type === 'flashcard' && revealed && (
            <div
              className="pt-4 mt-auto"
              style={{ borderTop: `1px solid rgba(${theme.accentRgb}, 0.1)` }}
            >
              <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{card.answer}</p>
            </div>
          )}

          {/* Multiple choice: options */}
          {card.type === 'multiple-choice' && card.options && (
            <div className="mt-auto space-y-2">
              {card.options.map((option, i) => {
                let bg = `rgba(${theme.accentRgb}, 0.04)`
                let border = `rgba(${theme.accentRgb}, 0.08)`
                let text = 'text-[#d4d4d8]'
                let letterColor = `rgba(${theme.accentRgb}, 0.5)`
                if (selectedOption) {
                  if (option === card.answer) {
                    bg = 'rgba(34,197,94,0.12)'
                    border = 'rgba(34,197,94,0.3)'
                    text = 'text-[#4ade80]'
                    letterColor = '#4ade80'
                  } else if (option === selectedOption) {
                    bg = 'rgba(239,68,68,0.12)'
                    border = 'rgba(239,68,68,0.3)'
                    text = 'text-[#f87171]'
                    letterColor = '#f87171'
                  } else {
                    bg = 'rgba(255,255,255,0.02)'
                    border = 'rgba(255,255,255,0.04)'
                    text = 'text-[#52525b]'
                    letterColor = '#3f3f46'
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); handleOptionSelect(option) }}
                    disabled={!!selectedOption}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg border ${text} transition-all duration-200 ${
                      !selectedOption ? 'cursor-pointer hover:brightness-125' : 'cursor-default'
                    }`}
                    style={{ background: bg, borderColor: border }}
                  >
                    <span className="font-semibold mr-2" style={{ color: letterColor }}>{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Confidence rating buttons */}
        {showRating && (
          <div className="mt-4 space-y-2">
            {card.type === 'multiple-choice' && selectedOption && (
              <p className="text-[11px] text-center text-[#71717a] mb-1">
                {isCorrect
                  ? <span className="text-[#4ade80] font-medium">Correct!</span>
                  : <><span className="text-[#f87171]">Incorrect</span> — {card.answer}</>
                }
                {' '}<span className="text-[#3f3f46]">|</span> How well did you know this?
              </p>
            )}
            {card.type === 'flashcard' && (
              <p className="text-[11px] text-center text-[#71717a] mb-1">How well did you know this?</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onRate(1)}
                className="py-2.5 rounded-lg text-xs font-semibold bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] transition-colors"
              >
                Again
              </button>
              <button
                onClick={() => onRate(2)}
                className="py-2.5 rounded-lg text-xs font-semibold bg-[rgba(245,158,11,0.12)] text-[#fbbf24] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
              >
                Good
              </button>
              <button
                onClick={() => onRate(3)}
                className="py-2.5 rounded-lg text-xs font-semibold bg-[rgba(34,197,94,0.12)] text-[#4ade80] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.2)] transition-colors"
              >
                Easy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FlashcardView({ onBack }: FlashcardViewProps): React.JSX.Element {
  const [phase, setPhase] = useState<StudyPhase>('deck-select')
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null)
  const [progress, setProgress] = useState<Record<string, CardProgress>>({})
  const [currentCard, setCurrentCard] = useState<FlashCard | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0, streak: 0 })

  // Load progress on mount
  useEffect(() => {
    window.electronAPI.getFlashcardProgress().then(setProgress)
  }, [])

  // Overall stats for header
  const overallStats = useMemo(() => {
    const totalCards = FLASHCARD_DECKS.reduce((sum, d) => sum + d.cardCount, 0)
    let mastered = 0
    FLASHCARD_DECKS.forEach(deck => {
      deck.cards.forEach(card => {
        const p = progress[card.id]
        if (p && p.confidence === 3) mastered++
      })
    })
    return { totalCards, mastered, pct: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0 }
  }, [progress])

  const handleSelectDeck = useCallback((deck: FlashcardDeck) => {
    setActiveDeck(deck)
    setPhase('studying')
    setCardIndex(0)
    setSessionStats({ studied: 0, correct: 0, streak: 0 })
    const first = pickNextCard(deck.cards, progress)
    setCurrentCard(first)
  }, [progress])

  const handleBackToDecks = useCallback(() => {
    setPhase('deck-select')
    setActiveDeck(null)
    setCurrentCard(null)
  }, [])

  const handleRate = useCallback(async (confidence: 1 | 2 | 3) => {
    if (!currentCard || !activeDeck) return

    const existing = progress[currentCard.id]
    const updated: CardProgress = {
      confidence,
      timesSeen: (existing?.timesSeen ?? 0) + 1,
      lastSeen: new Date().toISOString()
    }

    // Save progress
    const newProgress = await window.electronAPI.saveFlashcardProgress(currentCard.id, updated)
    setProgress(newProgress)

    // Update session stats with streak tracking
    setSessionStats(prev => ({
      studied: prev.studied + 1,
      correct: prev.correct + (confidence >= 2 ? 1 : 0),
      streak: confidence >= 2 ? prev.streak + 1 : 0
    }))

    // Pick next card
    setCardIndex(prev => prev + 1)
    const next = pickNextCard(activeDeck.cards, { ...progress, [currentCard.id]: updated }, currentCard.id)
    setCurrentCard(next)
  }, [currentCard, activeDeck, progress])

  const handleResetDeck = useCallback(async () => {
    if (!activeDeck) return
    // Reset progress for all cards in this deck
    const newProgress = { ...progress }
    activeDeck.cards.forEach(card => {
      delete newProgress[card.id]
    })
    // Save each deletion
    for (const card of activeDeck.cards) {
      await window.electronAPI.saveFlashcardProgress(card.id, { confidence: 1, timesSeen: 0, lastSeen: '' })
    }
    setProgress(newProgress)
    setSessionStats({ studied: 0, correct: 0, streak: 0 })
    setCardIndex(0)
    const first = pickNextCard(activeDeck.cards, {})
    setCurrentCard(first)
  }, [activeDeck, progress])

  const handleShuffle = useCallback(() => {
    if (!activeDeck) return
    const next = pickNextCard(activeDeck.cards, progress, currentCard?.id)
    setCurrentCard(next)
  }, [activeDeck, progress, currentCard])

  // ── Deck selection screen ──
  if (phase === 'deck-select') {
    return (
      <div className="flex flex-col h-full">
        {/* Header with overall progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#ededee]">Education</h2>
            <span className="text-[10px] text-[#52525b]">
              {FLASHCARD_DECKS.length} decks
            </span>
          </div>

          {/* Overall mastery bar */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[rgba(129,140,248,0.08)] to-[rgba(34,211,238,0.06)] rounded-lg border border-white/[0.05]">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#818cf8" strokeWidth="3"
                  strokeDasharray={`${overallStats.pct} ${100 - overallStats.pct}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#818cf8]">
                {overallStats.pct}%
              </span>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[#ededee]">
                {overallStats.mastered} <span className="text-[#71717a] font-normal">of</span> {overallStats.totalCards} <span className="text-[#71717a] font-normal">mastered</span>
              </p>
              <p className="text-[10px] text-[#52525b]">
                {overallStats.pct >= 80 ? 'Expert level!' : overallStats.pct >= 50 ? 'Great progress!' : overallStats.pct >= 20 ? 'Keep going!' : 'Start studying to build mastery'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
          {FLASHCARD_DECKS.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              progress={progress}
              onClick={() => handleSelectDeck(deck)}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Study screen ──
  const deckTheme = activeDeck ? getTheme(activeDeck.id) : DEFAULT_THEME

  return (
    <div className="flex flex-col h-full">
      {/* Deck header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <button
          onClick={handleBackToDecks}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: deckTheme.accent }}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          Decks
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShuffle}
            className="p-1.5 text-[#71717a] hover:text-[#ededee] hover:bg-white/[0.06] rounded-md transition-colors"
            title="Shuffle"
          >
            <Shuffle size={13} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleResetDeck}
            className="p-1.5 text-[#71717a] hover:text-[#ededee] hover:bg-white/[0.06] rounded-md transition-colors"
            title="Reset deck progress"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="text-base">{deckTheme.icon}</span>
        <h3 className="text-xs font-medium" style={{ color: deckTheme.accent }}>{activeDeck?.name}</h3>
      </div>

      {/* Study card */}
      {currentCard && activeDeck && (
        <div className="flex-1 min-h-0">
          <StudyCard
            key={currentCard.id + '-' + cardIndex}
            card={currentCard}
            onRate={handleRate}
            cardIndex={cardIndex}
            totalCards={activeDeck.cards.length}
            sessionStats={sessionStats}
            deckId={activeDeck.id}
          />
        </div>
      )}
    </div>
  )
}
