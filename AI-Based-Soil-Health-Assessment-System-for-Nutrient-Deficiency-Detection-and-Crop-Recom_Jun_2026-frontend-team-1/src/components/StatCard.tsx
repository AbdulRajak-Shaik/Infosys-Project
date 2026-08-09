import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down'
  icon: ReactNode
  iconBg?: string
  gradient?: boolean
  color?: string
}

export default function StatCard({ title, value, change, trend, icon, iconBg = 'bg-green-100', gradient, color }: StatCardProps) {
  if (gradient && color) {
    return (
      <div className="rounded-2xl p-5 text-white shadow-card transition-all-smooth hover:shadow-elevated hover:-translate-y-0.5" style={{ background: color }}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-surface/20 flex items-center justify-center">
            {icon}
          </div>
          {change && (
            <span className="flex items-center gap-1 text-xs font-medium bg-surface/20 px-2 py-1 rounded-full">
              {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {change}
            </span>
          )}
        </div>
        <p className="text-white/80 text-xs font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-5 shadow-sm border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center text-primary-600`}>
          {icon}
        </div>
        {change && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-red-600'}`}>
            {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change}
          </span>
        )}
      </div>
      <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold font-heading text-text-primary tabular-nums">{value}</p>
    </div>
  )
}
