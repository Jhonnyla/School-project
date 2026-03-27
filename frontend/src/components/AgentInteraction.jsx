import React, { useState, useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Pipeline steps — reflects the real fixed pipeline:
//   Orchestrator → Inbox Scout → Agent 1 (Policy Research) → Agent 2 (Concierge)
// ---------------------------------------------------------------------------
const PIPELINE_STEPS = [
  {
    id:    'scout',
    icon:  '📧',
    agent: 'Inbox Scout',
    role:  'Data Retrieval',
    label: 'Locating your purchase receipt…',
  },
  {
    id:    'research',
    icon:  '🔍',
    agent: 'Policy Research Agent',
    role:  'Agent 1 — Tool-using Executor',
    label: 'Searching the web for live policy data…',
  },
  {
    id:    'concierge',
    icon:  '🤝',
    agent: 'Purchase Concierge Agent',
    role:  'Agent 2 — Domain Expert',
    label: 'Synthesizing your personalized response…',
  },
]

const STEP_DELAY = 900

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-emerald-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Single pipeline step row
// ---------------------------------------------------------------------------
function PipelineStep({ step, status, pipelineData }) {
  const isDone    = status === 'done'
  const isActive  = status === 'active'
  const isPending = status === 'pending'

  // Extra detail shown once the step is done and we have real pipeline data
  let detail = null
  if (isDone && pipelineData) {
    if (step.id === 'research' && pipelineData.agent1) {
      const searches = pipelineData.agent1.searches || []
      if (searches.length > 0) {
        detail = `Searched: "${searches.join('", "')}"  ·  ${pipelineData.agent1.sources_found} source(s) found`
      }
    }
    if (step.id === 'concierge' && pipelineData.agent2) {
      const intent = pipelineData.agent2.intent
      if (intent) {
        detail = `Intent detected: ${intent.replace(/_/g, ' ')}  ·  Item: ${pipelineData.agent2.item || '—'}`
      }
    }
  }

  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
        isActive  ? 'bg-emerald-50 border border-emerald-200'  :
        isDone    ? 'bg-slate-50  border border-slate-200'     :
                    'opacity-40'
      }`}
    >
      {/* Status indicator */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
        {isDone   && <span className="text-emerald-500 text-base leading-none">✓</span>}
        {isActive && <Spinner />}
        {isPending && <span className="block w-2.5 h-2.5 rounded-full bg-slate-300" />}
      </div>

      {/* Agent icon + labels */}
      <span className="text-lg leading-none mt-0.5">{step.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-xs font-semibold uppercase tracking-wider ${
            isActive ? 'text-emerald-700' : isDone ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {step.agent}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
            isActive ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
            isDone   ? 'text-slate-400 border-slate-200 bg-white' :
                       'text-slate-300 border-slate-100'
          }`}>
            {step.role}
          </span>
        </div>
        <p className={`text-sm mt-0.5 ${
          isActive ? 'text-slate-700' : isDone ? 'text-slate-500' : 'text-slate-400'
        } ${isDone ? 'line-through' : ''}`}>
          {isDone ? step.label.replace('…', ' ✓') : step.label}
        </p>
        {detail && (
          <p className="text-xs text-slate-400 mt-1 font-mono leading-relaxed">
            {detail}
          </p>
        )}
      </div>

      {isActive && (
        <span className="ml-auto shrink-0 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
          Running
        </span>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AgentInteraction({
  question,
  response,
  reasoning,
  sources = [],
  pipeline = null,
  claimContext = null,
  isLoading,
  onAsk,
  onStartClaim,
  placeholder = "e.g. 'Can I return my Canon camera?' or 'What is the warranty on my Oura Ring?'",
}) {
  const [input, setInput]     = useState(question ?? '')
  const [stepIdx, setStepIdx] = useState(-1)
  const timersRef             = useRef([])

  useEffect(() => {
    if (question != null) setInput(question)
  }, [question])

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (isLoading) {
      setStepIdx(0)
      PIPELINE_STEPS.forEach((_, i) => {
        if (i === 0) return
        const t = setTimeout(() => setStepIdx(i), i * STEP_DELAY)
        timersRef.current.push(t)
      })
    } else {
      setStepIdx(PIPELINE_STEPS.length)
    }

    return () => timersRef.current.forEach(clearTimeout)
  }, [isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = input.trim()
    if (q) {
      setStepIdx(-1)
      onAsk?.(q)
    }
  }

  const showPipeline = isLoading || (stepIdx >= PIPELINE_STEPS.length && !!response)

  // Format response text: newlines → paragraphs / line breaks
  const renderResponse = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-lg font-semibold text-navy-900">Ask the Concierge</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Powered by a two-agent pipeline — Agent 1 searches live policy data, Agent 2 drafts your answer.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-5">
        <label htmlFor="agent-question" className="sr-only">
          Your question for the agent
        </label>
        <div className="flex gap-3">
          <input
            id="agent-question"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-active/30 focus:border-emerald-active disabled:opacity-60"
            aria-describedby="agent-response"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 rounded-lg bg-navy-800 text-white font-medium hover:bg-navy-700 focus:ring-2 focus:ring-navy-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Running…' : 'Ask'}
          </button>
        </div>
      </form>

      {/* ── Live pipeline indicator ──────────────────────────────────────── */}
      {showPipeline && (
        <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Pipeline header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Multi-Agent Pipeline
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Fixed pipeline: Inbox Scout → Agent 1 (Policy Research) → Agent 2 (Concierge)
              </p>
            </div>
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Spinner />
                Processing
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                ✓ Complete
              </span>
            )}
          </div>

          {/* Steps */}
          <ul className="p-3 space-y-2">
            {PIPELINE_STEPS.map((step, i) => {
              const status =
                i < stepIdx  ? 'done'   :
                i === stepIdx ? 'active' :
                                'pending'
              return (
                <PipelineStep
                  key={step.id}
                  step={step}
                  status={status}
                  pipelineData={stepIdx >= PIPELINE_STEPS.length ? pipeline : null}
                />
              )
            })}
          </ul>
        </div>
      )}

      {/* ── Agent response ───────────────────────────────────────────────── */}
      {(reasoning || response || sources?.length > 0) && !isLoading && (
        <div
          id="agent-response"
          className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-5 mx-5"
          aria-live="polite"
        >
          {question && (
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-600">You asked:</span> {question}
            </p>
          )}

          {reasoning && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Agent 2 Reasoning
              </h3>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 leading-relaxed">
                {reasoning}
              </p>
            </div>
          )}

          {response && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Response
              </h3>
              <div className="text-slate-800 leading-relaxed">
                {renderResponse(response)}
              </div>
            </div>
          )}

          {sources?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Sources
              </h3>
              <ul className="space-y-2">
                {sources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-active hover:underline flex items-center gap-1.5"
                    >
                      <span aria-hidden>↗</span>
                      {s.label ?? s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Start Claim CTA — shown when item is eligible for return */}
          {claimContext?.eligible && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  This item is eligible for return
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {claimContext.days_remaining} day{claimContext.days_remaining !== 1 ? 's' : ''} remaining in your return window.
                  Start a claim to get step-by-step resources to proceed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onStartClaim?.(claimContext)}
                className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Start Return Claim
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
