import { Bell, Menu, Sun, Moon } from 'lucide-react'
import { SearchInput } from './ui'
import { useTranslation } from '../i18n'
import { getLocalizedPersonName } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'

type Role = 'farmer' | 'admin'

interface NavbarProps {
  role: Role
  user?: any
  page: string
  darkMode: boolean
  onToggleDark: () => void
  onMenuToggle: () => void
  onNavigate: (page: string) => void
  unreadNotifs?: number
}

export const INITIAL_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🌐' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
  { code: 'mni', name: 'Manipuri / Meitei', native: 'মৈতৈলোন্', flag: '🇮🇳' },

  { code: 'brx', name: 'Bodo', native: 'बर\'', flag: '🇮🇳' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', flag: '🇮🇳' },
  { code: 'ks', name: 'Kashmiri', native: 'कॉशुर', flag: '🇮🇳' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी', flag: '🇮🇳' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي / सिन्धी', flag: '🇮🇳' },
]

const pageTitles: Record<string, string> = {
  dashboard: 'dashboard',
  soil: 'soil',
  crop: 'crop',
  fertilizer: 'fertilizer',
  disease: 'disease',
  chatbot: 'chatbot',
  weather: 'weather',
  history: 'history',
  notifications: 'notifications',
  feedback: 'feedback',
  profile: 'profile',
  about: 'about',
  settings: 'settings',
  users: 'userManagement',
  analytics: 'analytics',
  security: 'security',
  health: 'health',
  reports: 'reports',
}

const roleColors: Record<Role, string> = {
  farmer: 'from-green-600 to-green-700',
  admin: 'from-blue-600 to-blue-700',
}

import { useSarvamUsername } from '../services/sarvamClient'

export function Navbar({
  role,
  user,
  page,
  darkMode,
  onToggleDark,
  onMenuToggle,
  onNavigate,
  unreadNotifs = 0,
}: NavbarProps) {
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()

  const rawName = user?.username || (role === 'farmer' ? 'farmer' : 'admin')
  const sarvamName = useSarvamUsername(rawName)
  const displayName = sarvamName || getLocalizedPersonName(t(rawName), currentLanguage)
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 border-b border-border bg-surface shadow-subtle px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-text-secondary hover:bg-background transition-colors"
          aria-label={t('aria.openMenu')}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-text-primary leading-tight">
            {t(pageTitles[page] || 'dashboard')}
          </h1>
          <p className="text-[11px] text-text-muted hidden sm:block">
            {role === 'farmer' ? t('smartFarming') : t('systemAdmin')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:block">
          <SearchInput
            value=""
            onChange={() => {}}
            placeholder={t('search')}
            containerClassName="w-44 lg:w-52 py-1.5"
            aria-label={t('aria.search')}
          />
        </div>

        {/* Centralized Multi-lingual Language Selector */}
        <LanguageSelector />

        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-xl transition-all-smooth ${
            darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-background text-text-secondary hover:bg-background'
          }`}
          aria-label={t('aria.toggleTheme')}
          title={t('aria.toggleTheme')}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => onNavigate('notifications')}
          className={`relative p-2 rounded-xl transition-all-smooth ${
            darkMode ? 'bg-gray-800 text-text-muted hover:bg-gray-700' : 'bg-background text-text-secondary hover:bg-background'
          }`}
          aria-label={t('notifications')}
          title={t('notifications')}
        >
          <Bell size={18} key={unreadNotifs > 0 ? 'has' : 'none'} className={unreadNotifs > 0 ? 'animate-bell-shake' : ''} />
          {unreadNotifs > 0 && (
            <span key={unreadNotifs} className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-badge-pop" />
          )}
        </button>

        {/* User */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all-smooth ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-background hover:bg-background'
          }`}
          aria-label={t('profile')}
        >
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white text-xs font-bold`}>
            {initials}
          </div>
          <span className={`hidden md:block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-text-secondary'}`}>
            {displayName}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
