import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Konfirmasi', cancelLabel = 'Batal', variant = 'warning', onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null

  const variantStyles = {
    danger: { bg: 'bg-red-100', icon: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-amber-100', icon: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
    info: { bg: 'bg-blue-100', icon: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
  }

  const s = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${s.bg}`}>
            <AlertTriangle size={24} className={s.icon} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <button onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${s.btn}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
