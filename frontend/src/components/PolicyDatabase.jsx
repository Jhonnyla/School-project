import React, { useState } from 'react'

const POLICIES = [
  {
    retailer: 'Best Buy',
    logo: '🟦',
    returnWindow: 15,
    memberWindow: 30,
    yourTier: 'My Best Buy Plus',
    yourWindow: 30,
    condition: 'Opened or unopened in original packaging',
    exceptions: 'Cell phones & devices: 14 days. My Best Buy Total members get 45 days.',
    restockingFee: 'None for most items. 15% for opened drones.',
    url: 'https://www.bestbuy.com/site/help-topics/return-exchange-policy/pcmcat260800050014.c',
    coverage: ['Electronics', 'Appliances', 'Computers', 'TVs', 'Cameras'],
    tiers: [
      { name: 'Standard',          days: 15 },
      { name: 'My Best Buy Plus',  days: 30, active: true },
      { name: 'My Best Buy Total', days: 45 },
    ],
  },
  {
    retailer: 'Amazon',
    logo: '🟧',
    returnWindow: 30,
    memberWindow: 30,
    condition: 'Most items in original condition',
    exceptions: 'Hazardous materials, digital downloads, and gift cards are non-returnable.',
    restockingFee: 'Up to 20% for some opened items.',
    url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7',
    coverage: ['Most product categories', 'Third-party sellers vary'],
  },
  {
    retailer: 'Oura',
    logo: '⬛',
    returnWindow: 30,
    memberWindow: 30,
    condition: 'Unworn, with all original accessories',
    exceptions: 'Membership subscription fees are non-refundable.',
    restockingFee: 'None.',
    url: 'https://ouraring.com/policies/refund-policy',
    coverage: ['Oura Ring 4', 'Oura Ring Gen 3', 'Accessories'],
  },
  {
    retailer: 'Apple',
    logo: '⬜',
    returnWindow: 14,
    memberWindow: 14,
    condition: 'Opened or unopened',
    exceptions: 'Personalized or engraved items cannot be returned.',
    restockingFee: 'None.',
    url: 'https://www.apple.com/shop/help/returns_refund',
    coverage: ['iPhone', 'Mac', 'iPad', 'Apple Watch', 'AirPods'],
  },
  {
    retailer: 'Target',
    logo: '🎯',
    returnWindow: 90,
    memberWindow: 120,
    condition: 'Unopened or defective',
    exceptions: 'Electronics & entertainment: 30 days. Apple products: 15 days.',
    restockingFee: 'None.',
    url: 'https://www.target.com/c/target-help-return-policy/-/N-4tfyn',
    coverage: ['Apparel', 'Home', 'Electronics (30d)', 'Grocery'],
  },
  {
    retailer: 'Walmart',
    logo: '🟡',
    returnWindow: 90,
    memberWindow: 90,
    condition: 'With receipt, original packaging preferred',
    exceptions: 'Electronics & TVs: 30 days. Cell phones: 14 days.',
    restockingFee: '15% on some electronics.',
    url: 'https://www.walmart.com/help/article/walmart-return-policy/b573d6b6e6b741a3bfc90c99afe5c83e',
    coverage: ['General merchandise', 'Electronics (30d)', 'Apparel'],
  },
]

export default function PolicyDatabase() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = POLICIES.filter(p =>
    p.retailer.toLowerCase().includes(search.toLowerCase()) ||
    p.coverage.some(c => c.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <span className="text-slate-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Search retailer or product category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
            Clear
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Retailers Tracked', value: POLICIES.length },
          { label: 'Avg Return Window', value: `${Math.round(POLICIES.reduce((a, p) => a + p.returnWindow, 0) / POLICIES.length)}d` },
          { label: 'Your Active Retailers', value: 3 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-navy-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Policy cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((policy) => (
          <div
            key={policy.retailer}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:border-emerald-active/50 transition-colors"
            onClick={() => setSelected(selected === policy.retailer ? null : policy.retailer)}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{policy.logo}</span>
                <div>
                  <p className="font-semibold text-navy-900">{policy.retailer}</p>
                  <p className="text-xs text-slate-500">
                    Standard: {policy.returnWindow}d
                    {policy.yourTier && (
                      <> · <span className="text-blue-600 font-medium">Your tier: {policy.yourWindow}d</span></>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {policy.yourTier ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    {policy.yourWindow}d
                  </span>
                ) : (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    policy.returnWindow >= 30
                      ? 'bg-emerald-100 text-emerald-700'
                      : policy.returnWindow >= 15
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {policy.returnWindow}d
                  </span>
                )}
                <span className="text-slate-400 text-sm">{selected === policy.retailer ? '▲' : '▼'}</span>
              </div>
            </div>

            {selected === policy.retailer && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2.5 bg-slate-50/40">
                <Row label="Condition"      value={policy.condition} />
                <Row label="Restocking Fee" value={policy.restockingFee} />
                <Row label="Exceptions"     value={policy.exceptions} />
                <Row label="Covers"         value={policy.coverage.join(', ')} />

                {/* Tier breakdown */}
                {policy.tiers && (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Return Window by Tier</p>
                    <div className="flex flex-wrap gap-2">
                      {policy.tiers.map(t => (
                        <span
                          key={t.name}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                            t.active
                              ? 'bg-blue-100 text-blue-700 border-blue-300 ring-1 ring-blue-400'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {t.active ? '✓ ' : ''}{t.name}: {t.days}d
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={policy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1"
                >
                  ↗ View official policy
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-8 text-sm">No retailers match "{search}".</p>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}: </span>
      <span className="text-xs text-slate-700">{value}</span>
    </div>
  )
}
