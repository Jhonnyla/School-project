import React from 'react'
import WarrantyStatus from './WarrantyStatus'

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

export default function PurchasesTable({ purchases, syncState, syncSteps = [] }) {
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
            Click <span className="font-semibold">Sync Inbox</span> above to scan your email receipts and load your purchases.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" role="table" aria-label="Recent purchases">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Retailer
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Warranty / Return Status
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="font-medium text-navy-900">{p.productName}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {formatPrice(p.price, p.currency)}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{p.retailer}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(p.purchaseDate)}
                  </td>
                  <td className="px-5 py-4">
                    <WarrantyStatus
                      purchaseDate={p.purchaseDate}
                      returnWindowDays={p.returnWindowDays}
                    />
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
