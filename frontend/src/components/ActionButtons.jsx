import React from 'react'

export default function ActionButtons({ onUploadReceipt, loadingAction }) {
  return (
    <div className="flex flex-wrap gap-3 items-start" role="group" aria-label="Agent actions">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onUploadReceipt}
          disabled={!!loadingAction}
          aria-label="Upload a receipt for Gemini to read"
          title="Gemini Vision reads your receipt and automatically researches return & warranty policies"
          className="flex items-center gap-2.5 px-5 py-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-xl" aria-hidden>📄</span>
          Upload Receipt
        </button>
        <span className="text-xs text-slate-500 pl-1">
          Gemini reads it → researches policies → tracks your warranty
        </span>
      </div>
    </div>
  )
}
