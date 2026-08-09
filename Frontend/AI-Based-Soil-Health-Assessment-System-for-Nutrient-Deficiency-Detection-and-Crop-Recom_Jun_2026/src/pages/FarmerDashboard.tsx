import { useState, useEffect } from 'react'
import api from '../services/api'
import { Leaf, Sprout, FlaskConical, Cloud, TrendingUp, Droplets, Thermometer, Sun, Bell, ChevronRight, Activity, CloudLightning, Bug, Bot } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Card, Badge } from '../components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FEATURES } from '../config'

const notifications = [
  { icon: <Cloud size={14} className="text-blue-500" />, title: 'Heavy Rainfall Alert', desc: 'Expected 45mm in next 24 hours', time: '2h ago', type: 'weather' },
  ...(FEATURES.DISEASE_DETECTION ? [{ icon: <Bug size={14} className="text-orange-500" />, title: 'Disease Risk: Blight', desc: 'High humidity favors late blight', time: '5h ago', type: 'disease' }] : []),
  { icon: <Bell size={14} className="text-green-500" />, title: 'Optimal Planting Window', desc: 'Next 3 days ideal for sowing', time: '1d ago', type: 'info' },
]

interface FarmerDashboardProps { onNavigate: (page: string) => void }

export default function FarmerDashboard({ onNavigate }: FarmerDashboardProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const [analytics, setAnalytics] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/analytics'),
      api.get('/history')
    ])
      .then(([analyticsRes, historyRes]) => {
        if (active) {
          setAnalytics(analyticsRes.data)
          setHistory(historyRes.data)
        }
      })
      .catch(err => {
        console.error(err)
      })
    return () => { active = false }
  }, [])

  // 1. Dynamic Crop Distribution Chart Data
  const cropCounts: { [key: string]: number } = {}
  let totalCrops = 0
  history.forEach(item => {
    if (item.top_crop) {
      cropCounts[item.top_crop] = (cropCounts[item.top_crop] || 0) + 1
      totalCrops++
    }
  })

  const originalColors = ['#43A047', '#FB8C00', '#1565C0', '#F9A825', '#9E9E9E', '#7B1FA2', '#D32F2F']
  let cropDist = Object.entries(cropCounts).map(([name, count], index) => ({
    name,
    value: totalCrops > 0 ? Math.round((count / totalCrops) * 100) : 0,
    color: originalColors[index % originalColors.length]
  })).sort((a, b) => b.value - a.value)

  if (cropDist.length === 0) {
    cropDist = [
      { name: 'Wheat', value: 35, color: '#F9A825' },
      { name: 'Rice', value: 28, color: '#43A047' },
      { name: 'Maize', value: 18, color: '#FB8C00' },
      { name: 'Cotton', value: 12, color: '#1565C0' },
      { name: 'Other', value: 7, color: '#9E9E9E' },
    ]
  }

  // 2. Dynamic Prediction Trends Chart Data (Last 6 Months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const last6Months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push({
      month: monthNames[d.getMonth()],
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      soil: 0,
      crop: 0,
      disease: 0
    })
  }

  history.forEach(item => {
    const date = new Date(item.prediction_date)
    const itemMonth = date.getMonth()
    const itemYear = date.getFullYear()
    const target = last6Months.find(m => m.monthIndex === itemMonth && m.year === itemYear)
    if (target) {
      if (item.soil_type) {
        target.soil++
      }
      if (item.top_crop) {
        target.crop++
      }
      if (item.soil_health && item.soil_health.toLowerCase() !== 'healthy') {
        target.disease++
      }
    }
  })

  let predTrend = last6Months.map(({ month, soil, crop, disease }) => ({
    month,
    soil,
    crop,
    disease
  }))

  const hasTrendData = predTrend.some(m => m.soil > 0 || m.crop > 0 || m.disease > 0)
  if (!hasTrendData) {
    predTrend = [
      { month: 'Feb', soil: 12, crop: 18, disease: 5 },
      { month: 'Mar', soil: 19, crop: 24, disease: 8 },
      { month: 'Apr', soil: 15, crop: 20, disease: 12 },
      { month: 'May', soil: 28, crop: 32, disease: 6 },
      { month: 'Jun', soil: 22, crop: 27, disease: 9 },
      { month: 'Jul', soil: 35, crop: 41, disease: 14 },
    ]
  }

  // 3. Dynamic Recent Predictions
  let recentPredictions = history.slice(0, 4).map(item => ({
    id: `H-00${item.history_id}`,
    type: item.top_crop ? 'Crop' : 'Soil',
    input: `Soil: ${item.soil_type || 'Unknown'}`,
    result: item.top_crop || item.soil_type || 'Unknown',
    confidence: Math.round(item.soil_health_score * 10) || 85,
    date: new Date(item.prediction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: item.soil_fertility_status === 'optimal' || item.soil_health === 'Healthy' ? 'success' : 'warning'
  }))

  if (recentPredictions.length === 0) {
    recentPredictions = [
      { id: 'P001', type: 'Crop', input: 'N:90 P:42 K:43 pH:6.5', result: 'Rice', confidence: 96, date: 'Jul 24, 2026', status: 'success' },
      { id: 'P002', type: 'Soil', input: 'Red Loamy Soil sample', result: 'Sandy Loam', confidence: 88, date: 'Jul 23, 2026', status: 'success' },
      { id: 'P004', type: 'Fertilizer', input: 'Wheat, Clay soil', result: 'Urea + DAP', confidence: 84, date: 'Jul 21, 2026', status: 'success' },
    ]
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Hero Greeting */}
      <div className="gradient-hero rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
          <div className="w-full h-full rounded-full border-4 border-white" style={{ transform: 'translate(30%, -30%)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">{greeting},</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Rajesh Kumar 🌾</h2>
            <p className="text-white/80 text-sm">Your fields in Ludhiana, Punjab are looking healthy. 3 new AI insights available.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-surface/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <Thermometer size={18} className="text-orange-300" />
              <div>
                <p className="text-white/70 text-xs">Temperature</p>
                <p className="font-bold">32°C / Sunny</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <Droplets size={18} className="text-blue-300" />
              <div>
                <p className="text-white/70 text-xs">Humidity</p>
                <p className="font-bold">68% — Good</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 ${FEATURES.DISEASE_DETECTION ? 'lg:grid-cols-3' : 'lg:grid-cols-3'} gap-4`}>
        <StatCard title="Total Predictions" value={analytics?.total_predictions?.toString() ?? "0"} change="+12%" trend="up" icon={<Activity size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Crop Analyses" value={analytics?.total_crop_recommendations?.toString() ?? "0"} change="+8%" trend="up" icon={<Sprout size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        {FEATURES.DISEASE_DETECTION ? (
          <StatCard title="Disease Alerts" value="6" change="-2" trend="down" icon={<Bug size={20} className="text-orange-600" />} iconBg="bg-orange-100" />
        ) : (
          <StatCard title="Weather Alerts" value={analytics?.total_image_uploads?.toString() ?? "0"} change="+3" trend="up" icon={<CloudLightning size={20} className="text-amber-600" />} iconBg="bg-amber-100" />
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h3 className="font-bold text-text-primary mb-4">Quick Actions</h3>
        <div className={`grid grid-cols-3 ${FEATURES.DISEASE_DETECTION ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-3`}>
          {[
            { label: 'Soil Analysis', icon: <Leaf size={22} />, page: 'soil', color: 'bg-green-100 text-green-700' },
            { label: 'Crop Advice', icon: <Sprout size={22} />, page: 'crop', color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Fertilizer', icon: <FlaskConical size={22} />, page: 'fertilizer', color: 'bg-blue-100 text-blue-700' },
            ...(FEATURES.DISEASE_DETECTION ? [{ label: 'Disease AI', icon: <Bug size={22} />, page: 'disease', color: 'bg-orange-100 text-orange-700' }] : []),
            { label: 'AI Chatbot', icon: <Bot size={22} />, page: 'chatbot', color: 'bg-purple-100 text-purple-700' },
            { label: 'Weather', icon: <Cloud size={22} />, page: 'weather', color: 'bg-sky-100 text-sky-700' },
          ].map(a => (
            <button key={a.label} onClick={() => onNavigate(a.page)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background transition-all-smooth group">
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
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">Prediction Trends</h3>
            <Badge color="green">Last 6 months</Badge>
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
              <Area type="monotone" dataKey="crop" stroke="#1565C0" strokeWidth={2} fill="url(#colorCrop)" name="Crop" />
              <Area type="monotone" dataKey="soil" stroke="#2E7D32" strokeWidth={2} fill="url(#colorSoil)" name="Soil" />
              {FEATURES.DISEASE_DETECTION && <Area type="monotone" dataKey="disease" stroke="#FB8C00" strokeWidth={2} fill="none" name="Disease" />}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Crop Distribution */}
        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">Crop Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={cropDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {cropDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {cropDist.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-text-secondary">{c.name}</span>
                </div>
                <span className="font-semibold text-text-secondary">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Predictions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Recent Predictions</h3>
            <button onClick={() => onNavigate('history')} className="text-xs text-green-700 font-semibold hover:text-green-800 flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentPredictions.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-background transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${p.type === 'Crop' ? 'bg-green-100 text-green-700' : p.type === 'Soil' ? 'bg-amber-100 text-amber-700' : p.type === 'Disease' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  {p.type[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.result}</p>
                  <p className="text-xs text-text-muted">{p.date} · {p.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-secondary">{p.confidence}%</p>
                  <Badge color={p.status === 'success' ? 'green' : 'orange'}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications + Weather */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary">Alerts & Notifications</h3>
              <button onClick={() => onNavigate('notifications')} className="text-xs text-green-700 font-semibold">View All</button>
            </div>
            <div className="space-y-3">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">{n.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{n.title}</p>
                    <p className="text-xs text-text-muted">{n.desc} · {n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-text-primary mb-4">7-Day Forecast</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { day: 'Today', icon: <Sun size={16} className="text-yellow-500" />, h: '34°', l: '24°' },
                { day: 'Fri', icon: <Cloud size={16} className="text-text-muted" />, h: '31°', l: '22°' },
                { day: 'Sat', icon: <Droplets size={16} className="text-blue-400" />, h: '28°', l: '21°' },
                { day: 'Sun', icon: <Sun size={16} className="text-yellow-500" />, h: '33°', l: '23°' },
              ].map(d => (
                <div key={d.day} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-background">
                  <span className="text-[10px] text-text-muted font-medium">{d.day}</span>
                  {d.icon}
                  <span className="text-xs font-bold text-text-secondary">{d.h}</span>
                  <span className="text-[10px] text-text-muted">{d.l}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('weather')} className="w-full mt-3 text-xs text-green-700 font-semibold flex items-center justify-center gap-1 hover:text-green-800">
              Full Forecast <ChevronRight size={12} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
