import React, { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import PurchasesTable from './components/PurchasesTable'
import AgentInteraction from './components/AgentInteraction'
import ActionButtons from './components/ActionButtons'
import ActiveClaims from './components/ActiveClaims'
import PolicyDatabase from './components/PolicyDatabase'
import Settings from './components/Settings'
import ReceiptUpload from './components/ReceiptUpload'

function App() {
  const [currentView, setCurrentView] = useState('Purchases')

  // Purchases — empty until Sync is clicked
  const [purchases, setPurchases] = useState([])

  // Sync progress state
  const [syncState, setSyncState] = useState({ active: false, progress: 0, stepIdx: 0 })

  // Policy database — auto-populated from /api/policies after each upload
  const [policyResearch, setPolicyResearch] = useState([])

  // Claims — empty until started from chat
  const [claims, setClaims] = useState([])

  const [showUpload, setShowUpload] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [chatMessages, setChatMessages] = useState([])

  // Notifications
  const [notification, setNotification] = useState(null)
  const [loadingAction, setLoadingAction] = useState(null)

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadPolicies = useCallback(async () => {
    try {
      const res = await fetch('/api/policies')
      const data = await res.json()
      if (data.policies?.length > 0) setPolicyResearch(data.policies)
    } catch {}
  }, [])

  // Load claims, policies, and Gmail auth status on mount
  useEffect(() => {
    fetch('/api/claims')
      .then(r => r.json())
      .then(data => setClaims(data.claims || []))
      .catch(() => {})

    loadPolicies()
  }, [loadPolicies])

  const handleAskConcierge = useCallback((purchase) => {
    setSelectedPurchase(purchase)
    setCurrentView('Purchases') // stay on dashboard where concierge is visible
    // Scroll to concierge section after a tick
    setTimeout(() => {
      document.getElementById('concierge-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  // ── Chat box ──────────────────────────────────────────────────────────────
  const handleAskAgent = useCallback(async (question) => {
    // Add user message to chat
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: question }
    const loadingMsg = { id: `a-${Date.now()}`, role: 'assistant', loading: true, loadingLabel: 'Researching…', content: '' }
    setChatMessages(prev => [...prev, userMsg, loadingMsg])
    setLoadingAction('ask')

    // Build history for backend (exclude the loading placeholder)
    const history = chatMessages
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          purchase_context: selectedPurchase || null,
          conversation_history: history,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Agent error')

      const assistantMsg = {
        id: loadingMsg.id,
        role: 'assistant',
        content: data.response || 'No response.',
        sources: data.sources || [],
        claimContext: data.claim_context,
        noPurchaseFound: data.no_purchase_found || false,
        loading: false,
      }
      setChatMessages(prev => prev.map(m => m.id === loadingMsg.id ? assistantMsg : m))
    } catch (e) {
      setChatMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, loading: false, content: `Error: ${e.message}` }
          : m
      ))
    } finally {
      setLoadingAction(null)
    }
  }, [selectedPurchase, chatMessages])

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


  return (
    <div className="flex min-h-screen bg-slate-100">
      {showUpload && (
        <ReceiptUpload
          onAdd={(purchase) => {
            setPurchases(prev => [purchase, ...prev])
            loadPolicies()
            showNotification('success', `✅ ${purchase.productName} added — policies researched and saved.`)
          }}
          onClose={() => setShowUpload(false)}
        />
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
                  onUploadReceipt={() => setShowUpload(true)}
                  loadingAction={loadingAction}
                />
              </section>

              <section aria-labelledby="purchases-heading">
                <h3 id="purchases-heading" className="sr-only">Recent purchases</h3>
                <PurchasesTable
                  purchases={purchases}
                  setPurchases={setPurchases}
                  syncState={syncState}
                  syncSteps={[]}
                  onStartClaim={handleStartClaim}
                  onAskConcierge={handleAskConcierge}
                />
              </section>

              <section aria-labelledby="agent-heading">
                <h3 id="agent-heading" className="sr-only">Ask the agent</h3>
                <div id="concierge-section">
                  <AgentInteraction
                    selectedPurchase={selectedPurchase}
                    onClearPurchase={() => setSelectedPurchase(null)}
                    messages={chatMessages}
                    isLoading={loadingAction === 'ask'}
                    onAsk={handleAskAgent}
                    onStartClaim={handleStartClaim}
                  />
                </div>
              </section>
            </>
          )}

          {currentView === 'Active Claims' && (
            <ActiveClaims claims={claims} />
          )}
          {currentView === 'Policy Database' && (
            <PolicyDatabase policyResearch={policyResearch} />
          )}
          {currentView === 'Settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}

export default App
