import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, RotateCcw, Shuffle } from 'lucide-react'
import type { FlashCard, FlashcardDeck, CardProgress } from '../../../shared/types'
import { FLASHCARD_DECKS } from '../../../shared/flashcards'

interface FlashcardViewProps {
  onBack: () => void
}

type StudyPhase = 'deck-select' | 'studying'

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
    return { seen, green, yellow, red, total, greenPct, yellowPct, redPct }
  }, [deck, progress])

  return (
    <button
      onClick={onClick}
      className="text-left p-4 bg-[#1f1f21] border border-white/[0.07] rounded-xl hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.06)] transition-all group"
    >
      <h3 className="text-sm font-semibold text-[#ededee] group-hover:text-white mb-1 leading-tight">{deck.name}</h3>
      <p className="text-[11px] text-[#71717a] mb-3 leading-relaxed line-clamp-2">{deck.description}</p>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <div className="h-full flex">
          <div className="bg-[#4ade80] transition-all" style={{ width: `${stats.greenPct}%` }} />
          <div className="bg-[#fbbf24] transition-all" style={{ width: `${stats.yellowPct}%` }} />
          <div className="bg-[#f87171] transition-all" style={{ width: `${stats.redPct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#52525b]">{stats.seen} / {stats.total} studied</span>
        {stats.greenPct > 0 && (
          <span className="text-[11px] text-[#4ade80]">{Math.round(stats.greenPct)}% mastered</span>
        )}
      </div>
    </button>
  )
}

function StudyCard({ card, onRate, cardIndex, totalCards, sessionStats }: {
  card: FlashCard
  onRate: (confidence: 1 | 2 | 3) => void
  cardIndex: number
  totalCards: number
  sessionStats: { studied: number; correct: number }
}) {
  const [revealed, setRevealed] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)

  // Reset state when card changes
  useEffect(() => {
    setRevealed(false)
    setSelectedOption(null)
    setShowRating(false)
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

  return (
    <div className="flex flex-col h-full">
      {/* Session stats bar */}
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[11px] text-[#52525b]">
          Card {cardIndex + 1} of {totalCards}
        </span>
        <span className="text-[11px] text-[#52525b]">
          {sessionStats.studied} studied
          {sessionStats.studied > 0 && (
            <> · {Math.round((sessionStats.correct / sessionStats.studied) * 100)}% correct</>
          )}
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#818cf8] transition-all"
          style={{ width: `${((cardIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Question */}
        <div
          className={`rounded-xl border p-5 flex-1 flex flex-col ${
            card.type === 'flashcard' && !revealed
              ? 'cursor-pointer hover:border-[rgba(99,102,241,0.3)] active:scale-[0.99]'
              : ''
          } ${
            revealed || selectedOption
              ? 'bg-[#1a1a1c] border-white/[0.1]'
              : 'bg-[#1f1f21] border-white/[0.07]'
          } transition-all`}
          onClick={handleFlip}
        >
          {/* Question text */}
          <div className={`${revealed || selectedOption ? '' : 'flex-1 flex items-center justify-center'}`}>
            <p className={`text-[#ededee] leading-relaxed ${
              revealed || selectedOption ? 'text-sm mb-4' : 'text-base text-center'
            }`}>
              {card.question}
            </p>
          </div>

          {/* Flashcard: tap to reveal hint */}
          {card.type === 'flashcard' && !revealed && (
            <p className="text-[11px] text-[#52525b] text-center mt-3">Tap to reveal answer</p>
          )}

          {/* Flashcard: revealed answer */}
          {card.type === 'flashcard' && revealed && (
            <div className="border-t border-white/[0.07] pt-4 mt-auto">
              <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{card.answer}</p>
            </div>
          )}

          {/* Multiple choice: options */}
          {card.type === 'multiple-choice' && card.options && (
            <div className="mt-auto space-y-2">
              {card.options.map((option, i) => {
                let bg = 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.07]'
                let text = 'text-[#d4d4d8]'
                if (selectedOption) {
                  if (option === card.answer) {
                    bg = 'bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.3)]'
                    text = 'text-[#4ade80]'
                  } else if (option === selectedOption) {
                    bg = 'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)]'
                    text = 'text-[#f87171]'
                  } else {
                    bg = 'bg-white/[0.02] border-white/[0.04]'
                    text = 'text-[#52525b]'
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); handleOptionSelect(option) }}
                    disabled={!!selectedOption}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg border ${bg} ${text} transition-all ${
                      !selectedOption ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className="font-medium mr-2 text-[#52525b]">{String.fromCharCode(65 + i)}.</span>
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
                {isCorrect ? 'Correct!' : `Answer: ${card.answer}`} — How well did you know this?
              </p>
            )}
            {card.type === 'flashcard' && (
              <p className="text-[11px] text-center text-[#71717a] mb-1">How well did you know this?</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onRate(1)}
                className="py-2.5 rounded-lg text-xs font-medium bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] transition-colors"
              >
                Again
              </button>
              <button
                onClick={() => onRate(2)}
                className="py-2.5 rounded-lg text-xs font-medium bg-[rgba(245,158,11,0.12)] text-[#fbbf24] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
              >
                Good
              </button>
              <button
                onClick={() => onRate(3)}
                className="py-2.5 rounded-lg text-xs font-medium bg-[rgba(34,197,94,0.12)] text-[#4ade80] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.2)] transition-colors"
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
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0 })

  // Load progress on mount
  useEffect(() => {
    window.electronAPI.getFlashcardProgress().then(setProgress)
  }, [])

  const handleSelectDeck = useCallback((deck: FlashcardDeck) => {
    setActiveDeck(deck)
    setPhase('studying')
    setCardIndex(0)
    setSessionStats({ studied: 0, correct: 0 })
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

    // Update session stats
    setSessionStats(prev => ({
      studied: prev.studied + 1,
      correct: prev.correct + (confidence >= 2 ? 1 : 0)
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
    setSessionStats({ studied: 0, correct: 0 })
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#ededee]">Education</h2>
          <span className="text-[11px] text-[#52525b]">
            {FLASHCARD_DECKS.reduce((sum, d) => sum + d.cardCount, 0)} cards · {FLASHCARD_DECKS.length} decks
          </span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5">
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
  return (
    <div className="flex flex-col h-full">
      {/* Deck header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <button
          onClick={handleBackToDecks}
          className="flex items-center gap-1 text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
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

      <h3 className="text-xs font-medium text-[#71717a] mb-3 shrink-0">{activeDeck?.name}</h3>

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
          />
        </div>
      )}
    </div>
  )
}
