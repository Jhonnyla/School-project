import React, { useState } from 'react'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const statusStyles = {
  initiated:   'bg-emerald-100 text-emerald-800 border border-emerald-200',
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
  closed:      'bg-slate-100 text-slate-600 border border-slate-200',
}

const statusDot = {
  initiated:   'bg-emerald-500',
  in_progress: 'bg-blue-500',
  closed:      'bg-slate-400',
}

const statusLabel = {
  initiated:   'Initiated',
  in_progress: 'In Progress',
  closed:      'Closed',
}

export default function ActiveClaims({ claims = [] }) {
  const [expanded, setExpanded] = useState(null)

  // ── Empty state ───────────────────────────────────────────────────────────
  if (claims.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-lg font-semibold text-navy-900">Active Claims</h2>
          <p className="text-sm text-slate-500 mt-0.5">Return and exchange claims you have started.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm font-medium text-slate-600">No active claims</p>
          <p className="text-xs text-slate-400 mt-1">
            Ask the Concierge about a product's return eligibility on the Dashboard, then click <span className="font-semibold">Start Return Claim</span> to create one.
          </p>
        </div>
      </div>
    )
  }

  // ── Claims list ───────────────────────────────────────────────────────────
  const initiated   = claims.filter(c => c.status === 'initiated').length
  const in_progress = claims.filter(c => c.status === 'in_progress').length
  const closed      = claims.filter(c => c.status === 'closed').length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Claims', value: claims.length,  color: 'text-navy-900' },
          { label: 'Initiated',    value: initiated,       color: 'text-emerald-600' },
          { label: 'In Progress',  value: in_progress,     color: 'text-blue-600' },
          { label: 'Closed',       value: closed,          color: 'text-slate-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Claims list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-lg font-semibold text-navy-900">Claims & Tracking</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Return claims started from the Concierge chat.
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {claims.map((claim) => {
            const isOpen = expanded === claim.id
            const dot = statusDot[claim.status] || 'bg-slate-400'
            const badge = statusStyles[claim.status] || statusStyles.initiated
            const label = statusLabel[claim.status] || claim.statusLabel || claim.status

            return (
              <li key={claim.id}>
                <button
                  className="w-full text-left px-5 py-4 hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : claim.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900 truncate">{claim.item}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {claim.id} · {claim.retailer}
                          {claim.filedDate ? ` · Filed ${formatDate(claim.filedDate)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {claim.daysRemaining > 0 && (
                        <span className="text-xs text-slate-500 hidden sm:block">
                          {claim.daysRemaining}d left
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge}`}>
                        {label}
                      </span>
                      <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/40 pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <InfoRow label="Retailer" value={claim.retailer} />
                        <InfoRow label="Return Window" value={
                          claim.daysRemaining > 0
                            ? `${claim.daysRemaining} day(s) remaining`
                            : 'Window expired'
                        } />
                        <InfoRow label="Filed" value={claim.filedDate ? formatDate(claim.filedDate) : '—'} />
                      </div>
                      <div>
                        {claim.resources?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              Resources to Proceed
                            </p>
                            <ul className="space-y-1.5">
                              {claim.resources.map((r, i) => (
                                <li key={i}>
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                                  >
                                    ↗ {r.label || r.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value}</p>
    </div>
  )
}
