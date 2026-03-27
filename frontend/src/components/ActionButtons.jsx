import React from 'react'

const actions = [
  {
    id: 'sync-inbox',
    loadingKey: 'sync',
    label: 'Sync Inbox',
    loadingLabel: 'Syncing…',
    description: 'Scan your email receipts and load purchases',
    icon: '📥',
    ariaLabel: 'Sync inbox to scan for purchase receipts',
  },
  {
    id: 'research-policies',
    loadingKey: 'research',
    label: 'Research Policies',
    loadingLabel: 'Researching…',
    description: 'Agent 1 searches the web for live return & warranty policies',
    icon: '🔍',
    ariaLabel: 'Run Policy Research Agent on all purchases',
  },
]

export default function ActionButtons({
  onSyncInbox,
  onResearchPolicies,
  loadingAction,
}) {
  const handlers = {
    'sync-inbox': onSyncInbox,
    'research-policies': onResearchPolicies,
  }

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Agent actions">
      {actions.map(({ id, loadingKey, label, loadingLabel, description, icon, ariaLabel }) => {
        const isLoading = loadingAction === loadingKey
        const isDisabled = !!loadingAction

        return (
          <button
            key={id}
            type="button"
            onClick={() => handlers[id]?.()}
            disabled={isDisabled}
            aria-label={isLoading ? loadingLabel : ariaLabel}
            title={description}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 border-navy-200 bg-white text-navy-800 font-medium hover:border-emerald-active hover:bg-emerald-light/30 hover:text-navy-900 focus:ring-2 focus:ring-emerald-active/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-xl" aria-hidden>
              {isLoading ? '⏳' : icon}
            </span>
            {isLoading ? loadingLabel : label}
          </button>
        )
      })}
    </div>
  )
}
