import React from 'react'

export default function AgentInteraction({
  question,
  response,
  reasoning,
  sources = [],
  isLoading,
  onAsk,
  placeholder = "e.g. 'My TV has a dead pixel, am I still covered?' or 'Find the return policy for my Canon EOS R50'",
}) {
  const [input, setInput] = React.useState(question ?? '')
  React.useEffect(() => {
    if (question != null) setInput(question)
  }, [question])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = input.trim()
    if (q) onAsk?.(q)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-lg font-semibold text-navy-900">Ask the Concierge</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Ask about return eligibility, warranty coverage, or retailer policies.
        </p>
      </div>
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
            {isLoading ? 'Asking…' : 'Ask'}
          </button>
        </div>
      </form>

      {(reasoning || response || sources?.length > 0) && (
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
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
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
