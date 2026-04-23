import React, { useState, useEffect, useRef } from 'react'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function UserBubble({ message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-navy-800 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
        {message.content}
      </div>
    </div>
  )
}

function AssistantBubble({ message, onStartClaim }) {
  const renderResponse = (text) =>
    text.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ))

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {/* Response text */}
        <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 leading-relaxed">
          {message.loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Spinner />
              <span>{message.loadingLabel || 'Thinking…'}</span>
            </div>
          ) : (
            renderResponse(message.content)
          )}
        </div>

        {/* Sources */}
        {!message.loading && message.sources?.length > 0 && (
          <div className="px-1 flex flex-wrap gap-2">
            {message.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
              >
                ↗ {s.label || s.url}
              </a>
            ))}
          </div>
        )}

        {/* Start claim CTA */}
        {!message.loading && message.claimContext?.eligible && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Return window is still open</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {message.claimContext.days_remaining} day{message.claimContext.days_remaining !== 1 ? 's' : ''} remaining.
              </p>
            </div>
            <button
              onClick={() => onStartClaim?.(message.claimContext)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Start Return Claim
            </button>
          </div>
        )}

        {/* No purchase found note */}
        {!message.loading && message.noPurchaseFound && (
          <p className="px-1 text-xs text-slate-400 italic">
            No purchase record found — upload a receipt for a personalized answer.
          </p>
        )}
      </div>
    </div>
  )
}

export default function AgentInteraction({
  selectedPurchase,
  onClearPurchase,
  messages,
  isLoading,
  onAsk,
  onStartClaim,
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when a purchase is pre-selected
  useEffect(() => {
    if (selectedPurchase) inputRef.current?.focus()
  }, [selectedPurchase])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = input.trim()
    if (!q || isLoading) return
    onAsk?.(q)
    setInput('')
  }

  const empty = !messages || messages.length === 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '420px', maxHeight: '640px' }}>

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
        <h2 className="text-lg font-semibold text-navy-900">Ask the Concierge</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask about return eligibility, warranty coverage, or how to start a return.
        </p>
      </div>

      {/* Chat thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {empty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-sm font-medium text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Ask a question below, or click <span className="font-semibold">Ask Concierge</span> on any purchase row.
            </p>
          </div>
        ) : (
          messages.map((msg) =>
            msg.role === 'user'
              ? <UserBubble key={msg.id} message={msg} />
              : <AssistantBubble key={msg.id} message={msg} onStartClaim={onStartClaim} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Selected purchase context chip */}
      {selectedPurchase && (
        <div className="px-5 py-2 border-t border-slate-100 bg-blue-50/60 shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-blue-700 truncate">
            <span className="font-semibold">Context:</span> {selectedPurchase.productName} · {selectedPurchase.retailer}
          </p>
          <button
            onClick={onClearPurchase}
            className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedPurchase
                ? `Ask about your ${selectedPurchase.productName}…`
                : "e.g. 'Can I return my Sony headphones?' or 'What is Best Buy's return policy?'"
            }
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? <><Spinner /> Thinking</> : 'Ask'}
          </button>
        </div>
      </form>
    </div>
  )
}
