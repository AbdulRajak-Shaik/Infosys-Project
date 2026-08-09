import { Bell, Search, Menu, Sun, Moon, ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SearchInput } from './ui'
import { useTranslate } from '../contexts/TranslationContext'

type Role = 'farmer' | 'admin'

interface NavbarProps {
  role: Role
  page: string
  darkMode: boolean
  onToggleDark: () => void
  onMenuToggle: () => void
  onNavigate: (page: string) => void
  unreadNotifs?: number
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  soil: 'Soil Classification',
  crop: 'Crop Recommendation',
  fertilizer: 'Fertilizer Recommendation',
  disease: 'Disease Detection',
  chatbot: 'AI Chatbot',
  weather: 'Weather Dashboard',
  history: 'Prediction History',
  notifications: 'Notifications',
  feedback: 'Feedback',
  profile: 'Profile',
  about: 'About AgroAI',
  settings: 'Settings',
  users: 'User Management',
  analytics: 'Analytics & Reports',
  security: 'Security Logs',
  health: 'System Health',
  reports: 'Reports',
}

const roleColors: Record<Role, string> = {
  farmer: 'from-green-600 to-green-700',

  admin: 'from-purple-600 to-purple-700',
}

export default function Navbar({ role, page, darkMode, onToggleDark, onMenuToggle, onNavigate, unreadNotifs = 0 }: NavbarProps) {
  const { i18n } = useTranslation()
  const { lang, setLang, t } = useTranslate()
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'HI' },
    { code: 'te', label: 'TE' },
    { code: 'ta', label: 'TA' },
    { code: 'kn', label: 'KN' },
    { code: 'mr', label: 'MR' },
    { code: 'bn', label: 'BN' },
  ]

  return (
    <header className={`h-16 flex items-center justify-between px-4 lg:px-6 border-b ${darkMode ? 'bg-[#1E293B]/80 backdrop-blur-md border-gray-800' : 'bg-white/80 backdrop-blur-md border-border'} shadow-soft sticky top-0 z-30`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className={`lg:hidden p-2 rounded-lg ${darkMode ? 'text-text-muted hover:bg-gray-800' : 'text-text-muted hover:bg-background'}`}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className={`font-bold text-base leading-tight ${darkMode ? 'text-white' : 'text-text-primary'}`}>
            {t(page) || 'AgroAI'}
          </h1>
          <p className={`text-xs ${darkMode ? 'text-text-muted' : 'text-text-muted'}`}>
            {new Date().toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'kn' ? 'kn-IN' : lang === 'mr' ? 'mr-IN' : lang === 'bn' ? 'bn-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:block">
          <SearchInput 
            value="" 
            onChange={() => {}} 
            placeholder={t('searchPlaceholder') || 'Search...'} 
            containerClassName="w-44 lg:w-52 py-1.5"
          />
        </div>

        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-xl transition-all-smooth ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-background text-text-secondary hover:bg-background'}`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language selector dropdown */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 shadow-sm transition-all hover:border-text-muted/30">
          <Globe size={15} className="text-text-muted flex-shrink-0" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-xs font-semibold text-text-secondary outline-none border-none cursor-pointer pr-1"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
        </div>

        {/* Notifications */}
        <button
          onClick={() => onNavigate('notifications')}
          className={`relative p-2 rounded-xl transition-all-smooth ${darkMode ? 'bg-gray-800 text-text-muted hover:bg-gray-700' : 'bg-background text-text-secondary hover:bg-background'}`}
        >
          <Bell size={18} key={unreadNotifs > 0 ? 'has' : 'none'} className={unreadNotifs > 0 ? 'animate-bell-shake' : ''} />
          {unreadNotifs > 0 && (
            <span key={unreadNotifs} className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none animate-badge-pop">
              {unreadNotifs > 99 ? '99+' : unreadNotifs}
            </span>
          )}
        </button>

        {/* User */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all-smooth ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-background hover:bg-background'}`}
        >
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white text-xs font-bold`}>
            {role === 'farmer' ? 'RF' : 'SA'}
          </div>
          <span className={`hidden md:block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-text-secondary'}`}>
            {role === 'farmer' ? 'Rajesh' : 'Admin'}
          </span>
          <ChevronDown size={14} className={darkMode ? 'text-text-muted' : 'text-text-muted'} />
        </button>
      </div>
    </header>
  )
}
