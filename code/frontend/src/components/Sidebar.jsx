import React from 'react'

const navItems = [
  { label: 'Purchases', href: '#purchases', icon: '🛒' },
  { label: 'Active Claims', href: '#claims', icon: '📋' },
  { label: 'Settings', href: '#settings', icon: '⚙️' },
  { label: 'Policy Database', href: '#policies', icon: '📚' },
]

export default function Sidebar({ currentView, onNavigate }) {
  return (
    <aside
      className="w-56 min-h-screen bg-navy-900 text-slate-200 flex flex-col shrink-0"
      aria-label="Main navigation"
    >
      <div className="p-5 border-b border-navy-700">
        <h1 className="font-semibold text-lg text-white tracking-tight">
          Post-Purchase Concierge
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Warranty & return tracking</p>
      </div>
      <nav className="p-3 flex-1" aria-label="Primary">
        <ul className="space-y-1">
          {navItems.map(({ label, href, icon }) => (
            <li key={label}>
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate?.(label)
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${currentView === label
                    ? 'bg-navy-700 text-white'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'}
                `}
                aria-current={currentView === label ? 'page' : undefined}
              >
                <span className="text-lg" aria-hidden>{icon}</span>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-navy-700 text-xs text-slate-500">
        PPC Agent v0.1
      </div>
    </aside>
  )
}
