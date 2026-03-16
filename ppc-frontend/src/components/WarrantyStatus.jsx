import React from 'react'

/**
 * Returns days remaining in return window from purchase date.
 */
function getReturnDaysRemaining(purchaseDate, returnWindowDays) {
  const end = new Date(purchaseDate)
  end.setDate(end.getDate() + returnWindowDays)
  const now = new Date()
  const ms = end - now
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

/**
 * Status: 'active' (within return window), 'expiring' (≤3 days), 'expired'.
 */
function getReturnStatus(purchaseDate, returnWindowDays) {
  const daysLeft = getReturnDaysRemaining(purchaseDate, returnWindowDays)
  if (daysLeft === 0) return { status: 'expired', daysLeft, label: 'Return window ended' }
  if (daysLeft <= 3) return { status: 'expiring', daysLeft, label: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to return` }
  return { status: 'active', daysLeft, label: `${daysLeft} days left to return` }
}

/**
 * Progress 0–100 for countdown bar (100 = full window remaining, 0 = expired).
 */
function getProgressPercent(purchaseDate, returnWindowDays) {
  const daysLeft = getReturnDaysRemaining(purchaseDate, returnWindowDays)
  return Math.round((daysLeft / returnWindowDays) * 100)
}

export default function WarrantyStatus({ purchaseDate, returnWindowDays }) {
  const { status, daysLeft, label } = getReturnStatus(purchaseDate, returnWindowDays)
  const percent = getProgressPercent(purchaseDate, returnWindowDays)

  const statusStyles = {
    active: 'bg-emerald-active text-white',
    expiring: 'bg-amber-expiring text-white',
    expired: 'bg-slate-500 text-white',
  }

  const barStyles = {
    active: 'bg-emerald-active',
    expiring: 'bg-amber-expiring',
    expired: 'bg-slate-400',
  }

  return (
    <div className="min-w-[140px]">
      <div
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
        role="status"
        aria-label={`Return window: ${label}`}
      >
        {label}
      </div>
      <div
        className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"
        aria-hidden
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barStyles[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export { getReturnDaysRemaining, getReturnStatus }
