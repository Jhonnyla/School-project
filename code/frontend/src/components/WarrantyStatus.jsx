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

export default function WarrantyStatus({ purchaseDate, returnWindowDays }) {
  const { status, label } = getReturnStatus(purchaseDate, returnWindowDays)

  const statusStyles = {
    active: 'bg-emerald-active text-white',
    expiring: 'bg-amber-expiring text-white',
    expired: 'bg-slate-500 text-white',
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
    </div>
  )
}

export { getReturnDaysRemaining, getReturnStatus }
