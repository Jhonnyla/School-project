import React, { useState } from 'react'

export default function Settings() {
  const [notifications, setNotifications] = useState({
    returnAlerts:   true,
    warrantyExpiry: true,
    claimUpdates:   true,
  })

  const profile = {
    name:     'Alex Rivera',
    email:    'alex.rivera@example.com',
    timezone: 'America/New_York',
    currency: 'USD',
  }

  const toggle = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))

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

      {/* Notifications */}
      <Section title="Notifications" description="Choose when the concierge alerts you.">
        <ul className="divide-y divide-slate-100">
          {[
            { key: 'returnAlerts',   label: 'Return Window Alerts',   desc: 'Notify me 3 days before a return window closes.' },
            { key: 'warrantyExpiry', label: 'Warranty Expiry Alerts', desc: 'Alert me 30 days before a product warranty expires.' },
            { key: 'claimUpdates',   label: 'Claim Status Updates',   desc: 'Notify me when a return claim status changes.' },
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
