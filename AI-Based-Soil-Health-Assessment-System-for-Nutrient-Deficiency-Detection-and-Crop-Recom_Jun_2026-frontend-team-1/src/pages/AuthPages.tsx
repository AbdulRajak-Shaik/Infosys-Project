import { useState } from 'react'
import { Leaf, Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, ChevronLeft, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button, Input, SelectInput } from '../components/ui'
import FloatingChatbot from '../components/FloatingChatbot'
import { loginUser, loginAdmin, getCurrentUser, registerUser, requestPasswordReset, verifyPasswordReset, forgotPassword as apiForgotPassword } from '../services/api'
import { useTranslation } from '../i18n'
import LanguageSelector from '../components/LanguageSelector'
import { INITIAL_LANGUAGES } from '../components/Navbar'

type AuthPage = 'login' | 'register' | 'forgot'

interface AuthPagesProps {
  onLogin: (role: 'farmer' | 'admin') => void
  onBack: () => void
  initialPage?: AuthPage
}

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation()
  const checks = [
    { label: t('charCount'), ok: password.length >= 8 },
    { label: t('uppercase'), ok: /[A-Z]/.test(password) },
    { label: t('lowercase'), ok: /[a-z]/.test(password) },
    { label: t('number'), ok: /\d/.test(password) },
    { label: t('specialChar'), ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-green-600']
  const labels = [t('veryWeak'), t('weak'), t('fair'), t('good'), t('strong')]
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-background'}`} />
        ))}
      </div>
      {password && <p className="text-xs text-text-muted">{t('strength')} <span className="font-semibold">{labels[score - 1] || t('veryWeak')}</span></p>}
    </div>
  )
}

function LoginForm({ onLogin, onForgot, onRegister }: { onLogin: (role: 'farmer' | 'admin') => void; onForgot: () => void; onRegister: () => void }) {
  const { t } = useTranslation()
  const [loginRole, setLoginRole] = useState<'farmer' | 'admin'>('farmer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      if (loginRole === 'admin') {
        await loginAdmin({ email: email.trim(), password, role: 'admin' })
      } else {
        await loginUser({ email: email.trim(), password, role: 'farmer' })
      }
      onLogin(loginRole)
    } catch (err: any) {
      let errMsg = err.message || 'Login failed. Please check your credentials and role selection.'
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = 'Unable to connect to backend server. Please ensure python run_server.py is running on http://127.0.0.1:8000.'
      }
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Role Switcher: Farmer Login vs Admin Login */}
      <div className="flex p-1 bg-background rounded-xl gap-1 border border-border">
        <button
          type="button"
          onClick={() => { setLoginRole('farmer'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            loginRole === 'farmer'
              ? 'bg-surface text-green-700 shadow-soft border border-green-200'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span>🌾</span>
          <span>{t('farmerLogin') || 'Farmer Login'}</span>
        </button>
        <button
          type="button"
          onClick={() => { setLoginRole('admin'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            loginRole === 'admin'
              ? 'bg-surface text-blue-700 shadow-soft border border-blue-200'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span>🛡️</span>
          <span>{t('adminLogin') || 'Admin Login'}</span>
        </button>
      </div>

      <div className="text-center mb-1 space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
          👋 {t('welcomeBack') || 'Welcome Back!'}
        </span>
        <h2 className="text-2xl font-bold text-text-primary">
          {loginRole === 'farmer' ? (t('farmerLogin') || 'Farmer Login') : (t('adminLogin') || 'Admin Login')}
        </h2>
        <p className="text-sm text-text-muted">
          {loginRole === 'farmer'
            ? (t('farmerLoginDesc') || 'Sign in to access your farm dashboard, soil health reports & crop recommendations')
            : (t('adminLoginDesc') || 'Sign in to access system administration, user management & AI analytics')}
        </p>
      </div>

      <Input 
        label={t('emailAddress')} 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder={loginRole === 'farmer' ? 'you@example.com' : 'admin@agroai.com'} 
        icon={<Mail size={15} />} 
      />

      <div className="flex flex-col gap-1.5 relative">
        <Input 
          label={t('password')}
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t('password')}
          icon={<Lock size={15} />}
        />
        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary" aria-label={showPw ? t('hidePassword') : t('showPassword')}>
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" className="rounded border-border accent-primary-600" />
          {t('rememberMe')}
        </label>
        <button type="button" onClick={onForgot} className="text-sm font-semibold text-primary-700 hover:text-primary-800">{t('forgotPassword')}</button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <Button variant="primary" size="lg" loading={loading} onClick={handleLogin} className="w-full justify-center mt-1">
        {loginRole === 'farmer' ? (t('signInAsFarmer') || t('signIn') || 'Sign In as Farmer') : (t('signInAsAdmin') || t('signIn') || 'Sign In as Admin')}
      </Button>

      <div className="relative mt-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-surface px-3 text-xs text-text-muted">{t('or')}</span></div>
      </div>

      <button type="button" onClick={handleLogin} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-background transition-all-smooth">
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        {t('continueWithGoogle')}
      </button>

      <p className="text-center text-sm text-text-muted mt-2">
        {t('dontHaveAccount')}{' '}
        <button type="button" onClick={onRegister} className="font-semibold text-primary-700 hover:text-primary-800">{t('createAccount')}</button>
      </p>
    </div>
  )
}

function RegisterForm({ onLogin }: { onSuccess?: () => void; onLogin: () => void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<{ name: string; email: string; phone: string; password: string; confirm: string; country: string; state: string; district: string; language: string; role: 'farmer' | 'admin'; terms: boolean; privacy: boolean }>({ name: '', email: '', phone: '', password: '', confirm: '', country: 'India', state: '', district: '', language: 'English', role: 'farmer', terms: false, privacy: false })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [step1Attempted, setStep1Attempted] = useState(false)
  const [step2Attempted, setStep2Attempted] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Step 1 computed errors
  const nameErr = step1Attempted && !form.name.trim() ? t('fullNameRequired') : ''
  const emailErr = step1Attempted
    ? (!form.email.trim() ? t('emailRequired') : !emailRe.test(form.email) ? t('emailInvalid') : '')
    : ''
  const passwordErr = step1Attempted
    ? (!form.password
      ? t('passwordRequired')
      : form.password.length < 8
        ? t('passwordMinChar')
        : !/[A-Z]/.test(form.password)
          ? t('passwordUppercase')
          : !/[a-z]/.test(form.password)
            ? t('passwordLowercase')
            : !/\d/.test(form.password)
              ? t('passwordNumber')
              : !/[!@#$%^&*(),.?":{}|<>]/.test(form.password)
                ? t('passwordSpecial')
                : '')
    : ''
  const confirmErr = step1Attempted
    ? (!form.confirm ? t('confirmPasswordRequired') : form.confirm !== form.password ? t('passwordsDoNotMatch') : '')
    : ''

  const step1Valid =
    form.name.trim().length > 0 &&
    emailRe.test(form.email) &&
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /\d/.test(form.password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(form.password) &&
    form.confirm.length > 0 &&
    form.confirm === form.password

  // Step 2 computed errors
  const stateErr = step2Attempted && !form.state.trim() ? t('stateRequired') : ''
  const districtErr = step2Attempted && !form.district.trim() ? t('districtRequired') : ''
  const step2Valid = form.state.trim().length > 0 && form.district.trim().length > 0

  const [regError, setRegError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setRegError('')
    try {
      await registerUser({
        username: form.name || (form.role === 'admin' ? 'System Admin' : 'Farmer'),
        email: form.email,
        password: form.password,
        confirm_password: form.confirm,
        language_id: 1,
        region: form.state ? `${form.state}, ${form.district}` : 'Telangana',
        role: form.role,
      })
      setDone(true)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setRegError('Failed to connect to backend server. Please verify python run_server.py is running on port 8000.')
      } else {
        setRegError(msg ? (t('registrationFailed') || msg) : t('registrationFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-primary-600" />
      </div>
      <h3 className="text-xl font-bold text-text-primary">{t('accountCreated')}</h3>
      <p className="text-sm text-text-muted text-center">{t('accountCreatedDesc')}</p>
      <Button variant="primary" size="lg" onClick={onLogin} className="mt-2">{t('signInNow')}</Button>
    </div>
  )

  const stepTitles = [t('basicInfo'), t('locationAndRole'), t('termsAndConfirm')]

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-1">
        <h2 className="text-2xl font-bold text-text-primary">{t('createAccount')}</h2>
        <p className="text-sm text-text-muted mt-1">{t('step')} {step} {t('of')} 3 — {stepTitles[step - 1]}</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-green-500' : 'bg-background'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Input label={t('fullName')} required error={nameErr} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rajesh Kumar" icon={<User size={15} />} />
          <Input label={t('emailAddress')} type="email" required error={emailErr} value={form.email} onChange={e => set('email', e.target.value)} placeholder="rajesh@farm.com" icon={<Mail size={15} />} />
          <Input label={t('phoneNumber')} hint={t('optional')} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" icon={<Phone size={15} />} />
          
          <div className="flex flex-col gap-1.5 relative">
            <Input label={t('password')} required error={passwordErr} type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder={t('charCount')} icon={<Lock size={15} />} />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-secondary">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            {form.password && !passwordErr && <PasswordStrength password={form.password} />}
          </div>

          <Input label={t('confirmPassword')} required error={confirmErr} type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder={t('confirmPassword')} icon={<Lock size={15} />} />

          <Button
            variant="primary"
            onClick={() => { setStep1Attempted(true); if (step1Valid) setStep(2) }}
            className="w-full justify-center"
            icon={<ChevronRight size={15} />}
          >
            {t('continue')}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <SelectInput 
            label={t('country')} 
            value={form.country} 
            onChange={e => set('country', e.target.value)} 
            options={['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'UAE', 'Kenya', 'Nigeria'].map(c => ({ value: c, label: c }))} 
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('state')} required error={stateErr} value={form.state} onChange={e => set('state', e.target.value)} placeholder="Punjab" />
            <Input label={t('district')} required error={districtErr} value={form.district} onChange={e => set('district', e.target.value)} placeholder="Ludhiana" />
          </div>
          <SelectInput 
            label={t('preferredLanguage')} 
            value={form.language} 
            onChange={e => set('language', e.target.value)} 
            options={INITIAL_LANGUAGES.map(l => ({ value: l.name, label: `${l.name} (${l.native})` }))} 
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">{t('userRole')}<span className="text-error ml-1">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set('role', 'farmer')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.role === 'farmer'
                    ? 'border-green-500 bg-green-50'
                    : 'border-border bg-surface hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-semibold ${form.role === 'farmer' ? 'text-green-700' : 'text-text-primary'}`}>{t('roleFarmer') || 'Farmer / Producer'}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{t('roleDescription') || 'Access soil analysis, crop recommendations, and weather alerts.'}</p>
              </button>
              <button
                type="button"
                onClick={() => set('role', 'admin')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.role === 'admin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-border bg-surface hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-semibold ${form.role === 'admin' ? 'text-blue-700' : 'text-text-primary'}`}>{t('systemAdmin') || 'System Administrator'}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{t('adminRoleDescription') || 'Access system administration, user management, and AI analytics.'}</p>
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} icon={<ChevronLeft size={15} />}>{t('back')}</Button>
            <Button
              variant="primary"
              onClick={() => { setStep2Attempted(true); if (step2Valid) setStep(3) }}
              className="flex-1 justify-center"
              icon={<ChevronRight size={15} />}
            >
              {t('continue')}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-background rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
            <p className="font-semibold text-text-primary mb-2">{t('termsOfService')}</p>
            <p className="text-xs">{t('termsDesc')}</p>
          </div>
          <div className="bg-background rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
            <p className="font-semibold text-text-primary mb-2">{t('privacyPolicy')}</p>
            <p className="text-xs">{t('privacyDesc')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.terms} onChange={e => set('terms', e.target.checked)} className="mt-0.5 accent-green-600" />
              <span className="text-sm text-text-secondary">{t('agreeTerms')} <span className="text-green-700 font-medium">{t('termsOfService')}</span></span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.privacy} onChange={e => set('privacy', e.target.checked)} className="mt-0.5 accent-green-600" />
              <span className="text-sm text-text-secondary">{t('agreePrivacy')} <span className="text-green-700 font-medium">{t('privacyPolicy')}</span></span>
            </label>
          </div>
          {regError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{regError}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} icon={<ChevronLeft size={15} />}>{t('back')}</Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit} disabled={!form.terms || !form.privacy} className="flex-1 justify-center">{t('createAccount')}</Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-text-muted">
        {t('alreadyHaveAccount')}{' '}
        <button onClick={onLogin} className="font-semibold text-green-700 hover:text-green-800">{t('signIn')}</button>
      </p>
    </div>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pw, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const handleReset = async () => {
    setError('')
    if (!pw || pw !== confirmPw) {
      setError(t('passwordsDoNotMatch'))
      return
    }

    setLoading(true)
    try {
      await apiForgotPassword({
        email: email.trim(),
        reset_token: resetToken,
        new_password: pw,
        confirm_password: confirmPw,
      })
      setStep('done')
    } catch (err: any) {
      setError(err.message ? (t('passwordResetFailed') || err.message) : t('passwordResetFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mb-1">
        <h2 className="text-2xl font-bold text-text-primary">{t('resetPassword')}</h2>
        <p className="text-sm text-text-muted mt-1">{t('resetPasswordDesc')}</p>
      </div>

      {step === 'email' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Input label={t('emailAddress')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={<Mail size={15} />} />
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <Button variant="primary" loading={emailLoading} onClick={async () => {
            setError('')
            setEmailLoading(true)
            try {
              await requestPasswordReset(email.trim())
              setStep('otp')
            } catch (err: any) {
              setError(err.message ? (t('unableToSendResetCode') || err.message) : t('unableToSendResetCode'))
            } finally {
              setEmailLoading(false)
            }
          }} className="w-full justify-center">{t('sendOtpCode')}</Button>
        </div>
      )}

      {step === 'otp' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <p className="text-sm text-text-muted text-center">{t('enterOtpCode')} <strong>{email || t('emailAddress')}</strong></p>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="w-full text-center py-3 rounded-xl border-2 border-border text-xl font-mono tracking-[0.5em] focus:border-text-muted" />
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <Button variant="primary" loading={otpLoading} onClick={async () => {
            setError('')
            setOtpLoading(true)
            try {
              const result = await verifyPasswordReset(email.trim(), otp)
              setResetToken(result.reset_token)
              setStep('reset')
            } catch (err: any) {
              setError(err.message ? (t('resetCodeInvalid') || err.message) : t('resetCodeInvalid'))
            } finally {
              setOtpLoading(false)
            }
          }} className="w-full justify-center">{t('verifyCode')}</Button>
          <button onClick={() => setStep('email')} className="text-sm text-text-muted hover:text-text-secondary text-center">{t('resendCode')}</button>
        </div>
      )}

      {step === 'reset' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Input label={t('newPassword')} type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={t('charCount')} icon={<Lock size={15} />} />
          {pw && <PasswordStrength password={pw} />}
          <Input label={t('confirmPassword')} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder={t('confirmPassword')} icon={<Lock size={15} />} />
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <Button variant="primary" loading={loading} onClick={handleReset} className="w-full justify-center">{t('resetPassword')}</Button>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">{t('passwordResetSuccess')}</h3>
          <p className="text-sm text-text-muted text-center">{t('passwordResetSuccessDesc')}</p>
          <Button variant="primary" onClick={onBack} className="mt-2">{t('backToSignIn')}</Button>
        </div>
      )}

      {step !== 'done' && (
        <button onClick={onBack} className="flex items-center justify-center gap-1 text-sm text-text-muted hover:text-text-secondary">
          <ArrowLeft size={14} />
          {t('backToSignIn')}
        </button>
      )}
    </div>
  )
}

export default function AuthPages({ onLogin, onBack, initialPage = 'login' }: AuthPagesProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState<AuthPage>(initialPage)

  const illustrations = [
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=900&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=900&fit=crop&auto=format',
  ]
  const img = illustrations[page === 'login' ? 0 : 1]

  const stats = [
    { v: '98.2%', l: t('aiAccuracy') },
    { v: t('farmersCount'), l: t('farmer') },
    { v: '12', l: t('cropTypes') },
    { v: t('languagesCount'), l: t('preferredLanguage') }
  ]

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
              {t('backToHome')}
            </button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-surface/20 flex items-center justify-center"><Leaf size={24} className="text-white" /></div>
              <span className="text-2xl font-bold">{t('agroAi')}</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t('aiPoweredSmartAgri')}</h2>
            <p className="text-white/75 leading-relaxed mb-8">{t('authHeroSubtitle')}</p>
            <div className="grid grid-cols-2 gap-4">
              {stats.map(s => (
                <div key={s.l} className="bg-surface/10 rounded-xl p-3 border border-white/20">
                  <p className="text-xl font-bold">{s.v}</p>
                  <p className="text-white/65 text-xs">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs">© 2026 {t('agroAi')} — {t('enterprisePlatform')}</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={onBack} className="lg:hidden flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary">
              <ArrowLeft size={14} /> {t('backToHome')}
            </button>
            <LanguageSelector compact className="ml-auto" />
          </div>
          <div className="bg-surface rounded-2xl shadow-elevated border border-border p-8">
            {page === 'login' && <LoginForm onLogin={onLogin} onForgot={() => setPage('forgot')} onRegister={() => setPage('register')} />}
            {page === 'register' && <RegisterForm onSuccess={() => setPage('login')} onLogin={() => setPage('login')} />}
            {page === 'forgot' && <ForgotForm onBack={() => setPage('login')} />}
          </div>
        </div>
      </div>

      <FloatingChatbot />
    </div>
  )
}
