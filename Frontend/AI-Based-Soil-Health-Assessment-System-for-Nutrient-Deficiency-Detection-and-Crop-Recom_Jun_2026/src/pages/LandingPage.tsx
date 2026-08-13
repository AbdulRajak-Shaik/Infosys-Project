import { useState } from 'react'
import { Leaf, Brain, Cloud, Shield, Users, Sprout, Bug, FlaskConical, Bot, ChevronRight, Star, ArrowRight, CheckCircle2, Zap, Globe, BarChart3, Menu, X } from 'lucide-react'
import { Button } from '../components/ui'
import FloatingChatbot from '../components/FloatingChatbot'
import LanguageSelector from '../components/LanguageSelector'
import { FEATURES } from '../config'
import { useTranslation } from '../i18n'

interface LandingPageProps {
  onLogin: () => void
  onRegister: () => void
  onGuestTrial?: () => void
}

const stats = [
  { value: '50K+', label: 'Farmers Served' },
  { value: '98.2%', label: 'AI Accuracy' },
  { value: '12', label: 'Crop Types' },
  { value: '24/7', label: 'AI Support' },
]

const features = [
  { icon: <Leaf size={24} className="text-green-600" />, title: 'soilClassification', desc: 'soilClassificationDesc' },
  { icon: <Sprout size={24} className="text-green-600" />, title: 'cropRecommendation', desc: 'cropRecommendationDesc' },
  { icon: <FlaskConical size={24} className="text-blue-600" />, title: 'fertilizerAdvisor', desc: 'fertilizerAdvisorDesc' },
  ...(FEATURES.DISEASE_DETECTION ? [{ icon: <Bug size={24} className="text-orange-600" />, title: 'diseaseDetection', desc: 'diseaseDetectionDesc' }] : []),
  { icon: <Bot size={24} className="text-purple-600" />, title: 'multilingualChatbot', desc: 'multilingualChatbotDesc' },
  { icon: <Cloud size={24} className="text-blue-500" />, title: 'weatherIntelligence', desc: 'weatherIntelligenceDesc' },
]

const testimonials = [
  { name: 'Rajesh Kumar', role: 'roleWheatFarmer', rating: 5, text: 'testimonial1Text' },
  { name: 'Mohammed Al-Farsi', role: 'roleDatePalmFarmer', rating: 5, text: 'testimonial2Text' },
]

const faqs = [
  { q: 'faq1Q', a: 'faq1A' },
  { q: 'faq2Q', a: 'faq2A' },
  { q: 'faq3Q', a: 'faq3A' },
]

export default function LandingPage({ onLogin, onRegister, onGuestTrial }: LandingPageProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const handleTrialClick = onGuestTrial ?? onRegister

  return (
    <div className="min-h-screen bg-surface font-['Inter']">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="font-bold text-text-primary text-lg">{t('agroAi')}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-green-700 transition-colors">{t('features')}</a>
            <a href="#modules" className="hover:text-green-700 transition-colors">{t('modules')}</a>
            <a href="#testimonials" className="hover:text-green-700 transition-colors">{t('reviews')}</a>
            <a href="#faq" className="hover:text-green-700 transition-colors">{t('faq')}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector compact />
            <Button variant="ghost" onClick={onLogin}>{t('signIn')}</Button>
            <Button variant="primary" onClick={onRegister} icon={<ArrowRight size={14} />}>{t('getStarted')}</Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-surface border-t border-border p-4 flex flex-col gap-3 animate-fade-in">
            <LanguageSelector className="w-full justify-center" />
            <Button variant="outlined" className="w-full justify-center" onClick={onLogin}>{t('signIn')}</Button>
            <Button variant="primary" className="w-full justify-center" onClick={onRegister}>{t('getStarted')}</Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-mesh">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&h=900&fit=crop&auto=format')] bg-cover bg-center opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-green-100">
                <Zap size={14} />
                {t('poweredByAI')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
                {t('smartFarming')}<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #2E7D32, #1565C0)' }}>
                  {t('poweredByAI')}
                </span>
              </h1>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" variant="primary" onClick={handleTrialClick} icon={<ArrowRight size={16} />}>{t('startFreeTrial')}</Button>
                <Button size="lg" variant="outlined" onClick={onLogin}>{t('signIn')}</Button>
              </div>
              <div className="flex flex-wrap gap-6">
                {[
                  { key: 'noCreditCardRequired' },
                  { key: 'wcagAccessible' },
                  { key: 'supportedLanguages' },
                ].map(f => (
                  <div key={f.key} className="flex items-center gap-2 text-sm text-text-muted">
                    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    {t(f.key)}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full bg-green-100 opacity-40 animate-float" style={{ animationDelay: '0s' }} />
              <div className="absolute w-48 h-48 rounded-full bg-blue-100 opacity-30 animate-float" style={{ animationDelay: '1.5s', top: '10%', right: '5%' }} />
              <div className="relative z-10 grid grid-cols-2 gap-4">
                {[
                  { label: t('modelAccuracy'), value: '98.2%', icon: <Brain size={20} className="text-green-600" />, bg: 'bg-green-50' },
                  { label: t('cropAnalyses'), value: '2.4M', icon: <Sprout size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
                  ...(FEATURES.DISEASE_DETECTION ? [{ label: t('diseaseAlerts'), value: '12K', icon: <Bug size={20} className="text-orange-600" />, bg: 'bg-orange-50' }] : [{ label: t('soilAnalyses'), value: '15K', icon: <FlaskConical size={20} className="text-orange-600" />, bg: 'bg-orange-50' }]),
                  { label: t('totalPredictions'), value: '50K+', icon: <Users size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-2xl p-5 shadow-card border border-white animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                    <div className="mb-2">{item.icon}</div>
                    <p className="text-2xl font-bold text-text-primary">{item.value}</p>
                    <p className="text-xs text-text-muted font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50K+', key: 'farmersServed' },
              { value: '98.2%', key: 'aiAccuracy' },
              { value: '12', key: 'cropTypes' },
              { value: '24/7', key: 'aiSupport' },
            ].map(s => (
              <div key={s.key} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #2E7D32, #1565C0)' }}>{s.value}</p>
                <p className="text-sm text-text-muted mt-1 font-medium">{t(s.key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-blue-100">
              <BarChart3 size={14} />
              {t('enterpriseFeatures')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{t('everythingFarmSmarter')}</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">{t('fromSoilToHarvest')}</p>
          </div>
          <div id="modules" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-surface rounded-2xl p-6 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all-smooth group">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-bold text-text-primary mb-2">{t(f.title) || f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t(f.desc) || f.desc}</p>
                <button className="mt-4 flex items-center gap-1 text-sm font-semibold text-green-700 hover:gap-2 transition-all">
                  {t('learnMore')} <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{t('howItWorks')}</h2>
            <p className="text-text-muted text-lg">{t('threeSimpleSteps')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: t('signUpSetProfile'), desc: t('registerAsFarmer'), icon: <Users size={28} className="text-white" />, bg: 'gradient-primary' },
              { step: '02', title: t('inputFieldData'), desc: t('enterSoilParams'), icon: <BarChart3 size={28} className="text-white" />, bg: 'gradient-secondary' },
              { step: '03', title: t('getAiInsights'), desc: t('receiveRecommendations') || `Receive personalized recommendations, ${FEATURES.DISEASE_DETECTION ? 'disease alerts,' : 'weather alerts,'} and actionable growing tips.`, icon: <Brain size={28} className="text-white" />, bg: 'gradient-accent' },
            ].map(item => (
              <div key={item.step} className="text-center group">
                <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-5 shadow-card group-hover:shadow-elevated group-hover:scale-110 transition-all-smooth`}>
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-gray-300 tracking-widest mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('builtWithTech')}</h2>
            <p className="text-text-muted">{t('poweredByBestStack')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {['FastAPI', 'PyTorch', 'PostgreSQL', 'Redis', 'TensorFlow', 'React', 'JWT Auth', 'REST APIs', 'Docker'].map(tech => (
              <div key={tech} className="px-5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors">
                {tech}
              </div>
            ))}
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={20} className="text-green-400" />, title: t('enterpriseSecurity'), desc: t('securityDesc') },
              { icon: <Globe size={20} className="text-blue-400" />, title: t('multiLangSupport'), desc: t('fullMultilingualSupport') },
              { icon: <Zap size={20} className="text-yellow-400" />, title: t('fastResponse'), desc: t('gpuAcceleration') },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{t('trustedByFarmers')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((tItem, i) => (
              <div key={i} className="bg-background rounded-2xl p-6 border border-border hover:shadow-card transition-all-smooth">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: tItem.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#FB8C00" className="text-orange-400" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-5 italic">"{t(tItem.text) || tItem.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {tItem.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">{t(tItem.name) || tItem.name}</p>
                    <p className="text-xs text-text-muted">{t(tItem.role) || tItem.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">{t('faqHeader')}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden shadow-soft">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-text-primary hover:bg-background transition-colors"
                >
                  {t(faq.q) || faq.q}
                  <ChevronRight size={16} className={`text-text-muted transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed animate-fade-in border-t border-gray-50 pt-3">
                    {t(faq.a) || faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('readyTransformFarm')}</h2>
          <p className="text-white/80 text-lg mb-8">{t('ctaSubtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={handleTrialClick} className="bg-surface text-green-700 hover:bg-green-50 font-bold px-8">
              {t('startFreeTrial')}
            </Button>
            <Button size="lg" variant="ghost" onClick={onLogin} className="text-white border border-white/30 hover:bg-surface/10 px-8">
              {t('signIn')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-text-muted py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Leaf size={15} className="text-white" />
              </div>
              <span className="font-bold text-white">{t('agroAi')}</span>
            </div>
            <p className="text-sm">© 2026 {t('agroAi')}. {t('allRightsReserved')}</p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-white transition-colors">{t('privacy')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('terms')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('contact')}</a>
            </div>
          </div>
        </div>
      </footer>
      <FloatingChatbot />
    </div>
  )
}
