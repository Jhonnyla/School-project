import React, { useState, useRef } from 'react'

const ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf'

const PHASES = [
  { key: 'reading',     label: 'Gemini is reading your receipt…' },
  { key: 'researching', label: 'Researching return & warranty policies…' },
  { key: 'done',        label: 'Done!' },
]

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )
}

export default function ReceiptUpload({ onAdd, onClose }) {
  const [dragging, setDragging] = useState(false)
  const [phase, setPhase]       = useState(null)   // null | 'reading' | 'researching' | 'done'
  const [error, setError]       = useState(null)
  const [fileName, setFileName] = useState(null)
  const [preview, setPreview]   = useState(null)   // { purchase, policy }
  const inputRef = useRef()

  async function processFile(file) {
    setError(null)
    setPreview(null)
    setFileName(file.name)
    setPhase('reading')

    const form = new FormData()
    form.append('file', file)

    try {
      // Phase 1 label shows while the fetch runs (Vision + policy research both happen server-side)
      // We switch to 'researching' label after a short delay so the user sees both steps
      const phaseTimer = setTimeout(() => setPhase('researching'), 3500)

      const res  = await fetch('/api/receipts/upload', { method: 'POST', body: form })
      clearTimeout(phaseTimer)

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Server is restarting — please try again in a moment.')
      }

      if (!res.ok) throw new Error(data.detail || 'Upload failed')

      if (!data.success) {
        setPhase(null)
        if (data.reason === 'return')        setError("This looks like a return/refund receipt — it won't be added.")
        else if (data.reason === 'not_a_receipt') setError("Gemini couldn't identify this as a purchase receipt. Try a clearer image.")
        else setError('Could not extract purchase info from this file.')
        return
      }

      setPhase('done')
      setPreview({ purchase: data.purchase, policy: data.policy })
    } catch (e) {
      setPhase(null)
      setError(e.message)
    }
  }

  function handleFiles(files) {
    if (files?.length) processFile(files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleConfirm() {
    if (!preview) return
    onAdd(preview.purchase)
    onClose()
  }

  function updatePurchase(key, value) {
    setPreview(prev => ({ ...prev, purchase: { ...prev.purchase, [key]: value } }))
  }

  const currentPhase = PHASES.find(p => p.key === phase)
  const loading = phase === 'reading' || phase === 'researching'
  const p = preview?.purchase
  const pol = preview?.policy

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upload Receipt</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gemini reads it → researches policy → tracks your warranty automatically
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">

          {/* Drop zone */}
          {!loading && !preview && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors
                ${dragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}
              `}
            >
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
                onChange={e => handleFiles(e.target.files)} />
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">
                {fileName ? `✓ ${fileName}` : 'Drop receipt here or click to browse'}
              </p>
              <p className="text-xs text-slate-400">JPG, PNG, HEIC, PDF — up to 20 MB</p>
            </div>
          )}

          {/* Agentic progress */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-slate-700">{currentPhase?.label}</p>
                <div className="flex gap-2 mt-1">
                  {PHASES.slice(0, 2).map(ph => (
                    <span key={ph.key}
                      className={`text-xs px-2 py-0.5 rounded-full ${phase === ph.key ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100 text-slate-400'}`}>
                      {ph.key === 'reading' ? '1. Read receipt' : '2. Research policy'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {error}
            </div>
          )}

          {/* Confirmation preview */}
          {preview && p && (
            <div className="flex flex-col gap-4">

              {/* Success banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-col gap-1">
                <p className="text-sm font-semibold text-emerald-800">✓ Receipt read + policies researched</p>
                <p className="text-xs text-emerald-600">Edit any field below before adding to your purchases.</p>
              </div>

              {/* Editable purchase fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Product" value={p.productName} onChange={v => updatePurchase('productName', v)} />
                </div>
                <Field label="Retailer" value={p.retailer} onChange={v => updatePurchase('retailer', v)} />
                <Field label="Total Paid ($)" value={p.price} onChange={v => updatePurchase('price', parseFloat(v) || 0)} type="number" />
                <Field label="Purchase Date" value={p.purchaseDate} onChange={v => updatePurchase('purchaseDate', v)} type="date" />
                <Field label="Order #" value={p.orderNumber || ''} onChange={v => updatePurchase('orderNumber', v || null)} />
              </div>

              {/* Policy summary from Agent 1 */}
              {pol && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Policy Research</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                    <span className="text-slate-400">Return window</span>
                    <span className="font-medium">{p.returnWindowDays} days</span>
                    {pol.conditions && (
                      <>
                        <span className="text-slate-400">Conditions</span>
                        <span>{pol.conditions}</span>
                      </>
                    )}
                    {pol.warranty_summary && (
                      <>
                        <span className="text-slate-400">Warranty</span>
                        <span>{pol.warranty_summary}</span>
                      </>
                    )}
                  </div>
                  {pol.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {pol.sources.slice(0, 3).map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline">
                          ↗ {s.label?.slice(0, 30) || 'Source'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setPreview(null); setFileName(null); setPhase(null) }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Try another
                </button>
                <button onClick={handleConfirm}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                  Add to purchases
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
