import { useState, useEffect } from 'react'
import { Users, Activity, BarChart3, TrendingUp, CheckCircle, Clock, Search, MessageSquare, HelpCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Card, Badge, StatusDot, ProgressBar, SearchInput } from '../components/ui'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { FEATURES } from '../config'
import { useTranslation } from '../i18n'
import { formatLocalizedMonth } from '../utils/dateUtils'
import { getAdminStats, type AdminStats } from '../services/api'

const userGrowth = [
  { month: 'Jan', farmers: 800, total: 800 }, { month: 'Feb', farmers: 1200, total: 1200 },
  { month: 'Mar', farmers: 1800, total: 1800 }, { month: 'Apr', farmers: 2400, total: 2400 },
  { month: 'May', farmers: 3100, total: 3100 }, { month: 'Jun', farmers: 4200, total: 4200 },
  { month: 'Jul', farmers: 5000, total: 5000 },
]

const recentUsers = [
  { name: 'Rajesh Kumar', email: 'rajesh@farm.com', role: 'Farmer', status: 'active', joined: 'Jul 24', region: 'Punjab' },
  { name: 'Ali Hassan', email: 'ali@agro.pk', role: 'Farmer', status: 'pending', joined: 'Jul 22', region: 'Sindh' },
  { name: 'Sarah Okonkwo', email: 'sarah@farm.ng', role: 'Farmer', status: 'active', joined: 'Jul 21', region: 'Lagos' },
]

const soilData = [
  { name: 'Black Soil', value: 35 }, { name: 'Clay Soil', value: 20 }, { name: 'Loamy Soil', value: 35 },
  { name: 'Red Soil', value: 5 }, { name: 'Sandy Soil', value: 5 }
]

const langData = [
  { name: 'English', value: 40 }, { name: 'Hindi', value: 30 }, { name: 'Punjabi', value: 15 },
  { name: 'Tamil', value: 10 }, { name: 'Telugu', value: 5 }
]

const cropData = [
  { name: 'Rice', value: 4500 }, { name: 'Wheat', value: 3800 }, { name: 'Maize', value: 3200 },
  { name: 'Cotton', value: 2900 }, { name: 'Other', value: 2500 }
]

const nutrientData = [
  { name: 'Nitrogen', value: 85 }, { name: 'Phosphorus', value: 65 }, { name: 'Potassium', value: 45 },
  { name: 'Soil pH', value: 30 }
]

const botActivity = [
  { time: '2m ago', user: 'Rajesh K.', topic: 'Crop Recommendation', lang: 'English', status: 'Resolved', id: 'C-101' },
  { time: '14m ago', user: 'Harish M.', topic: 'Weather Forecast', lang: 'Hindi', status: 'Resolved', id: 'C-102' },
  { time: '38m ago', user: 'Arun S.', topic: 'Fertilizer Advice', lang: 'Tamil', status: 'Escalated', id: 'C-103' },
  { time: '1h ago', user: 'Simran K.', topic: 'Disease Control', lang: 'Punjabi', status: 'Resolved', id: 'C-104' },
]

const COLORS = ['#2E7D32', '#1565C0', '#FB8C00', '#7B1FA2', '#D32F2F', '#0288D1']

interface AdminDashboardProps { onNavigate: (page: string) => void }

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { t, currentLanguage } = useTranslation()
  const [botSearch, setBotSearch] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    getAdminStats()
      .then(res => setStats(res))
      .catch(err => console.warn('Admin stats note:', err))
  }, [])

  const monthsIndices = [0, 1, 2, 3, 4, 5, 6] // Jan .. Jul
  const translatedUserGrowth = userGrowth.map((item, idx) => ({
    ...item,
    month: formatLocalizedMonth(monthsIndices[idx] || idx, currentLanguage),
    [t('Farmer')]: item.farmers,
  }))

  const translatedCropData = cropData.map(c => ({
    ...c,
    name: t(c.name),
  }))

  const translatedSoilData = soilData.map(s => ({
    ...s,
    name: t(s.name),
  }))

  const translatedNutrientData = nutrientData.map(n => ({
    ...n,
    name: t(n.name),
  }))

  const filteredBotActivity = botActivity.filter(a => 
    a.user.toLowerCase().includes(botSearch.toLowerCase()) || 
    a.topic.toLowerCase().includes(botSearch.toLowerCase()) ||
    a.lang.toLowerCase().includes(botSearch.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('enterpriseDashboard')}</h2>
          <p className="text-sm text-text-muted">Platform overview and system health — July 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
            <StatusDot status="green" />
            <span className="text-xs font-semibold text-green-700">{t('allSystemsOperational')}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={stats?.total_users ? stats.total_users.toLocaleString() : "5,510"} change="+19%" trend="up" icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
        <StatCard title={t('userManagement')} value={stats?.total_users ? stats.total_users.toLocaleString() : "5,510"} change="+19%" trend="up" icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
        <StatCard title={t('community')} value={stats?.active_today ? stats.active_today.toLocaleString() : "1,247"} change="+8%" trend="up" icon={<Activity size={20} className="text-white" />} gradient color="linear-gradient(135deg, #1565C0, #1976D2)" />
        <StatCard title={t('totalPredictions')} value={stats?.total_predictions ? stats.total_predictions.toLocaleString() : "11,850"} change="+31%" trend="up" icon={<BarChart3 size={20} className="text-white" />} gradient color="linear-gradient(135deg, #7B1FA2, #9C27B0)" />
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('predictionTrends')}</h3>
            <Badge color="blue">2026 YTD</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={translatedUserGrowth} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorFarmers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.25} /><stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey={t('Farmer')} stroke="#2E7D32" strokeWidth={2} fill="url(#colorFarmers)" name={t('Farmer')} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Most Recommended Crops */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('suitableCrops')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={translatedCropData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#4CAF50" radius={[4, 4, 0, 0]} name={t('recommendCrop')} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Soil Type Distribution */}
        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">{t('soil')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={translatedSoilData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                {translatedSoilData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Nutrient Deficiencies */}
        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">{t('nutrientAlert')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={translatedNutrientData} layout="vertical" margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#FB8C00" radius={[0, 4, 4, 0]} name="Incidents (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Chatbot Monitoring Module */}
      <h3 className="text-xl font-bold text-text-primary mt-8 mb-2">Chatbot Monitoring</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><MessageSquare size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">842</p><p className="text-sm font-medium text-text-muted">Total Conversations</p></div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><HelpCircle size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">4.2</p><p className="text-sm font-medium text-text-muted">Avg Questions/Session</p></div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Users size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">315</p><p className="text-sm font-medium text-text-muted">Active Users Today</p></div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">Recent Bot Activity</h3>
            <div className="w-64">
              <SearchInput value={botSearch} onChange={setBotSearch} placeholder="Search activity..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">Time</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">User</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">Topic</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">Language</th>
                  <th className="text-left py-2 text-xs font-semibold text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBotActivity.map((a, i) => (
                  <tr key={i} className="border-b border-border hover:bg-background transition-colors">
                    <td className="py-2.5 pr-3 text-xs text-text-muted">{a.time}</td>
                    <td className="py-2.5 pr-3 font-medium text-text-primary text-xs">{a.user}</td>
                    <td className="py-2.5 pr-3 text-xs">{a.topic}</td>
                    <td className="py-2.5 pr-3 text-xs">{a.lang}</td>
                    <td className="py-2.5">
                      <Badge color={a.status === 'Resolved' ? 'green' : 'orange'}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">Languages Used</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={langData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {langData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

    </div>
  )
}
