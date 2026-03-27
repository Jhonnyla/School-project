import React, { useState } from 'react'

const RETAILER_LOGOS = {
  'Best Buy': '🟦',
  'Amazon':   '🟧',
  'Oura':     '⬛',
}

export default function PolicyDatabase({ policyResearch }) {
  const [selected, setSelected] = useState(null)

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!policyResearch) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-lg font-semibold text-navy-900">Policy Database</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Live return and warranty policies researched from retailer websites.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm font-medium text-slate-600">No policies researched yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click <span className="font-semibold">Research Policies</span> on the Dashboard to have Agent 1 search the web for live return and warranty data.
          </p>
        </div>
      </div>
    )
  }

  // ── Populated state ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Retailers Researched" value={policyResearch.length} />
        <StatCard
          label="Avg Return Window"
          value={
            policyResearch.length
              ? `${Math.round(policyResearch.reduce((a, r) => a + (r.return_window_days || 0), 0) / policyResearch.length)}d`
              : '—'
          }
        />
        <StatCard
          label="Sources Found"
          value={policyResearch.reduce((a, r) => a + (r.sources?.length || 0), 0)}
        />
      </div>

      {/* Policy cards */}
      <div className="space-y-3">
        {policyResearch.map((policy) => {
          const isOpen = selected === policy.retailer
          const logo = RETAILER_LOGOS[policy.retailer] || '🏪'
          return (
            <div
              key={policy.retailer}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Card header — always visible */}
              <button
                type="button"
                className="w-full text-left px-5 py-4 hover:bg-slate-50/60 transition-colors"
                onClick={() => setSelected(isOpen ? null : policy.retailer)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{logo}</span>
                    <div>
                      <p className="font-semibold text-navy-900">{policy.retailer}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Return window: <span className="font-medium text-navy-900">{policy.return_window_days}d</span>
                        {' · '}
                        <span className="text-slate-400">{policy.membership}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      policy.return_window_days >= 45
                        ? 'bg-purple-100 text-purple-700'
                        : policy.return_window_days >= 30
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {policy.return_window_days}d
                    </span>
                    {policy.searches_made?.length > 0 && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 hidden sm:block">
                        🔍 Live
                      </span>
                    )}
                    <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-slate-50/40 space-y-3">
                  {policy.policy_summary && (
                    <Row label="Summary" value={policy.policy_summary} />
                  )}
                  {policy.conditions && (
                    <Row label="Conditions" value={policy.conditions} />
                  )}
                  {policy.membership_benefit && (
                    <Row label="Membership Benefit" value={policy.membership_benefit} />
                  )}
                  {policy.warranty_summary && (
                    <Row label="Warranty" value={policy.warranty_summary} />
                  )}
                  {policy.important_exclusions && (
                    <Row label="Exclusions" value={policy.important_exclusions} />
                  )}

                  {/* Search queries used */}
                  {policy.searches_made?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Agent 1 searched for
                      </p>
                      <ul className="space-y-1">
                        {policy.searches_made.map((q, i) => (
                          <li key={i} className="text-xs text-slate-500 font-mono">
                            🔍 "{q}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources */}
                  {policy.sources?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Sources
                      </p>
                      <ul className="space-y-1">
                        {policy.sources.map((s, i) => (
                          <li key={i}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              ↗ {s.label || s.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {policy.policy_url && (
                    <a
                      href={policy.policy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1"
                    >
                      ↗ View official policy page
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 text-center">
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{value}</p>
    </div>
  )
}
