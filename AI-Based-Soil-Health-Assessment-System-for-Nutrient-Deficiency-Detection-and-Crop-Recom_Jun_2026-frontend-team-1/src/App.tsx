import { useState, useEffect, useRef } from 'react'
import { X, Eye, EyeOff, User, Mail, Phone, Lock, Globe, MapPin, Shield, Search, TrendingUp, Filter, Calendar, Bot, MessageSquare, FileText } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Navbar, { INITIAL_LANGUAGES } from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AuthPages from './pages/AuthPages'
import FarmerDashboard from './pages/FarmerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { SoilClassification, CropRecommendation, FertilizerRecommendation, DiseaseDetection } from './pages/AIModules'
import AIChatbot from './pages/AIChatbot'
import { WeatherDashboard, PredictionHistory, Notifications, Feedback, Profile, Settings, generateRealNotifications } from './pages/MorePages'
import { About } from './pages/About'
import GuestExperience from './pages/GuestExperience'
import FarmerCommunity from './pages/FarmerCommunity'
import { Toast, LineSpinner, Input, SelectInput, Button } from './components/ui'
import FloatingChatbot from './components/FloatingChatbot'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { FEATURES } from './config'
import api, { getCurrentUser, logoutUser, getAdminUsers, updateAdminUser, deleteAdminUser, type UserProfile, LANGUAGE_ID_TO_CODE, getNotifications, markNotificationRead, markAllNotificationsRead } from './services/api'
import { useTranslation } from './i18n'
import { useLanguage } from './contexts/LanguageContext'


type AppState = 'landing' | 'auth' | 'app' | 'guest'
type Role = 'farmer' | 'admin'
export type ThemeMode = 'light' | 'dark' | 'system'

function SplashScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [exiting, setExiting] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1800)
    const t2 = setTimeout(() => onDone(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface transition-opacity duration-500${exiting ? ' opacity-0' : ' opacity-100'}`}>
      <div className="flex flex-col items-center select-none animate-slide-in-up">
        <svg viewBox="0 0 40 40" width="48" height="48" overflow="visible" aria-hidden="true" className="mb-4">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#E6F4EA" strokeWidth="6" />
          <path d="M 20 4 A 16 16 0 0 1 36 20" fill="none" stroke="#2E7D32" strokeWidth="6" strokeLinecap="round" className="animate-spin-slow" style={{ transformOrigin: '20px 20px' }} />
        </svg>
        <p className="text-text-primary font-heading font-bold text-2xl tracking-tight">
          Agro<span className="text-primary-600">AI</span>
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { t } = useTranslation()
  const { currentLanguage, setLanguage } = useLanguage()
  const [splashDone, setSplashDone] = useState(false)
  const [appState, setAppState] = useState<AppState>('landing')
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'forgot'>('login')
  const [role, setRole] = useState<Role>('farmer')
  const [currentPage, setCurrentPage] = useState('dashboard')

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (appState === 'app') {
      getCurrentUser()
        .then(u => setUser(u))
        .catch(err => console.warn('App user fetch note:', err))
    }
  }, [appState])

  useEffect(() => {
    if (user && user.language_id) {
      // CRITICAL FIX: Only sync language from backend if the user has NO stored
      // preference in localStorage. This prevents the backend DB language from
      // overwriting a language the user has already manually selected in the UI.
      // After first login, the user's UI selection always takes priority.
      try {
        const stored = localStorage.getItem('selected_language')
        if (!stored || stored === 'en') {
          // No preference stored yet — apply the user's DB language preference
          const code = LANGUAGE_ID_TO_CODE[user.language_id]
          if (code && code !== currentLanguage) {
            setLanguage(code)
          }
        }
        // If a language IS already stored, the user chose it explicitly — do NOT override
      } catch {
        // localStorage not available — skip sync
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language_id])

  // ── Theme state: persisted, system-aware ──────────────────
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    (localStorage.getItem('agroai_theme') as ThemeMode) || 'light'
  )
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [themeToast, setThemeToast] = useState<string | null>(null)

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark)

  // Listen to OS theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('agroai_theme', mode)
    const messages: Record<ThemeMode, string> = {
      light: t('theme.lightEnabled'),
      dark: t('theme.darkEnabled'),
      system: t('theme.followSystem'),
    }
    setThemeToast(messages[mode])
    setTimeout(() => setThemeToast(null), 2500)
  }

  // Nav toggle cycles between light ↔ dark
  const handleNavToggle = () => setThemeMode(isDark ? 'light' : 'dark')

  const handleLogin = (r: Role) => {
    setRole(r)
    setCurrentPage('dashboard')
    setAppState('app')
    getCurrentUser().then(u => setUser(u)).catch(() => {})
  }

  // ── Global notification state ─────────────────────────────
  const [allNotifs, setAllNotifs] = useState<any[]>([])
  const [notifReadIds, setNotifReadIds] = useState<Set<string>>(new Set())

  const fetchNotifs = () => {
    getNotifications()
      .then(items => {
        if (Array.isArray(items)) {
          setAllNotifs(items)
          const readSet = new Set(items.filter((it: any) => it.read).map((it: any) => it.id))
          setNotifReadIds(readSet)
        }
      })
      .catch(() => {
        setAllNotifs([])
      })
  }

  useEffect(() => {
    if (appState === 'app') {
      fetchNotifs()
    } else {
      setAllNotifs([])
    }
  }, [appState])

  useEffect(() => {
    if (appState === 'app') {
      window.addEventListener('storage', fetchNotifs)
      window.addEventListener('predictionCreated', fetchNotifs)
      return () => {
        window.removeEventListener('storage', fetchNotifs)
        window.removeEventListener('predictionCreated', fetchNotifs)
      }
    }
  }, [appState])

  const notifUnreadCount = allNotifs.filter(n => !notifReadIds.has(n.id)).length
  
  const markNotifRead = (id: string) => {
    setNotifReadIds(s => {
      const newSet = new Set([...s, id])
      return newSet
    })
    markNotificationRead(id).catch(() => {})
  }
  
  const markAllNotifsRead = () => {
    const allIds = new Set(allNotifs.map(n => n.id))
    setNotifReadIds(allIds)
    markAllNotificationsRead().catch(() => {})
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.warn('Logout request failed; clearing the local session.', err)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setUser(null)
      setAppState('landing')
      setCurrentPage('dashboard')
    }
  }

  const goToAuth = (page: 'login' | 'register' = 'login') => {
    setAuthPage(page)
    setAppState('auth')
  }

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />
  }

  if (appState === 'landing') {
    return (
      <LandingPage
        onLogin={() => goToAuth('login')}
        onRegister={() => goToAuth('register')}
        onGuestTrial={() => setAppState('guest')}
      />
    )
  }

  if (appState === 'guest') {
    return (
      <GuestExperience
        onLogin={() => goToAuth('login')}
        onRegister={() => goToAuth('register')}
      />
    )
  }

  if (appState === 'auth') {
    return <AuthPages onLogin={handleLogin} onBack={() => setAppState('landing')} initialPage={authPage} />
  }

  return (
      <div className={`flex h-screen overflow-hidden bg-background ${isDark ? 'dark-mode' : ''}`}>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:static z-50 h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar
            role={role}
            user={user}
            currentPage={currentPage}
            onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false) }}
            onLogout={handleLogout}
            onClose={() => setSidebarOpen(false)}
            notifBadge={notifUnreadCount}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar
            role={role}
            user={user}
            page={currentPage}
            darkMode={isDark}
            onToggleDark={handleNavToggle}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            onNavigate={setCurrentPage}
            unreadNotifs={notifUnreadCount}
          />

          {currentPage === 'chatbot' ? (
            <AIChatbot />
          ) : (
            <main key={currentPage} className="flex-1 overflow-y-auto bg-background animate-page-enter">
              {currentPage === 'dashboard' && role === 'farmer' && <FarmerDashboard onNavigate={setCurrentPage} />}
              {currentPage === 'dashboard' && role === 'admin' && <AdminDashboard onNavigate={setCurrentPage} />}
              {currentPage === 'soil' && <SoilClassification onNavigate={setCurrentPage} />}
              {currentPage === 'crop' && <CropRecommendation onNavigate={setCurrentPage} />}
              {currentPage === 'fertilizer' && <FertilizerRecommendation onNavigate={setCurrentPage} />}
              {FEATURES.DISEASE_DETECTION && currentPage === 'disease' && <DiseaseDetection onNavigate={setCurrentPage} />}
              {currentPage === 'weather' && <WeatherDashboard onNavigate={setCurrentPage} />}
              {currentPage === 'community' && <FarmerCommunity onNavigate={setCurrentPage} />}
              {currentPage === 'history' && <PredictionHistory onNavigate={setCurrentPage} />}
              {currentPage === 'notifications' && <Notifications onNavigate={setCurrentPage} readIds={notifReadIds} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifsRead} />}
              {currentPage === 'feedback' && <Feedback role={role} onNavigate={setCurrentPage} />}
              {currentPage === 'profile' && <Profile onNavigate={setCurrentPage} />}
              {currentPage === 'about' && <About onNavigate={setCurrentPage} />}
              {currentPage === 'settings' && <Settings themeMode={themeMode} role={role} onSetTheme={setThemeMode} onNavigate={setCurrentPage} />}
              {currentPage === 'chatbot-monitoring' && <AdminChatbotMonitoring />}
              {currentPage === 'users' && <AdminUserManagement />}
              {currentPage === 'analytics' && <AdminAnalytics />}

              {currentPage === 'reports' && <AdminReports />}
            </main>
          )}
        </div>

        {themeToast && (
          <Toast message={themeToast} type="success" onClose={() => setThemeToast(null)} />
        )}

      </div>
  )
}

// ---- Admin Stub Pages ----

const ADD_USER_LANGUAGES = INITIAL_LANGUAGES.map(l => l.name)
const ADD_USER_COUNTRIES = ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'UAE', 'Kenya', 'Nigeria']
const ADD_USER_PERMISSIONS = ['User Management', 'Analytics', 'Reports', 'Feedback', ...(FEATURES.DISEASE_DETECTION ? ['Disease Detection'] : []), 'Crop Recommendation', 'Weather', 'Notifications']

interface UserRecord {
  name: string; email: string; role: string; status: string; region: string; joined: string
}

function AddUserModal({ existingEmails, onClose, onSuccess }: {
  existingEmails: string[]
  onClose: () => void
  onSuccess: (u: UserRecord) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    role: 'Farmer', language: 'English',
    country: 'India', state: '', district: '', city: '', postalCode: '',
    accountStatus: 'active',
    permissions: [] as string[],
  })
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [loading, setLoading] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstInputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const togglePermission = (p: string) =>
    setForm(f => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p] }))

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isDuplicateEmail = existingEmails.map(e => e.toLowerCase()).includes(form.email.toLowerCase().trim())

  const errs = {
    name: attempted && !form.name.trim() ? 'Name is required.' : '',
    email: attempted
      ? !form.email.trim() ? 'Email is required.'
        : !emailRe.test(form.email) ? 'Please enter a valid email address.'
        : isDuplicateEmail ? 'This email address is already registered.'
        : ''
      : '',
    password: attempted
      ? !form.password ? 'Password is required.'
        : form.password.length < 8 ? 'Password must be at least 8 characters.'
        : ''
      : '',
    confirm: attempted
      ? !form.confirm ? 'Please confirm your password.'
        : form.confirm !== form.password ? 'Passwords do not match.'
        : ''
      : '',
    state: attempted && !form.state.trim() ? 'State is required.' : '',
    district: attempted && !form.district.trim() ? 'District is required.' : '',
    city: attempted && !form.city.trim() ? 'City / Village / Town is required.' : '',
  }

  const isValid =
    form.name.trim().length > 0 &&
    emailRe.test(form.email) && !isDuplicateEmail &&
    form.password.length >= 8 && form.confirm === form.password &&
    form.state.trim().length > 0 && form.district.trim().length > 0 && form.city.trim().length > 0

  const handleSubmit = () => {
    setAttempted(true)
    if (!isValid) return
    setLoading(true)
    setTimeout(() => {
      onSuccess({
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.accountStatus,
        region: `${form.state}, ${form.country}`,
        joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }, 1500)
  }

  const Req = () => <span className="text-red-500 ml-0.5" aria-hidden>*</span>
  const FieldErr = ({ msg }: { msg: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1" role="alert">{msg}</p> : null

  const inputCls = (err: string) =>
    `w-full py-2.5 rounded-xl border text-sm bg-surface placeholder-text-muted transition-colors ${err ? 'border-red-400' : 'border-border hover:border-border'}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-t-2xl sm:rounded-2xl shadow-elevated w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-slide-in-up sm:animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{t('addNewUser')}</h2>
            <p className="text-sm text-text-muted mt-0.5">{t('createNewUserAccount')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-background transition-colors mt-0.5 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Personal Information */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">{t('sections.personalInformation')}</p>
            <div className="space-y-4">
              <Input 
                label={t('form.fullName')} 
                required 
                error={errs.name} 
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
                placeholder={t('placeholders.enterFullName')} 
                icon={<User size={14} />} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label={t('form.emailAddress')} 
                  required 
                  error={errs.email} 
                  type="email" 
                  value={form.email} 
                  onChange={e => set('email', e.target.value)} 
                  placeholder={t('placeholders.emailExample')} 
                  icon={<Mail size={14} />} 
                />
                <Input 
                  label={t('form.phoneNumber')} 
                  hint={t('hints.optional')} 
                  type="tel" 
                  value={form.phone} 
                  onChange={e => set('phone', e.target.value)} 
                  placeholder={t('placeholders.phoneExample')} 
                  icon={<Phone size={14} />} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input 
                    label={t('form.password')} 
                    required 
                    error={errs.password} 
                    type={showPw ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={e => set('password', e.target.value)} 
                    placeholder={t('placeholders.passwordMin8')} 
                    icon={<Lock size={14} />} 
                  />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    label={t('form.confirmPassword')} 
                    required 
                    error={errs.confirm} 
                    type={showConfirm ? 'text' : 'password'} 
                    value={form.confirm} 
                    onChange={e => set('confirm', e.target.value)} 
                    placeholder={t('placeholders.reenterPassword')} 
                    icon={<Lock size={14} />} 
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput 
                  label={t('form.userRole')} 
                  value={form.role} 
                  onChange={e => set('role', e.target.value)} 
                  options={[{ value: 'Farmer', label: t('role.farmer') }, { value: 'Admin', label: t('role.admin') }]} 
                />
                <SelectInput 
                  label={t('languagePreference')} 
                  value={form.language} 
                  onChange={e => set('language', e.target.value)} 
                  options={ADD_USER_LANGUAGES.map(l => ({ value: l, label: l }))} 
                />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Location */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">{t('sections.locationInformation')}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput 
                  label={t('country')} 
                  value={form.country} 
                  onChange={e => set('country', e.target.value)} 
                  options={ADD_USER_COUNTRIES.map(c => ({ value: c, label: c }))} 
                />
                <Input label={t('state')} required error={errs.state} value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Punjab" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('district')} required error={errs.district} value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Ludhiana" />
                <Input label={t('cityVillage')} required error={errs.city} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Kotkapura" />
              </div>
              <div className="md:max-w-xs">
                <Input label={t('postalCode')} hint={t('optional')} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="e.g. 142001" />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Account Status */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t('sections.accountStatus')}</p>
            <div className="flex gap-3">
              {(['active', 'inactive'] as const).map(s => (
                <button key={s} onClick={() => set('accountStatus', s)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all capitalize ${
                    form.accountStatus === s
                      ? s === 'active' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-400 bg-background text-text-secondary'
                      : 'border-border text-text-muted hover:border-border'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${form.accountStatus === s ? (s === 'active' ? 'bg-green-500' : 'bg-gray-500') : 'bg-background'}`} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Permissions – Admin only */}
          {form.role === 'Admin' && (
            <>
              <div className="border-t border-border" />
              <section>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Permissions <span className="normal-case font-normal text-text-muted">(Optional)</span>
                </p>
                <p className="text-xs text-text-muted mb-3">Select the modules this {form.role.toLowerCase()} can access.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ADD_USER_PERMISSIONS.map(p => (
                    <label key={p} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none ${
                      form.permissions.includes(p) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-border text-text-secondary hover:border-border bg-surface'
                    }`}>
                      <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} className="accent-blue-600 w-3.5 h-3.5 flex-shrink-0" />
                      {p}
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-background rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-text-muted hidden sm:block"><span className="text-red-500">*</span> {t('requiredFields')}</p>
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-background transition-colors">
              {t('cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center transition-all">
              {loading ? <><LineSpinner size={14} color="white" strokeWidth={2} /> {t('creatingUser')}</> : t('createUser')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function AdminChatbotMonitoring() {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState('Last 7 Days')
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    api.get('/api/chatbot/monitoring-analytics')
      .then(res => setAnalytics(res.data))
      .catch(err => console.warn('Analytics fetch note:', err))

    api.get('/api/chatbot/recent-activity')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((it: any) => {
            const code = (it.language || 'English').toLowerCase();
            const langMap: Record<string, string> = {
              en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil',
              kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', gu: 'Gujarati',
              bn: 'Bengali', pa: 'Punjabi', or: 'Odia', as: 'Assamese',
              ur: 'Urdu', mai: 'Maithili', mni: 'Manipuri', sat: 'Santali',
              brx: 'Bodo', doi: 'Dogri', ks: 'Kashmiri', kok: 'Konkani',
              ne: 'Nepali', sa: 'Sanskrit', sd: 'Sindhi'
            };
            const standardLangName = langMap[code] || it.language || 'English';
            return {
              id: it.id ? String(it.id) : `conv-${Math.random()}`,
              time: it.timestamp || it.created_at || 'Recent',
              user: it.userName || it.user || 'Farmer',
              role: it.userRole || it.role || 'Farmer',
              lang: standardLangName,
              q: it.question || it.user_message || 'Agricultural inquiry',
              response: it.assistant_response || 'Advisory response generated.',
              topic: it.topic || 'General Query',
              status: it.status || 'Resolved',
              responseTime: '1.0s'
            };
          })
          setRecentActivity(mapped)
        } else {
          setRecentActivity([])
        }
      })
      .catch(err => console.warn('Activity fetch note:', err))
  }, [])

  const lineData = analytics?.trends?.length ? analytics.trends : [
    { name: 'Mon', conversations: 0, activeUsers: 0 },
    { name: 'Tue', conversations: 0, activeUsers: 0 },
    { name: 'Wed', conversations: 0, activeUsers: 0 },
    { name: 'Thu', conversations: 0, activeUsers: 0 },
    { name: 'Fri', conversations: 0, activeUsers: 0 },
    { name: 'Sat', conversations: 0, activeUsers: 0 },
    { name: 'Sun', conversations: 0, activeUsers: 0 },
  ]
  const topicsData = analytics?.topics?.length ? analytics.topics : [
    { name: 'Crop Recommendation', count: 0 },
    { name: 'Weather', count: 0 },
    { name: 'Fertilizer', count: 0 },
    { name: 'Pest Management', count: 0 },
    { name: 'Government Schemes', count: 0 },
    { name: 'Soil Classification', count: 0 },
  ]
  const languageData = analytics?.languages?.length ? analytics.languages : [
    { name: 'English', value: 1 },
  ]
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B']

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in relative">
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-bold text-lg text-text-primary">{t('conversationDetails') || 'Conversation Details'}</h3>
              <button onClick={() => setSelectedConversation(null)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">{t('user') || 'User'}</p>
                  <p className="font-medium text-text-primary">{selectedConversation.user} <span className="text-xs ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{t(selectedConversation.role?.toLowerCase()) || selectedConversation.role}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">{t('conversationId') || 'Conversation ID'}</p>
                  <p className="font-mono text-sm text-text-primary">{selectedConversation.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">{t('topicAndLanguage') || 'Topic & Language'}</p>
                  <p className="font-medium text-text-primary">{t(selectedConversation.topic) || selectedConversation.topic} · {t(selectedConversation.lang?.toLowerCase()) || selectedConversation.lang}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">{t('aiProcessingTime') || 'AI Processing Time'}</p>
                  <p className="font-medium text-text-primary">{selectedConversation.responseTime}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="bg-background rounded-xl p-4 ml-8 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-text-secondary">{t('userQuestion') || 'User Question'}</span>
                    <span className="text-xs text-text-muted">{selectedConversation.time}</span>
                  </div>
                  <p className="text-sm text-text-primary">{selectedConversation.q}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 mr-8 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Bot size={14} /> {t('agroAiResponse') || 'AgroAI Response'}</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {selectedConversation.response || t('advisorySentDesc') || 'Based on current soil test & weather conditions, recommended optimal advisory has been sent to the farmer.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('chatbotMonitoring') || 'Chatbot Monitoring'}</h2>
          <p className="text-sm text-text-muted">{t('chatbotMonitoringDesc') || 'Real-time metrics and conversation logs from database'}</p>
        </div>
        <SelectInput 
          options={[{label: t('today') || 'Today', value: 'Today'}, {label: t('last7Days') || 'Last 7 Days', value: 'Last 7 Days'}, {label: t('last30Days') || 'Last 30 Days', value: 'Last 30 Days'}]} 
          value={timeRange} 
          onChange={e=>setTimeRange(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: t('totalConversations') || 'Total Conversations', value: analytics?.kpis?.total_conversations?.toLocaleString() ?? '0', trend: t('liveDb') || 'Live DB', up: true, icon: <MessageSquare size={20} className="text-blue-500" /> },
          { title: t('questionsToday') || 'Questions Today', value: analytics?.kpis?.questions_today?.toLocaleString() ?? '0', trend: t('liveDb') || 'Live DB', up: true, icon: <Bot size={20} className="text-green-500" /> },
          { title: t('activeChatbotUsers') || 'Active Chatbot Users', value: analytics?.kpis?.active_users_today?.toLocaleString() ?? '0', trend: t('liveDb') || 'Live DB', up: true, icon: <User size={20} className="text-purple-500" /> },
          { title: t('avgQuestionsPerSession') || 'Avg Questions/Session', value: analytics?.kpis?.avg_questions_per_session ?? '0.0', trend: t('liveDb') || 'Live DB', up: true, icon: <TrendingUp size={20} className="text-orange-500" /> }
        ].map((kpi, i) => (
          <div key={i} className="bg-surface rounded-2xl p-5 shadow-card border border-border flex flex-col justify-between hover:shadow-elevated transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-background rounded-xl">{kpi.icon}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <h4 className="text-text-muted text-sm font-medium mb-1">{kpi.title}</h4>
              <span className="text-2xl font-bold text-text-primary">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-6">{t('conversationTrends') || 'Conversation Trends'}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="conversations" name={t('conversations') || 'Conversations'} stroke="#3B82F6" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
              <Line type="monotone" dataKey="activeUsers" name={t('activeUsers') || 'Active Users'} stroke="#10B981" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text-primary mb-2">{t('languagesUsed') || 'Languages Used'}</h3>
            <div className="min-h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={languageData.filter((entry: any) => entry.value > 0).map((entry: any) => ({ ...entry, name: t(entry.name.toLowerCase()) || entry.name }))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {languageData.filter((entry: any) => entry.value > 0).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 border-t border-border pt-3">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{t('allSupportedLanguages') || 'All Supported Languages'}</h4>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {languageData.map((lang: any) => (
                <div key={lang.name} className="flex justify-between items-center p-1.5 rounded-lg bg-background border border-border text-[11px]">
                  <span className="font-medium text-text-primary truncate mr-1">{t(lang.name.toLowerCase()) || lang.name}</span>
                  <span className="font-mono text-text-muted bg-surface px-1 py-0.5 rounded border border-border flex-shrink-0">{lang.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-4 bg-background rounded-xl border border-border flex justify-between items-center">
            <div>
              <p className="text-xs text-text-muted">{t('avgResponseTime') || 'Avg Response Time'}</p>
              <p className="text-lg font-bold text-text-primary">1.4 sec</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Bot size={20} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-6">{t('mostCommonTopics') || 'Most Common Topics'}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topicsData} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} name={t('inquiries') || 'Inquiries'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary">{t('recentBotActivity') || 'Recent Bot Activity'}</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background">
              <Search size={14} className="text-text-muted" />
              <input placeholder={t('searchLogs') || 'Search logs...'} className="bg-transparent text-xs outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {['Time', 'User', 'Role', 'Language', 'Question', 'Topic', 'Status'].map(h => {
                  const key = h === 'Time' ? 'time' : h === 'User' ? 'user' : h === 'Role' ? 'role' : h === 'Language' ? 'language' : h === 'Question' ? 'question' : h === 'Topic' ? 'topic' : 'status';
                  return (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{t(key) || h}</th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((r, i) => (
                <tr key={i} onClick={() => setSelectedConversation(r)} className="border-b border-border hover:bg-background transition-colors cursor-pointer group">
                  <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">{r.time}</td>
                  <td className="py-3 px-4 font-medium text-text-primary">{r.user}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${r.role === 'Farmer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t(r.role?.toLowerCase()) || r.role}</span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-xs">{t(r.lang?.toLowerCase()) || r.lang}</td>
                  <td className="py-3 px-4 text-text-primary max-w-xs truncate" title={r.q}>{r.q}</td>
                  <td className="py-3 px-4 text-text-secondary text-xs">{t(r.topic) || r.topic}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Resolved' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'Resolved' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                      {t(r.status?.toLowerCase()) || r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


function AdminUserManagement() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [userList, setUserList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminUsers()
      const mapped = data.map((u: any) => ({
        id: u.id,
        name: u.username || 'User #' + u.id,
        email: u.email,
        phone: u.phone || u.phone_number || 'N/A',
        role: u.role === 'admin' ? 'Admin' : 'Farmer',
        status: u.status || 'active',
        region: u.region || 'N/A',
        joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never',
        lang: (() => {
          const langMap: Record<number, string> = {
            1: 'English', 2: 'Hindi', 3: 'Telugu', 4: 'Tamil', 5: 'Kannada',
            6: 'Malayalam', 7: 'Marathi', 8: 'Gujarati', 9: 'Bengali', 10: 'Punjabi',
            11: 'Odia', 12: 'Assamese', 13: 'Urdu', 14: 'Maithili', 15: 'Manipuri',
            16: 'Santali', 17: 'Bodo', 18: 'Dogri', 19: 'Kashmiri', 20: 'Konkani',
            21: 'Nepali', 22: 'Sanskrit', 23: 'Sindhi'
          };
          return langMap[u.language_id] || 'English';
        })(),
        analyses: u.analyses ?? 0,
        chatbot: u.chatbot ?? 0
      }))
      setUserList(mapped)
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err)
      setError(err.message || 'Failed to fetch user list from database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = userList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) || 
                          u.phone.includes(search)
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      await deleteAdminUser(selectedUser.id)
      setShowDeleteModal(false)
      showToast(t('userDeletedSuccessfully') || 'User deleted successfully.')
      await fetchUsers()
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.')
    }
  }
  
  const handleEditSave = async (updatedUser: any) => {
    try {
      await updateAdminUser(updatedUser.id, {
        role: updatedUser.role === 'Admin' ? 'admin' : 'farmer',
        status: updatedUser.status
      })
      setShowEditModal(false)
      showToast(t('userUpdatedSuccessfully') || 'User updated successfully.')
      await fetchUsers()
    } catch (err: any) {
      showToast(err.message || 'Failed to update user.')
    }
  }

  const handlePromote = async () => {
    if (!selectedUser) return
    if (confirm("Are you sure you want to promote this user to Admin?\nThis user will gain full administrative privileges.")) {
      try {
        await updateAdminUser(selectedUser.id, { role: 'admin' })
        setShowEditModal(false)
        showToast(t('userPromotedAdmin') || 'User promoted to Admin.')
        await fetchUsers()
      } catch (err: any) {
        showToast(err.message || 'Failed to promote user.')
      }
    }
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return
    try {
      await updateAdminUser(selectedUser.id, { status: 'inactive' })
      setShowEditModal(false)
      showToast(t('userAccountDeactivated') || 'User account deactivated.')
      await fetchUsers()
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate user.')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in relative">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 shadow-elevated animate-fade-in">
          <span className="text-sm font-medium">✅ {toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="text-xs opacity-60 hover:opacity-100 ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="text-red-600" size={32} />
            </div>
            <h3 className="font-bold text-xl text-text-primary mb-2">{t('deleteUser')}</h3>
            <p className="text-sm text-text-secondary mb-6">{t('deleteUserConfirm')} <strong>{selectedUser?.name}</strong>?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</Button>
              <Button variant="primary" className="flex-1 justify-center bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={handleDelete}>{t('deleteUser')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-bold text-lg text-text-primary">{t('editUserProfile') || 'Edit User Profile'}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><User size={16}/> {t('personalInformation') || 'Personal Information'}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label={t('fullName') || 'Full Name'} defaultValue={selectedUser.name} />
                  <Input label={t('emailAddress') || 'Email Address'} defaultValue={selectedUser.email} />
                  <Input label={t('phoneNumber') || 'Phone Number'} defaultValue={selectedUser.phone} />
                  <Input label={t('locationRegion') || 'Location/Region'} defaultValue={selectedUser.region} />
                  <SelectInput label={t('languagePreference') || 'Language Preference'} options={[{label: t('english') || 'English', value: 'English'}, {label: t('hindi') || 'Hindi', value: 'Hindi'}, {label: t('urdu') || 'Urdu', value: 'Urdu'}]} value={selectedUser.lang} onChange={()=>{}} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><Lock size={16}/> {t('accountControls') || 'Account Controls'}</h4>
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <SelectInput label={t('status') || 'Status'} options={[{label: t('active') || 'Active', value: 'active'}, {label: t('suspended') || 'Suspended', value: 'suspended'}, {label: t('inactive') || 'Inactive', value: 'inactive'}]} value={selectedUser.status} onChange={()=>{}} />
                  <div className="flex gap-2">
                    <Button variant="primary" className="flex-1 justify-center" onClick={() => handleEditSave(selectedUser)}>{t('saveChanges') || 'Save Changes'}</Button>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-red-800">{t('dangerZone') || 'Danger Zone'}</h4>
                {selectedUser.lastLogin.includes('Days ago') && parseInt(selectedUser.lastLogin) > 365 && (
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-red-100">
                    <div>
                      <p className="font-semibold text-red-800 text-sm">{t('inactiveAccountDetected') || 'Inactive Account Detected'}</p>
                      <p className="text-xs text-red-600">User inactive for: {selectedUser.lastLogin}</p>
                    </div>
                    <Button variant="secondary" className="border-red-200 text-red-700 hover:bg-red-50" onClick={handleDeactivate}>{t('deactivate') || 'Deactivate'}</Button>
                  </div>
                )}
                {selectedUser.role !== 'Admin' && (
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-red-100">
                    <div>
                      <p className="font-semibold text-red-800 text-sm">{t('administrativePrivileges') || 'Administrative Privileges'}</p>
                      <p className="text-xs text-red-600">{t('grantAdminAccess') || 'Grant full administrative control and dashboard access.'}</p>
                    </div>
                    <Button variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={handlePromote}>{t('promoteToAdmin') || 'Promote to Admin'}</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface w-full max-w-md h-full shadow-2xl animate-fade-in-up flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-primary">{t('userOverview') || 'User Overview'}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-sm">
                  {selectedUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <h2 className="text-xl font-bold text-text-primary">{selectedUser.name}</h2>
                <p className="text-sm text-text-muted mb-2">{selectedUser.email}</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${selectedUser.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{t(selectedUser.role?.toLowerCase()) || selectedUser.role}</span>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">{t('accountDetails') || 'Account Details'}</h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div><p className="text-text-muted text-xs">{t('phone') || 'Phone'}</p><p className="font-medium text-text-primary">{selectedUser.phone}</p></div>
                  <div><p className="text-text-muted text-xs">{t('location') || 'Location'}</p><p className="font-medium text-text-primary">{selectedUser.region}</p></div>
                  <div><p className="text-text-muted text-xs">{t('language') || 'Language'}</p><p className="font-medium text-text-primary">{t(selectedUser.lang?.toLowerCase()) || selectedUser.lang}</p></div>
                  <div><p className="text-text-muted text-xs">{t('status') || 'Status'}</p><p className="font-medium text-text-primary">{t(selectedUser.status?.toLowerCase()) || selectedUser.status}</p></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">{t('platformUsage') || 'Platform Usage'}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-2xl font-bold text-text-primary">{selectedUser.analyses}</p>
                    <p className="text-xs text-text-muted mt-1">{t('totalPredictions') || 'Total Predictions'}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-2xl font-bold text-text-primary">{selectedUser.chatbot}</p>
                    <p className="text-xs text-text-muted mt-1">{t('chatbotInquiries') || 'Chatbot Inquiries'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 text-sm pt-2">
                  <div><p className="text-text-muted text-xs">{t('joinDate') || 'Join Date'}</p><p className="font-medium text-text-primary">{selectedUser.joined}</p></div>
                  <div><p className="text-text-muted text-xs">{t('lastLogin') || 'Last Login'}</p><p className="font-medium text-text-primary">{selectedUser.lastLogin}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('userManagement') || 'User Management'}</h2>
          <p className="text-sm text-text-muted">{userList.length} {t('registeredUsers') || 'registered users'}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          {t('addUser') || '+ Add User'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border focus-within:border-text-muted focus-within:ring-2 focus-within:ring-text-muted/25 transition-all duration-200 bg-surface flex-1">
          <Search size={16} className="text-text-muted flex-shrink-0" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={t('searchUsersPlaceholder') || "Search by name, email, or phone..."}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none" 
          />
        </div>
        <div className="flex gap-3">
          <SelectInput 
            options={[{label: t('allRoles') || 'All Roles', value: 'All'}, {label: t('farmer') || 'Farmer', value: 'Farmer'}, {label: t('admin') || 'Admin', value: 'Admin'}]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          />
          <SelectInput 
            options={[{label: t('allStatus') || 'All Status', value: 'All'}, {label: t('active') || 'Active', value: 'active'}, {label: t('pending') || 'Pending', value: 'pending'}, {label: t('suspended') || 'Suspended', value: 'suspended'}, {label: t('inactive') || 'Inactive', value: 'inactive'}]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-background border-b border-border">
            <tr>{['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
              <th key={h} className="py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t(h.toLowerCase()) || h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i} className="border-b border-border hover:bg-background transition-colors cursor-pointer" onClick={() => { setSelectedUser(u); setShowDetailModal(true); }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                      {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{u.name}</p>
                      <p className="text-[10px] text-text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.role === 'Farmer' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>{t(u.role?.toLowerCase()) || u.role}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200'
                    : u.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'bg-background text-text-secondary border border-border'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${u.status === 'active' ? 'bg-green-500' : u.status === 'pending' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                    {t(u.status?.toLowerCase()) || u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-text-muted">{u.joined}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setSelectedUser(u); setShowEditModal(true); }} className="px-3 py-1.5 rounded-lg border border-border hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors text-text-secondary">{t('edit') || 'Edit'}</button>
                    <button onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }} className="px-3 py-1.5 rounded-lg bg-red-600 border border-red-600 text-white shadow-sm hover:bg-red-700 hover:border-red-700 hover:shadow active:scale-[0.98] text-xs font-medium transition-all">{t('delete') || 'Delete'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-text-muted text-sm">{t('noUsersFound') || 'No users found matching your criteria.'}</div>
        )}
      </div>
    </div>
  )
}

const analyticsData = [
  { month: 'Jan', predictions: 820, users: 340 },
  { month: 'Feb', predictions: 1200, users: 520 },
  { month: 'Mar', predictions: 1800, users: 780 },
  { month: 'Apr', predictions: 2400, users: 1100 },
  { month: 'May', predictions: 3100, users: 1450 },
  { month: 'Jun', predictions: 4200, users: 2000 },
  { month: 'Jul', predictions: 5500, users: 2800 },
]


function AdminAnalytics() {
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState('Last 7 Days')
  const [insights, setInsights] = useState<any>(null)
  const [growth, setGrowth] = useState<any[]>([])

  useEffect(() => {
    api.get('/api/dashboard/insights')
      .then(res => setInsights(res.data))
      .catch(err => console.warn('Insights fetch note:', err))

    api.get('/api/dashboard/user-growth')
      .then(res => {
        if (Array.isArray(res.data)) {
          setGrowth(res.data)
        }
      })
      .catch(err => console.warn('User growth fetch note:', err))
  }, [])
  
  const rawGrowthData = growth.length > 0 ? growth : [
    { month: 'January', users: 10, farmers: 8, admins: 2 },
    { month: 'February', users: 15, farmers: 12, admins: 3 },
    { month: 'March', users: 25, farmers: 20, admins: 5 },
    { month: 'April', users: 40, farmers: 32, admins: 8 },
    { month: 'May', users: 65, farmers: 52, admins: 13 },
    { month: 'June', users: 95, farmers: 76, admins: 19 },
    { month: 'July', users: 120, farmers: 96, admins: 24 },
  ]
  const translatedAnalyticsData = rawGrowthData.map(item => ({
    ...item,
    month: t(item.month) || item.month,
    [t('totalPredictions')]: (item as any).predictions || (item as any).users || 0,
    [t('userManagement')]: (item as any).users || 0,
  }))

  const rawSoilData = insights?.soil_type_distribution?.length ? insights.soil_type_distribution : [
    { name: 'Clay Soil', value: 35 },
    { name: 'Black Soil', value: 25 },
    { name: 'Loamy Soil', value: 20 },
    { name: 'Red Soil', value: 10 },
    { name: 'Sandy Soil', value: 10 },
  ]
  const soilData = rawSoilData.map((item: any) => ({
    ...item,
    name: t(item.name) || item.name
  }))

  const rawLanguageData = insights?.language_usage?.length ? insights.language_usage : [
    { name: 'English', value: 60 },
    { name: 'Hindi', value: 20 },
    { name: 'Punjabi', value: 8 },
    { name: 'Tamil', value: 7 },
    { name: 'Telugu', value: 5 },
  ]
  const languageData = rawLanguageData.map((item: any) => ({
    ...item,
    name: t(item.name.toLowerCase()) || item.name
  }))

  const rawNutrientData = insights?.nutrient_deficiency_stats?.length ? insights.nutrient_deficiency_stats : [
    { name: 'nitrogen', value: 75 },
    { name: 'phosphorus', value: 45 },
    { name: 'potassium', value: 30 },
    { name: 'soilPh', value: 40 },
  ]
  const nutrientData = rawNutrientData.map((item: any) => ({
    ...item,
    name: t(item.name) || item.name
  }))

  const rawCropData = insights?.crop_recommendation_counts?.length ? insights.crop_recommendation_counts : [
    { name: 'Wheat', count: 1200 },
    { name: 'Rice', count: 950 },
    { name: 'Cotton', count: 800 },
    { name: 'Maize', count: 650 },
    { name: 'Other', count: 500 },
  ]
  const cropData = rawCropData.map((item: any) => ({
    ...item,
    name: t(item.name) || item.name
  }))
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B', '#06B6D4']

  const renderChart = (data: any, children: React.ReactNode, height = 220) => {
    if (!data || data.length === 0) {
      return <div className={`flex items-center justify-center text-text-muted text-sm`} style={{ height: `${height}px` }}>{t('noAnalyticsData') || 'No analytics data available.'}</div>
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('analytics')}</h2>
          <p className="text-sm text-text-muted">{t('platformUsageInsights') || 'Platform-wide usage and insights'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-text-muted" />
          <SelectInput 
            options={[
              {label: t('today') || 'Today', value: 'Today'}, 
              {label: t('last7Days') || 'Last 7 Days', value: 'Last 7 Days'}, 
              {label: t('last30Days') || 'Last 30 Days', value: 'Last 30 Days'}, 
              {label: t('customRange') || 'Custom Range', value: 'Custom'}
            ]}
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('predictionTrends')}</h3>
          {renderChart(translatedAnalyticsData, (
            <AreaChart data={translatedAnalyticsData} margin={{ left: -20 }}>
              <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2}/><stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey={t('totalPredictions')} stroke="#2E7D32" strokeWidth={2} fill="url(#grad1)" name={t('totalPredictions')} />
            </AreaChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('userManagement')}</h3>
          {renderChart(translatedAnalyticsData, (
            <BarChart data={translatedAnalyticsData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey={t('userManagement')} fill="#1565C0" radius={[6, 6, 0, 0]} name={t('userManagement')} />
            </BarChart>
          ))}
        </div>
        
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('soilTypeDistribution') || 'Soil Type Distribution'}</h3>
          {renderChart(soilData, (
            <PieChart>
              <Pie data={soilData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {soilData.map((_entry: unknown, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text-primary mb-4">{t('languagesUsedPlatform') || 'Languages Used (Platform)'}</h3>
            {renderChart(languageData.filter((d: any) => d.value > 0), (
              <PieChart>
                <Pie data={languageData.filter((d: any) => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {languageData.filter((d: any) => d.value > 0).map((_entry: unknown, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{t('allSupportedLanguages') || 'All Supported Languages'}</h4>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {languageData.map((lang: any) => (
                <div key={lang.name} className="flex justify-between items-center p-1.5 rounded-lg bg-background border border-border text-[11px]">
                  <span className="font-medium text-text-primary truncate mr-1">{t(lang.name.toLowerCase()) || lang.name}</span>
                  <span className="font-mono text-text-muted bg-surface px-1 py-0.5 rounded border border-border flex-shrink-0">{lang.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('mostRecommendedCrops') || 'Most Recommended Crops'}</h3>
          {renderChart(cropData, (
            <BarChart data={cropData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} barSize={20} name={t('recommendations') || 'Recommendations'} />
            </BarChart>
          ), 240)}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('nutrientDeficiencyStats') || 'Nutrient Deficiency Statistics'}</h3>
          {renderChart(nutrientData, (
            <BarChart data={nutrientData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} name={t('deficiencyPercent') || 'Deficiency (%)'} />
            </BarChart>
          ), 240)}
        </div>
      </div>
    </div>
  )
}

function AdminReports() {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportFormat, setReportFormat] = useState('PDF')
  const [reportsList, setReportsList] = useState([
    { title: t('monthlyPlatformReport') || 'Monthly Platform Report — July 2026', type: 'Platform', date: 'Jul 25, 2026', size: '2.4 MB' },
    { title: t('aiModelPerformance') || 'AI Model Performance Q2 2026', type: 'AI/ML', date: 'Jun 30, 2026', size: '4.1 MB' },
    { title: t('userEngagementAnalysis') || 'User Engagement Analysis H1 2026', type: 'Analytics', date: 'Jun 30, 2026', size: '3.8 MB' },
    { title: t('securityAuditReport') || 'Security Audit Report July 2026', type: 'Security', date: 'Jul 20, 2026', size: '1.2 MB' },
    ...(FEATURES.DISEASE_DETECTION ? [{ title: t('diseaseDetectionReport') || 'Disease Detection Accuracy Report', type: 'AI/ML', date: 'Jul 15, 2026', size: '5.6 MB' }] : [{ title: t('cropRecommendationReportAccuracy') || 'Crop Recommendation Accuracy Report', type: 'AI/ML', date: 'Jul 15, 2026', size: '5.6 MB' }]),
  ])
  
  const [sections, setSections] = useState<string[]>(['Charts', 'Statistics'])
  const toggleSection = (s: string) => setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setReportsList([{ title: t('customGeneratedReport') || 'Custom Generated Report', type: 'Custom', date: 'Just now', size: '1.8 MB' }, ...reportsList])
    }, 1500)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('reportGenerationCenter') || 'Report Generation Center'}</h2>
          <p className="text-sm text-text-muted">{t('reportGenerationCenterDesc') || 'Create, manage and export comprehensive platform reports'}</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 flex-1 overflow-hidden pb-10">
        {/* Report Generator Panel */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-surface rounded-2xl shadow-card border border-border p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-500"/> {t('configureReport') || 'Configure Report'}</h3>
            
            <div className="space-y-4">
              <SelectInput 
                label={t('reportType') || 'Report Type'} 
                options={[
                  {label: t('overallPlatformReport') || 'Overall Platform Report', value: 'Overall Platform Report'},
                  {label: t('userActivityReport') || 'User Activity Report', value: 'User Activity Report'},
                  {label: t('soilAnalysisReport') || 'Soil Soil Analysis Report', value: 'Soil Analysis Report'},
                  {label: t('cropRecommendationReport') || 'Crop Recommendation Report', value: 'Crop Recommendation Report'},
                  {label: t('fertilizerRecommendationReport') || 'Fertilizer Recommendation Report', value: 'Fertilizer Recommendation Report'},
                  {label: t('weatherAnalyticsReport') || 'Weather Analytics Report', value: 'Weather Analytics Report'},
                  {label: t('chatbotUsageReport') || 'Chatbot Usage Report', value: 'Chatbot Usage Report'},
                  {label: t('communityActivityReport') || 'Community Activity Report', value: 'Community Activity Report'},
                  {label: t('feedbackReport') || 'Feedback Report', value: 'Feedback Report'}
                ]} 
                value="Overall Platform Report" 
                onChange={()=>{}} 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('startDate') || 'Start Date'} type="date" defaultValue="2026-07-01" />
                <Input label={t('endDate') || 'End Date'} type="date" defaultValue="2026-07-28" />
              </div>
              
              <div>
                <p className="text-xs font-semibold text-text-primary mb-2">{t('exportFormat') || 'Export Format'}</p>
                <div className="flex gap-2">
                  {['PDF', 'Excel', 'CSV'].map(f => (
                    <button key={f} onClick={() => setReportFormat(f)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${reportFormat === f ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-background text-text-secondary border-border hover:border-text-muted'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-primary mb-2">{t('includeSections') || 'Include Sections'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Charts', 'Statistics', 'User Details', 'Recommendations', 'AI Insights'].map(s => (
                    <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none ${sections.includes(s) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-border text-text-secondary hover:border-border bg-background'}`}>
                      <input type="checkbox" checked={sections.includes(s)} onChange={() => toggleSection(s)} className="accent-blue-600 w-3.5 h-3.5 flex-shrink-0" />
                      {s === 'Charts' ? t('charts') || s : s === 'Statistics' ? t('statistics') || s : s === 'User Details' ? t('userDetails') || s : s === 'Recommendations' ? t('recommendations') || s : t('aiInsights') || s}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <Button variant="primary" className="w-full justify-center py-3" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <><LineSpinner size={16} color="white" strokeWidth={2}/> {t('generating') || 'Generating...'}</> : t('generateReport') || 'Generate Report'}
                </Button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('reportSummary') || 'Report Summary'}</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div><p className="text-text-muted text-[10px] uppercase">{t('lastGenerated') || 'Last Generated'}</p><p className="font-medium text-text-primary text-xs">{t('today1045') || 'Today, 10:45 AM'}</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">{t('generatedBy') || 'Generated By'}</p><p className="font-medium text-text-primary text-xs">{t('systemAdmin') || 'System Admin'}</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">{t('estSize') || 'Est. Size'}</p><p className="font-medium text-text-primary text-xs">~2.5 MB</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">{t('status') || 'Status'}</p><p className="font-medium text-green-600 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {t('ready') || 'Ready'}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Panel */}
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-card border border-border p-5 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
            <h3 className="font-bold text-text-primary">{t('recentReports') || 'Recent Reports'}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input placeholder={t('searchReportsPlaceholder') || 'Search reports...'} className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:border-green-500 outline-none w-full sm:w-48" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-surface text-xs font-medium text-text-secondary"><Filter size={14}/> {t('filter') || 'Filter'}</button>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
            {reportsList.map((r, i) => (
              <div key={i} className="bg-background rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-soft transition-all-smooth group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.type === 'Security' ? 'bg-red-100 text-red-600' : r.type === 'AI/ML' ? 'bg-purple-100 text-purple-600' : r.type === 'Custom' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${r.type === 'Security' ? 'bg-red-50 text-red-700' : r.type === 'AI/ML' ? 'bg-purple-50 text-purple-700' : r.type === 'Custom' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{t(r.type.toLowerCase()) || r.type}</span>
                      <span className="text-xs text-text-muted">• {r.date} • {r.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto ml-13 sm:ml-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('view') || 'View'}><Eye size={14}/></button>
                  <button className="p-1.5 text-text-muted hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title={t('download') || 'Download'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                  <button className="p-1.5 text-text-muted hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title={t('regenerate') || 'Regenerate'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>
                  <button className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('delete') || 'Delete'}><X size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}