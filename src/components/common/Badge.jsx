export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    green:   'bg-green-100 text-green-700',
    red:     'bg-red-100 text-red-700',
    yellow:  'bg-yellow-100 text-yellow-700',
    blue:    'bg-blue-100 text-blue-700',
    orange:  'bg-orange-100 text-orange-700',
    purple:  'bg-violet-100 text-violet-700',
  }
  return (
    <span className={`badge ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </span>
  )
}

