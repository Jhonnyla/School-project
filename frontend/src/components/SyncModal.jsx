import React, { useState } from 'react'

const BB_TIERS = [
  { key: 'free',  label: 'My Best Buy (Free)', days: 15 },
  { key: 'plus',  label: 'My Best Buy Plus',   days: 30 },
  { key: 'total', label: 'My Best Buy Total',  days: 45 },
]

const AZ_TIERS = [
  { key: 'standard', label: 'No Prime (Standard)', days: 30 },
  { key: 'prime',    label: 'Amazon Prime',        days: 30 },
]

export default function SyncModal({ onConfirm, retailers = [] }) {
  const [bbTier, setBbTier] = useState('total')
  const [azTier, setAzTier] = useState('prime')
  const [saving, setSaving] = useState(false)

  // Only show sections for retailers that were actually found in the sync
  const hasBestBuy = retailers.some(r => r.toLowerCase().includes('best buy'))
  const hasAmazon  = retailers.some(r => r.toLowerCase().includes('amazon'))
  const hasOura    = retailers.some(r => r.toLowerCase().includes('oura'))
  const hasAny     = hasBestBuy || hasAmazon || hasOura

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (hasBestBuy) payload.best_buy = bbTier
      if (hasAmazon)  payload.amazon   = azTier
      await fetch('/api/user/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // Proceed anyway — demo can work without the API call
    } finally {
      setSaving(false)
      onConfirm({ best_buy: bbTier, amazon: azTier })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            Purchases Synced
          </p>
          <h2 className="text-lg font-bold text-navy-900">Confirm Your Memberships</h2>
          <p className="text-sm text-slate-500 mt-1">
            {hasAny
              ? 'Confirm your membership tier so the agents apply the correct return windows for your purchases.'
              : 'Your purchases have been loaded.'}
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Best Buy — only if found */}
          {hasBestBuy && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🛍️</span>
                <p className="text-sm font-semibold text-navy-900">Best Buy</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {BB_TIERS.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setBbTier(t.key)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      bbTier === t.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-xs font-semibold leading-tight ${bbTier === t.key ? 'text-emerald-700' : 'text-navy-900'}`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.days}d returns</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amazon — only if found */}
          {hasAmazon && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📦</span>
                <p className="text-sm font-semibold text-navy-900">Amazon</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AZ_TIERS.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setAzTier(t.key)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      azTier === t.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${azTier === t.key ? 'text-emerald-700' : 'text-navy-900'}`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.days}d returns</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Oura — only if found */}
          {hasOura && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-start gap-2">
              <span className="text-base">💍</span>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">Oura</span> — no paid membership tiers. All customers receive the same 30-day return window.
              </p>
            </div>
          )}

          {/* No known retailers found */}
          {!hasAny && (
            <p className="text-sm text-slate-500 text-center py-2">
              No membership tiers needed for the retailers in your receipts.
            </p>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Confirm & Continue'}
          </button>
        </div>

      </div>
    </div>
  )
}
