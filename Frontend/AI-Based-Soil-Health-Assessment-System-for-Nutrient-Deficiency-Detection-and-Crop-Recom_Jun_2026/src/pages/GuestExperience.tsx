import { useState, type ReactNode } from 'react'
import {
  Leaf, Sprout, CheckCircle2, Lock, Zap, Camera, FlaskConical,
  MapPin, CloudRain, Download, Sparkles, X, Star, Bug, Bot,
  BarChart3, History, ArrowRight,
} from 'lucide-react'
import { CropRecommendation } from './AIModules'
import { FEATURES } from '../config'

const TRIAL_KEY = 'agroai_guest_trial_used'

// ── Guest Navbar ──────────────────────────────────────────
function GuestNavbar({ trialExhausted, onLogin, onRegister }: {
  trialExhausted: boolean; onLogin: () => void; onRegister: () => void
}) {
  return (
    <header className="h-16 bg-surface border-b border-border shadow-soft sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
          <Leaf size={18} className="text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary text-base">AgroAI</span>
          <span className="px-2 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full tracking-wide">
            GUEST USER
          </span>
        </div>
      </div>

      {/* Trial counter */}
      <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all-smooth ${
        trialExhausted
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        <Zap size={12} className={trialExhausted ? 'text-red-500' : 'text-amber-600'} />
        Free Trial · {trialExhausted ? '0' : '1'} / 1 Analysis Remaining
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onLogin}
          className="px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-background rounded-xl transition-all-smooth"
        >
          Sign In
        </button>
        <button
          onClick={onRegister}
          className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white text-sm font-semibold rounded-xl shadow-soft hover:opacity-90 transition-opacity"
        >
          Create Account <ArrowRight size={13} />
        </button>
      </div>
    </header>
  )
}

// ── Welcome Page ──────────────────────────────────────────
function GuestWelcomePage({ onStart, onLogin }: {
  onStart: () => void; onLogin: () => void
}) {
  const trialFeatures = [
    { icon: <Camera size={15} />, label: 'Upload Soil Image' },
    { icon: <FlaskConical size={15} />, label: 'Enter NPK Values' },
    { icon: <MapPin size={15} />, label: 'GPS Location Detection' },
    { icon: <CloudRain size={15} />, label: 'Auto Weather Fetch' },
    { icon: <Sparkles size={15} />, label: 'AI Crop Prediction' },
    { icon: <Download size={15} />, label: 'Preview Report' },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4 md:p-6">
      <div className="max-w-2xl w-full animate-fade-in">
        <div className="bg-surface rounded-3xl shadow-elevated border border-border overflow-hidden">

          {/* Gradient header */}
          <div className="gradient-primary px-8 pt-10 pb-8 text-center">
            <div className="relative mx-auto w-20 h-20 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-surface/20 flex items-center justify-center shadow-soft">
                <Sprout size={40} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-soft">
                <Sparkles size={15} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Try AgroAI for Free</h1>
            <p className="text-green-100 text-base leading-relaxed max-w-md mx-auto">
              Experience our AI-powered crop recommendation with one complimentary analysis.
              No registration required.
            </p>
          </div>

          {/* Info banner */}
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3.5">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {['One free analysis', 'No credit card required', 'Registration required for additional analyses'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <CheckCircle2 size={12} className="text-amber-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
              In your free trial you can:
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-7">
              {trialFeatures.map(f => (
                <div key={f.label} className="flex items-center gap-2.5 p-3 bg-background rounded-xl border border-border hover:border-green-200 hover:bg-green-50/40 transition-all-smooth">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-soft">
                    <span className="text-white">{f.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Trial counter visual */}
            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-text-primary text-sm">1 Free Analysis Available</p>
                <p className="text-xs text-text-muted mt-0.5">1 of 1 crop recommendation remaining in your trial</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full py-4 gradient-primary text-white font-bold rounded-2xl text-base shadow-card hover:opacity-90 active:scale-[0.99] transition-all-smooth flex items-center justify-center gap-2"
            >
              <Sprout size={20} />
              Start Free Crop Analysis
              <ArrowRight size={18} />
            </button>

            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 h-px bg-background" />
              <span className="text-xs text-text-muted font-medium whitespace-nowrap">Already have an account?</span>
              <div className="flex-1 h-px bg-background" />
            </div>
            <button
              onClick={onLogin}
              className="w-full mt-4 py-3 border-2 border-border text-text-secondary font-semibold rounded-xl hover:bg-background hover:border-border transition-all-smooth text-sm"
            >
              Sign In to Full Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Locked State ──────────────────────────────────────────
function LockedState({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const premiumFeatures = [
    'Unlimited Crop Recommendations',
    'Soil Classification',
    ...(FEATURES.DISEASE_DETECTION ? ['Disease Detection'] : []),
    'Fertilizer Recommendations',
    'AI Chatbot',
    'Prediction History',
    'Weather Insights',
    'Profile Management',
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4 md:p-6">
      <div className="max-w-lg w-full animate-fade-in">
        <div className="bg-surface rounded-3xl shadow-elevated border border-border overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-8 pt-10 pb-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-surface" />
              <div className="absolute bottom-2 right-8 w-24 h-24 rounded-full bg-surface" />
            </div>
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="w-20 h-20 rounded-full bg-surface/20 flex items-center justify-center">
                <Lock size={36} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-white/30 border-dashed animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Free Trial Has Been Used</h2>
            <p className="text-amber-100 text-sm leading-relaxed">
              You've already completed your complimentary AI crop analysis.
            </p>
          </div>

          {/* Counter */}
          <div className="bg-orange-50 border-b border-orange-100 px-6 py-3 flex items-center justify-center gap-3">
            <Zap size={14} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-700">0 / 1 Analyses Remaining · Trial Complete</span>
          </div>

          {/* Features */}
          <div className="p-6 md:p-8">
            <p className="text-sm font-semibold text-text-secondary mb-4">
              Create a free AgroAI account to continue using:
            </p>
            <div className="space-y-2 mb-6">
              {premiumFeatures.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <button
              onClick={onRegister}
              className="w-full py-3.5 gradient-primary text-white font-bold rounded-xl shadow-soft hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-3"
            >
              <ArrowRight size={16} />
              Create Free Account
            </button>
            <button
              onClick={onLogin}
              className="w-full py-3 border-2 border-border text-text-secondary font-semibold rounded-xl hover:bg-background transition-all-smooth text-sm"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Premium Feature Modal ─────────────────────────────────
function PremiumModal({ onClose, onLogin, onRegister }: {
  onClose: () => void; onLogin: () => void; onRegister: () => void
}) {
  const benefits: { icon: ReactNode; label: string }[] = [
    { icon: <Sparkles size={13} />, label: 'Unlimited AI Predictions' },
    { icon: <History size={13} />, label: 'Save Prediction History' },
    { icon: <CloudRain size={13} />, label: 'Weather Integration' },
    ...(FEATURES.DISEASE_DETECTION ? [{ icon: <Bug size={13} />, label: 'Disease Detection' }] : []),
    { icon: <Leaf size={13} />, label: 'Soil Classification' },
    { icon: <Bot size={13} />, label: 'AI Chatbot' },
    { icon: <FlaskConical size={13} />, label: 'Fertilizer Recommendation' },
    { icon: <BarChart3 size={13} />, label: 'Analytics & Reports' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-3xl shadow-elevated border border-border max-w-md w-full overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="gradient-primary p-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Create Your Free AgroAI Account</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              You've used your complimentary AI analysis. Register to continue using all farming tools.
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1.5 flex-shrink-0 ml-3 hover:bg-surface/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-2 mb-6">
            {benefits.map(b => (
              <div key={b.label} className="flex items-center gap-2 text-sm text-text-secondary p-2.5 bg-background rounded-xl border border-border">
                <span className="text-green-600 flex-shrink-0">{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onRegister}
            className="w-full py-3 gradient-primary text-white font-bold rounded-xl shadow-soft hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-3"
          >
            <ArrowRight size={15} />
            Create Free Account
          </button>
          <button
            onClick={onLogin}
            className="w-full py-2.5 text-sm text-text-muted hover:text-text-secondary transition-colors font-medium text-center"
          >
            Already have an account?{' '}
            <span className="text-green-600 font-semibold">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Post-Prediction Sticky Banner ─────────────────────────
function PostPredictionBanner({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 animate-slide-in-up pointer-events-none">
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-elevated p-4 md:p-5 pointer-events-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface/20 flex items-center justify-center flex-shrink-0">
              <Star size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">Analysis Complete! Enjoying AgroAI?</p>
              <p className="text-green-100 text-xs mt-0.5 leading-relaxed">
                Create a free account to save your results and get unlimited AI crop analyses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={onLogin}
              className="flex-1 sm:flex-none px-4 py-2 bg-surface/15 hover:bg-surface/25 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onRegister}
              className="flex-1 sm:flex-none px-5 py-2 bg-surface text-green-700 text-sm font-bold rounded-xl hover:bg-green-50 transition-colors shadow-soft"
            >
              Create Free Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Guest Experience Orchestrator ────────────────────
export default function GuestExperience({ onLogin, onRegister }: {
  onLogin: () => void
  onRegister: () => void
}) {
  // Read localStorage once on mount — did a previous session use the trial?
  const [isLocked] = useState(() => localStorage.getItem(TRIAL_KEY) === 'true')
  const [page, setPage] = useState<'welcome' | 'crop'>('welcome')
  const [predictionDone, setPredictionDone] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const trialExhausted = isLocked || predictionDone

  const handlePredictionComplete = () => {
    localStorage.setItem(TRIAL_KEY, 'true')
    setPredictionDone(true)
  }

  // Interceptor for nav actions in guest mode
  const handleGuestNav = (_page: string) => {
    if (trialExhausted) setShowPremiumModal(true)
    // If trial not yet used, navigation is silently ignored (they only have crop page)
  }

  // CTA rendered inside the predict button area after prediction
  const guestCTA = predictionDone ? (
    <div className="space-y-2 animate-fade-in">
      <button
        onClick={onRegister}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold gradient-secondary text-white shadow-soft hover:opacity-90 transition-opacity"
      >
        <ArrowRight size={15} />
        Sign Up to Unlock Unlimited AI Predictions
      </button>
      <button
        onClick={onLogin}
        className="w-full py-2 text-xs text-text-muted hover:text-text-secondary font-medium transition-colors"
      >
        Already have an account?{' '}
        <span className="text-green-600 font-semibold">Sign In</span>
      </button>
    </div>
  ) : undefined

  // If trial was consumed in a PREVIOUS session → always show locked state
  if (isLocked) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <GuestNavbar trialExhausted={true} onLogin={onLogin} onRegister={onRegister} />
        <div className="flex-1 overflow-y-auto">
          <LockedState onLogin={onLogin} onRegister={onRegister} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <GuestNavbar trialExhausted={trialExhausted} onLogin={onLogin} onRegister={onRegister} />

      {showPremiumModal && (
        <PremiumModal
          onClose={() => setShowPremiumModal(false)}
          onLogin={onLogin}
          onRegister={onRegister}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {page === 'welcome' && (
          <GuestWelcomePage
            onStart={() => setPage('crop')}
            onLogin={onLogin}
          />
        )}

        {page === 'crop' && (
          <div className="relative">
            {/* Guest mode banner */}
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Zap size={13} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-700 truncate">
                  <span className="font-bold">Guest Mode</span> — Your results are not permanently saved. Create an account to save prediction history and unlock all AI features.
                </p>
              </div>
              <button
                onClick={onRegister}
                className="text-xs font-bold text-green-600 hover:text-green-700 whitespace-nowrap hidden sm:block transition-colors"
              >
                Create Account →
              </button>
            </div>

            <CropRecommendation
              onNavigate={handleGuestNav}
              guestMode={true}
              guestPredictionDone={predictionDone}
              onPredictionComplete={handlePredictionComplete}
              guestCTA={guestCTA}
            />

            {predictionDone && (
              <PostPredictionBanner onRegister={onRegister} onLogin={onLogin} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
