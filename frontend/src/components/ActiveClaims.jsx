import React, { useState } from 'react'
import { mockPurchases } from '../data/mockPurchases'
import { getReturnDaysRemaining } from './WarrantyStatus'

const now = new Date()

function daysAgo(n) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Derive mock claims from the purchase data
const CLAIMS = [
  {
    id: 'PPC-2026-001',
    purchaseId: '1',
    productName: 'Samsung 65" Class QN90F Series Neo QLED 4K Smart TV',
    retailer: 'Best Buy',
    issue: 'Dead pixel cluster detected in bottom-left corner of screen.',
    type: 'Return / Exchange',
    filedDate: daysAgo(2),
    status: 'in_progress',
    statusLabel: 'In Progress',
    assignedTo: 'Best Buy Support #BBS-88421',
    notes: 'Customer service contacted. Waiting on return label.',
  },
  {
    id: 'PPC-2026-002',
    purchaseId: '2',
    productName: 'Canon EOS R50 4K Video Mirrorless Camera',
    retailer: 'Best Buy',
    issue: 'Autofocus inconsistent in low-light environments.',
    type: 'Monitoring',
    filedDate: daysAgo(1),
    status: 'monitoring',
    statusLabel: 'Monitoring',
    assignedTo: '—',
    notes: 'Return window still open. Continuing to evaluate issue before filing.',
  },
  {
    id: 'PPC-2026-003',
    purchaseId: '3',
    productName: 'Sony WH-1000XM5 Wireless Headphones',
    retailer: 'Amazon',
    issue: 'Right ear cup audio cuts out intermittently.',
    type: 'Return',
    filedDate: daysAgo(20),
    status: 'closed',
    statusLabel: 'Closed — Window Expired',
    assignedTo: '—',
    notes: 'Return window of 30 days has passed. Claim ineligible.',
  },
  {
    id: 'PPC-2026-004',
    purchaseId: '4',
    productName: 'Oura Ring 4 Midnight Ceramic - Size 7',
    retailer: 'Oura',
    issue: 'No issue filed yet.',
    type: 'Eligible',
    filedDate: null,
    status: 'eligible',
    statusLabel: 'Eligible — No Claim Filed',
    assignedTo: '—',
    notes: 'Purchased yesterday. 29 days remaining in return window.',
  },
  {
    id: 'PPC-2026-005',
    purchaseId: '5',
    productName: 'Oura Ring 4 Midnight Ceramic - Size 8',
    retailer: 'Oura',
    issue: 'No issue filed yet.',
    type: 'Eligible',
    filedDate: null,
    status: 'eligible',
    statusLabel: 'Eligible — No Claim Filed',
    assignedTo: '—',
    notes: 'Purchased yesterday. 29 days remaining in return window.',
  },
]

const statusStyles = {
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
  monitoring:  'bg-amber-100 text-amber-800 border border-amber-200',
  closed:      'bg-slate-100 text-slate-600 border border-slate-200',
  eligible:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
}

const statusDot = {
  in_progress: 'bg-blue-500',
  monitoring:  'bg-amber-500',
  closed:      'bg-slate-400',
  eligible:    'bg-emerald-500',
}

export default function ActiveClaims() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Claims',    value: CLAIMS.length,                                          color: 'text-navy-900' },
          { label: 'In Progress',     value: CLAIMS.filter(c => c.status === 'in_progress').length,  color: 'text-blue-600' },
          { label: 'Eligible',        value: CLAIMS.filter(c => c.status === 'eligible').length,     color: 'text-emerald-600' },
          { label: 'Closed',          value: CLAIMS.filter(c => c.status === 'closed').length,       color: 'text-slate-500' },
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
          <p className="text-sm text-slate-500 mt-0.5">All active and historical return claims for your purchases.</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {CLAIMS.map((claim) => {
            const purchase = mockPurchases.find(p => p.id === claim.purchaseId)
            const daysLeft = purchase ? getReturnDaysRemaining(purchase.purchaseDate, purchase.returnWindowDays) : 0
            const isOpen = expanded === claim.id

            return (
              <li key={claim.id}>
                <button
                  className="w-full text-left px-5 py-4 hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : claim.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusDot[claim.status]}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900 truncate">{claim.productName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {claim.id} · {claim.retailer}
                          {claim.filedDate ? ` · Filed ${formatDate(claim.filedDate)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {daysLeft > 0 && (
                        <span className="text-xs text-slate-500 hidden sm:block">{daysLeft}d left</span>
                      )}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyles[claim.status]}`}>
                        {claim.statusLabel}
                      </span>
                      <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/40 border-t border-slate-100">
                    <div className="pt-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Reported</p>
                        <p className="text-sm text-slate-700 mt-1">{claim.issue}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Claim Type</p>
                        <p className="text-sm text-slate-700 mt-1">{claim.type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</p>
                        <p className="text-sm text-slate-700 mt-1">{claim.assignedTo}</p>
                      </div>
                    </div>
                    <div className="pt-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent Notes</p>
                        <p className="text-sm text-slate-700 mt-1">{claim.notes}</p>
                      </div>
                      {purchase && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Window</p>
                          <p className="text-sm text-slate-700 mt-1">
                            {purchase.returnWindowDays} days
                            {daysLeft > 0 ? ` · ${daysLeft} day(s) remaining` : ' · Expired'}
                          </p>
                        </div>
                      )}
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
