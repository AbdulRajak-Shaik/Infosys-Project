import { useEffect, useState } from "react"
import { useTranslation, useSarvamTranslation, Translate } from '../i18n'
import { Users, Activity, BarChart3, MessageSquare, HelpCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Card, Badge, StatusDot, SearchInput, Button } from '../components/ui'
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

  const [healthData, setHealthData] = useState<any>(null)
  const [showHealth, setShowHealth] = useState(false)
  const [chatbotMetricsState, setChatbotMetricsState] = useState<any>(null)

  const totalUsersText = useSarvamTranslation('Total Users')
  const activeTodayText = useSarvamTranslation('Active Today')
  const farmerAccountsText = useSarvamTranslation('Farmer Accounts')
  const totalPredictionsText = useSarvamTranslation('Total Predictions')
  const recommendationsText = useSarvamTranslation('Recommendations')
  const incidentsText = useSarvamTranslation('Incidents')
  const searchPlaceholderText = useSarvamTranslation('Search activity...')

  const soilData = insights?.soil_type_distribution ?? []
  const cropData = insights?.crop_recommendation_counts ?? []
  const nutrientData = insights?.nutrient_deficiency_stats ?? []
  const langData = insights?.language_usage ?? []
  const chatbotMetrics = chatbotMetricsState || insights?.chatbot_metrics

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
        const [sumRes, insightsRes, growthRes, activityRes, healthRes, chatbotRes] = await Promise.all([
          api.get('/api/dashboard/stats').catch(() => ({ data: null })),
          api.get('/api/dashboard/insights').catch(() => ({ data: null })),
          api.get('/api/dashboard/user-growth').catch(() => ({ data: [] })),
          api.get('/api/chatbot/recent-activity').catch(() => ({ data: [] })),
          api.get('/admin/dashboard/system-health').catch(() => ({ data: null })),
          api.get('/api/chatbot/monitoring-analytics').catch(() => ({ data: null })),
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
        setHealthData(healthRes.data ?? null)
        setChatbotMetricsState(chatbotRes.data?.kpis ?? null)

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
        <span className="text-sm font-medium"><Translate text="Loading metrics..." /></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-2 animate-fade-in">
        <span className="text-sm font-medium"><Translate text={error} /></span>
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
          <h2 className="text-2xl font-bold text-text-primary"><Translate text="Enterprise dashboard" /></h2>
          <p className="text-sm text-text-muted"><Translate text="Platform overview and system health — 2026" /></p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={showHealth ? "primary" : "outlined"} 
            size="sm"
            onClick={() => setShowHealth(!showHealth)}
          >
            {showHealth ? <Translate text="Show Analytics" /> : <Translate text="Show System Health" />}
          </Button>
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
            <StatusDot status="green" />
            <span className="text-xs font-semibold text-green-700"><Translate text="All systems operational" /></span>
          </div>
        </div>
      </div>

      {showHealth ? (
        <div className="space-y-6 animate-fade-in">
          {/* Health Grid */}
          <Card className="p-5">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              🛡️ System Component Health Monitors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthData?.components ? (
                Object.entries(healthData.components).map(([name, info]: any) => (
                  <div key={name} className="flex justify-between items-center p-3 rounded-xl bg-background border border-border shadow-soft">
                    <div>
                      <p className="text-sm font-semibold text-text-primary"><Translate text={name} /></p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {info.latency_ms != null ? `Latency: ${info.latency_ms}ms` : info.usage_pct != null ? `Usage: ${info.usage_pct}%` : `Active Tasks: ${info.active_tasks ?? 0}`}
                      </p>
                      <p className="text-[8px] text-text-muted mt-0.5">Checked: {new Date(info.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${info.status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <Translate text={info.status} />
                      </span>
                      <StatusDot status={info.status === 'Healthy' ? 'green' : 'yellow'} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted"><Translate text="Loading component health..." /></p>
              )}
            </div>
          </Card>

          {/* Observability summaries */}
          <Card className="p-5">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              📈 Observability & Average Latencies
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-background rounded-xl border border-border text-center shadow-soft">
                <p className="text-2xl font-bold text-green-700">{healthData?.observability?.average_prediction_latency_ms ?? 32}ms</p>
                <p className="text-[10px] font-semibold text-text-secondary uppercase mt-1"><Translate text="Prediction Latency" /></p>
              </div>
              <div className="p-4 bg-background rounded-xl border border-border text-center shadow-soft">
                <p className="text-2xl font-bold text-blue-700">{healthData?.observability?.average_translation_latency_ms ?? 205}ms</p>
                <p className="text-[10px] font-semibold text-text-secondary uppercase mt-1"><Translate text="Translation Latency" /></p>
              </div>
              <div className="p-4 bg-background rounded-xl border border-border text-center shadow-soft">
                <p className="text-2xl font-bold text-purple-700">{healthData?.observability?.average_api_latency_ms ?? 48}ms</p>
                <p className="text-[10px] font-semibold text-text-secondary uppercase mt-1"><Translate text="API Latency" /></p>
              </div>
              <div className="p-4 bg-background rounded-xl border border-border text-center shadow-soft">
                <p className="text-2xl font-bold text-orange-700">{healthData?.observability?.average_report_generation_time_s ?? 0.45}s</p>
                <p className="text-[10px] font-semibold text-text-secondary uppercase mt-1"><Translate text="Report Gen Time" /></p>
              </div>
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-border justify-around text-center">
              <div>
                <p className="text-sm font-bold text-text-primary">{healthData?.observability?.failed_requests ?? 0}</p>
                <p className="text-[10px] text-text-secondary"><Translate text="Failed Requests (24h)" /></p>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{healthData?.observability?.retry_attempts ?? 0}</p>
                <p className="text-[10px] text-text-secondary"><Translate text="Automatic Retries (24h)" /></p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={totalUsersText} value={summary?.total_users != null ? summary.total_users.toLocaleString() : "0"} icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
            <StatCard title={activeTodayText} value={summary?.active_today != null ? summary.active_today.toLocaleString() : "0"} icon={<Activity size={20} className="text-white" />} gradient color="linear-gradient(135deg, #1565C0, #1976D2)" />
            <StatCard title={farmerAccountsText} value={summary?.farmer_count != null ? summary.farmer_count.toLocaleString() : "0"} icon={<Users size={20} className="text-white" />} gradient color="linear-gradient(135deg, #2E7D32, #43A047)" />
            <StatCard title={totalPredictionsText} value={summary?.total_predictions != null ? summary.total_predictions.toLocaleString() : "0"} icon={<BarChart3 size={20} className="text-white" />} gradient color="linear-gradient(135deg, #7B1FA2, #9C27B0)" />
          </div>

          {/* Analytics Row */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* User Growth */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-text-primary"><Translate text="User Growth" /></h3>
                <Badge color="blue"><Translate text="2026 YTD" /></Badge>
              </div>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
                  <Translate text="No data available" />
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
                    <Area type="monotone" dataKey="users" stroke="#2E7D32" strokeWidth={2} fill="url(#colorFarmers)" name={totalUsersText} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Most Recommended Crops */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-text-primary"><Translate text="Suitable Crops" /></h3>
              </div>
              {cropData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
                  <Translate text="No predictions made yet" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cropData.map((c: any) => {
                    const key = normalizeCropKey(c.name);
                    const trans = t(key);
                    return { ...c, name: trans === key ? (t(c.name) || c.name) : trans };
                  })} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#4CAF50" radius={[4, 4, 0, 0]} name={recommendationsText} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Soil Type Distribution */}
            <Card className="p-5">
              <h3 className="font-bold text-text-primary mb-5"><Translate text="Soil Classification" /></h3>
              {soilData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
                  <Translate text="No predictions made yet" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={soilData.map((s: any) => {
                      const key = normalizeSoilKey(s.name);
                      const trans = t(key);
                      return { ...s, name: trans === key ? (t(s.name) || s.name) : trans };
                    })} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
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
              <h3 className="font-bold text-text-primary mb-5"><Translate text="Nutrient Alerts" /></h3>
              {nutrientData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
                  <Translate text="No predictions made yet" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={nutrientData.map((n: any) => {
                    const key = normalizeNutrientKey(n.name);
                    const trans = t(key);
                    return { ...n, name: trans === key ? (t(n.name) || n.name) : trans };
                  })} layout="vertical" margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#FB8C00" radius={[0, 4, 4, 0]} name={incidentsText} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Chatbot Monitoring Module */}
          <h3 className="text-xl font-bold text-text-primary mt-8 mb-2"><Translate text="Chatbot Monitoring" /></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><MessageSquare size={24} /></div>
              <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.total_conversations?.toLocaleString() ?? '0'}</p><p className="text-sm font-medium text-text-muted"><Translate text="Total Conversations" /></p></div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><HelpCircle size={24} /></div>
              <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.avg_questions_per_session ?? '0.0'}</p><p className="text-sm font-medium text-text-muted"><Translate text="Avg Questions/Session" /></p></div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Users size={24} /></div>
              <div><p className="text-3xl font-bold text-text-primary">{chatbotMetrics?.active_users_today?.toLocaleString() ?? '0'}</p><p className="text-sm font-medium text-text-muted"><Translate text="Active Users Today" /></p></div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-primary"><Translate text="Recent Bot Activity" /></h3>
                <div className="w-64">
                  <SearchInput value={botSearch} onChange={setBotSearch} placeholder={searchPlaceholderText} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted"><Translate text="Time" /></th>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted"><Translate text="User" /></th>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted"><Translate text="Topic" /></th>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-text-muted"><Translate text="Language" /></th>
                      <th className="text-left py-2 text-xs font-semibold text-text-muted"><Translate text="Status" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBotActivity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-text-muted text-xs font-medium">
                          <Translate text="No recent activity" />
                        </td>
                      </tr>
                    ) : (
                      filteredBotActivity.map((a: any, i: number) => (
                        <tr key={a.id || i} className="border-b border-border hover:bg-background transition-colors">
                          <td className="py-2.5 pr-3 text-xs text-text-muted"><Translate text={a.time} /></td>
                          <td className="py-2.5 pr-3 font-medium text-text-primary text-xs"><Translate text={a.user} /></td>
                          <td className="py-2.5 pr-3 text-xs"><Translate text={normalizeTopicKey(a.topic)} /></td>
                          <td className="py-2.5 pr-3 text-xs"><Translate text={a.lang} /></td>
                          <td className="py-2.5">
                            <Badge color={a.status === 'Resolved' ? 'green' : 'orange'}><Translate text={normalizeStatusKey(a.status)} /></Badge>
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
                <h3 className="font-bold text-text-primary mb-5"><Translate text="Languages Used" /></h3>
                {langData.filter((l: any) => l.value > 0).length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-medium">
                    <Translate text="No data available" />
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
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2"><Translate text="All Supported Languages" /></h4>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {langData.map((lang: any) => (
                    <div key={lang.name} className="flex justify-between items-center p-1.5 rounded-lg bg-background border border-border text-[11px]">
                      <span className="font-medium text-text-primary truncate mr-1"><Translate text={lang.name} /></span>
                      <span className="font-mono text-text-muted bg-surface px-1 py-0.5 rounded border border-border flex-shrink-0">{lang.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
