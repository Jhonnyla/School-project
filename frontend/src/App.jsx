import React, { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import PurchasesTable from './components/PurchasesTable'
import AgentInteraction from './components/AgentInteraction'
import ActionButtons from './components/ActionButtons'
import ActiveClaims from './components/ActiveClaims'
import PolicyDatabase from './components/PolicyDatabase'
import Settings from './components/Settings'
import SyncModal from './components/SyncModal'

// Sync progress steps (fake — for demo realism)
const SYNC_STEPS = [
  'Connecting to Gmail…',
  'Scanning 1,243 emails…',
  'Identifying purchase receipts…',
  'Parsing receipt data…',
  'Loading purchases…',
]

function App() {
  const [currentView, setCurrentView] = useState('Purchases')

  // Purchases — empty until Sync is clicked
  const [purchases, setPurchases] = useState([])

  // Sync progress state
  const [syncState, setSyncState] = useState({ active: false, progress: 0, stepIdx: 0 })
  const syncIntervalRef = useRef(null)

  // Membership modal — shown after sync completes
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  // Pending purchases held until modal is confirmed
  const pendingPurchasesRef = useRef(null)

  // Policy research results → feeds PolicyDatabase
  const [policyResearch, setPolicyResearch] = useState(null)  // null = not yet researched

  // Claims — empty until started from chat
  const [claims, setClaims] = useState([])

  // Whether the user has completed at least one sync (gates Settings memberships)
  const [hasSynced, setHasSynced] = useState(false)

  // Chat state
  const [agentQuestion, setAgentQuestion] = useState('')
  const [agentResponse, setAgentResponse] = useState(null)
  const [isAgentLoading, setAgentLoading] = useState(false)

  // Notifications
  const [notification, setNotification] = useState(null)
  const [loadingAction, setLoadingAction] = useState(null)

  // Load claims from backend on mount (in case server already has some)
  useEffect(() => {
    fetch('/api/claims')
      .then(r => r.json())
      .then(data => setClaims(data.claims || []))
      .catch(() => {})
  }, [])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // ── Chat box ──────────────────────────────────────────────────────────────
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
        pipeline: null,
        claim_context: null,
      })
    } finally {
      setAgentLoading(false)
    }
  }, [])

  // ── Start a return claim from chat ────────────────────────────────────────
  const handleStartClaim = useCallback(async (claimContext) => {
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: claimContext.item,
          retailer: claimContext.retailer,
          days_remaining: claimContext.days_remaining,
          sources: claimContext.sources || [],
        }),
      })
      const data = await res.json()
      setClaims(prev => [...prev, data.claim])
      showNotification('success', `✅ Return claim started for ${claimContext.item}. View it in Active Claims.`)
      setCurrentView('Active Claims')
    } catch {
      showNotification('error', '❌ Could not start claim — is the backend running?')
    }
  }, [])

  // ── Sync Inbox (with progress bar) ───────────────────────────────────────
  const handleSyncInbox = useCallback(async () => {
    setLoadingAction('sync')
    setSyncState({ active: true, progress: 0, stepIdx: 0 })

    // Start animated progress bar while the API call runs in parallel
    let progress = 0
    let stepIdx = 0
    syncIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + 2, 92) // max out at 92% until API returns
      stepIdx = Math.min(Math.floor(progress / (100 / SYNC_STEPS.length)), SYNC_STEPS.length - 1)
      setSyncState({ active: true, progress, stepIdx })
    }, 80)

    try {
      const res = await fetch('/api/agents/inbox-scout', { method: 'POST' })
      const data = await res.json()
      const parsed = data.purchases.map((p) => ({
        ...p,
        purchaseDate: new Date(p.purchaseDate),
      }))
      // Hold purchases — release after membership modal is confirmed
      pendingPurchasesRef.current = { purchases: parsed, scanned: data.scanned, found: data.found }

      // Complete the progress bar
      clearInterval(syncIntervalRef.current)
      setSyncState({ active: true, progress: 100, stepIdx: SYNC_STEPS.length - 1 })

      // Brief pause then show membership modal
      setTimeout(() => {
        setSyncState({ active: false, progress: 0, stepIdx: 0 })
        setShowMembershipModal(true)
      }, 500)
    } catch {
      clearInterval(syncIntervalRef.current)
      setSyncState({ active: false, progress: 0, stepIdx: 0 })
      showNotification('error', '❌ Sync failed — is the FastAPI backend running?')
      setLoadingAction(null)
    }
  }, [])

  // Called when user confirms membership in the modal
  const handleMembershipConfirmed = useCallback(() => {
    setShowMembershipModal(false)
    setHasSynced(true)
    const pending = pendingPurchasesRef.current
    if (pending) {
      setPurchases(pending.purchases)
      showNotification(
        'success',
        `✅ Inbox synced! Scanned ${pending.scanned.toLocaleString()} emails and found ${pending.found} purchase receipt${pending.found !== 1 ? 's' : ''}.`
      )
      pendingPurchasesRef.current = null
    }
    setLoadingAction(null)
  }, [])

  // ── Research Policies (Agent 1 → PolicyDatabase) ──────────────────────────
  const handleResearchPolicies = useCallback(async () => {
    setLoadingAction('research')
    try {
      const res = await fetch('/api/agents/research-policies', { method: 'POST' })
      const data = await res.json()
      setPolicyResearch(data.retailer_cards || [])
      setCurrentView('Policy Database')
      const count = (data.retailer_cards || []).length
      showNotification('success', `✅ Policy research complete — fetched live policies for ${count} retailer${count !== 1 ? 's' : ''}.`)
    } catch {
      showNotification('error', '❌ Policy research failed — is the FastAPI backend running?')
    } finally {
      setLoadingAction(null)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-100">
      {showMembershipModal && (
        <SyncModal onConfirm={handleMembershipConfirmed} />
      )}

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
                  onResearchPolicies={handleResearchPolicies}
                  loadingAction={loadingAction}
                />
              </section>

              <section aria-labelledby="purchases-heading">
                <h3 id="purchases-heading" className="sr-only">Recent purchases</h3>
                <PurchasesTable
                  purchases={purchases}
                  syncState={syncState}
                  syncSteps={SYNC_STEPS}
                />
              </section>

              <section aria-labelledby="agent-heading">
                <h3 id="agent-heading" className="sr-only">Ask the agent</h3>
                <AgentInteraction
                  question={agentQuestion}
                  response={agentResponse?.response}
                  reasoning={agentResponse?.reasoning}
                  sources={agentResponse?.sources}
                  pipeline={agentResponse?.pipeline}
                  claimContext={agentResponse?.claim_context}
                  isLoading={isAgentLoading}
                  onAsk={handleAskAgent}
                  onStartClaim={handleStartClaim}
                />
              </section>
            </>
          )}

          {currentView === 'Active Claims' && (
            <ActiveClaims claims={claims} />
          )}
          {currentView === 'Policy Database' && (
            <PolicyDatabase policyResearch={policyResearch} />
          )}
          {currentView === 'Settings' && <Settings hasSynced={hasSynced} />}
        </div>
      </main>
    </div>
  )
}

export default App
