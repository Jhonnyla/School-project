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
    { name: 'Gmail',       email: 'jhonatan@gmail.com', connected: true,  icon: '📧' },
    { name: 'Outlook',     email: '—',                   connected: false, icon: '📮' },
    { name: 'Apple Mail',  email: '—',                   connected: false, icon: '🍎' },
  ])

  const [memberships, setMemberships] = useState([])

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => setMemberships(data.memberships_detail || []))
      .catch(() => {})
  }, [])

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))

  const tierColor = (tier) => {
    if (tier === 'plus'  || tier === 'prime')  return 'bg-blue-100 text-blue-700 border-blue-200'
    if (tier === 'total' || tier === 'member') return 'bg-purple-100 text-purple-700 border-purple-200'
    return 'bg-slate-100 text-slate-500 border-slate-200'
  }

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
        title="Memberships & Loyalty Programs"
        description="Active memberships that extend your return windows beyond the standard policy."
      >
        {memberships.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Loading memberships…</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {memberships.map((m) => (
              <li key={m.retailer} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{m.retailer}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Return window: <span className="font-medium text-navy-900">{m.returnWindowDays} days</span>
                    {' '}·{' '}
                    <a
                      href={m.policyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      View policy ↗
                    </a>
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tierColor(m.tier)}`}>
                  {m.tierLabel}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Best Buy Plus benefit callout */}
        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
          <span className="text-lg mt-0.5">💳</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">My Best Buy Plus — Active</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your Plus membership doubles Best Buy's standard 15-day return window to
              <span className="font-bold"> 30 days</span> on all eligible purchases.
              The PPC automatically applies this when checking your eligibility.
            </p>
          </div>
        </div>
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
      <Section title="Agent Preferences" description="Control how the PPC agent behaves.">
        <div className="space-y-3">
          {[
            { label: 'Default Return Window', value: '30 days (fallback for unknown retailers)' },
            { label: 'Auto-Scan Frequency',   value: 'Every 24 hours' },
            { label: 'AI Model',              value: 'Groq / Llama 3.3-70B Versatile' },
            { label: 'Agent Version',         value: 'PPC Agent v0.2' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-600">{label}</span>
              <span className="text-sm font-medium text-navy-900">{value}</span>
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
