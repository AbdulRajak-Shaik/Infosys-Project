import { useState, useEffect, useRef } from 'react'
import { X, Eye, EyeOff, User, Mail, Phone, Lock, Globe, MapPin, Shield, Search, TrendingUp, Filter, Calendar, Bot, MessageSquare, FileText } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
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
import { getCurrentUser, logoutUser, type UserProfile } from './services/api'
import { useTranslation } from './i18n'

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
  const [allNotifs, setAllNotifs] = useState(() => generateRealNotifications())
  const [notifReadIds, setNotifReadIds] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('notification_read_ids') || '[]')
      return new Set(saved)
    } catch { return new Set() }
  })

  useEffect(() => {
    const refresh = () => setAllNotifs(generateRealNotifications())
    window.addEventListener('storage', refresh)
    window.addEventListener('predictionCreated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('predictionCreated', refresh)
    }
  }, [])

  const notifUnreadCount = allNotifs.filter(n => !notifReadIds.has(n.id)).length
  
  const markNotifRead = (id: string) => {
    setNotifReadIds(s => {
      const newSet = new Set([...s, id])
      try { localStorage.setItem('notification_read_ids', JSON.stringify([...newSet])) } catch {}
      return newSet
    })
  }
  
  const markAllNotifsRead = () => {
    const allIds = new Set(allNotifs.map(n => n.id))
    setNotifReadIds(allIds)
    try { localStorage.setItem('notification_read_ids', JSON.stringify([...allIds])) } catch {}
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

        <FloatingChatbot />
      </div>
  )
}

// ---- Admin Stub Pages ----

const ADD_USER_LANGUAGES = ['English', 'Hindi', 'Arabic', 'Tamil', 'Telugu', 'Marathi', 'Punjabi', 'Bengali', 'Urdu', 'Kannada']
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
  
  const lineData = [
    { name: 'Mon', conversations: 120, activeUsers: 85 },
    { name: 'Tue', conversations: 145, activeUsers: 95 },
    { name: 'Wed', conversations: 160, activeUsers: 110 },
    { name: 'Thu', conversations: 130, activeUsers: 90 },
    { name: 'Fri', conversations: 180, activeUsers: 130 },
    { name: 'Sat', conversations: 210, activeUsers: 160 },
    { name: 'Sun', conversations: 190, activeUsers: 140 },
  ]
  const topicsData = [
    { name: 'Crop Recommendation', count: 450 },
    { name: 'Weather', count: 320 },
    { name: 'Fertilizer', count: 280 },
    { name: 'Pest Management', count: 210 },
    { name: 'Government Schemes', count: 150 },
    { name: 'Soil Classification', count: 120 },
    { name: 'Irrigation', count: 90 },
  ]
  const languageData = [
    { name: 'English', value: 45 },
    { name: 'Hindi', value: 30 },
    { name: 'Punjabi', value: 10 },
    { name: 'Tamil', value: 8 },
    { name: 'Telugu', value: 5 },
    { name: 'Others', value: 2 },
  ]
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B']

  const recentActivity = [
    { id: 'conv-1045', time: '2 mins ago', user: 'Rajesh Kumar', role: 'Farmer', lang: 'Hindi', q: 'What is the best time to sow wheat?', topic: 'Crop Recommendation', status: 'Resolved', responseTime: '1.2s' },
    { id: 'conv-1046', time: '15 mins ago', user: 'Sarah Okonkwo', role: 'Farmer', lang: 'English', q: 'Forecast for tomorrow?', topic: 'Weather', status: 'Resolved', responseTime: '0.8s' },
    { id: 'conv-1047', time: '34 mins ago', user: 'Guest_992', role: 'Guest', lang: 'Tamil', q: 'Subsidy for tractor?', topic: 'Government Schemes', status: 'Pending', responseTime: '2.1s' },
    { id: 'conv-1048', time: '1 hour ago', user: 'Ali Hassan', role: 'Farmer', lang: 'Punjabi', q: 'Yellow spots on cotton leaves', topic: 'Pest Management', status: 'Resolved', responseTime: '3.5s' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in relative">
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-bold text-lg text-text-primary">{t('conversationDetails')}</h3>
              <button onClick={() => setSelectedConversation(null)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">User</p>
                  <p className="font-medium text-text-primary">{selectedConversation.user} <span className="text-xs ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{selectedConversation.role}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">Conversation ID</p>
                  <p className="font-mono text-sm text-text-primary">{selectedConversation.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">Topic & Language</p>
                  <p className="font-medium text-text-primary">{selectedConversation.topic} · {selectedConversation.lang}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">AI Processing Time</p>
                  <p className="font-medium text-text-primary">{selectedConversation.responseTime}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="bg-background rounded-xl p-4 ml-8 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-text-secondary">User Question</span>
                    <span className="text-xs text-text-muted">{selectedConversation.time}</span>
                  </div>
                  <p className="text-sm text-text-primary">{selectedConversation.q}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 mr-8 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Bot size={14} /> AgroAI Response</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    Based on current conditions, the optimal time for sowing wheat in your region is between November 1st and November 15th. Ensure the soil temperature is between 20-22°C.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Chatbot Monitoring</h2>
          <p className="text-sm text-text-muted">Real-time metrics and conversation logs</p>
        </div>
        <SelectInput 
          options={[{label:'Today',value:'Today'},{label:'Last 7 Days',value:'Last 7 Days'},{label:'Last 30 Days',value:'Last 30 Days'}]} 
          value={timeRange} 
          onChange={e=>setTimeRange(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Conversations', value: '14,230', trend: '+12%', up: true, icon: <MessageSquare size={20} className="text-blue-500" /> },
          { title: 'Questions Today', value: '842', trend: '+5%', up: true, icon: <Bot size={20} className="text-green-500" /> },
          { title: 'Active Chatbot Users', value: '3,190', trend: '+18%', up: true, icon: <User size={20} className="text-purple-500" /> },
          { title: 'Avg Questions/Session', value: '4.2', trend: '-2%', up: false, icon: <TrendingUp size={20} className="text-orange-500" /> }
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
          <h3 className="font-bold text-text-primary mb-6">Conversation Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="conversations" name="Conversations" stroke="#3B82F6" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
              <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#10B981" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border flex flex-col">
          <h3 className="font-bold text-text-primary mb-2">Languages Used</h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-background rounded-xl border border-border flex justify-between items-center">
            <div>
              <p className="text-xs text-text-muted">Avg Response Time</p>
              <p className="text-lg font-bold text-text-primary">1.4 sec</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Bot size={20} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-6">Most Common Topics</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topicsData} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} name="Inquiries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Recent Bot Activity</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background">
              <Search size={14} className="text-text-muted" />
              <input placeholder="Search logs..." className="bg-transparent text-xs outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>{['Time', 'User', 'Role', 'Language', 'Question', 'Topic', 'Status'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recentActivity.map((r, i) => (
                <tr key={i} onClick={() => setSelectedConversation(r)} className="border-b border-border hover:bg-background transition-colors cursor-pointer group">
                  <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">{r.time}</td>
                  <td className="py-3 px-4 font-medium text-text-primary">{r.user}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${r.role === 'Farmer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{r.role}</span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-xs">{r.lang}</td>
                  <td className="py-3 px-4 text-text-primary max-w-xs truncate" title={r.q}>{r.q}</td>
                  <td className="py-3 px-4 text-text-secondary text-xs">{r.topic}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Resolved' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'Resolved' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                      {r.status}
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
  const [userList, setUserList] = useState<any[]>([
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@farm.com', phone: '+91 9876543210', role: 'Farmer', status: 'active', region: 'Punjab', joined: 'Jul 24, 2025', lastLogin: '2 hours ago', lang: 'Hindi', analyses: 45, chatbot: 120 },
    { id: 2, name: 'Ali Hassan', email: 'ali@agro.pk', phone: '+92 3001234567', role: 'Farmer', status: 'pending', region: 'Sindh', joined: 'Jul 22, 2025', lastLogin: 'Never', lang: 'Urdu', analyses: 0, chatbot: 0 },
    { id: 3, name: 'Sarah Okonkwo', email: 'sarah@farm.ng', phone: '+234 8012345678', role: 'Farmer', status: 'active', region: 'Lagos', joined: 'Jul 21, 2025', lastLogin: '1 day ago', lang: 'English', analyses: 89, chatbot: 340 },
    { id: 4, name: 'Mohammed Al-Farsi', email: 'mfarsi@agro.ae', phone: '+971 501234567', role: 'Farmer', status: 'active', region: 'Abu Dhabi', joined: 'Jul 19, 2025', lastLogin: '5 mins ago', lang: 'Arabic', analyses: 21, chatbot: 56 },
    { id: 5, name: 'Inactive User', email: 'old@farm.com', phone: '+1 555000000', role: 'Farmer', status: 'active', region: 'California', joined: 'Jan 10, 2024', lastLogin: '412 Days ago', lang: 'English', analyses: 2, chatbot: 4 },
  ])
  
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

  const filtered = userList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) || 
                          u.phone.includes(search)
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleDelete = () => {
    setUserList(prev => prev.filter(u => u.id !== selectedUser.id))
    setShowDeleteModal(false)
    showToast('User deleted successfully.')
  }
  
  const handleEditSave = (updatedUser: any) => {
    setUserList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    setShowEditModal(false)
    showToast('User updated successfully.')
  }

  const handlePromote = () => {
    if (confirm("Are you sure you want to promote this user to Admin?\nThis user will gain full administrative privileges.")) {
      const updated = {...selectedUser, role: 'Admin'}
      setUserList(prev => prev.map(u => u.id === updated.id ? updated : u))
      setShowEditModal(false)
      showToast('User promoted to Admin.')
    }
  }

  const handleDeactivate = () => {
    const updated = {...selectedUser, status: 'inactive'}
    setUserList(prev => prev.map(u => u.id === updated.id ? updated : u))
    setShowEditModal(false)
    showToast('User account deactivated.')
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
              <h3 className="font-bold text-lg text-text-primary">{t('editUserProfile')}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><User size={16}/> {t('personalInformation')}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label={t('fullName')} defaultValue={selectedUser.name} />
                  <Input label={t('emailAddress')} defaultValue={selectedUser.email} />
                  <Input label={t('phoneNumber')} defaultValue={selectedUser.phone} />
                  <Input label={t('locationRegion')} defaultValue={selectedUser.region} />
                  <SelectInput label={t('languagePreference')} options={[{label:'English',value:'English'},{label:'Hindi',value:'Hindi'},{label:'Urdu',value:'Urdu'}]} value={selectedUser.lang} onChange={()=>{}} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><Lock size={16}/> {t('accountControls')}</h4>
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <SelectInput label={t('status')} options={[{label:'Active',value:'active'},{label:'Suspended',value:'suspended'},{label:'Inactive',value:'inactive'}]} value={selectedUser.status} onChange={()=>{}} />
                  <div className="flex gap-2">
                    <Button variant="primary" className="flex-1 justify-center" onClick={() => handleEditSave(selectedUser)}>{t('saveChanges')}</Button>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-red-800">{t('dangerZone')}</h4>
                {selectedUser.lastLogin.includes('Days ago') && parseInt(selectedUser.lastLogin) > 365 && (
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-red-100">
                    <div>
                      <p className="font-semibold text-red-800 text-sm">{t('inactiveAccountDetected')}</p>
                      <p className="text-xs text-red-600">User inactive for: {selectedUser.lastLogin}</p>
                    </div>
                    <Button variant="secondary" className="border-red-200 text-red-700 hover:bg-red-50" onClick={handleDeactivate}>{t('deactivate')}</Button>
                  </div>
                )}
                {selectedUser.role !== 'Admin' && (
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-red-100">
                    <div>
                      <p className="font-semibold text-red-800 text-sm">{t('administrativePrivileges')}</p>
                      <p className="text-xs text-red-600">{t('grantAdminAccess')}</p>
                    </div>
                    <Button variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={handlePromote}>{t('promoteToAdmin')}</Button>
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
              <h3 className="font-bold text-lg text-text-primary">User Overview</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-sm">
                  {selectedUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <h2 className="text-xl font-bold text-text-primary">{selectedUser.name}</h2>
                <p className="text-sm text-text-muted mb-2">{selectedUser.email}</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${selectedUser.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{selectedUser.role}</span>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">Account Details</h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div><p className="text-text-muted text-xs">Phone</p><p className="font-medium text-text-primary">{selectedUser.phone}</p></div>
                  <div><p className="text-text-muted text-xs">Location</p><p className="font-medium text-text-primary">{selectedUser.region}</p></div>
                  <div><p className="text-text-muted text-xs">Language</p><p className="font-medium text-text-primary">{selectedUser.lang}</p></div>
                  <div><p className="text-text-muted text-xs">Status</p><p className="font-medium text-text-primary">{selectedUser.status}</p></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">Platform Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-2xl font-bold text-text-primary">{selectedUser.analyses}</p>
                    <p className="text-xs text-text-muted mt-1">Total Predictions</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-2xl font-bold text-text-primary">{selectedUser.chatbot}</p>
                    <p className="text-xs text-text-muted mt-1">Chatbot Inquiries</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 text-sm pt-2">
                  <div><p className="text-text-muted text-xs">Join Date</p><p className="font-medium text-text-primary">{selectedUser.joined}</p></div>
                  <div><p className="text-text-muted text-xs">Last Login</p><p className="font-medium text-text-primary">{selectedUser.lastLogin}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">User Management</h2>
          <p className="text-sm text-text-muted">{userList.length} registered users</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          + Add User
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border focus-within:border-text-muted focus-within:ring-2 focus-within:ring-text-muted/25 transition-all duration-200 bg-surface flex-1">
          <Search size={16} className="text-text-muted flex-shrink-0" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name, email, or phone..."
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none" 
          />
        </div>
        <div className="flex gap-3">
          <SelectInput 
            options={[{label:'All Roles',value:'All'},{label:'Farmer',value:'Farmer'},{label:'Admin',value:'Admin'}]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          />
          <SelectInput 
            options={[{label:'All Status',value:'All'},{label:'Active',value:'active'},{label:'Pending',value:'pending'},{label:'Suspended',value:'suspended'},{label:'Inactive',value:'inactive'}]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-background border-b border-border">
            <tr>{['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
              <th key={h} className="py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
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
                  }`}>{u.role}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200'
                    : u.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'bg-background text-text-secondary border border-border'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${u.status === 'active' ? 'bg-green-500' : u.status === 'pending' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-text-muted">{u.joined}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setSelectedUser(u); setShowEditModal(true); }} className="px-3 py-1.5 rounded-lg border border-border hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors text-text-secondary">Edit</button>
                    <button onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }} className="px-3 py-1.5 rounded-lg bg-red-600 border border-red-600 text-white shadow-sm hover:bg-red-700 hover:border-red-700 hover:shadow active:scale-[0.98] text-xs font-medium transition-all">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-text-muted text-sm">No users found matching your criteria.</div>
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
  
  const translatedAnalyticsData = analyticsData.map(item => ({
    ...item,
    month: t(item.month),
    [t('totalPredictions')]: item.predictions,
    [t('userManagement')]: item.users,
  }))

  const soilData = [
    { name: t('Clay Soil'), value: 35 },
    { name: t('Black Soil'), value: 25 },
    { name: t('Loamy Soil'), value: 20 },
    { name: t('Red Soil'), value: 10 },
    { name: t('Sandy Soil'), value: 10 },
  ]
  const languageData = [
    { name: 'English', value: 60 },
    { name: 'Hindi', value: 20 },
    { name: 'Punjabi', value: 8 },
    { name: 'Tamil', value: 7 },
    { name: 'Telugu', value: 5 },
  ]
  const nutrientData = [
    { name: t('nitrogen'), value: 75 },
    { name: t('phosphorus'), value: 45 },
    { name: t('potassium'), value: 30 },
    { name: t('soilPh'), value: 40 },
  ]
  const cropData = [
    { name: t('Wheat'), count: 1200 },
    { name: t('Rice'), count: 950 },
    { name: t('Cotton'), count: 800 },
    { name: t('Maize'), count: 650 },
    { name: t('Other'), count: 500 },
  ]
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B', '#06B6D4']

  const renderChart = (data: any, children: React.ReactNode, height = 220) => {
    if (!data || data.length === 0) {
      return <div className={`flex items-center justify-center text-text-muted text-sm`} style={{ height: `${height}px` }}>No analytics data available.</div>
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
          <p className="text-sm text-text-muted">Platform-wide usage and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-text-muted" />
          <SelectInput 
            options={[
              {label: t('today'), value: 'Today'}, 
              {label: 'Last 7 Days', value: 'Last 7 Days'}, 
              {label: 'Last 30 Days', value: 'Last 30 Days'}, 
              {label: 'Custom Range', value: 'Custom'}
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
          <h3 className="font-bold text-text-primary mb-4">Soil Type Distribution</h3>
          {renderChart(soilData, (
            <PieChart>
              <Pie data={soilData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {soilData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">Languages Used (Platform)</h3>
          {renderChart(languageData, (
            <PieChart>
              <Pie data={languageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {languageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">Most Recommended Crops</h3>
          {renderChart(cropData, (
            <BarChart data={cropData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} barSize={20} name="Recommendations" />
            </BarChart>
          ), 240)}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">Nutrient Deficiency Statistics</h3>
          {renderChart(nutrientData, (
            <BarChart data={nutrientData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} name="Deficiency (%)" />
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
    { title: 'Monthly Platform Report — July 2026', type: 'Platform', date: 'Jul 25, 2026', size: '2.4 MB' },
    { title: 'AI Model Performance Q2 2026', type: 'AI/ML', date: 'Jun 30, 2026', size: '4.1 MB' },
    { title: 'User Engagement Analysis H1 2026', type: 'Analytics', date: 'Jun 30, 2026', size: '3.8 MB' },
    { title: 'Security Audit Report July 2026', type: 'Security', date: 'Jul 20, 2026', size: '1.2 MB' },
    ...(FEATURES.DISEASE_DETECTION ? [{ title: 'Disease Detection Accuracy Report', type: 'AI/ML', date: 'Jul 15, 2026', size: '5.6 MB' }] : [{ title: 'Crop Recommendation Accuracy Report', type: 'AI/ML', date: 'Jul 15, 2026', size: '5.6 MB' }]),
  ])
  
  const [sections, setSections] = useState<string[]>(['Charts', 'Statistics'])
  const toggleSection = (s: string) => setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setReportsList([{ title: 'Custom Generated Report', type: 'Custom', date: 'Just now', size: '1.8 MB' }, ...reportsList])
    }, 1500)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Report Generation Center</h2>
          <p className="text-sm text-text-muted">Create, manage and export comprehensive platform reports</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 flex-1 overflow-hidden pb-10">
        {/* Report Generator Panel */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-surface rounded-2xl shadow-card border border-border p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-500"/> Configure Report</h3>
            
            <div className="space-y-4">
              <SelectInput label="Report Type" options={['User Activity Report', 'Soil Analysis Report', 'Crop Recommendation Report', 'Fertilizer Recommendation Report', 'Weather Analytics Report', 'Chatbot Usage Report', 'Community Activity Report', 'Feedback Report', 'Overall Platform Report'].map(o => ({label: o, value: o}))} value="Overall Platform Report" onChange={()=>{}} />
              
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Date" type="date" defaultValue="2026-07-01" />
                <Input label="End Date" type="date" defaultValue="2026-07-28" />
              </div>
              
              <div>
                <p className="text-xs font-semibold text-text-primary mb-2">Export Format</p>
                <div className="flex gap-2">
                  {['PDF', 'Excel', 'CSV'].map(f => (
                    <button key={f} onClick={() => setReportFormat(f)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${reportFormat === f ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-background text-text-secondary border-border hover:border-text-muted'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-primary mb-2">Include Sections</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Charts', 'Statistics', 'User Details', 'Recommendations', 'AI Insights'].map(s => (
                    <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none ${sections.includes(s) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-border text-text-secondary hover:border-border bg-background'}`}>
                      <input type="checkbox" checked={sections.includes(s)} onChange={() => toggleSection(s)} className="accent-blue-600 w-3.5 h-3.5 flex-shrink-0" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <Button variant="primary" className="w-full justify-center py-3" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <><LineSpinner size={16} color="white" strokeWidth={2}/> Generating...</> : 'Generate Report'}
                </Button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Report Summary</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div><p className="text-text-muted text-[10px] uppercase">Last Generated</p><p className="font-medium text-text-primary text-xs">Today, 10:45 AM</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">Generated By</p><p className="font-medium text-text-primary text-xs">System Admin</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">Est. Size</p><p className="font-medium text-text-primary text-xs">~2.5 MB</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">Status</p><p className="font-medium text-green-600 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Ready</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Panel */}
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-card border border-border p-5 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
            <h3 className="font-bold text-text-primary">Recent Reports</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input placeholder="Search reports..." className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:border-green-500 outline-none w-full sm:w-48" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-surface text-xs font-medium text-text-secondary"><Filter size={14}/> Filter</button>
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${r.type === 'Security' ? 'bg-red-50 text-red-700' : r.type === 'AI/ML' ? 'bg-purple-50 text-purple-700' : r.type === 'Custom' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{r.type}</span>
                      <span className="text-xs text-text-muted">• {r.date} • {r.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto ml-13 sm:ml-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={14}/></button>
                  <button className="p-1.5 text-text-muted hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                  <button className="p-1.5 text-text-muted hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Regenerate"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>
                  <button className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><X size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}