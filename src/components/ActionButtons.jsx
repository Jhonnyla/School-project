import React from 'react'

const actions = [
  {
    id: 'sync-inbox',
    label: 'Sync Inbox',
    description: 'Trigger the Inbox Scout agent',
    icon: '📥',
    ariaLabel: 'Sync inbox to scan for new receipts',
  },
  {
    id: 'check-return',
    label: 'Check Return Eligibility',
    description: 'Trigger the Policy Researcher',
    icon: '📋',
    ariaLabel: 'Check return eligibility for a purchase',
  },
  {
    id: 'add-calendar',
    label: 'Add to Calendar',
    description: 'Trigger the Scheduler',
    icon: '📅',
    ariaLabel: 'Add return deadline to calendar',
  },
]

export default function ActionButtons({ onSyncInbox, onCheckReturn, onAddCalendar }) {
  const handlers = {
    'sync-inbox': onSyncInbox,
    'check-return': onCheckReturn,
    'add-calendar': onAddCalendar,
  }

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Agent actions">
      {actions.map(({ id, label, description, icon, ariaLabel }) => (
        <button
          key={id}
          type="button"
          onClick={() => handlers[id]?.()}
          aria-label={ariaLabel}
          title={description}
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 border-navy-200 bg-white text-navy-800 font-medium hover:border-emerald-active hover:bg-emerald-light/30 hover:text-navy-900 focus:ring-2 focus:ring-emerald-active/30 transition-colors"
        >
          <span className="text-xl" aria-hidden>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
