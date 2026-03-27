import React, { useState, useEffect } from 'react'

export default function Settings() {
  const [notifications, setNotifications] = useState({
    returnAlerts:   true,
    emailDigest:    true,
    calendarSync:   false,
    warrantyExpiry: true,
  })

  const [profile] = useState({
    name:     'Jhonatan Lopez',
    email:    'jhonatan@gmail.com',
    timezone: 'America/New_York',
    currency: 'USD',
  })

  const [accounts] = useState([
    { name: 'Gmail',      email: 'jhonatan@gmail.com', connected: true,  icon: '📧' },
    { name: 'Outlook',    email: '—',                   connected: false, icon: '📮' },
    { name: 'Apple Mail', email: '—',                   connected: false, icon: '🍎' },
  ])

  const [memberships, setMemberships] = useState([])
  const [savingTier, setSavingTier] = useState(null) // retailer_key being saved

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => setMemberships(data.memberships_detail || []))
      .catch(() => {})
  }, [])

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))

  const handleTierChange = async (retailer_key, newTier) => {
    // Optimistic update
    setMemberships(prev =>
      prev.map(m => {
        if (m.retailer_key !== retailer_key) return m
        const newTierInfo = m.available_tiers?.find(t => t.key === newTier)
        return {
          ...m,
          tier: newTier,
          tierLabel: newTierInfo?.label ?? newTier,
          returnWindowDays: newTierInfo?.days ?? m.returnWindowDays,
        }
      })
    )
    setSavingTier(retailer_key)
    try {
      await fetch('/api/user/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [retailer_key]: newTier }),
      })
    } catch {
      // Silently fail in demo — optimistic update stays
    } finally {
      setSavingTier(null)
    }
  }

  const getBestBuyMembership = () => memberships.find(m => m.retailer_key === 'best_buy')
  const getAmazonMembership  = () => memberships.find(m => m.retailer_key === 'amazon')
  const getOuraMembership    = () => memberships.find(m => m.retailer_key === 'oura')

  const tierBadgeColor = (tier) => {
    if (tier === 'total' || tier === 'prime')  return 'bg-purple-100 text-purple-700 border-purple-200'
    if (tier === 'plus')                        return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-slate-100 text-slate-500 border-slate-200'
  }

  const bb  = getBestBuyMembership()
  const az  = getAmazonMembership()
  const our = getOuraMembership()

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Profile */}
      <Section title="Profile" description="Your account information.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={profile.name} />
          <Field label="Email"     value={profile.email} />
          <Field label="Timezone"  value={profile.timezone} />
          <Field label="Currency"  value={profile.currency} />
        </div>
      </Section>

      {/* Memberships */}
      <Section
        title="Memberships"
        description="Select your current membership tier for each retailer. This affects the return window the agents use when researching your policies."
      >
        {memberships.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Loading memberships…</p>
        ) : (
          <div className="space-y-6">

            {/* ── Best Buy ─────────────────────────────────────────────── */}
            {bb && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛍️</span>
                    <p className="text-sm font-semibold text-navy-900">Best Buy</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tierBadgeColor(bb.tier)}`}>
                      {bb.tierLabel}
                      {savingTier === 'best_buy' && ' (saving…)'}
                    </span>
                  </div>
                  <a
                    href="https://www.bestbuy.com/account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    Link Best Buy Account ↗
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {bb.available_tiers.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => bb.tier !== t.key && handleTierChange('best_buy', t.key)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                        bb.tier === t.key
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className={`text-xs font-semibold ${bb.tier === t.key ? 'text-emerald-700' : 'text-navy-900'}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.days}-day returns</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Return window: <span className="font-medium text-navy-900">{bb.returnWindowDays} days</span>
                  {' · '}
                  <a href={bb.policyUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    View policy ↗
                  </a>
                </p>
              </div>
            )}

            <div className="border-t border-slate-100" />

            {/* ── Amazon ───────────────────────────────────────────────── */}
            {az && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <p className="text-sm font-semibold text-navy-900">Amazon</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tierBadgeColor(az.tier)}`}>
                      {az.tierLabel}
                      {savingTier === 'amazon' && ' (saving…)'}
                    </span>
                  </div>
                  <a
                    href="https://www.amazon.com/prime"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    Link Amazon Account ↗
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {az.available_tiers.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => az.tier !== t.key && handleTierChange('amazon', t.key)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                        az.tier === t.key
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className={`text-xs font-semibold ${az.tier === t.key ? 'text-emerald-700' : 'text-navy-900'}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.days}-day returns</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Return window: <span className="font-medium text-navy-900">{az.returnWindowDays} days</span>
                  {' · '}
                  <a href={az.policyUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    View policy ↗
                  </a>
                </p>
              </div>
            )}

            <div className="border-t border-slate-100" />

            {/* ── Oura ─────────────────────────────────────────────────── */}
            {our && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💍</span>
                    <p className="text-sm font-semibold text-navy-900">Oura</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                      Standard
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Oura does not offer a paid membership program that extends return windows.
                  All customers receive the same 30-day return policy.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Return window: <span className="font-medium text-navy-900">{our.returnWindowDays} days</span>
                  {' · '}
                  <a href={our.policyUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    View policy ↗
                  </a>
                </p>
              </div>
            )}

          </div>
        )}
      </Section>

      {/* Connected Accounts */}
      <Section title="Connected Accounts" description="Email accounts the Inbox Scout monitors for receipts.">
        <ul className="divide-y divide-slate-100">
          {accounts.map((acct) => (
            <li key={acct.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{acct.icon}</span>
                <div>
                  <p className="text-sm font-medium text-navy-900">{acct.name}</p>
                  <p className="text-xs text-slate-500">{acct.connected ? acct.email : 'Not connected'}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                acct.connected
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {acct.connected ? 'Connected' : 'Connect'}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" description="Choose when the PPC agent alerts you.">
        <ul className="divide-y divide-slate-100">
          {[
            { key: 'returnAlerts',   label: 'Return Window Alerts',   desc: 'Notify me 3 days before a return window closes.' },
            { key: 'emailDigest',    label: 'Weekly Email Digest',    desc: 'Summary of all active return windows every Monday.' },
            { key: 'calendarSync',   label: 'Calendar Sync',          desc: 'Auto-add return deadlines to Google Calendar.' },
            { key: 'warrantyExpiry', label: 'Warranty Expiry Alerts', desc: 'Alert me 30 days before a product warranty expires.' },
          ].map(({ key, label, desc }) => (
            <li key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-navy-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                role="switch"
                aria-checked={notifications[key]}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                  notifications[key] ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                    notifications[key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* Agent Preferences */}
      <Section title="Agent Preferences" description="How the multi-agent pipeline is configured.">
        <div className="space-y-3">
          {[
            { label: 'Agent 1',              value: 'Policy Research Agent (Groq / Llama 3.3-70B + Tavily)' },
            { label: 'Agent 2',              value: 'Purchase Concierge Agent (Groq / Llama 3.3-70B)' },
            { label: 'Coordination',         value: 'Fixed pipeline — Research → Concierge' },
            { label: 'Policy Data Source',   value: 'Live web search via Tavily API' },
            { label: 'Default Return Window','value': '30 days (fallback for unknown retailers)' },
            { label: 'Agent Version',        value: 'PPC Agent v1.0' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0 gap-4">
              <span className="text-sm text-slate-600 shrink-0">{label}</span>
              <span className="text-sm font-medium text-navy-900 text-right">{value}</span>
            </div>
          ))}
        </div>
      </Section>

    </div>
  )
}

function Section({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
        <h3 className="text-base font-semibold text-navy-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <div className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900">{value}</div>
    </div>
  )
}
