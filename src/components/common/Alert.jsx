import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

export default function Alert({ type = 'info', message, onDismiss }) {
  const styles = {
    info:    { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',   Icon: Info },
    success: { bg: 'bg-green-50 border-green-200',  text: 'text-green-800',  Icon: CheckCircle },
    warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', Icon: AlertCircle },
    error:   { bg: 'bg-red-50 border-red-200',      text: 'text-red-800',    Icon: XCircle },
  }
  const { bg, text, Icon } = styles[type] ?? styles.info

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${bg}`}>
      <Icon size={16} className={`${text} mt-0.5 shrink-0`} />
      <p className={`text-sm ${text} flex-1`}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className={`${text} hover:opacity-70`}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}

