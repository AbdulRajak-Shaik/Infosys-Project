import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next'
import { useTranslate } from '../contexts/TranslationContext'
import api from "../services/api";
import { Users, Activity, BarChart3, MessageSquare, HelpCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Card, Badge, StatusDot, SearchInput } from '../components/ui'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

const COLORS = ['#2E7D32', '#1565C0', '#FB8C00', '#7B1FA2', '#D32F2F', '#0288D1']

export default function AdminDashboard() {
  const { t: i18nT } = useTranslation()
  const { t: tx, translateText } = useTranslate()
  const t = tx || i18nT

  const [botSearch, setBotSearch] = useState('')
  const [summary, setSummary] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [growth, setGrowth] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const soilData = insights?.soil_type_distribution ?? []
  const cropData = insights?.crop_recommendation_counts ?? []
  const nutrientData = insights?.nutrient_deficiency_stats ?? []
  const langData = insights?.language_usage ?? []
  const chatbotMetrics = insights?.chatbot_metrics
  // activity state holds the dynamic chatbot activity rows
  // structure: { id, timestamp, userName, userRole, language, question, topic, status }
  const filteredBotActivity = activity.filter((a: any) =>
    (a.userName || '').toLowerCase().includes(botSearch.toLowerCase()) ||
    (a.question || '').toLowerCase().includes(botSearch.toLowerCase()) ||
    (a.topic || '').toLowerCase().includes(botSearch.toLowerCase())
  )

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        // Hits the new endpoints
        const [sumRes, insightsRes, growthRes, usersRes, activityRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/insights'),
          api.get('/api/dashboard/user-growth'),
          api.get('/api/users'),
          api.get('/api/chatbot/recent-activity'),
        ])

        if (!active) return

        setSummary(sumRes.data ?? null)
        setInsights(insightsRes.data ?? null)
        setGrowth(growthRes.data ?? [])
        setRecentUsers(usersRes.data ?? [])

        // Map activity to internally expected shape
        const mapped = (activityRes.data || []).map((it: any) => ({
          id: it.id,
          timestamp: it.timestamp || it.created_at || it.time,
          userName: it.userName || it.user_name || it.user || 'Unknown',
          userRole: it.userRole || it.role || 'Farmer',
          language: it.language || it.lang || 'en',
          question: it.question || it.user_message || it.q || '',
          topic: it.topic || it.subject || 'General',
          status: it.status || (it.resolved ? 'Resolved' : 'Pending')
        }))

        // Set activity immediately and end blocking spinner
        setActivity(mapped)
        setLoading(false)

        // Translate the questions/topics in the background
        Promise.all(mapped.map(async (m: any) => {
          const q = await translateText(m.question || '')
          const top = await translateText(m.topic || '')
          return { ...m, question: q, topic: top }
        })).then(translated => {
          if (active) setActivity(translated)
        }).catch(err => {
          console.warn('Background translation error:', err)
        })

      } catch (err: any) {
        console.error('AdminDashboard fetch error', err)
        setError('Failed to load dashboard data. Please verify backend status.')
        if (active) setLoading(false)
      }
    }

    fetchData()
    return () => { active = false }
  }, [])

  console.log("Recent users loaded from backend:", recentUsers.length)

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-2 animate-fade-in">
        <div className="w-8 h-8 rounded-full border-4 border-t-green-600 border-green-100 animate-spin" />
        <span className="text-sm font-medium">{t('loadingMetrics')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-2 animate-fade-in">
        <span className="text-sm font-medium">{error}</span>
      </div>
    )
  }

  const chartData = growth.length > 0 ? growth.map(g => ({
    month: g.month.substring(0, 3),
    farmers: g.users,
    total: g.users
  })) : [{ month: 'N/A', farmers: 0, total: 0 }]

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('dashboard')}</h2>
          <p className="text-sm text-text-muted">{t('platformOverview')}</p>
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
        <StatCard title={t('totalUsers')} value={summary?.total_users?.toLocaleString() ?? "0"} change="+19%" trend="up" icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
        <StatCard title={t('activeToday')} value={summary?.active_today?.toLocaleString() ?? "0"} change="+8%" trend="up" icon={<Activity size={20} className="text-white" />} gradient color="linear-gradient(135deg, #1565C0, #1976D2)" />
        <StatCard title={t('totalPredictions')} value={summary?.total_predictions?.toLocaleString() ?? "0"} change="+31%" trend="up" icon={<BarChart3 size={20} className="text-white" />} gradient color="linear-gradient(135deg, #7B1FA2, #9C27B0)" />
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('userGrowth')}</h3>
            <Badge color="blue">{t('ytd')}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
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
              <Area type="monotone" dataKey="farmers" stroke="#2E7D32" strokeWidth={2} fill="url(#colorFarmers)" name={t('farmers')} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Most Recommended Crops */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('mostRecommendedCrops')}</h3>
          </div>
          {cropData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noPredictionsMadeYet') || 'No predictions made yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cropData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#4CAF50" radius={[4, 4, 0, 0]} name={t('recommendations')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Soil Type Distribution */}
        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">{t('soilTypeDistribution')}</h3>
          {soilData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noPredictionsMadeYet') || 'No predictions made yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={soilData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {soilData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Nutrient Deficiencies */}
        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">{t('nutrientDeficiencyIncidents')}</h3>
          {nutrientData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noPredictionsMadeYet') || 'No predictions made yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nutrientData} layout="vertical" margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#FB8C00" radius={[0, 4, 4, 0]} name={t('incidents')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Chatbot Monitoring Module */}
      <h3 className="text-xl font-bold text-text-primary mt-8 mb-2">{t('chatbotMonitoring')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><MessageSquare size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.total_conversations?.toLocaleString() ?? '0'}</p><p className="text-sm font-medium text-text-muted">{t('totalConversations')}</p></div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><HelpCircle size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.avg_questions_per_session?.toFixed(1) ?? '0.0'}</p><p className="text-sm font-medium text-text-muted">{t('avgQuestionsSession')}</p></div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Users size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.active_users_today?.toLocaleString() ?? '0'}</p><p className="text-sm font-medium text-text-muted">{t('activeUsersToday')}</p></div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">{t('recentBotActivity')}</h3>
            <div className="w-64">
              <SearchInput value={botSearch} onChange={setBotSearch} placeholder={t('searchActivity')} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('time')}</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('user')}</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('topic')}</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('language')}</th>
                  <th className="text-left py-2 text-xs font-semibold text-text-muted">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBotActivity.map((a: any, i: number) => (
                  <tr key={i} className="border-b border-border hover:bg-background transition-colors">
                    <td className="py-2.5 pr-3 text-xs text-text-muted">{a.timestamp || a.time}</td>
                    <td className="py-2.5 pr-3 font-medium text-text-primary text-xs">{a.userName || a.user}</td>
                    <td className="py-2.5 pr-3 text-xs">{a.topic}</td>
                    <td className="py-2.5 pr-3 text-xs">{a.language || a.preferredLanguage}</td>
                    <td className="py-2.5">
                      <Badge color={a.status === 'Resolved' ? 'green' : 'orange'}>
                        {a.status === 'Resolved' ? t('resolved') : t('pending')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">{t('languagesUsed')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={langData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {langData.map((entry: any, index: number) => (
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
