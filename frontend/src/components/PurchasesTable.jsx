import React, { useState } from 'react'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
}

function PriceCell({ price, currency, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const isMissing = !price || price === 0

  function handleEdit() {
    setDraft(isMissing ? '' : String(price))
    setEditing(true)
  }

  function handleSave() {
    const val = parseFloat(draft.replace(/[^0-9.]/g, ''))
    if (!isNaN(val) && val > 0) onSave(val)
    setEditing(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-slate-400 text-sm">$</span>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKey}
          className="w-24 border border-emerald-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="0.00"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className={isMissing ? 'text-slate-400 italic text-sm' : 'text-slate-700'}>
        {isMissing ? 'Unknown' : formatPrice(price, currency)}
      </span>
      <button
        onClick={handleEdit}
        title="Edit price"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-emerald-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  )
}

export default function PurchasesTable({ purchases, setPurchases, syncState, syncSteps = [], onStartClaim, onAskConcierge }) {
  function daysRemaining(purchaseDate, returnWindowDays) {
    const elapsed = Math.floor((Date.now() - new Date(purchaseDate).getTime()) / 86400000)
    return (returnWindowDays || 30) - elapsed
  }

  function handlePriceUpdate(id, newPrice) {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-lg font-semibold text-navy-900">Recent Purchases</h2>
        <p className="text-sm text-slate-500 mt-0.5">Track return windows and warranty status</p>
      </div>
      {syncState?.active ? (
        <div className="px-6 py-10 flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-slate-600">
            {syncSteps[syncState.stepIdx] || 'Syncing…'}
          </p>
          <div className="w-full max-w-sm bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-200"
              style={{ width: `${syncState.progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{Math.round(syncState.progress)}%</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="text-4xl mb-3">📥</span>
          <p className="text-sm font-medium text-slate-600">No purchases loaded yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click <span className="font-semibold">Upload Receipt</span> above — Gemini will read it and track your warranty automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" role="table" aria-label="Recent purchases">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Retailer</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Purchase Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider" colSpan={2}></th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-navy-900">{p.productName}</span>
                    {p.orderNumber && (
                      <p className="text-xs text-slate-400 mt-0.5">Order #{p.orderNumber}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <PriceCell
                      price={p.price}
                      currency={p.currency}
                      onSave={(val) => handlePriceUpdate(p.id, val)}
                    />
                  </td>
                  <td className="px-5 py-4 text-slate-700">{p.retailer}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(p.purchaseDate)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onAskConcierge?.(p)}
                      className="text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Ask Concierge
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onStartClaim?.({
                        item: p.productName,
                        retailer: p.retailer,
                        days_remaining: daysRemaining(p.purchaseDate, p.returnWindowDays),
                        sources: [],
                      })}
                      className="text-xs font-medium text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Start Claim
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
