import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import PurchasesTable from './components/PurchasesTable'
import AgentInteraction from './components/AgentInteraction'
import ActionButtons from './components/ActionButtons'
import ActiveClaims from './components/ActiveClaims'
import PolicyDatabase from './components/PolicyDatabase'
import Settings from './components/Settings'
import { mockPurchases } from './data/mockPurchases'

function App() {
  const [currentView, setCurrentView] = useState('Purchases')
  const [purchases, setPurchases] = useState(mockPurchases)
  const [agentQuestion, setAgentQuestion] = useState('')
  const [agentResponse, setAgentResponse] = useState(null)
  const [isAgentLoading, setAgentLoading] = useState(false)
  const [notification, setNotification] = useState(null) // { type: 'success'|'error', message }
  const [loadingAction, setLoadingAction] = useState(null) // 'sync' | 'check' | 'calendar'

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // ── Chat box ─────────────────────────────────────────────────────────────
  const handleAskAgent = useCallback(async (question) => {
    setAgentQuestion(question)
    setAgentLoading(true)
    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      setAgentResponse({ ...data, question })
    } catch {
      setAgentResponse({
        question,
        reasoning: 'Could not reach the backend. Make sure the FastAPI server is running on port 8000.',
        response: 'Connection error — the concierge service is unavailable right now.',
        sources: [],
      })
    } finally {
      setAgentLoading(false)
    }
  }, [])

  // ── Sync Inbox ────────────────────────────────────────────────────────────
  const handleSyncInbox = useCallback(async () => {
    setLoadingAction('sync')
    try {
      const res = await fetch('/api/agents/inbox-scout', { method: 'POST' })
      const data = await res.json()
      // Backend sends ISO date strings — convert them back to Date objects
      const parsed = data.purchases.map((p) => ({
        ...p,
        purchaseDate: new Date(p.purchaseDate),
      }))
      setPurchases(parsed)
      showNotification(
        'success',
        `✅ Inbox synced! Scanned ${data.scanned.toLocaleString()} emails and found ${data.found} purchase receipt${data.found !== 1 ? 's' : ''}.`
      )
    } catch {
      showNotification('error', '❌ Sync failed — is the FastAPI backend running?')
    } finally {
      setLoadingAction(null)
    }
  }, [])

  // ── Check Return Eligibility ──────────────────────────────────────────────
  const handleCheckReturn = useCallback(async () => {
    setLoadingAction('check')
    try {
      const res = await fetch('/api/agents/policy-researcher', { method: 'POST' })
      const data = await res.json()
      const q = 'Check return eligibility for all my purchases'
      setAgentQuestion(q)
      setAgentResponse({ question: q, ...data })
    } catch {
      showNotification('error', '❌ Policy check failed — is the FastAPI backend running?')
    } finally {
      setLoadingAction(null)
    }
  }, [])

  // ── Add to Calendar ───────────────────────────────────────────────────────
  const handleAddCalendar = useCallback(async () => {
    setLoadingAction('calendar')
    try {
      const res = await fetch('/api/agents/scheduler', { method: 'POST' })
      const data = await res.json()
      showNotification('success', data.message)
    } catch {
      showNotification('error', '❌ Scheduler failed — is the FastAPI backend running?')
    } finally {
      setLoadingAction(null)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h2 className="text-2xl font-bold text-navy-900">
              {currentView === 'Purchases' ? 'Dashboard' : currentView}
            </h2>
            <p className="text-slate-600 mt-1">
              {currentView === 'Purchases'
                ? 'Overview of recent purchases and return windows.'
                : `Manage your ${currentView.toLowerCase()}.`}
            </p>
          </header>

          {/* Toast notification */}
          {notification && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-lg px-4 py-3 text-sm font-medium border ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {notification.message}
            </div>
          )}

          {currentView === 'Purchases' && (
            <>
              <section aria-labelledby="actions-heading">
                <h3 id="actions-heading" className="sr-only">Key actions</h3>
                <ActionButtons
                  onSyncInbox={handleSyncInbox}
                  onCheckReturn={handleCheckReturn}
                  onAddCalendar={handleAddCalendar}
                  loadingAction={loadingAction}
                />
              </section>

              <section aria-labelledby="purchases-heading">
                <h3 id="purchases-heading" className="sr-only">Recent purchases</h3>
                <PurchasesTable purchases={purchases} />
              </section>

              <section aria-labelledby="agent-heading">
                <h3 id="agent-heading" className="sr-only">Ask the agent</h3>
                <AgentInteraction
                  question={agentQuestion}
                  response={agentResponse?.response}
                  reasoning={agentResponse?.reasoning}
                  sources={agentResponse?.sources}
                  isLoading={isAgentLoading}
                  onAsk={handleAskAgent}
                />
              </section>
            </>
          )}

          {currentView === 'Active Claims' && <ActiveClaims />}
          {currentView === 'Policy Database' && <PolicyDatabase />}
          {currentView === 'Settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}

export default App
