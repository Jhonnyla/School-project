import React, { useState, useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Pipeline steps shown while the Orchestrator is running
// ---------------------------------------------------------------------------
const PIPELINE_STEPS = [
  {
    id:    'inbox',
    icon:  '📧',
    agent: 'Inbox Scout',
    label: 'Scanning email receipts for purchase…',
  },
  {
    id:    'policy',
    icon:  '🔍',
    agent: 'Policy Researcher',
    label: 'Fetching retailer return policy…',
  },
  {
    id:    'llm',
    icon:  '🧠',
    agent: 'AI Orchestrator',
    label: 'Analyzing eligibility & membership tier…',
  },
  {
    id:    'synth',
    icon:  '✍️',
    agent: 'Response Synthesizer',
    label: 'Composing your personalized response…',
  },
]

// Delay (ms) between each step becoming "active"
const STEP_DELAY = 700

// ---------------------------------------------------------------------------
// Spinner SVG
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
function PipelineStep({ step, status }) {
  const isDone    = status === 'done'
  const isActive  = status === 'active'
  const isPending = status === 'pending'

  return (
    <li
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
        isActive  ? 'bg-emerald-50 border border-emerald-200'  :
        isDone    ? 'bg-slate-50  border border-slate-200'     :
                    'opacity-40'
      }`}
    >
      {/* Status indicator */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {isDone   && <span className="text-emerald-500 text-base leading-none">✓</span>}
        {isActive && <Spinner />}
        {isPending && (
          <span className="block w-2.5 h-2.5 rounded-full bg-slate-300" />
        )}
      </div>

      {/* Agent icon + labels */}
      <span className="text-lg leading-none">{step.icon}</span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wider ${
          isActive ? 'text-emerald-700' : isDone ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {step.agent}
        </p>
        <p className={`text-sm mt-0.5 ${
          isActive ? 'text-slate-700' : isDone ? 'text-slate-500 line-through' : 'text-slate-400'
        }`}>
          {isDone ? step.label.replace('…', ' ✓') : step.label}
        </p>
      </div>

      {/* Active pulse badge */}
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
  isLoading,
  onAsk,
  placeholder = "e.g. 'Can I return my Canon camera?' or 'Am I still within the return window for my Oura Ring?'",
}) {
  const [input, setInput]       = useState(question ?? '')
  const [stepIdx, setStepIdx]   = useState(-1)   // index of currently active step
  const timersRef               = useRef([])

  // Keep input in sync with external question changes
  useEffect(() => {
    if (question != null) setInput(question)
  }, [question])

  // Animate pipeline steps when loading starts / stops
  useEffect(() => {
    // Clear any running timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (isLoading) {
      // Kick off each step with a staggered delay
      setStepIdx(0)
      PIPELINE_STEPS.forEach((_, i) => {
        if (i === 0) return // step 0 is set immediately above
        const t = setTimeout(() => setStepIdx(i), i * STEP_DELAY)
        timersRef.current.push(t)
      })
    } else {
      // Loading finished — mark all done by pushing index past the last step
      setStepIdx(PIPELINE_STEPS.length)
    }

    return () => timersRef.current.forEach(clearTimeout)
  }, [isLoading])

  // Reset pipeline when a new question is submitted
  const handleSubmit = (e) => {
    e.preventDefault()
    const q = input.trim()
    if (q) {
      setStepIdx(-1)
      onAsk?.(q)
    }
  }

  const showPipeline = isLoading || (stepIdx >= PIPELINE_STEPS.length && !!response)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-lg font-semibold text-navy-900">Ask the Concierge</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask about return eligibility, warranty coverage, or retailer policies.
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

      {/* ── Live pipeline indicator ─────────────────────────────────────── */}
      {showPipeline && (
        <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Pipeline header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Multi-Agent Pipeline
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Controller → Inbox Scout → Policy Researcher → Synthesizer
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
                i < stepIdx  ? 'done'    :
                i === stepIdx ? 'active'  :
                                'pending'
              return <PipelineStep key={step.id} step={step} status={status} />
            })}
          </ul>
        </div>
      )}

      {/* ── Agent response ──────────────────────────────────────────────── */}
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
                Reasoning
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
              <p className="text-slate-800 leading-relaxed">{response}</p>
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
        </div>
      )}
    </div>
  )
}
