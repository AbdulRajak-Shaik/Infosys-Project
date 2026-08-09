import { useState } from 'react'
import { Leaf, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Globe, ChevronRight, ChevronLeft, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button, Input, SelectInput } from '../components/ui'
import api from '../services/api'

type AuthPage = 'login' | 'register' | 'forgot'

interface AuthPagesProps {
  onLogin: (role: 'farmer' | 'admin') => void
  onBack: () => void
  initialPage?: AuthPage
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special char', ok: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-background'}`} />
        ))}
      </div>
      {password && <p className="text-xs text-text-muted">Strength: <span className="font-semibold">{labels[score - 1] || 'Very Weak'}</span></p>}
    </div>
  )
}

function LoginForm({ onLogin, onForgot, onRegister }: { onLogin: (role: 'farmer' | 'admin') => void; onForgot: () => void; onRegister: () => void }) {
  const [role, setRole] = useState<'farmer' | 'admin'>('farmer')
  const [email, setEmail] = useState('farmer@agroai.com')
  const [password, setPassword] = useState('password123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    
    const payload = {
      email: email,
      password: password,
      role: role
    }
    console.log("Login Payload:", payload)
    
    try {
      const endpoint = role === 'admin' ? '/admin/login' : '/login'
      const response = await api.post(endpoint, payload)
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      setLoading(false)
      onLogin(role)
    } catch (err: any) {
      setLoading(false)
      console.error("Login Error Details:", err)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Login failed. Please check your credentials and server status.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
        <p className="text-sm text-text-muted mt-1">Sign in to your AgroAI account</p>
      </div>

      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={() => { setRole('farmer'); setEmail('farmer@agroai.com'); }}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${role === 'farmer' ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}
        >
          Farmer
        </button>
        <button 
          type="button" 
          onClick={() => { setRole('admin'); setEmail('admin@agroai.com'); }}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${role === 'admin' ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}
        >
          Admin
        </button>
      </div>

      <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={<Mail size={15} />} />

      <div className="flex flex-col gap-1.5 relative">
        <Input 
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          icon={<Lock size={15} />}
        />
        <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" className="rounded border-border accent-primary-600" />
          Remember me
        </label>
        <button onClick={onForgot} className="text-sm font-semibold text-primary-700 hover:text-primary-800">Forgot password?</button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <Button variant="primary" size="lg" loading={loading} onClick={handleLogin} className="w-full justify-center mt-2">
        Sign In
      </Button>

      <div className="relative mt-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-surface px-3 text-xs text-text-muted">or</span></div>
      </div>

      <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-background transition-all-smooth">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-text-muted mt-2">
        Don't have an account?{' '}
        <button onClick={onRegister} className="font-semibold text-primary-700 hover:text-primary-800">Create account</button>
      </p>
    </div>
  )
}

function RegisterForm({ onLogin }: { onSuccess?: () => void; onLogin: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', country: 'India', state: '', district: '', language: 'English', role: 'farmer', terms: false, privacy: false })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [step1Attempted, setStep1Attempted] = useState(false)
  const [step2Attempted, setStep2Attempted] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Step 1 computed errors (shown only after user attempts to continue)
  const nameErr = step1Attempted && !form.name.trim() ? 'Full name is required.' : ''
  const emailErr = step1Attempted
    ? (!form.email.trim() ? 'Email address is required.' : !emailRe.test(form.email) ? 'Please enter a valid email address.' : '')
    : ''
  const passwordErr = step1Attempted
    ? (!form.password ? 'Password is required.' : form.password.length < 8 ? 'Password must contain at least 8 characters.' : '')
    : ''
  const confirmErr = step1Attempted
    ? (!form.confirm ? 'Please confirm your password.' : form.confirm !== form.password ? 'Passwords do not match.' : '')
    : ''

  const step1Valid =
    form.name.trim().length > 0 &&
    emailRe.test(form.email) &&
    form.password.length >= 8 &&
    form.confirm.length > 0 &&
    form.confirm === form.password

  // Step 2 computed errors
  const stateErr = step2Attempted && !form.state.trim() ? 'State is required.' : ''
  const districtErr = step2Attempted && !form.district.trim() ? 'District is required.' : ''
  const step2Valid = form.state.trim().length > 0 && form.district.trim().length > 0

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const langMap: Record<string, number> = {
        'English': 1,
        'Telugu': 2,
        'Hindi': 3,
        'Tamil': 4
      }
      const language_id = langMap[form.language] || 1
      const region = `${form.district}, ${form.state}`

      await api.post('/register', {
        username: form.name,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm,
        language_id: language_id,
        region: region
      })

      setLoading(false)
      setDone(true)
    } catch (err: any) {
      setLoading(false)
      console.error("Register Error Details:", err)
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            setError(err.response.data.detail.map((d: any) => d.msg).join(', '))
          } else {
            setError(err.response.data.detail)
          }
        } else {
          setError('Failed to create account. Please verify input fields.')
        }
      } else {
        setError('Connection failed. Please check backend server status.')
      }
    }
  }

  if (done) return (
    <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-primary-600" />
      </div>
      <h3 className="text-xl font-bold text-text-primary">Account Created!</h3>
      <p className="text-sm text-text-muted text-center">Welcome to AgroAI. Your account has been successfully created.</p>
      <Button variant="primary" size="lg" onClick={onLogin} className="mt-2">Sign In Now</Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-1">
        <h2 className="text-2xl font-bold text-text-primary">Create Account</h2>
        <p className="text-sm text-text-muted mt-1">Step {step} of 3 — {['Basic Info', 'Location & Role', 'Terms & Confirm'][step - 1]}</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-green-500' : 'bg-background'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Input label="Full Name" required error={nameErr} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rajesh Kumar" icon={<User size={15} />} />
          <Input label="Email Address" type="email" required error={emailErr} value={form.email} onChange={e => set('email', e.target.value)} placeholder="rajesh@farm.com" icon={<Mail size={15} />} />
          <Input label="Phone Number" hint="(Optional)" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" icon={<Phone size={15} />} />
          
          <div className="flex flex-col gap-1.5 relative">
            <Input label="Password" required error={passwordErr} type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" icon={<Lock size={15} />} />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            {form.password && !passwordErr && <PasswordStrength password={form.password} />}
          </div>

          <Input label="Confirm Password" required error={confirmErr} type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Re-enter password" icon={<Lock size={15} />} />

          <Button
            variant="primary"
            onClick={() => { setStep1Attempted(true); if (step1Valid) setStep(2) }}
            className="w-full justify-center"
            icon={<ChevronRight size={15} />}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <SelectInput 
            label="Country" 
            value={form.country} 
            onChange={e => set('country', e.target.value)} 
            options={['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'UAE', 'Kenya', 'Nigeria'].map(c => ({ value: c, label: c }))} 
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="State" required error={stateErr} value={form.state} onChange={e => set('state', e.target.value)} placeholder="Punjab" />
            <Input label="District" required error={districtErr} value={form.district} onChange={e => set('district', e.target.value)} placeholder="Ludhiana" />
          </div>
          <SelectInput 
            label="Preferred Language" 
            value={form.language} 
            onChange={e => set('language', e.target.value)} 
            options={['English', 'Hindi', 'Arabic', 'Tamil', 'Telugu', 'Marathi', 'Punjabi', 'Bengali', 'Urdu', 'Kannada'].map(l => ({ value: l, label: l }))} 
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Role<span className="text-error ml-1">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: 'farmer', l: 'Farmer', desc: 'Crop management & AI tools' }, { v: 'admin', l: 'Admin', desc: 'System Administration' }].map(r => (
                <button key={r.v} onClick={() => set('role', r.v)} className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === r.v ? 'border-green-500 bg-green-50' : 'border-border hover:border-border'}`}>
                  <p className={`text-sm font-semibold ${form.role === r.v ? 'text-green-700' : 'text-text-secondary'}`}>{r.l}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} icon={<ChevronLeft size={15} />}>Back</Button>
            <Button
              variant="primary"
              onClick={() => { setStep2Attempted(true); if (step2Valid) setStep(3) }}
              className="flex-1 justify-center"
              icon={<ChevronRight size={15} />}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-background rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
            <p className="font-semibold text-text-primary mb-2">Terms of Service</p>
            <p className="text-xs">By creating an account, you agree that AgroAI may use your agricultural data to improve AI models. Data is anonymized and never shared with third parties without consent.</p>
          </div>
          <div className="bg-background rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
            <p className="font-semibold text-text-primary mb-2">Privacy Policy</p>
            <p className="text-xs">We collect field data, predictions, and usage logs under GDPR compliance. You retain full ownership and can export or delete your data at any time.</p>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.terms} onChange={e => set('terms', e.target.checked)} className="mt-0.5 accent-green-600" />
              <span className="text-sm text-text-secondary">I agree to the <span className="text-green-700 font-medium">Terms of Service</span></span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.privacy} onChange={e => set('privacy', e.target.checked)} className="mt-0.5 accent-green-600" />
              <span className="text-sm text-text-secondary">I agree to the <span className="text-green-700 font-medium">Privacy Policy</span></span>
            </label>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} icon={<ChevronLeft size={15} />}>Back</Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit} disabled={!form.terms || !form.privacy} className="flex-1 justify-center">Create Account</Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <button onClick={onLogin} className="font-semibold text-green-700 hover:text-green-800">Sign in</button>
      </p>
    </div>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pw, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/forgot-password', {
        email: email,
        new_password: pw,
        confirm_password: confirmPw
      })
      setLoading(false)
      setStep('done')
    } catch (err: any) {
      setLoading(false)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Failed to reset password. Please make sure the email exists.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-1">
        <h2 className="text-2xl font-bold text-text-primary">Reset Password</h2>
        <p className="text-sm text-text-muted mt-1">We'll send a verification code to your email</p>
      </div>

      {step === 'email' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={<Mail size={15} />} />
          <Button variant="primary" onClick={() => setStep('otp')} className="w-full justify-center">Send OTP Code</Button>
        </div>
      )}

      {step === 'otp' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <p className="text-sm text-text-muted text-center">Enter the 6-digit code sent to <strong>{email || 'your email'}</strong></p>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="w-full text-center py-3 rounded-xl border-2 border-border text-xl font-mono tracking-[0.5em] focus:border-text-muted" />
          <Button variant="primary" onClick={() => setStep('reset')} className="w-full justify-center">Verify Code</Button>
          <button onClick={() => setStep('email')} className="text-sm text-text-muted hover:text-text-secondary text-center">Resend code</button>
        </div>
      )}

      {step === 'reset' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Input label="New Password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 8 characters" icon={<Lock size={15} />} />
          {pw && <PasswordStrength password={pw} />}
          <Input label="Confirm Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password" icon={<Lock size={15} />} />
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5">{error}</p>}
          <Button variant="primary" loading={loading} onClick={handleResetPassword} className="w-full justify-center">Reset Password</Button>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">Password Reset!</h3>
          <p className="text-sm text-text-muted text-center">Your password has been successfully updated.</p>
          <Button variant="primary" onClick={onBack} className="mt-2">Back to Sign In</Button>
        </div>
      )}

      {step !== 'done' && (
        <button onClick={onBack} className="flex items-center justify-center gap-1 text-sm text-text-muted hover:text-text-secondary">
          <ArrowLeft size={14} />
          Back to sign in
        </button>
      )}
    </div>
  )
}

export default function AuthPages({ onLogin, onBack, initialPage = 'login' }: AuthPagesProps) {
  const [page, setPage] = useState<AuthPage>(initialPage)

  const illustrations = [
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=900&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=900&fit=crop&auto=format',
  ]
  const img = illustrations[page === 'login' ? 0 : 1]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-green-900">
        <img src={img} alt="Agriculture" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 gradient-hero opacity-75" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} />
              Back to Home
            </button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-surface/20 flex items-center justify-center"><Leaf size={24} className="text-white" /></div>
              <span className="text-2xl font-bold">AgroAI</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">AI-Powered<br />Smart Agriculture</h2>
            <p className="text-white/75 leading-relaxed mb-8">Join thousands of farmers using AI to maximize yields, analyze soils, and make data-driven decisions.</p>
            <div className="grid grid-cols-2 gap-4">
              {[{ v: '98.2%', l: 'AI Accuracy' }, { v: '50K+', l: 'Farmers' }, { v: '12', l: 'Crop Types' }, { v: '10+', l: 'Languages' }].map(s => (
                <div key={s.l} className="bg-surface/10 rounded-xl p-3 border border-white/20">
                  <p className="text-xl font-bold">{s.v}</p>
                  <p className="text-white/65 text-xs">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs">© 2026 AgroAI — Enterprise Agriculture AI Platform</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="lg:hidden flex items-center gap-1 text-sm text-text-muted mb-6 hover:text-text-secondary">
            <ArrowLeft size={14} /> Back to Home
          </button>
          <div className="bg-surface rounded-2xl shadow-elevated border border-border p-8">
            {page === 'login' && <LoginForm onLogin={onLogin} onForgot={() => setPage('forgot')} onRegister={() => setPage('register')} />}
            {page === 'register' && <RegisterForm onSuccess={() => setPage('login')} onLogin={() => setPage('login')} />}
            {page === 'forgot' && <ForgotForm onBack={() => setPage('login')} />}
          </div>
        </div>
      </div>
    </div>
  )
}
