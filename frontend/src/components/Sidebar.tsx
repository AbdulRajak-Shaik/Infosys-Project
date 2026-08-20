import { type ReactNode } from 'react'
import {
  LayoutDashboard, Leaf, Sprout, FlaskConical, Bug, Bot, Cloud,
  Bell, History, MessageSquare, User, Settings, LogOut, ChevronRight,
  Users, BarChart3, FileText, X, Info
} from 'lucide-react'
import { FEATURES } from '../config'
import { useTranslation } from '../i18n'
import { useLanguage } from '../contexts/LanguageContext'
import { getLocalizedPersonName } from '../services/api'
import { useSarvamUsername } from '../services/sarvamClient'

type Role = 'farmer' | 'admin'
type Page = string

interface NavItem {
  id: Page
  label: string
  icon: ReactNode
  badge?: number
}

interface SidebarProps {
  role: Role
  user?: any
  currentPage: Page
  onNavigate: (page: Page) => void
  onLogout: () => void
  collapsed?: boolean
  onClose?: () => void
  notifBadge?: number
}

const farmerNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'soil', label: 'Soil Classification', icon: <Leaf size={18} /> },
  { id: 'crop', label: 'Crop Recommendation', icon: <Sprout size={18} /> },
  { id: 'fertilizer', label: 'Fertilizer', icon: <FlaskConical size={18} /> },
  ...(FEATURES.DISEASE_DETECTION ? [{ id: 'disease', label: 'Disease Detection', icon: <Bug size={18} /> }] : []),
  { id: 'chatbot', label: 'AI Chatbot', icon: <Bot size={18} /> },
  { id: 'weather', label: 'Weather', icon: <Cloud size={18} /> },
  { id: 'community', label: 'Community', icon: <Users size={18} /> },
  { id: 'history', label: 'History', icon: <History size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} /> },
  { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  { id: 'about', label: 'About AgroAI', icon: <Info size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]


const adminNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'chatbot-monitoring', label: 'Chatbot Monitoring', icon: <Bot size={18} /> },
  { id: 'users', label: 'User Management', icon: <Users size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]

const roleColors: Record<Role, string> = {
  farmer: 'from-green-600 to-green-700',

  admin: 'from-purple-600 to-purple-700',
}

const headerGradients: Record<Role, string> = {
  farmer:     'linear-gradient(135deg, #14422A 0%, #1B5E20 40%, #2E7D32 75%, #1A4731 100%)',

  admin:      'linear-gradient(135deg, #2D0854 0%, #4A148C 40%, #6A1B9A 75%, #3A0D6E 100%)',
}

const roleSubtitles: Record<Role, string> = {
  farmer:     'AI Farming Platform',

  admin:      'System Administration',
}

export default function Sidebar({ role, user, currentPage, onNavigate, onLogout, onClose, notifBadge = 0 }: SidebarProps) {
  const { t } = useTranslation()
  const farmerNavTranslated: NavItem[] = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
    { id: 'soil', label: t('soil'), icon: <Leaf size={18} /> },
    { id: 'crop', label: t('crop'), icon: <Sprout size={18} /> },
    { id: 'fertilizer', label: t('fertilizer'), icon: <FlaskConical size={18} /> },
    ...(FEATURES.DISEASE_DETECTION ? [{ id: 'disease', label: t('disease'), icon: <Bug size={18} /> }] : []),
    { id: 'chatbot', label: t('chatbot'), icon: <Bot size={18} /> },
    { id: 'weather', label: t('weather'), icon: <Cloud size={18} /> },
    { id: 'community', label: t('community'), icon: <Users size={18} /> },
    { id: 'history', label: t('history'), icon: <History size={18} /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell size={18} /> },
    { id: 'feedback', label: t('feedback'), icon: <MessageSquare size={18} /> },
    { id: 'profile', label: t('profile'), icon: <User size={18} /> },
    { id: 'about', label: t('about'), icon: <Info size={18} /> },
    { id: 'settings', label: t('settings'), icon: <Settings size={18} /> },
  ]
  const adminNavTranslated: NavItem[] = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
    { id: 'chatbot-monitoring', label: t('chatbotMonitoring'), icon: <Bot size={18} /> },
    { id: 'users', label: t('userManagement'), icon: <Users size={18} /> },
    { id: 'analytics', label: t('analytics'), icon: <BarChart3 size={18} /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell size={18} /> },
    { id: 'feedback', label: t('feedback'), icon: <MessageSquare size={18} /> },
    { id: 'reports', label: t('reports'), icon: <FileText size={18} /> },
    { id: 'settings', label: t('settings'), icon: <Settings size={18} /> },
  ]
  const { currentLanguage: currentLang } = useLanguage()
  const nav = role === 'admin' ? adminNavTranslated : farmerNavTranslated
  const rawName = user?.username || (role === 'admin' ? t('systemAdmin') : t('farmer'))
  const sarvamName = useSarvamUsername(rawName)
  const displayName = sarvamName || getLocalizedPersonName(rawName, currentLang)
  const displayEmail = user?.email || (role === 'admin' ? 'admin@agroai.com' : 'farmer@agroai.com')
  const initials = user?.username
    ? user.username.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (role === 'admin' ? 'SA' : (currentLang === 'te' ? 'రా' : currentLang === 'ta' ? 'ரா' : currentLang === 'hi' ? 'रा' : 'RF'))

  return (
    <aside className="w-64 h-full flex flex-col bg-surface border-r border-border shadow-soft">
      {/* Premium Header */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          background: headerGradients[role],
          borderRadius: '0 0 22px 22px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        {/* Decorative SVG — topographic lines, circuit traces, AI nodes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 256 96"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Topographic contour ellipses in top-right */}
          <ellipse cx="236" cy="-18" rx="72" ry="72" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="12" />
          <ellipse cx="236" cy="-18" rx="50" ry="50" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="9" />
          <ellipse cx="236" cy="-18" rx="30" ry="30" fill="none" stroke="rgba(255,255,255,0.04)"  strokeWidth="7" />
          {/* Circuit trace lines */}
          <path d="M 198 12 L 216 30 L 242 30" stroke="rgba(255,255,255,0.09)" fill="none" strokeWidth="1" strokeLinecap="round" />
          <path d="M 210 4 L 210 20 L 230 20" stroke="rgba(255,255,255,0.07)" fill="none" strokeWidth="1" strokeLinecap="round" />
          <path d="M 242 30 L 242 54 L 256 66" stroke="rgba(255,255,255,0.06)" fill="none" strokeWidth="1" strokeLinecap="round" />
          {/* AI node dots at circuit junctions */}
          <circle cx="216" cy="30" r="2"   fill="rgba(255,255,255,0.14)" />
          <circle cx="242" cy="30" r="2.5" fill="rgba(255,255,255,0.18)" />
          <circle cx="230" cy="20" r="1.8" fill="rgba(255,255,255,0.13)" />
          <circle cx="242" cy="54" r="1.5" fill="rgba(255,255,255,0.1)" />
          {/* Leaf-vein suggestion in bottom-right corner */}
          <path d="M 256 96 C 238 80 226 60 240 42 C 252 60 256 78 256 96 Z" fill="rgba(255,255,255,0.04)" />
          <path d="M 256 96 C 244 74 238 52 252 36 C 256 58 256 76 256 96 Z" fill="rgba(255,255,255,0.03)" />
          {/* Small floating leaf particle */}
          <path d="M 228 70 C 220 64 218 56 228 54 C 234 56 232 68 228 70 Z" fill="rgba(255,255,255,0.06)" />
          <path d="M 248 78 C 242 74 240 68 248 66 C 252 68 251 76 248 78 Z" fill="rgba(255,255,255,0.05)" />
        </svg>

        {/* Radial glow behind logo */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.13) 0%, transparent 68%)',
          }}
        />

        {/* Main content */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-6">
          {/* Logo + text */}
          <div className="flex items-center gap-3.5">
            {/* Frosted-glass logo container */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.24)',
              }}
            >
              <Leaf
                size={22}
                className="text-white"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }}
              />
            </div>

            {/* Text hierarchy */}
            <div>
              <p
                className="text-white font-bold leading-tight"
                style={{ fontSize: 16, letterSpacing: '-0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
              >
                {t('AgroAI')}
              </p>
              <p
                className="font-medium mt-0.5"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.04em' }}
              >
                {role === 'admin' ? t('systemAdmin') : t('aiFarmingPlatform')}
              </p>
            </div>
          </div>

          {/* Circular close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden flex-shrink-0 flex items-center justify-center transition-all active:scale-90"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: 'rgba(255,255,255,0.78)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label={t('closeNavigationMenu')}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Bottom shimmer row — subtle AI nodes */}
        <div
          className="absolute bottom-3 left-5 flex items-center gap-1.5 pointer-events-none"
          aria-hidden="true"
        >
          {[3.5, 2, 2.5, 2, 3, 2, 2.5].map((size, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: size,
                height: size,
                background: i % 3 === 0 ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.14)',
                boxShadow: i % 3 === 0 ? '0 0 4px rgba(255,255,255,0.25)' : 'none',
              }}
            />
          ))}
          <div
            className="rounded-full ml-0.5"
            style={{
              width: 5,
              height: 5,
              background: 'rgba(255,255,255,0.45)',
              boxShadow: '0 0 6px rgba(255,255,255,0.4)',
              animation: 'pulse-dot 2.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white font-bold text-sm`}>
            {initials}
          </div>
            <div>
              <p className="font-bold text-text-primary text-sm truncate">{displayName}</p>
              <p className="text-xs text-text-muted">{displayEmail}</p>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(item => {
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 mb-0.5 text-left group
                ${active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
            >
              <span className={`transition-colors duration-200 ${active ? 'text-primary-600' : 'text-text-muted group-hover:text-primary-500'}`}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.id === 'notifications' && notifBadge > 0 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse mr-2" />
              ) : item.badge ? (
                <span className="bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              ) : active ? (
                <ChevronRight size={14} className="text-primary-500" />
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-600 transition-all-smooth"
        >
          <LogOut size={18} />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </aside>
  )
}
