import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import PurchasesTable from './components/PurchasesTable'
import AgentInteraction from './components/AgentInteraction'
import ActionButtons from './components/ActionButtons'
import { mockPurchases, mockAgentResponse } from './data/mockPurchases'

function App() {
  const [currentView, setCurrentView] = useState('Purchases')
  const [agentQuestion, setAgentQuestion] = useState('')
  const [agentResponse, setAgentResponse] = useState(null)
  const [isAgentLoading, setAgentLoading] = useState(false)

  const handleAskAgent = useCallback((question) => {
    setAgentQuestion(question)
    setAgentLoading(true)
    // Simulate API delay; replace with: fetch('/api/agent/ask', { method: 'POST', body: JSON.stringify({ question }) })
    setTimeout(() => {
      setAgentResponse({
        ...mockAgentResponse,
        question,
        response: mockAgentResponse.response,
        reasoning: mockAgentResponse.reasoning,
        sources: mockAgentResponse.sources,
      })
      setAgentLoading(false)
    }, 800)
  }, [])

  const handleSyncInbox = useCallback(() => {
    // TODO: POST /api/agents/inbox-scout
    alert('Sync Inbox: Connect this button to your Inbox Scout agent (e.g. POST /api/agents/inbox-scout)')
  }, [])

  const handleCheckReturn = useCallback(() => {
    // TODO: POST /api/agents/policy-researcher or open eligibility flow
    alert('Check Return Eligibility: Connect to Policy Researcher agent')
  }, [])

  const handleAddCalendar = useCallback(() => {
    // TODO: POST /api/agents/scheduler
    alert('Add to Calendar: Connect to Scheduler agent')
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

          {currentView === 'Purchases' && (
            <>
              <section aria-labelledby="actions-heading">
                <h3 id="actions-heading" className="sr-only">
                  Key actions
                </h3>
                <ActionButtons
                  onSyncInbox={handleSyncInbox}
                  onCheckReturn={handleCheckReturn}
                  onAddCalendar={handleAddCalendar}
                />
              </section>

              <section aria-labelledby="purchases-heading">
                <div id="purchases-heading" className="sr-only">
                  Recent purchases table
                </div>
                <PurchasesTable purchases={mockPurchases} />
              </section>

              <section aria-labelledby="agent-heading">
                <h2 id="agent-heading" className="sr-only">
                  Ask the agent
                </h2>
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

          {(currentView === 'Active Claims' || currentView === 'Settings' || currentView === 'Policy Database') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              <p>
                {currentView} view — placeholder for future content. Navigate to Purchases for the main dashboard.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
