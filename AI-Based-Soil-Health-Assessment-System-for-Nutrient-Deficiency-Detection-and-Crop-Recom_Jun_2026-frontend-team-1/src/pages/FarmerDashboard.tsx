import { useState, useEffect } from 'react'
import { Leaf, Sprout, FlaskConical, Cloud, Droplets, Thermometer, Sun, Bell, ChevronRight, Activity, Bug, Bot, Download } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Card, Badge, Button, LineSpinner } from '../components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FEATURES } from '../config'
import { getCurrentUser, getPredictionHistory, transliterateTextApi, type UserProfile, type HistoryItem } from '../services/api'
import { useSarvamUsername, useSarvamLocation } from '../services/sarvamClient'
import { useTranslation, Translate } from '../i18n'
import { generatePdfReport } from '../utils/pdfReportGenerator'
import { getStoredLocation, getOrRequestLocation } from '../services/locationService'
import { formatLocalizedMonth, formatLocalizedDate, formatRelativeTime } from '../utils/dateUtils'

interface AlertItem {
  id: string
  type: string
  icon: React.ReactNode
  titleKey: string
  descKey: string
  timestamp: number
}

interface FarmerDashboardProps {
  onNavigate: (page: string) => void
}

export default function FarmerDashboard({ onNavigate }: FarmerDashboardProps) {
  const { t, currentLanguage } = useTranslation()
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening'
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const rawUsername = user?.username || 'Valued Farmer'
  const displayName = useSarvamUsername(rawUsername)

  const rawLocation = user?.region || getStoredLocation() || ''
  const sarvamLocation = useSarvamLocation(rawLocation)

  const reloadData = () => {
    Promise.all([
      getCurrentUser().then(u => setUser(u)),
      getPredictionHistory().then(h => setHistory(h))
    ]).catch(err => {
      console.warn('Dashboard fetch note:', err)
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    reloadData()
    window.addEventListener('predictionCreated', reloadData)
    window.addEventListener('storage', reloadData)
    window.addEventListener('locationUpdated', reloadData)
    // Trigger geolocation silently if no location saved
    if (!getStoredLocation()) {
      getOrRequestLocation().catch(() => {})
    }
    return () => {
      window.removeEventListener('predictionCreated', reloadData)
      window.removeEventListener('storage', reloadData)
      window.removeEventListener('locationUpdated', reloadData)
    }
  }, [currentLanguage])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2.5 text-green-700">
        <LineSpinner size={24} color="currentColor" strokeWidth={2.4} />
        <span className="text-sm font-medium"><Translate text="Loading Dashboard..." /></span>
      </div>
    )
  }


  const handleDownloadCropReport = (e: React.MouseEvent) => {
    e.preventDefault()
    // Use data from the most recent prediction history entry
    const lastSoilPrediction: any = history
      .filter((h: any) => h.soil_type || h.prediction_type === 'soil')
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]
    
    const lastCropPrediction: any = history
      .filter((h: any) => h.predicted_crop || h.prediction_type === 'crop')
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]

    const soilTypeValue = lastSoilPrediction?.soil_type || t('notAvailable') || '—'
    const topCropValue = lastCropPrediction?.predicted_crop || t('notAvailable') || '—'
    const confidenceValue = lastSoilPrediction?.confidence
      ? (lastSoilPrediction.confidence > 1 ? lastSoilPrediction.confidence : lastSoilPrediction.confidence * 100)
      : 0
    
    generatePdfReport({
      userName: rawUsername,
      location: sarvamLocation || rawLocation,
      topCrop: topCropValue,
      soilType: soilTypeValue,
      confidence: confidenceValue,
      recommendations: lastCropPrediction?.recommendations || [],
      nValue: lastSoilPrediction?.nitrogen ? `${lastSoilPrediction.nitrogen} mg/kg` : '—',
      pValue: lastSoilPrediction?.phosphorus ? `${lastSoilPrediction.phosphorus} mg/kg` : '—',
      kValue: lastSoilPrediction?.potassium ? `${lastSoilPrediction.potassium} mg/kg` : '—',
      phValue: lastSoilPrediction?.ph ? String(lastSoilPrediction.ph) : '—',
    })
  }

  // Structured Alerts without hardcoded language strings
  const now = Date.now()
  const alerts: AlertItem[] = [
    {
      id: 'a1',
      type: 'heavyRainfall',
      icon: <Cloud size={14} className="text-blue-500" />,
      titleKey: 'alerts.heavyRainfall.title',
      descKey: 'alerts.heavyRainfall.description',
      timestamp: now - 2 * 3600 * 1000,
    },
    ...(FEATURES.DISEASE_DETECTION ? [{
      id: 'a2',
      type: 'blightRisk',
      icon: <Bug size={14} className="text-orange-500" />,
      titleKey: 'alerts.blightRisk.title',
      descKey: 'alerts.blightRisk.description',
      timestamp: now - 5 * 3600 * 1000,
    }] : []),
    {
      id: 'a3',
      type: 'optimalPlanting',
      icon: <Bell size={14} className="text-green-500" />,
      titleKey: 'alerts.optimalPlanting.title',
      descKey: 'alerts.optimalPlanting.description',
      timestamp: now - 24 * 3600 * 1000,
    },
  ]

  // Dynamic Prediction Trend generated from real history for trailing 6 months up to current month (e.g. Aug)
  const currentMonthIndex = new Date().getMonth()
  const monthsIndices = Array.from({ length: 6 }, (_, i) => (currentMonthIndex - 5 + i + 12) % 12)
  const predTrend = monthsIndices.map((mIdx, i) => {
    const monthName = formatLocalizedMonth(mIdx, currentLanguage)
    // Filter real history matching month if created_at present, or base counts
    const monthHistory = history.filter(h => {
      if (!h.created_at) return false
      const d = new Date(h.created_at)
      return d.getMonth() === mIdx
    })
    const cropCount = monthHistory.filter(h => h.prediction_type === 'crop').length
    const soilCount = monthHistory.filter(h => h.prediction_type === 'soil').length

    return {
      month: monthName,
      [t('crop')]: cropCount,
      [t('soil')]: soilCount,
    }
  })

  // Dynamic Crop Distribution derived from real prediction history
  const cropCounts: Record<string, number> = {}
  let hasCropPredictions = false
  history.forEach(h => {
    const crop = h.predicted_crop || (h.prediction_type === 'crop' ? h.result : null)
    if (crop) {
      cropCounts[crop] = (cropCounts[crop] || 0) + 1
      hasCropPredictions = true
    }
  })

  const totalCrops = Object.values(cropCounts).reduce((a, b) => a + b, 0)

  const baseCropDist = hasCropPredictions ? Object.entries(cropCounts).map(([cropName, count]) => ({
    rawName: cropName,
    value: Math.round((count / totalCrops) * 100),
    color: cropName === 'Wheat' ? '#F9A825' : cropName === 'Rice' ? '#43A047' : cropName === 'Maize' ? '#FB8C00' : cropName === 'Cotton' ? '#1565C0' : '#9E9E9E'
  })) : []

  const translatedCropDist = baseCropDist.map(c => ({
    ...c,
    name: t(c.rawName) || c.rawName
  }))

  const totalCount = history.length
  const cropCountTotal = history.filter((p: any) => p.prediction_type === 'crop').length
  const soilCountTotal = history.filter((p: any) => p.prediction_type === 'soil').length

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Hero Greeting */}
      <div className="gradient-hero rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
          <div className="w-full h-full rounded-full border-4 border-white" style={{ transform: 'translate(30%, -30%)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">{t(greetingKey)},</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{displayName || user?.username || 'Valued Farmer'} 🌾</h2>
            <p className="text-white/80 text-sm mb-3">{t('fieldsHealthy')}</p>
            <button 
              onClick={handleDownloadCropReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur transition-all shadow-sm cursor-pointer"
            >
              <Download size={14} /> {t('Download Crop Recommendation PDF Report')}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-surface/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <Thermometer size={18} className="text-orange-300" />
              <div>
                <p className="text-white/70 text-xs">{t('temperature')}</p>
                <p className="font-bold">32°C / {t('Sunny')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <Droplets size={18} className="text-blue-300" />
              <div>
                <p className="text-white/70 text-xs">{t('humidity')}</p>
                <p className="font-bold">68% — {t('Good')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t('totalPredictions')} value={String(totalCount)} change={totalCount > 0 ? "+100%" : "0%"} trend="up" icon={<Activity size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title={t('cropAnalyses')} value={String(cropCountTotal)} change={cropCountTotal > 0 ? "+100%" : "0%"} trend="up" icon={<Sprout size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title={t('soilAnalyses')} value={String(soilCountTotal)} change={soilCountTotal > 0 ? "+100%" : "0%"} trend="up" icon={<Leaf size={20} className="text-amber-600" />} iconBg="bg-amber-100" />
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h3 className="font-bold text-text-primary mb-4">{t('quickActions')}</h3>
        <div className={`grid grid-cols-3 ${FEATURES.DISEASE_DETECTION ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-3`}>
          {[
            { label: t('soilAdvice'), icon: <Leaf size={22} />, page: 'soil', color: 'bg-green-100 text-green-700' },
            { label: t('cropAdvice'), icon: <Sprout size={22} />, page: 'crop', color: 'bg-emerald-100 text-emerald-700' },
            { label: t('fertilizer'), icon: <FlaskConical size={22} />, page: 'fertilizer', color: 'bg-blue-100 text-blue-700' },
            ...(FEATURES.DISEASE_DETECTION ? [{ label: t('diseaseAi'), icon: <Bug size={22} />, page: 'disease', color: 'bg-orange-100 text-orange-700' }] : []),
            { label: t('chatbot'), icon: <Bot size={22} />, page: 'chatbot', color: 'bg-purple-100 text-purple-700' },
            { label: t('weather'), icon: <Cloud size={22} />, page: 'weather', color: 'bg-sky-100 text-sky-700' },
          ].map(a => (
            <button key={a.page} onClick={() => onNavigate(a.page)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background transition-all-smooth group cursor-pointer">
              <div className={`w-12 h-12 rounded-xl ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {a.icon}
              </div>
              <span className="text-xs font-medium text-text-secondary text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Prediction Trend */}
        <Card className="lg:col-span-2 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('predictionTrends')}</h3>
            <Badge color="green">{t('realTimeAnalytics')}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={predTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2} /><stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCrop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565C0" stopOpacity={0.2} /><stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey={t('crop')} stroke="#1565C0" strokeWidth={2} fill="url(#colorCrop)" name={t('crop')} />
              <Area type="monotone" dataKey={t('soil')} stroke="#2E7D32" strokeWidth={2} fill="url(#colorSoil)" name={t('soil')} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Crop Distribution */}
        <Card className="p-5 flex flex-col">
          <h3 className="font-bold text-text-primary mb-5">{t('cropDistribution')}</h3>
          {translatedCropDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={translatedCropDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                    {translatedCropDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {translatedCropDist.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-text-secondary">{c.name}</span>
                    </div>
                    <span className="font-semibold text-text-secondary">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl mb-1">📊</span>
              <p className="text-xs font-semibold text-text-secondary">{t('noDataAvailable') || 'No Data Available'}</p>
              <p className="text-[10px] text-text-muted">{t('cropDistPlaceholderDesc') || 'Crop distribution appears after analysis.'}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Predictions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">{t('recentPredictions')}</h3>
            <button onClick={() => onNavigate('history')} className="text-xs text-green-700 font-semibold hover:text-green-800 flex items-center gap-1 cursor-pointer">
              {t('viewAll')} <ChevronRight size={12} />
            </button>
          </div>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 4).map((p: any, idx: number) => {
                const pTypeRaw = p.prediction_type || (p.type ? p.type.toLowerCase() : 'soil')
                const pTypeLabel = t(pTypeRaw.toLowerCase()) || (pTypeRaw.charAt(0).toUpperCase() + pTypeRaw.slice(1))
                const pResultRaw = p.predicted_crop || p.soil_type || p.result || 'Analyzed'
                
                let pResultLabel = pResultRaw
                if (typeof pResultRaw === 'string' && pResultRaw.startsWith('Weather Track:')) {
                  const locName = pResultRaw.replace(/^Weather Track:\s*/i, '').trim()
                  const trackPrefix = t('weatherTrack') || 'Weather Track'
                  pResultLabel = `${trackPrefix}: ${locName}`
                } else if (pResultRaw === 'Weather Dashboard' || pResultRaw === 'Weather') {
                  pResultLabel = t('weatherDashboard') || t('weather') || 'Weather Dashboard'
                } else {
                  pResultLabel = t(pResultRaw) || pResultRaw
                }

                const pConf = Math.round(p.confidence ? (p.confidence > 1 ? p.confidence : p.confidence * 100) : 95)
                const pDate = p.created_at ? formatLocalizedDate(p.created_at, currentLanguage) : formatLocalizedDate(Date.now(), currentLanguage)
                return (
                  <div key={p.id || idx} className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-background transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${pTypeRaw === 'crop' ? 'bg-green-100 text-green-700' : pTypeRaw === 'soil' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {pTypeRaw[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate"><Translate text={pResultLabel} /></p>
                      <p className="text-xs text-text-muted"><Translate text={pDate} /> · <Translate text={pTypeLabel} /></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-secondary">{pConf}%</p>
                      <Badge color="green"><Translate text="Success" /></Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 text-center space-y-3 bg-background rounded-xl">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto text-green-600 font-bold text-xl">
                🌱
              </div>
              <p className="font-semibold text-text-primary">{t('noPredictionsYet')}</p>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                {t('Your prediction trends will appear here as you analyze soils and crops.')}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <Button variant="primary" size="sm" onClick={() => onNavigate('soil')}>{t('soilAdvice')}</Button>
                <Button variant="outlined" size="sm" onClick={() => onNavigate('crop')}>{t('cropAdvice')}</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Notifications + Weather */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary">{t('alertsNotifications')}</h3>
              <button onClick={() => onNavigate('notifications')} className="text-xs text-green-700 font-semibold cursor-pointer">{t('viewAll')}</button>
            </div>
            <div className="space-y-3">
              {alerts.map((n) => {
                const titleText = t(n.titleKey) || n.titleKey
                const descText = t(n.descKey) || n.descKey
                const timeText = formatRelativeTime(n.timestamp, t)

                return (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary"><Translate text={titleText} /></p>
                      <p className="text-xs text-text-muted"><Translate text={descText} /> · <Translate text={timeText} /></p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-text-primary mb-4">{t('sevenDayForecast')}</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { day: t('today'), icon: <Sun size={16} className="text-yellow-500" />, h: '34°', l: '24°' },
                { day: t('fri'), icon: <Cloud size={16} className="text-text-muted" />, h: '31°', l: '22°' },
                { day: t('sat'), icon: <Droplets size={16} className="text-blue-400" />, h: '28°', l: '21°' },
                { day: t('sun'), icon: <Sun size={16} className="text-yellow-500" />, h: '33°', l: '23°' },
              ].map(d => (
                <div key={d.day} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-background">
                  <span className="text-[10px] text-text-muted font-medium">{d.day}</span>
                  {d.icon}
                  <span className="text-xs font-bold text-text-secondary">{d.h}</span>
                  <span className="text-[10px] text-text-muted">{d.l}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('weather')} className="w-full mt-3 text-xs text-green-700 font-semibold flex items-center justify-center gap-1 hover:text-green-800 cursor-pointer">
              {t('fullForecast')} <ChevronRight size={12} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
