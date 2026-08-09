import { useState, useEffect, useRef } from 'react'
import api from './services/api'
import { X, Eye, EyeOff, User, Mail, Phone, Lock, Globe, MapPin, Shield, Search, TrendingUp, Filter, Calendar, Bot, MessageSquare, FileText } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { useTranslate } from './contexts/TranslationContext'
import LandingPage from './pages/LandingPage'
import AuthPages from './pages/AuthPages'
import FarmerDashboard from './pages/FarmerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { SoilClassification, CropRecommendation, FertilizerRecommendation, DiseaseDetection } from './pages/AIModules'
import AIChatbot from './pages/AIChatbot'
import { WeatherDashboard, PredictionHistory, Notifications, Feedback, Profile, Settings, notifs } from './pages/MorePages'
import { About } from './pages/About'
import GuestExperience from './pages/GuestExperience'
import FarmerCommunity from './pages/FarmerCommunity'
import { Toast, LineSpinner, Input, SelectInput, Button } from './components/ui'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { FEATURES } from './config'

type AppState = 'landing' | 'auth' | 'app' | 'guest'
type Role = 'farmer' | 'admin'
export type ThemeMode = 'light' | 'dark' | 'system'

function SplashScreen({ onDone }: { onDone: () => void }) {
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
  const [splashDone, setSplashDone] = useState(false)
  const [appState, setAppState] = useState<AppState>('landing')
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'forgot'>('login')
  const [role, setRole] = useState<Role>('farmer')
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // Check for auto-login on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1]
        const decoded = JSON.parse(atob(payloadBase64))
        if (decoded && decoded.role) {
          setRole(decoded.role === 'admin' ? 'admin' : 'farmer')
          setAppState('app')
          setCurrentPage('dashboard')
        }
      } catch (err) {
        console.error('Invalid token', err)
        localStorage.removeItem('token')
      }
    }
  }, [])

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('agroai_theme', mode)
    const messages: Record<ThemeMode, string> = {
      light: '☀️ Light Theme Enabled',
      dark: '🌙 Dark Theme Enabled',
      system: '💻 Following System Theme',
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
  }

  // ── Global notification state ─────────────────────────────
  const [notificationsList, setNotificationsList] = useState<any[]>([])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications')
      setNotificationsList(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (appState === 'app') {
      fetchNotifications()
    }
  }, [appState])

  const notifUnreadCount = notificationsList.filter(n => !n.isRead).length

  const markNotifRead = async (id: any) => {
    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    try {
      await api.patch(`/api/notifications/${id}/read`)
    } catch (err) {
      console.error(err)
    }
  }

  const markAllNotifsRead = async () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })))
    try {
      await api.patch('/api/notifications/read-all')
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setAppState('landing')
    setCurrentPage('dashboard')
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
            {currentPage === 'notifications' && <Notifications onNavigate={setCurrentPage} notificationsList={notificationsList} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifsRead} />}
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
            <h2 className="text-lg font-bold text-text-primary">Add New User</h2>
            <p className="text-sm text-text-muted mt-0.5">Create a new account for a farmer or administrator.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-background transition-colors mt-0.5 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Personal Information */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Personal Information</p>
            <div className="space-y-4">
              <Input 
                label="Full Name" 
                required 
                error={errs.name} 
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
                placeholder="Enter full name" 
                icon={<User size={14} />} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Email Address" 
                  required 
                  error={errs.email} 
                  type="email" 
                  value={form.email} 
                  onChange={e => set('email', e.target.value)} 
                  placeholder="user@example.com" 
                  icon={<Mail size={14} />} 
                />
                <Input 
                  label="Phone Number" 
                  hint="(Optional)" 
                  type="tel" 
                  value={form.phone} 
                  onChange={e => set('phone', e.target.value)} 
                  placeholder="+91 98765 43210" 
                  icon={<Phone size={14} />} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input 
                    label="Password" 
                    required 
                    error={errs.password} 
                    type={showPw ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={e => set('password', e.target.value)} 
                    placeholder="Min. 8 characters" 
                    icon={<Lock size={14} />} 
                  />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    label="Confirm Password" 
                    required 
                    error={errs.confirm} 
                    type={showConfirm ? 'text' : 'password'} 
                    value={form.confirm} 
                    onChange={e => set('confirm', e.target.value)} 
                    placeholder="Re-enter password" 
                    icon={<Lock size={14} />} 
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput 
                  label="User Role" 
                  value={form.role} 
                  onChange={e => set('role', e.target.value)} 
                  options={['Farmer', 'Admin'].map(r => ({ value: r, label: r }))} 
                />
                <SelectInput 
                  label="Language Preference" 
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
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Location Information</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput 
                  label="Country" 
                  value={form.country} 
                  onChange={e => set('country', e.target.value)} 
                  options={ADD_USER_COUNTRIES.map(c => ({ value: c, label: c }))} 
                />
                <Input label="State" required error={errs.state} value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Punjab" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="District" required error={errs.district} value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Ludhiana" />
                <Input label="City / Village / Town" required error={errs.city} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Kotkapura" />
              </div>
              <div className="md:max-w-xs">
                <Input label="Postal Code" hint="(Optional)" value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="e.g. 142001" />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Account Status */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Account Status</p>
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
          <p className="text-xs text-text-muted hidden sm:block"><span className="text-red-500">*</span> Required fields</p>
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-background transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center transition-all">
              {loading ? <><LineSpinner size={14} color="white" strokeWidth={2} /> Creating user...</> : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function AdminChatbotMonitoring() {
  const { t } = useTranslate()
  const [timeRange, setTimeRange] = useState('Last 7 Days')
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setLoading(true)
      try {
        const [analyticsRes, activityRes] = await Promise.all([
          api.get('/api/chatbot/monitoring-analytics'),
          api.get('/api/chatbot/recent-activity')
        ])
        if (!active) return
        setAnalytics(analyticsRes.data)
        
        // Map recentActivity keys from backend
        const mapped = (activityRes.data || []).map((it: any) => ({
          id: it.id || `conv-${Math.floor(Math.random() * 10000)}`,
          time: it.timestamp ? new Date(it.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          user: it.userName || 'Unknown',
          role: it.userRole || 'Farmer',
          lang: it.language || 'English',
          q: it.question || '',
          topic: it.topic || 'General',
          status: it.status || 'Resolved',
          responseTime: '1.2s'
        }))
        setRecentActivity(mapped)
      } catch (err) {
        console.error("Error fetching chatbot monitoring data:", err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchData()
    return () => { active = false }
  }, [])

  const lineData = analytics?.trends ?? []
  const topicsData = analytics?.topics ?? []
  const languageData = analytics?.languages ?? []
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B']

  const filteredActivity = recentActivity.filter((r: any) =>
    (r.user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.q || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.lang || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                  <p className="text-xs text-text-muted">{t('user')}</p>
                  <p className="font-medium text-text-primary">{selectedConversation.user} <span className="text-xs ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{selectedConversation.role}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">Conversation ID</p>
                  <p className="font-mono text-sm text-text-primary">{selectedConversation.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">{t('topic')} & {t('language')}</p>
                  <p className="font-medium text-text-primary">{selectedConversation.topic} · {selectedConversation.lang}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">{t('aiProcessingTime')}</p>
                  <p className="font-medium text-text-primary">{selectedConversation.responseTime}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="bg-background rounded-xl p-4 ml-8 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-text-secondary">{t('userQuestion')}</span>
                    <span className="text-xs text-text-muted">{selectedConversation.time}</span>
                  </div>
                  <p className="text-sm text-text-primary">{selectedConversation.q}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 mr-8 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Bot size={14} /> {t('agroAiResponse')}</span>
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
          <h2 className="text-2xl font-bold text-text-primary">{t('chatbot-monitoring')}</h2>
          <p className="text-sm text-text-muted">{t('chatbotMonitoringDesc')}</p>
        </div>
        <SelectInput 
          options={[{label:'Today',value:'Today'},{label:'Last 7 Days',value:'Last 7 Days'},{label:'Last 30 Days',value:'Last 30 Days'}]} 
          value={timeRange} 
          onChange={e=>setTimeRange(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: t('totalConversations'), value: loading ? '...' : (analytics?.kpis?.total_conversations?.toLocaleString() ?? '0'), trend: '+12%', up: true, icon: <MessageSquare size={20} className="text-blue-500" /> },
          { title: t('questionsToday'), value: loading ? '...' : (analytics?.kpis?.questions_today?.toLocaleString() ?? '0'), trend: '+5%', up: true, icon: <Bot size={20} className="text-green-500" /> },
          { title: t('activeChatbotUsers'), value: loading ? '...' : (analytics?.kpis?.active_users_today?.toLocaleString() ?? '0'), trend: '+18%', up: true, icon: <User size={20} className="text-purple-500" /> },
          { title: t('avgQuestionsSession'), value: loading ? '...' : (analytics?.kpis?.avg_questions_per_session?.toString() ?? '0.0'), trend: '-2%', up: false, icon: <TrendingUp size={20} className="text-orange-500" /> }
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
          <h3 className="font-bold text-text-primary mb-6">{t('conversationTrends')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-text-muted">{t('loadingMetrics')}</div>
            ) : (
              <LineChart data={lineData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="conversations" name={t('conversations')} stroke="#3B82F6" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
                <Line type="monotone" dataKey="activeUsers" name={t('activeUsers')} stroke="#10B981" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border flex flex-col">
          <h3 className="font-bold text-text-primary mb-2">{t('languagesUsed')}</h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              {loading ? (
                <div className="flex items-center justify-center h-full text-text-muted">{t('loadingMetrics')}</div>
              ) : (
                <PieChart>
                  <Pie data={languageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-background rounded-xl border border-border flex justify-between items-center">
            <div>
              <p className="text-xs text-text-muted">{t('avgResponseTime')}</p>
              <p className="text-lg font-bold text-text-primary">1.2 sec</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Bot size={20} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-6">{t('mostCommonTopics')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-text-muted">{t('loadingMetrics')}</div>
            ) : (
              <BarChart data={topicsData} layout="vertical" margin={{ left: 50, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} name={t('inquiries')} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary">{t('recentBotActivity')}</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background">
              <Search size={14} className="text-text-muted" />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchLogs')} 
                className="bg-transparent text-xs outline-none" 
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-text-muted">{t('loadingMetrics')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>{[t('time'), t('user'), t('role'), t('language'), t('question'), t('topic'), t('status')].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredActivity.map((r, i) => (
                  <tr key={i} onClick={() => setSelectedConversation(r)} className="border-b border-border hover:bg-background transition-colors cursor-pointer group">
                    <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">{r.time}</td>
                    <td className="py-3 px-4 font-medium text-text-primary">{r.user}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${r.role.toLowerCase() === 'farmer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t(r.role.toLowerCase() === 'farmer' ? 'farmerRole' : 'systemAdmin')}</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{r.lang}</td>
                    <td className="py-3 px-4 text-text-primary max-w-xs truncate" title={r.q}>{r.q}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{r.topic}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status.toLowerCase() === 'resolved' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status.toLowerCase() === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                        {t(r.status.toLowerCase())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}


function AdminUserManagement() {
  const { t, lang } = useTranslate()
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
  const [editStatus, setEditStatus] = useState('active')
  const [editRole, setEditRole] = useState('farmer')
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/admin/users')
      const mapped = res.data.map((u: any) => ({
        id: u.id,
        name: u.username || 'No Name',
        email: u.email,
        phone: '+91 9999999999',
        role: u.role === 'admin' ? 'Admin' : 'Farmer',
        status: u.status,
        region: u.region || 'Punjab',
        joined: new Date(u.created_at).toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'kn' ? 'kn-IN' : lang === 'mr' ? 'mr-IN' : lang === 'bn' ? 'bn-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString() : 'Never',
        lang: u.language_id === 1 ? 'English' : u.language_id === 2 ? 'Telugu' : u.language_id === 3 ? 'Hindi' : u.language_id === 4 ? 'Tamil' : u.language_id === 5 ? 'Kannada' : u.language_id === 6 ? 'Marathi' : 'Bengali',
        analyses: 0,
        chatbot: 0
      }))
      setUserList(mapped)
      setLoading(false)
    } catch (err: any) {
      console.error(err)
      setError(t('failedToFetchUsers') || 'Failed to fetch user list.')
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
    try {
      await api.delete(`/admin/users/${selectedUser.id}`)
      setShowDeleteModal(false)
      showToast(t('userDeletedSuccessfully') || 'User deleted successfully.')
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.detail || t('failedToDeleteUser') || 'Failed to delete user.')
    }
  }
  
  const handleEditSave = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        role: editRole,
        status: editStatus
      })
      setShowEditModal(false)
      showToast(t('userUpdatedSuccessfully') || 'User updated successfully.')
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.detail || t('failedToUpdateUser') || 'Failed to update user.')
    }
  }

  const openEditModal = (u: any) => {
    setSelectedUser(u)
    setEditStatus(u.status)
    setEditRole(u.role === 'Admin' ? 'admin' : 'farmer')
    setShowEditModal(true)
  }

  const handlePromote = async () => {
    if (confirm(t('confirmPromoteAdmin') || "Are you sure you want to promote this user to Admin?\nThis user will gain full administrative privileges.")) {
      try {
        await api.put(`/admin/users/${selectedUser.id}`, {
          role: 'admin'
        })
        setShowEditModal(false)
        showToast(t('userPromotedToAdmin') || 'User promoted to Admin.')
        fetchUsers()
      } catch (err: any) {
        alert(err.response?.data?.detail || t('failedToPromoteUser') || 'Failed to promote user.')
      }
    }
  }

  const handleDeactivate = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        status: 'inactive'
      })
      setShowEditModal(false)
      showToast(t('userDeactivated') || 'User account deactivated.')
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.detail || t('failedToDeactivateUser') || 'Failed to deactivate user.')
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-bold text-lg text-text-primary">{t('addNewUser')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-surface rounded-lg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const target = e.target as any
              const payload = {
                username: target.username.value,
                email: target.email.value,
                password: target.password.value,
                role: target.role.value,
                status: target.status.value,
                region: target.region.value,
                language_id: parseInt(target.language_id.value)
              }
              try {
                await api.post('/api/users', payload)
                setShowAddModal(false)
                showToast('User created successfully.')
                fetchUsers()
              } catch (err: any) {
                console.error("Create User Error Details:", err)
                alert(err.response?.data?.detail || 'Failed to create user. Please check your connection and input validity.')
              }
            }} className="p-6 overflow-y-auto space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Input name="username" label={t('fullName')} required />
                <Input name="email" label={t('emailAddress')} type="email" required />
                <Input name="password" label={t('password')} type="password" required />
                <Input name="region" label={t('locationRegion')} required />
                <SelectInput name="role" label={t('role')} options={[{label:t('farmerRole'),value:'farmer'},{label:t('systemAdmin'),value:'admin'}]} defaultValue="farmer" />
                <SelectInput name="status" label={t('status')} options={[{label:t('active'),value:'active'},{label:t('inactive'),value:'inactive'},{label:t('suspended'),value:'suspended'}]} defaultValue="active" />
                <SelectInput name="language_id" label={t('preferredLanguage')} options={[
                  {label:'English',value:'1'},
                  {label:'Telugu',value:'2'},
                  {label:'Hindi',value:'3'},
                  {label:'Tamil',value:'4'},
                  {label:'Kannada',value:'5'},
                  {label:'Marathi',value:'6'},
                  {label:'Bengali',value:'7'}
                ]} defaultValue="1" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>{t('cancel')}</Button>
                <Button variant="primary" type="submit">{t('createUser')}</Button>
              </div>
            </form>
          </div>
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
            <p className="text-sm text-text-secondary mb-6">{t('confirmDeleteUser')} <strong>{selectedUser?.name}</strong>?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</Button>
              <Button variant="primary" className="flex-1 justify-center bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={handleDelete}>{t('delete')}</Button>
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
                  <Input label={t('fullName')} value={selectedUser.name} disabled />
                  <Input label={t('emailAddress')} value={selectedUser.email} disabled />
                  <Input label={t('phoneNumber')} value={selectedUser.phone} disabled />
                  <Input label={t('locationRegion')} value={selectedUser.region} disabled />
                  <SelectInput label={t('preferredLanguage')} options={[
                    {label: t('English'), value: 'English'},
                    {label: t('Telugu'), value: 'Telugu'},
                    {label: t('Hindi'), value: 'Hindi'},
                    {label: t('Tamil'), value: 'Tamil'},
                    {label: t('Kannada'), value: 'Kannada'},
                    {label: t('Marathi'), value: 'Marathi'},
                    {label: t('Bengali'), value: 'Bengali'}
                  ]} value={selectedUser.lang} onChange={()=>{}} disabled />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><Lock size={16}/> {t('accountControls')}</h4>
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <SelectInput label={t('status')} options={[{label:t('active'),value:'active'},{label:t('suspended'),value:'suspended'},{label:t('inactive'),value:'inactive'}]} value={editStatus} onChange={e=>setEditStatus(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="primary" className="flex-1 justify-center" onClick={handleEditSave}>{t('saveChanges')}</Button>
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
                      <p className="text-xs text-red-600">{t('grantFullAccess')}</p>
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
              <h3 className="font-bold text-lg text-text-primary">{t('userOverview')}</h3>
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
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">{t('accountDetails')}</h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div><p className="text-text-muted text-xs">{t('phone')}</p><p className="font-medium text-text-primary">{selectedUser.phone}</p></div>
                  <div><p className="text-text-muted text-xs">{t('location')}</p><p className="font-medium text-text-primary">{selectedUser.region}</p></div>
                  <div><p className="text-text-muted text-xs">{t('language')}</p><p className="font-medium text-text-primary">{selectedUser.lang}</p></div>
                  <div><p className="text-text-muted text-xs">{t('status')}</p><p className="font-medium text-text-primary">{selectedUser.status}</p></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">{t('platformUsage')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-2xl font-bold text-text-primary">{selectedUser.analyses}</p>
                    <p className="text-xs text-text-muted mt-1">{t('totalPredictions')}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-2xl font-bold text-text-primary">{selectedUser.chatbot}</p>
                    <p className="text-xs text-text-muted mt-1">{t('chatbotInquiries')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 text-sm pt-2">
                  <div><p className="text-text-muted text-xs">{t('joinDate')}</p><p className="font-medium text-text-primary">{selectedUser.joined}</p></div>
                  <div><p className="text-text-muted text-xs">{t('lastLogin')}</p><p className="font-medium text-text-primary">{selectedUser.lastLogin}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('userManagement')}</h2>
          <p className="text-sm text-text-muted">{t('registeredUsers', { count: userList.length })}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          {t('addUserButton')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border focus-within:border-text-muted focus-within:ring-2 focus-within:ring-text-muted/25 transition-all duration-200 bg-surface flex-1">
          <Search size={16} className="text-text-muted flex-shrink-0" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={t('searchUsersPlaceholder') || 'Search by name, email, or phone...'}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none" 
          />
        </div>
        <div className="flex gap-3">
          <SelectInput 
            options={[{label:t('allRoles'),value:'All'},{label:t('farmerRole'),value:'Farmer'},{label:t('systemAdmin'),value:'Admin'}]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          />
          <SelectInput 
            options={[{label:t('allStatus'),value:'All'},{label:t('active'),value:'active'},{label:t('pending'),value:'pending'},{label:t('suspended'),value:'suspended'},{label:t('inactive'),value:'inactive'}]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-text-muted text-sm flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-t-green-600 border-green-100 animate-spin" />
          <span>{t('loadingUserAccounts')}</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 text-sm">{error}</div>
      ) : (
        <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-background border-b border-border">
              <tr>{[t('user'), t('role'), t('status'), t('joined'), t('actions')].map(h => (
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
                      <button onClick={() => openEditModal(u)} className="px-3 py-1.5 rounded-lg border border-border hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors text-text-secondary">{t('edit')}</button>
                      <button onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }} className="px-3 py-1.5 rounded-lg bg-red-600 border border-red-600 text-white shadow-sm hover:bg-red-700 hover:border-red-700 hover:shadow active:scale-[0.98] text-xs font-medium transition-all">{t('delete')}</button>
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
      )}
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
  const { t } = useTranslate()
  const [dateRange, setDateRange] = useState('Last 7 Days')
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [userLanguageData, setUserLanguageData] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        setLoading(true)
        const [growthRes, usersRes, analyticsRes] = await Promise.all([
          api.get('/admin/dashboard/user-growth'),
          api.get('/admin/users').catch(() => ({ data: [] })),
          api.get('/api/analytics/summary').catch(() => ({ data: null }))
        ])
        if (active) {
          const mappedGrowth = growthRes.data.map((item: any) => ({
            month: item.month,
            predictions: Math.round(item.total * 2.3),
            users: item.total
          }))
          setUserGrowth(mappedGrowth)

          const languagesMap: Record<number, string> = {
            1: 'English',
            2: 'Telugu',
            3: 'Hindi',
            4: 'Tamil'
          }
          const langCounts: Record<string, number> = {}
          usersRes.data.forEach((u: any) => {
            const lName = languagesMap[u.language_id || 1] || 'English'
            langCounts[lName] = (langCounts[lName] || 0) + 1
          })
          const mappedLang = Object.entries(langCounts).map(([name, value]) => ({
            name,
            value
          }))
          setUserLanguageData(mappedLang.length > 0 ? mappedLang : [
            { name: 'English', value: 1 }
          ])
          if (analyticsRes?.data) {
            setAnalyticsData(analyticsRes.data)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [])
  
  const soilData = analyticsData?.soil_type_distribution?.length > 0 ? analyticsData.soil_type_distribution : []
  const languageData = analyticsData?.language_usage?.length > 0 ? analyticsData.language_usage : userLanguageData
  const nutrientData = analyticsData?.nutrient_deficiency_stats?.length > 0 ? analyticsData.nutrient_deficiency_stats : []
  const cropData = analyticsData?.crop_recommendation_counts?.length > 0 
    ? analyticsData.crop_recommendation_counts.map((c: any) => ({ name: c.name, count: c.value }))
    : []
  
  // Dynamic translations mapping
  const translatedSoilData = soilData.map((item: any) => ({ ...item, name: t(item.name) || item.name }))
  const translatedLanguageData = languageData.map((item: any) => ({ ...item, name: t(item.name) || item.name }))
  const translatedNutrientData = nutrientData.map((item: any) => ({ ...item, name: t(item.name) || item.name }))
  const translatedCropData = cropData.map((item: any) => ({ ...item, name: t(item.name) || item.name }))

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LineSpinner size={24} color="green" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('analyticsAndReports')}</h2>
          <p className="text-sm text-text-muted">{t('platformWideUsage')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-text-muted" />
          <SelectInput 
            options={[
              {label: 'Today', value: 'Today'}, 
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
          <h3 className="font-bold text-text-primary mb-4">{t('predictionsOverTime')}</h3>
          {renderChart(userGrowth, (
            <AreaChart data={userGrowth} margin={{ left: -20 }}>
              <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2}/><stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="predictions" stroke="#2E7D32" strokeWidth={2} fill="url(#grad1)" name="Predictions" />
            </AreaChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('userGrowth')}</h3>
          {renderChart(userGrowth, (
            <BarChart data={userGrowth} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="users" fill="#1565C0" radius={[6, 6, 0, 0]} name="Users" />
            </BarChart>
          ))}
        </div>
        
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('soilTypeDistribution')}</h3>
          {renderChart(translatedSoilData, (
            <PieChart>
              <Pie data={translatedSoilData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {translatedSoilData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('languagesUsedPlatform')}</h3>
          {renderChart(translatedLanguageData, (
            <PieChart>
              <Pie data={translatedLanguageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {translatedLanguageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ))}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('mostRecommendedCrops')}</h3>
          {renderChart(translatedCropData, (
            <BarChart data={translatedCropData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 'auto']} hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} barSize={20} name="Recommendations" />
            </BarChart>
          ), 240)}
        </div>

        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-bold text-text-primary mb-4">{t('nutrientDeficiencyStats')}</h3>
          {renderChart(translatedNutrientData, (
            <BarChart data={translatedNutrientData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 'auto']} hide />
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
  const { t } = useTranslate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportType, setReportType] = useState('Overall Platform Report')
  const [startDate, setStartDate] = useState('2026-07-01')
  const [endDate, setEndDate] = useState('2026-07-28')
  const [reportFormat, setReportFormat] = useState('PDF')
  const [reportsList, setReportsList] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [sections, setSections] = useState<string[]>(['Charts', 'Statistics'])
  const toggleSection = (s: string) => setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const fetchRecentReports = async () => {
    setLoadingList(true)
    try {
      const resp = await api.get('/api/reports/recent')
      setReportsList(resp.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchRecentReports()
  }, [])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const payload = {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        export_format: reportFormat,
        included_sections: sections
      }
      
      const response = await api.post('/api/reports/generate', payload, { responseType: 'blob' })
      
      const ext = reportFormat.toLowerCase() === 'pdf' ? 'pdf' : (reportFormat.toLowerCase() === 'csv' ? 'csv' : 'xlsx')
      const fileName = `report_${reportType.toLowerCase().replace('/', '_')}.${ext}`
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      fetchRecentReports()
    } catch (err) {
      console.error(err)
      alert("Failed to generate report.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadHistorical = async (reportId: number, filename: string) => {
    try {
      const response = await api.get(`/api/reports/download/${reportId}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error(err)
      alert("Failed to download historical report.")
    }
  }

  const filteredReports = reportsList.filter((r: any) =>
    (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const reportTypes = [
    'User Activity Report', 
    'Soil Analysis Report', 
    'Crop Recommendation Report', 
    'Fertilizer Recommendation Report', 
    'Weather Analytics Report', 
    'Chatbot Usage Report', 
    'Community Activity Report', 
    'Feedback Report', 
    'Overall Platform Report'
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('reportGenerationCenter')}</h2>
          <p className="text-sm text-text-muted">{t('reportGenerationCenterDesc')}</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 flex-1 overflow-hidden pb-10">
        {/* Report Generator Panel */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-surface rounded-2xl shadow-card border border-border p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-500"/> {t('configureReport')}</h3>
            
            <div className="space-y-4">
              <SelectInput 
                label={t('reportType')} 
                options={reportTypes.map(o => ({label: t(o), value: o}))} 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)} 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input label={t('endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              
              <div>
                <p className="text-xs font-semibold text-text-primary mb-2">{t('exportFormat')}</p>
                <div className="flex gap-2">
                  {['PDF', 'Excel', 'CSV'].map(f => (
                    <button key={f} onClick={() => setReportFormat(f)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${reportFormat === f ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-background text-text-secondary border-border hover:border-text-muted'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-primary mb-2">{t('includeSections')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Charts', 'Statistics', 'User Details', 'Recommendations', 'AI Insights'].map(s => (
                    <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none ${sections.includes(s) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-border text-text-secondary hover:border-border bg-background'}`}>
                      <input type="checkbox" checked={sections.includes(s)} onChange={() => toggleSection(s)} className="accent-blue-600 w-3.5 h-3.5 flex-shrink-0" />
                      {t(s.replace(' ', '')) || t(s)}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <Button variant="primary" className="w-full justify-center py-3" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <><LineSpinner size={16} color="white" strokeWidth={2}/> {t('generating')}</> : t('generateReport')}
                </Button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('reportSummary')}</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div><p className="text-text-muted text-[10px] uppercase">{t('lastGenerated')}</p><p className="font-medium text-text-primary text-xs">Today, 10:45 AM</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">{t('generatedBy')}</p><p className="font-medium text-text-primary text-xs">{t('systemAdmin')}</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">{t('estSize')}</p><p className="font-medium text-text-primary text-xs">~2.5 MB</p></div>
                <div><p className="text-text-muted text-[10px] uppercase">{t('status')}</p><p className="font-medium text-green-600 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {t('ready')}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Panel */}
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-card border border-border p-5 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
            <h3 className="font-bold text-text-primary">{t('recentReports')}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  placeholder={t('searchReports')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:border-green-500 outline-none w-full sm:w-48" 
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-surface text-xs font-medium text-text-secondary"><Filter size={14}/> {t('filter')}</button>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
            {loadingList ? (
              <div className="flex justify-center py-10">
                <LineSpinner size={20} color="green" />
              </div>
            ) : filteredReports.map((r, i) => (
              <div key={i} className="bg-background rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-soft transition-all-smooth group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.type === 'Security' ? 'bg-red-100 text-red-600' : r.type === 'AI/ML' ? 'bg-purple-100 text-purple-600' : r.type === 'Custom' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${r.type === 'Security' ? 'bg-red-50 text-red-700' : r.type === 'AI/ML' ? 'bg-purple-50 text-purple-700' : r.type === 'Custom' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{t(r.type) || r.type}</span>
                      <span className="text-xs text-text-muted">• {r.date} • {r.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto ml-13 sm:ml-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-1.5 text-text-muted hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download" onClick={() => handleDownloadHistorical(r.id, r.title)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                </div>
              </div>
            ))}
            {!loadingList && filteredReports.length === 0 && (
              <div className="text-center py-10">
                <p className="text-text-muted text-xs">{t('noReportsGenerated')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
