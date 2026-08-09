import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'

export interface SearchInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  containerClassName?: string
  icon?: ReactNode
  rightElement?: ReactNode
}

export function SearchInput({ value, onChange, placeholder, className = '', containerClassName = '', icon, rightElement }: SearchInputProps) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border focus-within:border-text-muted bg-background transition-colors ${containerClassName}`}>
      {icon ? icon : <Search size={16} className="text-text-muted flex-shrink-0" />}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none border-none focus:ring-0 ${className}`}
      />
      {value && !rightElement && (
        <button onClick={() => onChange('')} className="text-text-muted hover:text-text-primary flex-shrink-0 transition-colors">
          <X size={14} />
        </button>
      )}
      {rightElement}
    </div>
  )
}


/** Line-art spinner — two 120° arcs rotating, no solid circle. Replaces Loader2 everywhere. */
export function LineSpinner({ size = 16, color = 'currentColor', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="-8 -8 16 16" className="animate-line-art-spin flex-shrink-0" role="status" aria-label="Loading">
      <path d="M 0 -6.5 A 6.5 6.5 0 0 1 5.63 3.25"
        stroke={color} fill="none" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M 0 6.5 A 6.5 6.5 0 0 1 -5.63 -3.25"
        stroke={color} fill="none" strokeWidth={strokeWidth} strokeLinecap="round" style={{ opacity: 0.3 }} />
    </svg>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outlined' | 'danger' | 'success' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    primary: 'gradient-primary text-white shadow-sm hover:opacity-90 hover:shadow-md active:scale-[0.98]',
    secondary: 'bg-secondary-600 text-white shadow-sm hover:bg-secondary-700 hover:shadow active:scale-[0.98]',
    ghost: 'bg-transparent text-text-secondary hover:bg-background hover:text-text-primary active:scale-[0.98]',
    outlined: 'bg-surface border border-border text-text-primary hover:bg-background active:scale-[0.98]',
    danger: 'bg-error text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
    success: 'bg-success text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
    accent: 'bg-warning text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <LineSpinner size={16} color="currentColor" strokeWidth={2} /> : icon}
      {children}
    </button>
  )
}

interface CardProps { children: ReactNode; className?: string; onClick?: () => void }
export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-xl shadow-sm border border-border transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-primary-100' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface BadgeProps { children: ReactNode; color?: 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple' }
export function Badge({ children, color = 'green' }: BadgeProps) {
  const colors = {
    green: 'bg-primary-50 text-primary-700 border border-primary-100',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    orange: 'bg-orange-50 text-orange-700 border border-orange-100',
    red: 'bg-red-50 text-red-700 border border-red-100',
    gray: 'bg-background text-text-secondary border border-border',
    purple: 'bg-purple-50 text-purple-700 border border-purple-100',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${colors[color]}`}>{children}</span>
}

export function Skeleton({ className = '', variant = 'text' }: { className?: string, variant?: 'text' | 'circular' | 'rectangular' }) {
  const base = "skeleton relative overflow-hidden bg-background"
  const variants = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  }
  return <div className={`${base} ${variants[variant]} ${className}`} />
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  hint?: string
}
export function Input({ label, error, hint, icon, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-semibold text-text-primary">{label}{props.required && <span className="text-error ml-1">*</span>}</label>}
      <div className="relative group">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-600 transition-colors">{icon}</div>}
        <input
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-background placeholder-text-muted transition-all duration-200 outline-none focus:ring-2 focus:border-text-muted focus:ring-text-muted/25 ${icon ? 'pl-9' : ''} ${error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-border hover:border-border'}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error animate-fade-in">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}

interface SelectInputProps {
  label?: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
}
export function SelectInput({ label, options, value, onChange, className = '' }: SelectInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-background text-text-primary transition-all-smooth hover:border-border appearance-none focus:outline-none focus:border-text-muted focus:ring-2 focus:ring-text-muted/25"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function ProgressBar({ value, color = '#2E7D32', label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-text-muted mb-1"><span>{label}</span><span>{value}%</span></div>}
      <div className="w-full bg-background rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const colors = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />
}

export function Breadcrumb({ items, onNavigate }: {
  items: { label: string; page?: string }[]
  onNavigate?: (page: string) => void
}) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-1" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-text-muted select-none">›</span>}
          {item.page && onNavigate ? (
            <button
              onClick={() => onNavigate(item.page!)}
              className="text-green-700 hover:text-green-800 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-text-muted">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'warning'; onClose: () => void }) {
  const wrapperStyles = {
    success: 'bg-surface border-green-200 text-green-800',
    error:   'bg-surface border-red-200   text-red-700',
    warning: 'bg-surface border-amber-200 text-amber-700',
  }
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-xl border shadow-elevated animate-toast-in ${wrapperStyles[type]}`}>
      {/* Line-art icon per type */}
      {type === 'success' && (
        <svg width="24" height="24" viewBox="-12 -12 24 24" className="flex-shrink-0" aria-hidden="true">
          {/* Stem */}
          <path d="M 0 9 L 0 -1" stroke="#2E7D32" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Left leaf drawing itself */}
          <path d="M 0 5 C -5 2 -7 -2 -4 -6 C -1 -3 0 5 0 5"
            stroke="#43A047" fill="none" strokeWidth="1.8" strokeLinecap="round"
            pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            className="animate-check-draw" />
          {/* Right leaf drawing itself */}
          <path d="M 0 0 C 5 -3 7 -7 4 -10 C 1 -7 0 0 0 0"
            stroke="#2E7D32" fill="none" strokeWidth="1.8" strokeLinecap="round"
            pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animationDelay: '0.15s' }}
            className="animate-check-draw" />
          {/* Checkmark drawing itself */}
          <path d="M -6 -1 L -3 3 L 6 -6"
            stroke="#43A047" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1, animationDelay: '0.4s' }}
            className="animate-check-draw" />
        </svg>
      )}
      {type === 'error' && (
        <svg width="22" height="22" viewBox="-11 -11 22 22" className="flex-shrink-0" aria-hidden="true">
          {/* Wilted plant stem */}
          <path d="M 0 8 C 0 4 0 0 0 -2 C 0 -5 4 -7 6 -6" stroke="#E53935" fill="none" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 0 2 C -5 0 -7 -3 -4 -7" stroke="#EF5350" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {type === 'warning' && (
        <svg width="22" height="22" viewBox="-11 -11 22 22" className="flex-shrink-0" aria-hidden="true">
          <path d="M 0 -8 L 0 1" stroke="#F9A825" fill="none" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="0" cy="6" r="1.8" stroke="#F9A825" fill="none" strokeWidth="1.8" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="ml-1 opacity-40 hover:opacity-70 transition-opacity">
        <svg width="12" height="12" viewBox="-6 -6 12 12">
          <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
