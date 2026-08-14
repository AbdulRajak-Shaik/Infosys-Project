import { ArrowRight, Brain, Cloud, Shield, Leaf, TrendingUp, Users, Target, Activity, MapPin, MessageSquare, BarChart3, Sprout, Mail } from 'lucide-react'
import { Button, Card, Breadcrumb } from '../components/ui'
import { useTranslation } from '../i18n'
import { useState, useEffect } from 'react'
import { getAdminStats, getPredictionHistory, getPlatformStats } from '../services/api'

export function About({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()

  // Real stats from backend — no hardcoded fallbacks
  const [realStats, setRealStats] = useState({ predictions: 0, farmers: 0, avgRating: 0, languageCount: 0 })
  useEffect(() => {
    Promise.all([getPredictionHistory(), getAdminStats(), getPlatformStats()])
      .then(([history, adminStats, platformStats]) => {
        setRealStats({
          predictions: history.length,
          farmers: adminStats.farmer_count,
          avgRating: platformStats.avg_rating,
          languageCount: platformStats.language_count,
        })
      })
      .catch(() => setRealStats({ predictions: 0, farmers: 0, avgRating: 0, languageCount: 0 }))
  }, [])

  return (
    <div className="animate-fade-in relative">
      {/* Background ambient effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-24">
        {onNavigate && (
          <div className="mb-8">
            <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('about') }]} onNavigate={onNavigate} />
          </div>
        )}

        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium mb-2">
              <Leaf size={16} />
              <span>{t('aiFarmingPlatform')} v2.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary leading-[1.15] tracking-tight">
              {t('farmingPerfected')} <span className="bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">{t('perfected')}</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t('aboutPlatformDesc')}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button variant="primary" size="lg" className="w-full sm:w-auto font-semibold px-8 py-3 group" onClick={() => onNavigate?.('soil')}>
                {t('exploreFeatures')} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outlined" size="lg" className="w-full sm:w-auto font-semibold px-8 py-3 group" onClick={() => onNavigate?.('dashboard')}>
                <BarChart3 size={18} className="mr-2" /> {t('viewDashboard')}
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative w-full max-w-md lg:max-w-none aspect-square lg:aspect-auto lg:h-[500px] flex items-center justify-center">
            {/* Animated Hero Illustration */}
            <div className="relative w-full h-full max-h-[400px] bg-gradient-to-br from-surface to-background rounded-3xl border border-border shadow-2xl overflow-hidden group">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-5" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {/* Scanning line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent shadow-[0_0_15px_rgba(34,197,94,0.5)] opacity-50 group-hover:animate-[scan_3s_ease-in-out_infinite]" />
              
              {/* Central Element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="w-32 h-32 bg-surface border border-border rounded-2xl shadow-elevated flex items-center justify-center relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                    <Leaf size={48} className="text-green-600 dark:text-green-400 animate-float" />
                  </div>
                  
                  {/* Orbiting particles */}
                  <div className="absolute inset-[-40px] border border-dashed border-border rounded-full animate-spin-slow">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                      <Cloud size={12} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-200 dark:border-orange-800 flex items-center justify-center">
                      <Shield size={12} className="text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Data Cards */}
              <div className="absolute top-8 left-8 bg-surface/80 backdrop-blur-md border border-border rounded-xl p-3 shadow-soft animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-text-primary">Soil Healthy</span>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 bg-surface/80 backdrop-blur-md border border-border rounded-xl p-3 shadow-soft animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-purple-500" />
                  <span className="text-xs font-bold text-text-primary">AI Sync Active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: t('farmersServed'), value: realStats.farmers > 0 ? realStats.farmers.toLocaleString() : '0', icon: <Users size={24} className="text-blue-500" />, desc: t('Actual farmer accounts registered in AgroAI.') },
            { label: t('Your Predictions Made'), value: realStats.predictions > 0 ? realStats.predictions.toLocaleString() : '0', icon: <Activity size={24} className="text-green-500" />, desc: t('AI-powered soil, crop, fertilizer, weather, and disease predictions in your History.') },
            { label: t('avgFeedbackRating') || 'Avg. Feedback Rating', value: realStats.avgRating > 0 ? `${realStats.avgRating.toFixed(1)}/5` : t('noRatingsYet') || 'No ratings yet', icon: <Target size={24} className="text-purple-500" />, desc: t('Average star rating given by registered farmers who submitted feedback on AgroAI.') },
            { label: t('languagesSupported') || 'Languages Supported', value: realStats.languageCount > 0 ? String(realStats.languageCount) : '0', icon: <MapPin size={24} className="text-orange-500" />, desc: t('Number of Indian and international languages supported by the multilingual AI system.') },
          ].map((stat, i) => (
            <Card key={i} className="p-6 bg-surface/60 backdrop-blur-md border-border/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 shadow-sm border border-border">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-extrabold text-text-primary mb-1 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{stat.desc}</p>
            </Card>
          ))}
        </section>

        {/* Mission Section */}
        <section className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20 bg-background/50 rounded-[2.5rem] p-8 md:p-12 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px]" />
          
          <div className="flex-1 w-full max-w-md lg:max-w-none relative aspect-[4/3] lg:aspect-auto lg:h-[400px]">
            <div className="w-full h-full bg-gradient-to-br from-surface to-background rounded-2xl border border-border shadow-elevated relative overflow-hidden flex items-end justify-center pb-8">
              {/* Chart lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                <path d="M0,400 Q100,300 200,350 T400,200 T600,250 T800,100" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500" />
              </svg>
              {/* Live prediction count card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface/90 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 shadow-xl animate-float">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-semibold text-text-secondary">{t('totalPredictions') || 'Total Predictions'}</span>
                </div>
                <div className="text-4xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                  {realStats.predictions > 0 ? realStats.predictions.toLocaleString() : '—'}
                </div>
                <div className="w-full bg-background rounded-full h-1.5 mt-4 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full w-3/4 animate-shimmer" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center lg:text-left z-10">
            <h4 className="text-sm font-bold tracking-widest text-green-600 dark:text-green-400 uppercase">{t('ourMission')}</h4>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">{t('Data-driven decisions for every acre.')}</h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              {t('We believe that global food security starts with empowering the individual farmer. By analyzing millions of data points — from atmospheric pressure to soil microbiome levels — we remove the guesswork from crop planning.')}
            </p>
            <p className="text-lg font-medium text-text-primary italic border-l-4 border-green-500 pl-4">
              {t("AgroAI doesn't replace the farmer's intuition; it amplifies it.")}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button variant="primary" size="sm" className="px-6 py-2 group" onClick={() => onNavigate?.('soil')}>
                <Sprout size={16} className="mr-2" /> {t('Try Soil Analysis')}
              </Button>
              <Button variant="outlined" size="sm" className="px-6 py-2 group" onClick={() => onNavigate?.('weather')}>
                <Cloud size={16} className="mr-2" /> {t('Check Weather')}
              </Button>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">{t('Powered by intelligence')}</h2>
            <p className="text-lg text-text-secondary">
              {t('The platform architecture behind AgroAI is built for scale, speed, and accuracy in low-connectivity rural environments.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: t('Deep Learning'), desc: t('Our convolutional neural networks analyze leaf and soil images to detect diseases, deficiencies, and soil types — even from low-quality mobile camera photos.'), icon: <Brain size={24} className="text-purple-500" />, glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]', page: 'soil' },
              { title: t('Global Weather APIs'), desc: t('Real-time and 7-day hyper-local weather forecasts powered by OpenWeatherMap and Nominatim, providing precipitation, humidity, wind, and UV data for your exact farm location.'), icon: <Cloud size={24} className="text-blue-500" />, glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]', page: 'weather' },
              { title: t('Soil Bioinformatics'), desc: t('Advanced NPK, pH, and organic carbon analysis using spectral data and machine learning models trained on diverse agro-climatic zone datasets.'), icon: <Leaf size={24} className="text-green-500" />, glow: 'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]', page: 'crop' },
              { title: t('Secure Architecture'), desc: t('All farm data is encrypted end-to-end with AES-256 encryption. We follow GDPR and Indian DPDP Act compliance standards to ensure your agricultural data remains private and secure.'), icon: <Shield size={24} className="text-orange-500" />, glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]', page: 'settings' },
            ].map((tech, i) => (
              <Card key={i} className={`p-6 bg-surface border-border group transition-all duration-300 hover:-translate-y-2 cursor-pointer ${tech.glow}`} onClick={() => onNavigate?.(tech.page)}>
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{tech.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tech.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('Learn More')} <ArrowRight size={12} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-surface border border-border shadow-soft rounded-[2.5rem] p-8 md:p-16 text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">{t('Built by farmers, for farmers')}</h2>
            <p className="text-lg text-text-secondary">
              {t('Our core team comprises agronomists, software engineers, and climate scientists dedicated to sustainable agriculture.')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
            {[
              { name: 'Ramyasree Ramayanam', role: t('Full Stack Developer'), desc: t('Lead developer — React frontend, AI integration & soil analysis modules'), color: 'from-green-400 to-emerald-600' },
              { name: 'Team Member 2', role: t('AI/ML Engineer'), desc: t('CNN model training, soil & crop prediction pipeline and dataset curation'), color: 'from-blue-400 to-indigo-600' },
              { name: 'Team Member 3', role: t('Backend Developer'), desc: t('REST API design, database management and server-side prediction logic'), color: 'from-orange-400 to-red-600' },
              { name: 'Team Member 4', role: t('Data Analyst'), desc: t('Agricultural dataset collection, labelling, NPK analysis and bioinformatics'), color: 'from-purple-400 to-pink-600' },
              { name: 'Team Member 5', role: t('UI/UX Designer'), desc: t('Interface design, accessibility, responsive layout and user experience'), color: 'from-yellow-400 to-orange-600' },
            ].map((member, i) => (
              <div key={i} className="group flex flex-col items-center gap-3 max-w-[140px]">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${member.color} p-[2px] group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-300 cursor-pointer`}>
                  <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden border-2 border-surface">
                    <UserIllustration />
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-text-primary block">{member.name}</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 block">{member.role}</span>
                  <span className="text-[11px] text-text-muted leading-tight block mt-1">{member.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="primary" className="px-8 py-2.5 rounded-full font-medium group" onClick={() => onNavigate?.('community')}>
              <Users size={16} className="mr-2" /> {t('Join Our Community')}
            </Button>
            <Button variant="outlined" className="px-8 py-2.5 rounded-full font-medium hover:bg-background group" onClick={() => onNavigate?.('chatbot')}>
              <MessageSquare size={16} className="mr-2" /> {t('Try AI Chatbot')}
            </Button>
          </div>
        </section>

        {/* Contact / CTA Section */}
        <section className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[2.5rem] p-8 md:p-16 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t('Ready to transform your farming?')}</h2>
            <p className="text-lg text-green-100 leading-relaxed">
              {t("Get started with AgroAI today — analyze your soil, get personalized crop recommendations, track weather patterns, and connect with a thriving community of farmers. It's completely free.")}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button variant="primary" size="lg" className="bg-white !text-green-700 hover:bg-green-50 font-bold px-8 py-3 rounded-full group" onClick={() => onNavigate?.('dashboard')}>
                {t('Get Started Free')} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outlined" size="lg" className="!border-white/40 !text-white hover:!bg-white/10 font-semibold px-8 py-3 rounded-full group" onClick={() => onNavigate?.('feedback')}>
                <Mail size={18} className="mr-2" /> {t('Contact Us')}
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

// Minimal stylized avatar illustration
function UserIllustration() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="18" fill="currentColor" className="text-text-muted" />
      <path d="M20 100C20 75 35 65 50 65C65 65 80 75 80 100" fill="currentColor" className="text-text-muted" />
    </svg>
  )
}
