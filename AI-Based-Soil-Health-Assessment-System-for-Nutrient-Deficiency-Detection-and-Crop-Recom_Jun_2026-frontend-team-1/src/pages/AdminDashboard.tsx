import { useEffect, useState } from "react"
import { useTranslation } from '../i18n'
import { Users, Activity, BarChart3, MessageSquare, HelpCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Card, Badge, StatusDot, SearchInput } from '../components/ui'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { getAdminStats } from '../services/api'
import api from '../services/api'
import { normalizeSoilKey, normalizeNutrientKey, normalizeCropKey, normalizeTopicKey, normalizeStatusKey } from '../utils/domainNormalizer'

const COLORS = ['#2E7D32', '#1565C0', '#FB8C00', '#7B1FA2', '#D32F2F', '#0288D1']

interface AdminDashboardProps { onNavigate?: (page: string) => void }

export default function AdminDashboard({ onNavigate: _onNavigate }: AdminDashboardProps) {
  const { t } = useTranslation()

  const [botSearch, setBotSearch] = useState('')
  const [summary, setSummary] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [growth, setGrowth] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const soilData = insights?.soil_type_distribution ?? []
  const cropData = insights?.crop_recommendation_counts ?? []
  const nutrientData = insights?.nutrient_deficiency_stats ?? []
  const langData = insights?.language_usage ?? []
  const chatbotMetrics = insights?.chatbot_metrics

  const filteredBotActivity = activity.filter((a: any) =>
    (a.user || '').toLowerCase().includes(botSearch.toLowerCase()) ||
    (a.topic || '').toLowerCase().includes(botSearch.toLowerCase()) ||
    (a.lang || '').toLowerCase().includes(botSearch.toLowerCase())
  )

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [sumRes, insightsRes, growthRes, activityRes] = await Promise.all([
          api.get('/api/dashboard/stats').catch(() => ({ data: null })),
          api.get('/api/dashboard/insights').catch(() => ({ data: null })),
          api.get('/api/dashboard/user-growth').catch(() => ({ data: [] })),
          api.get('/api/chatbot/recent-activity').catch(() => ({ data: [] })),
        ])

        if (!active) return

        if (!sumRes.data) {
          const directStats = await getAdminStats().catch(() => null)
          setSummary(directStats)
        } else {
          setSummary(sumRes.data)
        }

        setInsights(insightsRes.data ?? null)
        setGrowth(growthRes.data ?? [])

        const mapped = (activityRes.data || []).map((it: any) => ({
          id: it.id ? String(it.id) : `conv-${it.time || Math.random()}`,
          time: it.timestamp || it.created_at || it.time || 'Recent',
          user: it.userName || it.user_name || it.user || 'Farmer',
          topic: it.topic || it.subject || it.question || 'General Query',
          lang: it.language || it.lang || 'English',
          status: it.status || 'Resolved'
        }))

        setActivity(mapped)
        setLoading(false)
      } catch (err: any) {
        console.error('AdminDashboard fetch error', err)
        setError('Failed to load dashboard metrics. Please verify backend server status.')
        if (active) setLoading(false)
      }
    }

    fetchData()
    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-2 animate-fade-in">
        <div className="w-8 h-8 rounded-full border-4 border-t-green-600 border-green-100 animate-spin" />
        <span className="text-sm font-medium">{t('loadingMetrics') || 'Loading metrics...'}</span>
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

  const chartData = growth.map(g => {
    const rawMonth = g.month ? g.month.substring(0, 3) : ''
    return {
      month: t(rawMonth) || rawMonth,
      users: g.users || 0,
      farmers: g.farmers || 0
    }
  })

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('enterpriseDashboard') || 'Enterprise dashboard'}</h2>
          <p className="text-sm text-text-muted">{t('platformOverviewSystemHealth') || 'Platform overview and system health — 2026'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
            <StatusDot status="green" />
            <span className="text-xs font-semibold text-green-700">{t('allSystemsOperational') || 'All systems operational'}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('totalUsers') || "Total Users"} value={summary?.total_users != null ? summary.total_users.toLocaleString() : "0"} icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
        <StatCard title={t('activeToday') || "Active Today"} value={summary?.active_today != null ? summary.active_today.toLocaleString() : "0"} icon={<Activity size={20} className="text-white" />} gradient color="linear-gradient(135deg, #1565C0, #1976D2)" />
        <StatCard title={t('farmerAccounts') || "Farmer Accounts"} value={summary?.farmer_count != null ? summary.farmer_count.toLocaleString() : "0"} icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
        <StatCard title={t('totalPredictions') || "Total Predictions"} value={summary?.total_predictions != null ? summary.total_predictions.toLocaleString() : "0"} icon={<BarChart3 size={20} className="text-white" />} gradient color="linear-gradient(135deg, #7B1FA2, #9C27B0)" />
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('predictionTrends') || 'User Growth'}</h3>
            <Badge color="blue">{t('ytd2026') || '2026 YTD'}</Badge>
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noDataAvailable') || 'No data available'}
            </div>
          ) : (
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
                <Area type="monotone" dataKey="users" stroke="#2E7D32" strokeWidth={2} fill="url(#colorFarmers)" name={t('totalUsers') || 'Total Users'} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Most Recommended Crops */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-text-primary">{t('suitableCrops') || 'Suitable Crops'}</h3>
          </div>
          {cropData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noPredictionsMadeYet') || 'No predictions made yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cropData.map((c: any) => ({ ...c, name: t(normalizeCropKey(c.name)) || t(c.name) || c.name }))} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#4CAF50" radius={[4, 4, 0, 0]} name={t('recommendations') || 'Recommendations'} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Soil Type Distribution */}
        <Card className="p-5">
          <h3 className="font-bold text-text-primary mb-5">{t('soil') || 'Soil Classification'}</h3>
          {soilData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noPredictionsMadeYet') || 'No predictions made yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={soilData.map((s: any) => ({ ...s, name: t(normalizeSoilKey(s.name)) || t(s.name) || s.name }))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                  {soilData.map((_entry: any, index: number) => (
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
          <h3 className="font-bold text-text-primary mb-5">{t('nutrientAlert') || 'Nutrient Alerts'}</h3>
          {nutrientData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
              {t('noPredictionsMadeYet') || 'No predictions made yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nutrientData.map((n: any) => ({ ...n, name: t(normalizeNutrientKey(n.name)) || t(n.name) || n.name }))} layout="vertical" margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#FB8C00" radius={[0, 4, 4, 0]} name={t('incidents') || 'Incidents'} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Chatbot Monitoring Module */}
      <h3 className="text-xl font-bold text-text-primary mt-8 mb-2">{t('chatbotMonitoring') || 'Chatbot Monitoring'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><MessageSquare size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.total_conversations?.toLocaleString() ?? '0'}</p><p className="text-sm font-medium text-text-muted">{t('totalConversations') || 'Total Conversations'}</p></div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><HelpCircle size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.avg_questions_per_session ?? '0.0'}</p><p className="text-sm font-medium text-text-muted">{t('avgQuestionsPerSession') || 'Avg Questions/Session'}</p></div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Users size={24} /></div>
          <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.active_users_today?.toLocaleString() ?? '0'}</p><p className="text-sm font-medium text-text-muted">{t('activeUsersToday') || 'Active Users Today'}</p></div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">{t('recentBotActivity') || 'Recent Bot Activity'}</h3>
            <div className="w-64">
              <SearchInput value={botSearch} onChange={setBotSearch} placeholder={t('searchActivity') || "Search activity..."} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('time') || 'Time'}</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('user') || 'User'}</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('topic') || 'Topic'}</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted">{t('language') || 'Language'}</th>
                  <th className="text-left py-2 text-xs font-semibold text-text-muted">{t('status') || 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBotActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-text-muted text-xs font-medium">
                      {t('noDataAvailable') || 'No recent activity'}
                    </td>
                  </tr>
                ) : (
                  filteredBotActivity.map((a: any, i: number) => (
                    <tr key={a.id || i} className="border-b border-border hover:bg-background transition-colors">
                      <td className="py-2.5 pr-3 text-xs text-text-muted">{a.time}</td>
                      <td className="py-2.5 pr-3 font-medium text-text-primary text-xs">{a.user}</td>
                      <td className="py-2.5 pr-3 text-xs">{t(normalizeTopicKey(a.topic)) || t(a.topic) || a.topic}</td>
                      <td className="py-2.5 pr-3 text-xs">{t((a.lang || 'english').toLowerCase()) || a.lang}</td>
                      <td className="py-2.5">
                        <Badge color={a.status === 'Resolved' ? 'green' : 'orange'}>{t(normalizeStatusKey(a.status)) || t(a.status) || a.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text-primary mb-5">{t('languagesUsed') || 'Languages Used'}</h3>
            {langData.filter((l: any) => l.value > 0).length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
                {t('noDataAvailable') || 'No data available'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={langData.filter((l: any) => l.value > 0).map((l: any) => ({ ...l, name: t(l.name.toLowerCase()) || l.name }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {langData.filter((l: any) => l.value > 0).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{t('allSupportedLanguages') || 'All Supported Languages'}</h4>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {langData.map((lang: any) => (
                <div key={lang.name} className="flex justify-between items-center p-1.5 rounded-lg bg-background border border-border text-[11px]">
                  <span className="font-medium text-text-primary truncate mr-1">{t(lang.name.toLowerCase()) || lang.name}</span>
                  <span className="font-mono text-text-muted bg-surface px-1 py-0.5 rounded border border-border flex-shrink-0">{lang.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
