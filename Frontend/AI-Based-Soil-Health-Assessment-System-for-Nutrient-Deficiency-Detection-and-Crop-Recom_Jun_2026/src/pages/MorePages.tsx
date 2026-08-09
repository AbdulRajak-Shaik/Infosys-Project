import React, { useState, useRef, useEffect } from 'react'
import { Cloud, Droplets, Thermometer, Wind, Sunrise, Sunset, Bell, Star, Download, Search, Filter, ChevronDown, ChevronUp, Lock, Globe, Sun, Shield, Smartphone, Check, X, MapPin, Camera, Edit3, Trash2, Navigation, FileText, AlertCircle, Bot, Sparkles, Eye, EyeOff, Leaf, MessageSquare, TrendingUp, ThumbsUp, CheckCircle2 } from 'lucide-react'
import { Card, Badge, Button, Input, SelectInput, SearchInput, ProgressBar, Breadcrumb, LineSpinner } from '../components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FEATURES } from '../config'
import api from '../services/api'
import { useTranslate } from '../contexts/TranslationContext'

// ---- Weather location dataset ----
interface WeatherLocation {
  label: string
  state: string
  temp: number
  humidity: number
  wind: number
  condition: string
  feelsLike: number
}

const WEATHER_LOCATIONS: WeatherLocation[] = [
  { label: 'Ludhiana, Punjab', state: 'Punjab', temp: 32, humidity: 68, wind: 14, condition: 'Partly Sunny', feelsLike: 38 },
  { label: 'Amritsar, Punjab', state: 'Punjab', temp: 30, humidity: 72, wind: 12, condition: 'Hazy', feelsLike: 36 },
  { label: 'Kotkapura, Faridkot, Punjab', state: 'Punjab', temp: 31, humidity: 70, wind: 11, condition: 'Partly Sunny', feelsLike: 37 },
  { label: 'Chandigarh', state: 'Punjab', temp: 31, humidity: 70, wind: 11, condition: 'Partly Sunny', feelsLike: 37 },
  { label: 'Delhi, NCT', state: 'Delhi', temp: 38, humidity: 55, wind: 18, condition: 'Hot & Sunny', feelsLike: 44 },
  { label: 'Jaipur, Rajasthan', state: 'Rajasthan', temp: 40, humidity: 40, wind: 20, condition: 'Sunny & Hot', feelsLike: 45 },
  { label: 'Jodhpur, Rajasthan', state: 'Rajasthan', temp: 42, humidity: 35, wind: 22, condition: 'Very Hot', feelsLike: 47 },
  { label: 'Lucknow, Uttar Pradesh', state: 'UP', temp: 37, humidity: 65, wind: 10, condition: 'Hot & Sunny', feelsLike: 43 },
  { label: 'Varanasi, Uttar Pradesh', state: 'UP', temp: 36, humidity: 68, wind: 9, condition: 'Sunny', feelsLike: 42 },
  { label: 'Agra, Uttar Pradesh', state: 'UP', temp: 38, humidity: 58, wind: 12, condition: 'Hot', feelsLike: 44 },
  { label: 'Patna, Bihar', state: 'Bihar', temp: 35, humidity: 75, wind: 8, condition: 'Humid & Sunny', feelsLike: 42 },
  { label: 'Bhopal, Madhya Pradesh', state: 'MP', temp: 34, humidity: 60, wind: 10, condition: 'Partly Sunny', feelsLike: 40 },
  { label: 'Indore, Madhya Pradesh', state: 'MP', temp: 33, humidity: 62, wind: 11, condition: 'Partly Sunny', feelsLike: 39 },
  { label: 'Nagpur, Maharashtra', state: 'Maharashtra', temp: 36, humidity: 58, wind: 13, condition: 'Sunny', feelsLike: 42 },
  { label: 'Pune, Maharashtra', state: 'Maharashtra', temp: 27, humidity: 78, wind: 15, condition: 'Partly Cloudy', feelsLike: 29 },
  { label: 'Mumbai, Maharashtra', state: 'Maharashtra', temp: 29, humidity: 85, wind: 22, condition: 'Humid & Cloudy', feelsLike: 34 },
  { label: 'Ahmedabad, Gujarat', state: 'Gujarat', temp: 38, humidity: 50, wind: 17, condition: 'Hot & Sunny', feelsLike: 44 },
  { label: 'Surat, Gujarat', state: 'Gujarat', temp: 33, humidity: 78, wind: 16, condition: 'Humid', feelsLike: 38 },
  { label: 'Hyderabad, Telangana', state: 'Telangana', temp: 33, humidity: 62, wind: 16, condition: 'Partly Cloudy', feelsLike: 38 },
  { label: 'Bengaluru, Karnataka', state: 'Karnataka', temp: 28, humidity: 60, wind: 14, condition: 'Partly Cloudy', feelsLike: 30 },
  { label: 'Mysuru, Karnataka', state: 'Karnataka', temp: 27, humidity: 65, wind: 12, condition: 'Pleasant', feelsLike: 29 },
  { label: 'Chennai, Tamil Nadu', state: 'Tamil Nadu', temp: 35, humidity: 80, wind: 20, condition: 'Hot & Humid', feelsLike: 42 },
  { label: 'Coimbatore, Tamil Nadu', state: 'Tamil Nadu', temp: 30, humidity: 70, wind: 12, condition: 'Partly Cloudy', feelsLike: 34 },
  { label: 'Kolkata, West Bengal', state: 'West Bengal', temp: 31, humidity: 82, wind: 12, condition: 'Humid', feelsLike: 38 },
  { label: 'Bhubaneswar, Odisha', state: 'Odisha', temp: 33, humidity: 74, wind: 14, condition: 'Partly Cloudy', feelsLike: 39 },
]

// ---- Location picker modal ----
function LocationModal({ onSelect, onClose }: {
  onSelect: (loc: WeatherLocation) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'denied'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const suggestions = query.length >= 2
    ? WEATHER_LOCATIONS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : []

  const handleGPS = () => {
    setGpsStatus('loading')
    if (!navigator.geolocation) { setGpsStatus('denied'); return }
    navigator.geolocation.getCurrentPosition(
      () => {
        // Simulate resolving GPS to nearest location
        setTimeout(() => {
          const loc = WEATHER_LOCATIONS[Math.floor(Math.random() * (WEATHER_LOCATIONS.length - 1)) + 1]
          onSelect(loc)
        }, 1000)
      },
      () => setGpsStatus('denied'),
      { timeout: 8000 }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-elevated w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary">Change Location</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search input with GPS integrated */}
        <div className="relative mb-3 group">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search village, town, city, district, state..."
            icon={<MapPin size={16} className="text-text-muted transition-colors flex-shrink-0" />}
            rightElement={
              query ? (
                <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary flex-shrink-0">
                  <X size={14} />
                </button>
              ) : (
                <button 
                  onClick={handleGPS} 
                  className="text-text-muted hover:text-text-primary flex items-center gap-1.5 px-2 py-0.5 rounded bg-background border border-border text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  {gpsStatus === 'loading' ? <LineSpinner size={12} color="currentColor" strokeWidth={2} /> : <Navigation size={12} />}
                  GPS
                </button>
              )
            }
          />
          {gpsStatus === 'denied' && (
            <p className="text-[10px] text-error mt-1.5 flex items-center gap-1 animate-fade-in"><AlertCircle size={10} /> Location access denied. Please search manually.</p>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border max-h-52 overflow-y-auto bg-surface mb-3">
            {suggestions.slice(0, 8).map(loc => (
              <button
                key={loc.label}
                onClick={() => onSelect(loc)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
              >
                <MapPin size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-primary font-semibold">{loc.label}</span>
                <span className="ml-auto text-xs text-text-muted">{loc.temp}°C</span>
              </button>
            ))}
          </div>
        )}

        {/* Popular locations (shown when no query) */}
        {query.length === 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Popular Locations</p>
            <div className="flex flex-wrap gap-2">
              {WEATHER_LOCATIONS.slice(0, 8).map(loc => (
                <button
                  key={loc.label}
                  onClick={() => onSelect(loc)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                >
                  {loc.label.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {query.length >= 2 && suggestions.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">No locations found for "{query}"</p>
        )}
      </div>
    </div>
  )
}

// ---- Weather Dashboard ----
const generateHourly = (baseTemp: number) => [
  { time: '06:00', temp: Math.round(baseTemp - 8), humidity: 82 },
  { time: '09:00', temp: Math.round(baseTemp - 4), humidity: 70 },
  { time: '12:00', temp: baseTemp, humidity: 45 },
  { time: '15:00', temp: Math.round(baseTemp + 2), humidity: 38 },
  { time: '18:00', temp: Math.round(baseTemp - 1), humidity: 50 },
  { time: '21:00', temp: Math.round(baseTemp - 5), humidity: 65 },
]

const generateForecast = (baseTemp: number, condition: string) => [
  { day: 'Today', icon: condition.includes('Rain') ? '🌧️' : condition.includes('Cloud') ? '⛅' : '☀️', high: Math.round(baseTemp + 2), low: Math.round(baseTemp - 8), rain: condition.includes('Rain') ? '80%' : '0%', condition: condition.includes('Rain') ? 'Rain Showers' : 'Partly Cloudy', humidity: 65, wind: 12, dir: 'NE', uv: 6, sunrise: '05:42 AM', sunset: '07:18 PM', desc: 'Good conditions for field preparation.' },
  { day: 'Wed', icon: '⛅', high: Math.round(baseTemp), low: Math.round(baseTemp - 7), rain: '10%', condition: 'Partly Cloudy', humidity: 55, wind: 15, dir: 'N', uv: 7, sunrise: '05:43 AM', sunset: '07:17 PM', desc: 'Ideal for fertilization.' },
  { day: 'Thu', icon: '☀️', high: Math.round(baseTemp + 1), low: Math.round(baseTemp - 6), rain: '0%', condition: 'Sunny', humidity: 40, wind: 8, dir: 'E', uv: 9, sunrise: '05:43 AM', sunset: '07:16 PM', desc: 'High UV. Consider shading sensitive seedlings.' },
  { day: 'Fri', icon: '🌧️', high: Math.round(baseTemp - 3), low: Math.round(baseTemp - 9), rain: '70%', condition: 'Heavy Rain', humidity: 85, wind: 20, dir: 'SW', uv: 3, sunrise: '05:44 AM', sunset: '07:15 PM', desc: 'Delay pesticide application. Potential runoff.' },
  { day: 'Sat', icon: '⛈️', high: Math.round(baseTemp - 4), low: Math.round(baseTemp - 10), rain: '90%', condition: 'Thunderstorms', humidity: 90, wind: 25, dir: 'SW', uv: 2, sunrise: '05:45 AM', sunset: '07:14 PM', desc: 'Secure loose equipment. Risk of waterlogging.' },
  { day: 'Sun', icon: '⛅', high: Math.round(baseTemp - 1), low: Math.round(baseTemp - 8), rain: '20%', condition: 'Mostly Cloudy', humidity: 60, wind: 10, dir: 'S', uv: 5, sunrise: '05:46 AM', sunset: '07:12 PM', desc: 'Soil moisture returning to optimal levels.' },
  { day: 'Mon', icon: '☀️', high: Math.round(baseTemp + 3), low: Math.round(baseTemp - 5), rain: '0%', condition: 'Clear Sky', humidity: 45, wind: 5, dir: 'SE', uv: 8, sunrise: '05:47 AM', sunset: '07:11 PM', desc: 'Perfect window for harvesting operations.' },
]

function WeatherConditionIcon({ condition }: { condition: string }) {
  const c = condition.toLowerCase()
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) {
    return (
      <svg width="52" height="52" viewBox="-26 -20 52 52" overflow="visible" className="animate-weather-in flex-shrink-0">
        <ellipse cx="0" cy="-8" rx="16" ry="10" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="-8" cy="-11" rx="9" ry="7" fill="rgba(255,255,255,0.25)" />
        <ellipse cx="8" cy="-11" rx="8" ry="6.5" fill="rgba(255,255,255,0.25)" />
        <line x1="-12" y1="2" x2="-14" y2="14" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" className="animate-rain-1" />
        <line x1="-4"  y1="2" x2="-6"  y2="14" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" className="animate-rain-2" />
        <line x1="4"   y1="2" x2="2"   y2="14" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" className="animate-rain-3" />
        <line x1="12"  y1="2" x2="10"  y2="14" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" className="animate-rain-4" />
      </svg>
    )
  }
  if (c.includes('cloud') || c.includes('hazy') || c.includes('overcast')) {
    return (
      <svg width="52" height="36" viewBox="-26 -14 52 36" overflow="visible" className="animate-weather-in flex-shrink-0">
        <g className="animate-cloud">
          <ellipse cx="0" cy="8" rx="18" ry="10" fill="rgba(255,255,255,0.35)" />
          <ellipse cx="-10" cy="4" rx="10" ry="8" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="10" cy="4" rx="9" ry="7" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="0" cy="-2" rx="12" ry="9" fill="rgba(255,255,255,0.3)" />
        </g>
      </svg>
    )
  }
  if (c.includes('wind') || c.includes('breezy')) {
    return (
      <svg width="52" height="36" viewBox="-26 -14 52 36" overflow="visible" className="animate-weather-in flex-shrink-0">
        <path d="M -22 -4 Q 0 -4 12 -4 Q 20 -4 20 -10 Q 20 -16 12 -16 Q 4 -16 4 -10" stroke="rgba(255,255,255,0.75)" fill="none" strokeWidth="2.5" strokeLinecap="round" className="animate-wind-leaf" />
        <path d="M -22 2 Q 6 2 16 2 Q 24 2 24 8 Q 24 14 16 14 Q 8 14 8 8" stroke="rgba(255,255,255,0.55)" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M -22 10 Q 0 10 8 10" stroke="rgba(255,255,255,0.4)" fill="none" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (c.includes('storm') || c.includes('thunder')) {
    return (
      <svg width="52" height="52" viewBox="-26 -20 52 52" overflow="visible" className="animate-weather-in flex-shrink-0">
        <ellipse cx="0" cy="-8" rx="16" ry="10" fill="rgba(255,255,255,0.25)" />
        <path d="M 4 0 L -6 14 L 0 14 L -8 28" stroke="rgba(251,191,36,0.9)" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-lightning" />
      </svg>
    )
  }
  // Default: sunny / hot
  return (
    <svg width="52" height="52" viewBox="-26 -26 52 52" overflow="visible" className="animate-weather-in flex-shrink-0">
      <g className="animate-sun-spin">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <line key={a} x1="0" y1="12" x2="0" y2="18" stroke="rgba(251,191,36,0.9)" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle cx="0" cy="0" r="9" fill="rgba(251,191,36,0.9)" />
      <circle cx="0" cy="0" r="7" fill="#FBC02D" />
    </svg>
  )
}

export function WeatherDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [location, setLocation] = useState<WeatherLocation>(WEATHER_LOCATIONS[0])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Fetching weather...')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [hourlyData, setHourlyData] = useState<any[]>(() => generateHourly(location.temp))
  const [forecast, setForecast] = useState<any[]>(() => generateForecast(location.temp, location.condition))

  const fetchWeatherData = async (locName: string) => {
    setLoading(true)
    setLoadingMsg('Fetching current weather...')
    try {
      const currentRes = await api.get('/weather/current', { params: { location: locName } })
      const forecastRes = await api.get('/weather/forecast', { params: { location: locName } })
      
      const c = currentRes.data
      setLocation({
        label: c.location,
        state: '',
        temp: c.current_temperature,
        humidity: c.humidity,
        wind: c.wind_speed,
        condition: c.condition,
        feelsLike: c.feels_like
      })

      setHourlyData(generateHourly(c.current_temperature))

      const f = forecastRes.data.forecast.map((item: any) => ({
        day: item.day_name,
        icon: item.condition.toLowerCase().includes('rain') ? '🌧️' : item.condition.toLowerCase().includes('cloud') ? '⛅' : '☀️',
        high: item.max_temp,
        low: item.min_temp,
        rain: item.condition.toLowerCase().includes('rain') ? '80%' : '0%',
        condition: item.condition,
        humidity: 65,
        wind: 12,
        dir: 'NE',
        uv: 6,
        sunrise: '05:42 AM',
        sunset: '07:18 PM',
        desc: 'Optimal condition for crop maintenance.'
      }))
      setForecast(f)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeatherData(location.label)
  }, [])

  const handleLocationSelect = (loc: WeatherLocation) => {
    setShowModal(false)
    fetchWeatherData(loc.label)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {showModal && <LocationModal onSelect={handleLocationSelect} onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Weather' }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">Weather Dashboard</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-text-muted flex items-center gap-1 hover:text-green-700 transition-colors mt-0.5 group"
          >
            <MapPin size={12} />
            <span>{location.label}</span>
            <Edit3 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
        </div>
        <Button variant="outlined" size="sm" icon={<MapPin size={13} />} onClick={() => setShowModal(true)}>
          Change Location
        </Button>
      </div>

      {/* Weather loading */}
      {loading && (
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-5 animate-fade-in">
          <p className="text-sm font-medium text-blue-700 mb-4 text-center">{loadingMsg}</p>
          <div className="flex items-center justify-center gap-6">
            {/* Cloud */}
            <div className="flex flex-col items-center gap-1 animate-wl-0">
              <svg width="36" height="24" viewBox="0 0 36 24" className="animate-cloud">
                <ellipse cx="18" cy="16" rx="14" ry="8" fill="#90CAF9" />
                <ellipse cx="12" cy="14" rx="8" ry="6" fill="#BBDEFB" />
                <ellipse cx="24" cy="14" rx="7" ry="5.5" fill="#BBDEFB" />
                <ellipse cx="18" cy="10" rx="10" ry="7" fill="#BBDEFB" />
              </svg>
              <span className="text-[10px] text-blue-400 font-medium">Clouds</span>
            </div>
            {/* Sun */}
            <div className="flex flex-col items-center gap-1 animate-wl-1">
              <svg width="30" height="30" viewBox="-15 -15 30 30">
                <g className="animate-sun-spin">
                  {[0,45,90,135,180,225,270,315].map(a => (
                    <line key={a} x1="0" y1="8" x2="0" y2="12" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round"
                      transform={`rotate(${a})`} />
                  ))}
                </g>
                <circle cx="0" cy="0" r="6.5" fill="#FBC02D" />
              </svg>
              <span className="text-[10px] text-yellow-500 font-medium">Sun</span>
            </div>
            {/* Rain */}
            <div className="flex flex-col items-center gap-1 animate-wl-2">
              <svg width="32" height="36" viewBox="-16 -8 32 36" overflow="visible">
                <ellipse cx="0" cy="-4" rx="10" ry="6" fill="#90CAF9" />
                <line x1="-8" y1="2" x2="-10" y2="14" stroke="#42A5F5" strokeWidth="1.8" strokeLinecap="round" className="animate-rain-1" />
                <line x1="-2" y1="2" x2="-4"  y2="14" stroke="#42A5F5" strokeWidth="1.8" strokeLinecap="round" className="animate-rain-2" />
                <line x1="4"  y1="2" x2="2"   y2="14" stroke="#42A5F5" strokeWidth="1.8" strokeLinecap="round" className="animate-rain-3" />
                <line x1="10" y1="2" x2="8"   y2="14" stroke="#42A5F5" strokeWidth="1.8" strokeLinecap="round" className="animate-rain-4" />
              </svg>
              <span className="text-[10px] text-blue-500 font-medium">Rain</span>
            </div>
            {/* Wind */}
            <div className="flex flex-col items-center gap-1 animate-wl-3">
              <svg width="34" height="24" viewBox="-17 -12 34 24">
                <path d="M -14 -4 Q 0 -4 8 -4 Q 14 -4 14 -8 Q 14 -12 8 -12 Q 2 -12 2 -8" stroke="#78909C" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M -14 0 Q 4 0 12 0 Q 18 0 18 4 Q 18 8 12 8 Q 6 8 6 4" stroke="#B0BEC5" fill="none" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M -14 6 Q 0 6 6 6" stroke="#CFD8DC" fill="none" strokeWidth="1.4" strokeLinecap="round" className="animate-wind-leaf" />
              </svg>
              <span className="text-[10px] text-text-muted font-medium">Wind</span>
            </div>
            {/* Temp */}
            <div className="flex flex-col items-center gap-1 animate-wl-4">
              <svg width="20" height="34" viewBox="-10 -16 20 34">
                <rect x="-3.5" y="-14" width="7" height="22" rx="3.5" fill="#E0E0E0" />
                <rect x="-3.5" y="-14" width="7" height="22" rx="3.5" fill="#EF5350" clipPath="url(#tc)" />
                <clipPath id="tc"><rect x="-3.5" y="2" width="7" height="6" /></clipPath>
                <circle cx="0" cy="11" r="7" fill="#EF5350" />
                <line x1="4" y1="-6" x2="7" y2="-6" stroke="#EF5350" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="-1" x2="7" y2="-1" stroke="#EF5350" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-red-400 font-medium">Temp</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather */}
      <div className={`gradient-hero rounded-2xl p-6 text-white transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <p className="text-white/70 text-sm mb-2">Current Conditions — {location.label}</p>
            <div className="flex items-end gap-4 mb-3">
              <WeatherConditionIcon condition={location.condition} />
              <span className="text-7xl font-bold">{location.temp}°</span>
              <div>
                <p className="text-xl font-semibold">{location.condition}</p>
                <p className="text-white/70 text-sm">Feels like {location.feelsLike}°C</p>
              </div>
            </div>
            <p className="text-white/80 text-sm">🌾 Good conditions for irrigation. Avoid pesticide spraying — forecast rain in 2 days.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Droplets size={16} />, label: 'Humidity', value: `${location.humidity}%` },
              { icon: <Wind size={16} />, label: 'Wind Speed', value: `${location.wind} km/h` },
              { icon: <Thermometer size={16} />, label: 'Dew Point', value: `${Math.round(location.temp - 8)}°C` },
              { icon: <Cloud size={16} />, label: 'Cloud Cover', value: `${Math.round(location.humidity / 2)}%` },
              { icon: <Sunrise size={16} />, label: 'Sunrise', value: '05:42 AM' },
              { icon: <Sunset size={16} />, label: 'Sunset', value: '07:18 PM' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2 bg-surface/10 rounded-xl px-3 py-2 backdrop-blur border border-white/10">
                <span className="text-white/70">{m.icon}</span>
                <div>
                  <p className="text-[10px] text-white/60">{m.label}</p>
                  <p className="font-semibold text-sm">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Chart */}
      <Card className="p-5">
        <h3 className="font-bold text-text-primary mb-4">Today's Hourly Forecast</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FB8C00" stopOpacity={0.2} /><stop offset="95%" stopColor="#FB8C00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="temp" stroke="#FB8C00" strokeWidth={2.5} fill="url(#tempGrad)" name="Temp (°C)" />
            <Area type="monotone" dataKey="humidity" stroke="#1565C0" strokeWidth={2} fill="none" name="Humidity (%)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="p-5">
        <h3 className="font-bold text-text-primary mb-4">7-Day Forecast</h3>
        <div className="flex flex-col gap-3">
          {forecast.map(d => {
            const isExpanded = expandedDay === d.day;
            return (
              <div key={d.day} className={`overflow-hidden rounded-xl border transition-all duration-300 ease-in-out ${d.day === 'Today' ? 'border-green-100 bg-green-50/30 dark:bg-green-900/10' : 'border-border bg-surface'} ${isExpanded ? 'shadow-md ring-1 ring-border' : 'hover:bg-background'}`}>
                <button 
                  onClick={() => setExpandedDay(isExpanded ? null : d.day)}
                  className="w-full flex items-center justify-between p-3 md:p-4 text-left"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <span className="w-10 md:w-12 text-sm font-semibold text-text-primary">{d.day}</span>
                    <span className="text-2xl w-8 text-center">{d.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary">{d.high}° <span className="text-xs font-normal text-text-muted ml-1">/ {d.low}°</span></span>
                      <span className="text-xs text-text-muted hidden md:inline-block">{d.condition}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-xs font-medium text-blue-500 flex items-center gap-1"><Droplets size={12}/> {d.rain}</span>
                    <ChevronDown size={18} className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary-500' : ''}`} />
                  </div>
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-4 pt-0 border-t border-border/50 bg-background/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Feels Like</p>
                        <p className="text-sm font-semibold text-text-primary">{d.high + 1}°</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Humidity</p>
                        <p className="text-sm font-semibold text-text-primary">{d.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Wind</p>
                        <p className="text-sm font-semibold text-text-primary">{d.wind} km/h {d.dir}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">UV Index</p>
                        <p className="text-sm font-semibold text-text-primary">{d.uv}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] text-text-muted uppercase">Sunrise</p>
                        <p className="text-sm font-semibold text-text-primary">{d.sunrise}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] text-text-muted uppercase">Sunset</p>
                        <p className="text-sm font-semibold text-text-primary">{d.sunset}</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50/50 dark:bg-green-900/10 rounded-lg p-3 border border-green-100/50 dark:border-green-800/30">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1.5"><Leaf size={12} /> Agricultural Recommendation</p>
                      <p className="text-sm text-text-primary leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ---- Prediction History ----

export function PredictionHistory({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [predictionList, setPredictionList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [predictionDetails, setPredictionDetails] = useState<Record<number, any>>({})
  const [fetchingDetailId, setFetchingDetailId] = useState<number | null>(null)

  const fetchPredictionDetail = async (historyId: number) => {
    if (predictionDetails[historyId]) return
    setFetchingDetailId(historyId)
    try {
      const res = await api.get(`/history/${historyId}`)
      setPredictionDetails(prev => ({ ...prev, [historyId]: res.data }))
    } catch (err) {
      console.error(err)
    } finally {
      setFetchingDetailId(null)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/history')
      .then(res => {
        if (active) {
          const mapped = res.data.map((p: any) => ({
            id: `P0${p.history_id || p.id}`,
            historyId: p.history_id || p.id,
            type: p.soil_type ? 'Soil' : 'Crop',
            result: p.top_crop || p.soil_type || 'Unspecified',
            confidence: Math.round(p.soil_health_score) || 90,
            date: new Date(p.prediction_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            status: 'success'
          }))
          setPredictionList(mapped)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error(err)
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const tabs = ['All', 'Soil', 'Crop', 'Fertilizer', ...(FEATURES.DISEASE_DETECTION ? ['Disease'] : [])]
  const filtered = predictionList.filter(p =>
    (activeTab === 'All' || p.type === activeTab) &&
    (p.result.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Prediction History' }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">Prediction History</h2>
          <p className="text-sm text-text-muted">{predictionList.length} total predictions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" size="sm" icon={<Download size={13} />}>Export CSV</Button>
          <Button variant="primary" size="sm" icon={<Download size={13} />}>Download PDF</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all-smooth whitespace-nowrap ${activeTab === tab ? 'bg-surface shadow-soft text-green-700' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search predictions..."
          />
        </div>
        <Button variant="ghost" icon={<Filter size={14} />}>Filter</Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Result</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Confidence</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <React.Fragment key={p.id}>
                  <tr 
                    className="border-b border-border hover:bg-background transition-colors cursor-pointer"
                    onClick={() => {
                      const isExpanded = expandedRow === p.id
                      setExpandedRow(isExpanded ? null : p.id)
                      if (!isExpanded) {
                        fetchPredictionDetail(p.historyId)
                      }
                    }}
                  >
                    <td className="py-3 px-4 text-xs font-mono text-text-muted">{p.id}</td>
                    <td className="py-3 px-4">
                      <Badge color={p.type === 'Crop' ? 'green' : p.type === 'Soil' ? 'orange' : p.type === 'Disease' ? 'red' : 'blue'}>{p.type}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">{p.result}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-background rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${p.confidence}%` }} />
                        </div>
                        <span className="text-xs font-medium text-text-secondary">{p.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted">{p.date}</td>
                    <td className="py-3 px-4">
                      <Badge color={p.status === 'success' ? 'green' : 'orange'}>{p.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={(e) => {
                        e.stopPropagation()
                        const isExpanded = expandedRow === p.id
                        setExpandedRow(isExpanded ? null : p.id)
                        if (!isExpanded) {
                          fetchPredictionDetail(p.historyId)
                        }
                      }} className="text-text-muted hover:text-text-secondary transition-colors">
                        {expandedRow === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === p.id && (
                    <tr className="bg-surface-hover border-b border-border">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          {fetchingDetailId === p.historyId ? (
                            <div className="flex items-center gap-2 py-2">
                              <LineSpinner size={14} color="green" />
                              <span className="text-xs text-text-muted">Loading prediction details...</span>
                            </div>
                          ) : predictionDetails[p.historyId] ? (
                            (() => {
                              const details = predictionDetails[p.historyId]
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-text-secondary">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-text-primary text-xs uppercase tracking-wider">Input soil parameters</p>
                                    <p className="font-mono text-xs text-text-muted bg-background rounded-lg p-2.5">
                                      N: {details.nitrogen || 0} | P: {details.phosphorus || 0} | K: {details.potassium || 0} | pH: {details.ph || 0} | Temp: {details.temperature || 0}°C | Humidity: {details.humidity || 0}%
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-semibold text-text-primary text-xs uppercase tracking-wider">Soil health & recommendations</p>
                                    <div className="text-xs space-y-1 bg-background rounded-lg p-2.5">
                                      <p><span className="font-medium">Soil Health:</span> {details.soil_health || 'Unspecified'} (Score: {details.soil_health_score || 0})</p>
                                      <p><span className="font-medium">Soil Fertility Status:</span> {details.soil_fertility_status || 'Unspecified'}</p>
                                      {details.recommended_crops && <p><span className="font-medium">Recommended Crops:</span> {details.recommended_crops.map((c: any) => c.crop || c).join(', ')}</p>}
                                      {details.recommended_fertilizers && details.recommended_fertilizers.length > 0 && (
                                        <p><span className="font-medium">Recommended Fertilizers:</span> {details.recommended_fertilizers.join(', ')}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })()
                          ) : (
                            <div className="text-xs text-text-muted">No details available.</div>
                          )}
                          <div className="flex gap-3 mt-3">
                            <Button variant="outlined" size="sm" icon={<FileText size={12} />} onClick={() => alert('View Report functionality coming soon!')}>View Report</Button>
                            <Button variant="outlined" size="sm" icon={<Download size={12} />}>Download Report</Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-text-muted">
          <span>Showing {filtered.length} of {predictionList.length} predictions</span>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === 1 ? 'bg-green-600 text-white' : 'hover:bg-background'}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ---- Notifications ----
export const notifs = [
  { id: '1', title: 'Heavy Rainfall Alert', desc: 'Expected 45mm rainfall in Ludhiana in next 24 hours. Secure crops and delay irrigation.', time: '2 hours ago', type: 'weather', read: false },
  ...(FEATURES.DISEASE_DETECTION ? [{ id: '2', title: 'Disease Risk: Leaf Blight', desc: 'High humidity (85%+) for 3 consecutive days increases late blight risk in your area.', time: '5 hours ago', type: 'disease', read: false }] : []),
  { id: '3', title: 'Optimal Planting Window', desc: 'Next 3 days ideal for wheat sowing in Punjab. Temperature range 18–24°C with 40% humidity.', time: '1 day ago', type: 'crop', read: false },
  { id: '4', title: 'System Maintenance', desc: 'Scheduled maintenance on Jul 28, 2026 from 2:00–4:00 AM IST. Services may be unavailable.', time: '2 days ago', type: 'admin', read: true },
  { id: '5', title: 'AI Model Updated', desc: 'Crop recommendation model upgraded to v3.1 with improved accuracy (+2.1%) for rice varieties.', time: '3 days ago', type: 'system', read: true },
]

export function Notifications({ onNavigate, notificationsList: propsNotifs, onMarkRead, onMarkAllRead }: {
  onNavigate?: (page: string) => void
  notificationsList?: any[]
  onMarkRead?: (id: any) => void
  onMarkAllRead?: () => void
}) {
  const { t } = useTranslate()
  const [localReadIds, setLocalReadIds] = useState(() => new Set(notifs.filter(n => n.read).map(n => n.id)))
  const [filter, setFilter] = useState('All')
  const [toast, setToast] = useState(false)
  const [expandedId, setExpandedId] = useState<string | number | null>(null)

  const typeColors: Record<string, 'blue' | 'red' | 'green' | 'gray' | 'orange'> = { weather: 'blue', disease: 'red', crop: 'green', admin: 'gray', system: 'orange', community: 'blue' }
  const typeIcons: Record<string, string> = { weather: '⛈️', disease: '🐛', crop: '🌱', admin: '📢', system: '🤖', community: '💬' }

  const displayNotifs = propsNotifs ?? notifs
  const normalizedNotifs = displayNotifs.map(n => ({
    id: n.id,
    title: n.title,
    desc: n.message || n.desc,
    type: n.category || n.type,
    read: n.isRead !== undefined ? n.isRead : (n.read !== undefined ? n.read : false),
    time: n.timestamp || n.time
  }))

  const unreadCount = normalizedNotifs.filter(n => !n.read).length

  const visible = normalizedNotifs.filter(n =>
    filter === 'All' ||
    (filter === 'Unread' && !n.read) ||
    (filter === 'Read' && n.read)
  )

  const markRead = (id: string | number) => {
    if (onMarkRead) onMarkRead(id)
    else setLocalReadIds(s => new Set([...s, String(id)]))
  }

  const markAllRead = () => {
    if (onMarkAllRead) onMarkAllRead()
    else setLocalReadIds(new Set(normalizedNotifs.map(n => String(n.id))))
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const handleCardClick = (id: string | number) => {
    setExpandedId(prev => prev === id ? null : id)
    markRead(id)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 shadow-elevated animate-fade-in">
          <Check size={15} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium">{t('allNotificationsMarkedRead')}</span>
          <button onClick={() => setToast(false)} className="text-xs opacity-60 hover:opacity-100 ml-2">✕</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('notifications') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('notifications')}</h2>
          <p className="text-sm text-text-muted">
            {unreadCount > 0 ? <span className="font-semibold text-green-700">{t('unreadNotifications', { count: unreadCount })}</span> : t('allCaughtUp')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" icon={<Check size={13} />} onClick={markAllRead}>{t('markAllRead')}</Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['All', 'Unread', 'Read'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-green-600 text-white shadow-sm' : 'bg-surface text-text-muted border border-border hover:border-border'
            }`}
          >
            {t(f)}
            {f === 'Unread' && unreadCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === 'Unread' ? 'bg-surface/30 text-white' : 'bg-green-100 text-green-700'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification cards */}
      <div className="space-y-2">
        {visible.map((n, idx) => {
          const isUnread = !n.read
          const isExpanded = expandedId === n.id
          return (
            <div
              key={n.id}
              onClick={() => handleCardClick(n.id)}
              className={`rounded-2xl border transition-all duration-200 cursor-pointer select-none animate-notif-${Math.min(idx, 4)} ${
                isUnread
                  ? 'bg-surface border-border shadow-soft hover:shadow-card border-l-4 border-l-green-500'
                  : 'bg-background/60 border-border hover:bg-background'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`text-xl flex-shrink-0 mt-0.5 transition-opacity ${isUnread ? 'opacity-100' : 'opacity-50'}`}>
                  {typeIcons[n.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-text-primary' : 'font-medium text-text-muted'}`}>
                      {t(n.title)}
                    </p>
                    <Badge color={typeColors[n.type] || 'gray'}>{t(n.type) || n.type}</Badge>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                  </div>
                  <p className={`text-xs leading-relaxed transition-all ${
                    isExpanded ? 'line-clamp-none' : 'line-clamp-2'
                  } ${isUnread ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {t(n.desc)}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1.5">{n.time}</p>
                </div>
              </div>
            </div>
          )
        })}

        {visible.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mx-auto mb-3">
              <Bell size={24} className="text-text-muted" />
            </div>
            <p className="font-semibold text-text-muted">{t('noNotifications')}</p>
            <p className="text-sm text-text-muted mt-1">
              {filter === 'Unread' ? t('allCaughtUp') : filter === 'Read' ? (t('noReadNotifications') || 'No read notifications yet.') : (t('nothingHere') || 'Nothing here yet.')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Feedback ----
export function Feedback({ role, onNavigate }: { role?: string, onNavigate?: (page: string) => void }) {
  const { t } = useTranslate()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [category, setCategory] = useState('general')
  const [search, setSearch] = useState('')
  const [adminReplyState, setAdminReplyState] = useState<Record<string, boolean>>({})
  const [adminReplyText, setAdminReplyText] = useState<Record<string | number, string>>({})
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const [fbRes, usersRes, summaryRes] = await Promise.all([
        api.get('/feedback/'),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/feedback/summary').catch(() => ({ data: null }))
      ])
      const userMap = new Map(usersRes.data.map((u: any) => [u.id, u.username]))
      const mapped = fbRes.data.map((fb: any) => {
        const username = userMap.get(fb.user_id) || `Farmer #${fb.user_id}`
        return {
          id: `FB-${fb.id}`,
          rawId: fb.id,
          user: username,
          initials: username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          cropFocus: 'General',
          date: new Date(fb.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          category: 'General',
          rating: fb.rating,
          comment: fb.comment,
          adminResponse: fb.admin_response || '',
          isResolved: fb.is_resolved || false,
          helpfulCount: 0
        }
      })
      setFeedbackList(mapped)
      if (summaryRes?.data) {
        setSummary(summaryRes.data)
      }
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'admin') {
      fetchFeedback()
    }
  }, [role])

  const handleSubmitFeedback = async () => {
    if (rating === 0) return
    try {
      await api.post('/feedback/', {
        rating,
        comment
      })
      setSubmitted(true)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit feedback.')
    }
  }

  const handleMarkResolved = async (rawId: number) => {
    try {
      await api.put(`/feedback/${rawId}/resolve`)
      fetchFeedback()
    } catch (err) {
      console.error("Failed to resolve feedback:", err)
    }
  }

  const handleSendReply = async (rawId: number) => {
    const text = adminReplyText[rawId] || adminReplyText[`FB-${rawId}`]
    if (!text || !text.trim()) return
    try {
      await api.put(`/feedback/${rawId}/reply`, { admin_response: text })
      setAdminReplyText(prev => {
        const copy = { ...prev }
        delete copy[rawId]
        delete copy[`FB-${rawId}`]
        return copy
      })
      setAdminReplyState(prev => ({ ...prev, [rawId]: false, [`FB-${rawId}`]: false }))
      fetchFeedback()
    } catch (err) {
      console.error("Failed to send reply:", err)
    }
  }

  const handleDeleteReply = async (rawId: number) => {
    if (window.confirm(t('confirmDeleteResponse'))) {
      try {
        await api.delete(`/feedback/${rawId}/reply`)
        fetchFeedback()
      } catch (err) {
        console.error("Failed to delete reply:", err)
      }
    }
  }

  if (role === 'admin') {
    const filteredFeedback = feedbackList.filter(f => f.user.toLowerCase().includes(search.toLowerCase()) || f.comment.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()))

    const toggleReply = (id: string, rawId: number, currentText: string) => {
      if (!adminReplyText[rawId]) {
        setAdminReplyText(prev => ({ ...prev, [rawId]: currentText }))
      }
      setAdminReplyState(prev => ({ ...prev, [id]: !prev[id] }))
    }

    if (loading) {
      return (
        <div className="p-8 text-center text-text-muted text-sm flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-t-green-600 border-green-100 animate-spin" />
          <span>{t('loadingFeedback')}</span>
        </div>
      )
    }

    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('farmerFeedback') }]} onNavigate={onNavigate} />}
            <h2 className="text-2xl font-bold text-text-primary">{t('farmerFeedback')}</h2>
            <p className="text-sm text-text-muted">{t('farmerFeedbackDesc')}</p>
          </div>
        </div>

        {/* Overall Rating Summary */}
        <Card className="p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-surface to-background border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <h3 className="text-5xl font-bold text-text-primary mb-2">
                  {summary ? summary.average_rating.toFixed(1) : '4.8'}
                </h3>
                <div className="flex text-orange-400">
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} className="text-gray-300" />
                </div>
                <p className="text-xs font-semibold text-text-muted mt-2 uppercase tracking-wide">{t('averageRating')}</p>
              </div>
              <div className="w-px h-16 bg-border mx-2 hidden md:block"></div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary ? summary.total_reviews.toLocaleString() : '384'}
                  </p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-0.5">{t('totalReviews')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary ? summary.active_farmers.toLocaleString() : '12.5k'}
                  </p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-0.5">{t('activeFarmers')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary ? `${summary.response_rate}%` : '94%'}
                  </p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-0.5">{t('responseRate')}</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <SearchInput value={search} onChange={setSearch} placeholder={t('searchFeedback')} />
            </div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        </Card>

        {/* Feedback Cards List */}
        <div className="space-y-4">
          {filteredFeedback.map((fb) => (
            <Card key={fb.id} className="p-6 transition-all duration-300 hover:shadow-md hover:border-text-muted/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-lg flex-shrink-0">
                    {fb.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-base">{fb.user}</h4>
                    <p className="text-xs text-text-secondary mt-0.5"><span className="font-medium text-text-muted">{t('cropFocus')}:</span> {fb.cropFocus}</p>
                    <p className="text-[11px] text-text-muted mt-1">{fb.date}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex text-orange-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={16} fill={idx < fb.rating ? '#FB8C00' : 'none'} className={idx < fb.rating ? 'text-orange-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${fb.isResolved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {fb.isResolved ? t('resolved') : t('pending')}
                  </span>
                </div>
              </div>

              <div className="pl-16 space-y-4">
                <p className="text-sm text-text-primary leading-relaxed">"{fb.comment}"</p>
                
                {fb.helpfulCount > 0 && (
                  <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
                    <ThumbsUp size={12} className="text-blue-500" /> {fb.helpfulCount} farmers found this helpful
                  </p>
                )}

                {fb.adminResponse && (
                  <div className="mt-4 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-xl">
                    <p className="text-xs font-bold text-green-800 dark:text-green-400 mb-2 uppercase tracking-wide">{t('adminResponse')}</p>
                    <p className="text-sm text-text-primary whitespace-pre-line">{fb.adminResponse}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  {!fb.adminResponse && (
                    <Button variant="primary" size="sm" onClick={() => toggleReply(fb.id, fb.rawId, fb.adminResponse)}>{t('reply')}</Button>
                  )}
                  {fb.adminResponse && (
                    <>
                      <Button variant="outlined" size="sm" onClick={() => toggleReply(fb.id, fb.rawId, fb.adminResponse)}>{t('editResponse')}</Button>
                      <Button variant="outlined" size="sm" onClick={() => handleDeleteReply(fb.rawId)} className="!text-error !border-error/30 hover:!bg-error/10">{t('deleteResponse')}</Button>
                    </>
                  )}
                  {!fb.isResolved && (
                    <Button variant="outlined" size="sm" onClick={() => handleMarkResolved(fb.rawId)} icon={<CheckCircle2 size={14} />}>{t('markAsResolved')}</Button>
                  )}
                </div>

                {/* Collapsible Reply Box */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${adminReplyState[fb.id] ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-text-primary">{fb.adminResponse ? t('editResponse') : t('replyToFarmer')}</p>
                    <textarea 
                      className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-green-500 transition-colors resize-none" 
                      rows={3}
                      placeholder={t('typeResponseHere')}
                      value={adminReplyText[fb.rawId] || ''}
                      onChange={(e) => setAdminReplyText(prev => ({ ...prev, [fb.rawId]: e.target.value }))}
                    ></textarea>
                    <div className="flex justify-end gap-2">
                      <Button variant="outlined" size="sm" onClick={() => toggleReply(fb.id, fb.rawId, fb.adminResponse)}>{t('cancel')}</Button>
                      <Button variant="primary" size="sm" onClick={() => handleSendReply(fb.rawId)}>{fb.adminResponse ? t('saveChanges') : t('sendReply')}</Button>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          ))}
          {filteredFeedback.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted">{t('noFeedbackMatches')}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (submitted) return (
    <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-64 gap-4 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <Check size={36} className="text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-text-primary">Thank you for your feedback!</h3>
      <p className="text-sm text-text-muted text-center max-w-sm">Your response helps us improve AgroAI for farmers worldwide. We typically respond within 24 hours.</p>
      <Button variant="primary" onClick={() => { setSubmitted(false); setRating(0); setComment('') }}>Submit Another</Button>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Feedback' }]} onNavigate={onNavigate} />}
        <h2 className="text-2xl font-bold text-text-primary">Share Feedback</h2>
        <p className="text-sm text-text-muted">Help us improve AgroAI for farmers everywhere</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}

      <Card className="p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3">How would you rate AgroAI? *</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star size={32} fill={(hovered || rating) >= s ? '#FB8C00' : 'none'} className={(hovered || rating) >= s ? 'text-orange-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-text-muted mt-2">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}</p>
          )}
        </div>

        <SelectInput
          label="Feedback Category"
          options={[
            { value: 'general', label: 'General' }, 
            { value: 'crop', label: 'Crop Recommendation' }, 
            { value: 'soil', label: 'Soil Classification' }, 
            ...(FEATURES.DISEASE_DETECTION ? [{ value: 'disease', label: 'Disease Detection' }] : []), 
            { value: 'chatbot', label: 'AI Chatbot' }, 
            { value: 'weather', label: 'Weather' }, 
            { value: 'ux', label: 'UI/UX Design' }
          ]}
          value={category}
          onChange={e => setCategory(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Your Comments</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell us what you loved or what we can improve..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface text-text-primary placeholder-text-muted outline-none focus:border-text-muted transition-colors resize-none"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Attach Screenshot (Optional)</p>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-text-muted transition-colors cursor-pointer">
            <Camera size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-text-muted">Click to upload screenshot</p>
          </div>
        </div>

        <Button variant="primary" size="lg" onClick={handleSubmitFeedback} disabled={rating === 0} className="w-full justify-center">
          Submit Feedback
        </Button>
      </Card>

        {/* Right Column - Animated Illustration Panel */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-surface rounded-3xl border border-border p-8 relative overflow-hidden shadow-soft">
          {/* Animated decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-green-200/40 dark:bg-green-700/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-200/40 dark:bg-emerald-700/10 rounded-full blur-3xl -ml-20 -mb-20 animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
          
          <div className="relative z-10 w-full max-w-md mx-auto text-center space-y-6">
            {/* Main Icon */}
            <div className="w-20 h-20 bg-background rounded-2xl shadow-elevated flex items-center justify-center mx-auto mb-6 relative animate-float">
              <Leaf size={36} className="text-green-600" />
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-tr from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Star size={14} className="text-white" fill="white" />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-text-primary leading-tight">Your Feedback Helps <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">AgroAI</span> Grow</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Every suggestion, review, and experience shared by our farming community helps us improve AgroAI and build smarter agricultural solutions for everyone.
              </p>
            </div>

            {/* Animated Statistics */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.1s' }}>
                <div className="flex text-orange-400 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#FB8C00" />)}
                </div>
                <p className="text-3xl font-bold text-text-primary">4.9<span className="text-sm font-normal text-text-muted">/5</span></p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">Average Rating</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.2s' }}>
                <MessageSquare size={20} className="text-blue-500 mb-1" />
                <p className="text-3xl font-bold text-text-primary">12.5k+</p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">Feedback Received</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.3s' }}>
                <TrendingUp size={20} className="text-purple-500 mb-1" />
                <p className="text-3xl font-bold text-text-primary">1.2k+</p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">Feature Requests</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.4s' }}>
                <ThumbsUp size={20} className="text-green-500 mb-1" />
                <p className="text-3xl font-bold text-text-primary">98%</p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">Farmer Satisfaction</p>
              </div>
            </div>

            {/* Floating feature cards */}
            <div className="pt-6 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-10 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl rounded-full"></div>
              <div className="flex justify-center gap-3 animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                <span className="bg-background border border-border shadow-soft px-4 py-2 rounded-full text-xs font-semibold text-text-primary flex items-center gap-1.5 hover:bg-surface transition-colors cursor-default">
                  <CheckCircle2 size={14} className="text-green-500" /> Better Crop Recommendations
                </span>
              </div>
              <div className="flex justify-center gap-3 mt-3">
                <span className="bg-background border border-border shadow-soft px-4 py-2 rounded-full text-xs font-semibold text-text-primary flex items-center gap-1.5 animate-float hover:bg-surface transition-colors cursor-default" style={{ animationDelay: '2s', animationDuration: '5s' }}>
                  <Sparkles size={14} className="text-purple-500" /> Improved AI Accuracy
                </span>
                <span className="bg-background border border-border shadow-soft px-4 py-2 rounded-full text-xs font-semibold text-text-primary flex items-center gap-1.5 animate-float hover:bg-surface transition-colors cursor-default" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}>
                  <Cloud size={14} className="text-blue-500" /> Weather Enhancements
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Profile ----
export function Profile({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [languageId, setLanguageId] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/me')
      .then(res => {
        if (active) {
          setUser(res.data)
          setEmail(res.data.email)
          setLanguageId(res.data.language_id || 1)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error(err)
        if (active) {
          setError('Failed to fetch profile details.')
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.put('/me', {
        email: email,
        language_id: languageId
      })
      setUser(res.data)
      setEditing(false)
      setLoading(false)
    } catch (err: any) {
      setLoading(false)
      setError(err.response?.data?.detail || 'Failed to update profile.')
    }
  }

  const handleDeleteAccount = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  const languagesMap: Record<number, string> = {
    1: 'English',
    2: 'Telugu',
    3: 'Hindi',
    4: 'Tamil'
  }

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <LineSpinner size={24} color="green" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex items-center justify-between mb-2">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Profile' }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">My Profile</h2>
        </div>
        <Button variant={editing ? 'primary' : 'outlined'} size="sm" icon={<Edit3 size={13} />} onClick={() => { if (editing) handleSave(); else setEditing(true); }}>
          {editing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold">
              {user?.username?.slice(0, 2).toUpperCase() || 'US'}
            </div>
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <Input label="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                <SelectInput 
                  label="Preferred Language" 
                  value={String(languageId)} 
                  onChange={e => setLanguageId(parseInt(e.target.value))} 
                  options={[{label: 'English', value: '1'}, {label: 'Telugu', value: '2'}, {label: 'Hindi', value: '3'}, {label: 'Tamil', value: '4'}]}
                />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-text-primary">{user?.username || 'No Name'}</h3>
                <p className="text-sm text-text-muted mt-1">Role: {user?.role === 'admin' ? 'Administrator' : 'Farmer'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge color="green">{user?.role === 'admin' ? 'Admin' : 'Farmer'}</Badge>
                  <Badge color="blue">{user?.region || 'Not Specified'}</Badge>
                  <Badge color="gray">{languagesMap[user?.language_id || 1] || 'English'}</Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Completion */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Profile Completion</span>
            <span className="text-sm font-bold text-green-700">100%</span>
          </div>
          <ProgressBar value={100} color="#2E7D32" />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 border border-red-100">
        <h3 className="font-semibold text-red-700 mb-4">Danger Zone</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Delete Account</p>
            <p className="text-xs text-text-muted mt-0.5">Permanently remove your account and all data</p>
          </div>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
        </div>
      </Card>
    </div>

    {/* Right Column */}
    <div className="lg:col-span-7 space-y-6">
      {/* Personal Info */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Email', value: user?.email || 'N/A', icon: '📧' },
            { label: 'Role', value: user?.role === 'admin' ? 'Admin' : 'Farmer', icon: '🔑' },
            { label: 'Region', value: user?.region || 'Not Specified', icon: '📍' },
            { label: 'Language', value: languagesMap[user?.language_id || 1] || 'English', icon: '🗣️' },
            { label: 'Account Status', value: user?.status || 'Active', icon: '🛡️' },
            { label: 'Registered On', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A', icon: '📅' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 p-3 bg-background rounded-xl">
              <span className="text-lg">{f.icon}</span>
              <div>
                <p className="text-xs text-text-muted">{f.label}</p>
                <p className="font-medium text-text-primary">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity Summary */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Activity Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Predictions', value: '247', icon: '🤖' },
            { label: 'Days Active', value: '89', icon: '📅' },
            { label: 'Crops Saved', value: '14', icon: '🌾' },
            { label: 'Reports', value: '32', icon: '📄' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-background rounded-xl">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-surface rounded-xl border border-border shadow-elevated w-full max-w-sm p-6 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Delete Account?</h3>
            <p className="text-sm text-text-muted mb-6">This action cannot be undone. All your farm data, predictions, and settings will be permanently lost.</p>
            <div className="flex gap-3">
              <Button variant="outlined" className="flex-1 justify-center" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" className="flex-1 justify-center" onClick={handleDeleteAccount}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Settings ----
type ThemeMode = 'light' | 'dark' | 'system'

export function Settings({ themeMode = 'light', role, onSetTheme, onNavigate }: {
  themeMode?: ThemeMode
  role?: 'farmer' | 'admin'
  onSetTheme?: (t: ThemeMode) => void
  onNavigate?: (page: string) => void
}) {
  const { t } = useTranslate()
  const [lang, setLang] = useState('English')
  const [languages, setLanguages] = useState<any[]>([])
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSMS, setNotifSMS] = useState(false)
  const [notifPush, setNotifPush] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [apiKey, setApiKey] = useState('')
  const [geminiModel, setGeminiModel] = useState('Gemini 2.5 Flash')
  const [maxTokens, setMaxTokens] = useState(2048)
  const [temperature, setTemperature] = useState(0.7)
  const [systemPrompt, setSystemPrompt] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/languages')
      .then(res => {
        if (active) setLanguages(res.data)
      })
      .catch(err => {
        console.error(err)
      })

    api.get('/api/settings/config')
      .then(res => {
        if (active && res.data) {
          const { gemini, active_sessions } = res.data
          setActiveSessions(active_sessions || [])
          if (gemini) {
            setApiKey(gemini.api_key || '')
            setGeminiModel(gemini.default_model || 'Gemini 2.5 Flash')
            setMaxTokens(gemini.max_tokens || 2048)
            setTemperature(gemini.temperature || 0.7)
            setSystemPrompt(gemini.system_prompt || '')
          }
        }
      })
      .catch(err => {
        console.error(err)
      })

    return () => { active = false }
  }, [])
  
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingApi, setIsTestingApi] = useState(false)
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleTestApi = () => {
    setIsTestingApi(true)
    setTimeout(() => {
      setIsTestingApi(false)
      setApiTestStatus('success')
    }, 1500)
  }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-all-smooth ${on ? 'bg-green-500' : 'bg-background'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-surface shadow-soft transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('settings') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('settings')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
      {/* Appearance */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Sun size={16} /> {t('appearance')}</h3>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as ThemeMode[]).map(tName => (
            <button
              key={tName}
              onClick={() => onSetTheme?.(tName)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all capitalize ${themeMode === tName ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-text-muted hover:border-border'}`}
            >
              {tName === 'light' ? '☀️' : tName === 'dark' ? '🌙' : '💻'} {t(tName) || tName}
            </button>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Globe size={16} /> {t('language')}</h3>
        <SelectInput
          options={(languages.length > 0 ? languages.map(l => l.language_name) : ['English', 'Hindi', 'Arabic', 'Tamil', 'Telugu', 'Marathi', 'Punjabi', 'Bengali', 'Urdu', 'Kannada']).map(l => ({ value: l, label: l }))}
          value={lang}
          onChange={e => setLang(e.target.value)}
        />
      </Card>
      
      {/* Active Sessions */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Smartphone size={16} /> {t('activeSessions')}</h3>
        <div className="space-y-3">
          {(activeSessions.length > 0 ? activeSessions : [
            { device: 'Chrome on Windows', location: 'Ludhiana, IN', current: true },
            { device: 'AgroAI Mobile App', location: 'Punjab, IN', current: false },
          ]).map(s => (
            <div key={s.device} className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div>
                <p className="text-sm font-medium text-text-primary">{s.device}</p>
                <p className="text-xs text-text-muted">{s.location}</p>
              </div>
              {s.current ? <Badge color="green">{t('current')}</Badge> : <Button variant="ghost" size="sm">{t('revoke')}</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Right Column */}
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Bell size={16} /> {t('notifications')}</h3>
        <div className="space-y-4">
          {[
            { label: t('emailNotifications'), desc: t('emailNotificationsDesc'), on: notifEmail, toggle: () => setNotifEmail(!notifEmail) },
            { label: t('smsAlerts'), desc: t('smsAlertsDesc'), on: notifSMS, toggle: () => setNotifSMS(!notifSMS) },
            { label: t('pushNotifications'), desc: t('pushNotificationsDesc'), on: notifPush, toggle: () => setNotifPush(!notifPush) },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{n.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{n.desc}</p>
              </div>
              <Toggle on={n.on} onToggle={n.toggle} />
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Shield size={16} /> {t('security')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">{t('twoFactorAuth')}</p>
              <p className="text-xs text-text-muted">{t('twoFactorAuthDesc')}</p>
            </div>
            <Toggle on={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
          </div>
          <Button variant="outlined" size="sm" icon={<Lock size={13} />} className="w-full justify-center">{t('changePassword')}</Button>
        </div>
      </Card>
      {role === 'admin' && (
        <Card className="p-5 border-l-4 border-l-purple-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2 relative z-10"><Bot size={18} className="text-purple-600"/> {t('geminiAiConfig')}</h3>
          
          <div className="space-y-5 relative z-10">
            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">{t('apiKey')}</label>
              <div className="relative">
                <input 
                  type={showApiKey ? 'text' : 'password'} 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono"
                />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-600 transition-colors">
                  {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1"><Lock size={10}/> Encrypted at rest</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectInput label={t('defaultModel')} options={['Gemini 2.5 Flash', 'Gemini 2.5 Pro', 'Gemini 1.5 Pro'].map(o => ({label: o, value: o}))} value={geminiModel} onChange={e => setGeminiModel(e.target.value)} />
              <Input label={t('maxTokens')} type="number" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 2048)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>{t('temperature')}</span>
                <span className="text-purple-600 font-mono">{temperature}</span>
              </label>
              <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value) || 0.7)} className="w-full accent-purple-600" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>{t('precise') || 'Precise'} (0.0)</span>
                <span>{t('creative') || 'Creative'} (2.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">{t('systemPrompt')}</label>
              <textarea 
                className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all min-h-[80px] font-mono resize-y"
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-text-primary mb-3">{t('enabledLanguages')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(languages.length > 0 ? languages.map(l => l.language_name) : ['English', 'Hindi', 'Arabic', 'Tamil', 'Telugu', 'Marathi']).map(langName => (
                  <label key={langName} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-purple-600 rounded" />
                    {langName}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
              <Button variant="outlined" className="w-full sm:w-auto justify-center" onClick={handleTestApi} disabled={isTestingApi}>
                {isTestingApi ? <><LineSpinner size={14} color="gray"/> {t('testing')}</> : <><Sparkles size={14}/> {t('testConnection')}</>}
              </Button>
              {apiTestStatus === 'success' && <span className="text-xs font-medium text-green-600 flex items-center gap-1"><Check size={14}/> {t('connectionSuccessful')}</span>}
            </div>
            
            {/* Status Panel */}
            <div className="bg-background rounded-xl p-4 border border-border mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-[10px] text-text-muted uppercase">{t('status')}</p><p className="text-xs font-bold text-green-600">{t('active')}</p></div>
              <div><p className="text-[10px] text-text-muted uppercase">{t('model')}</p><p className="text-xs font-bold text-text-primary truncate">{geminiModel}</p></div>
              <div><p className="text-[10px] text-text-muted uppercase">{t('latency')}</p><p className="text-xs font-bold text-text-primary">~120ms</p></div>
              <div><p className="text-[10px] text-text-muted uppercase">{t('apiCall') || 'API Call'}</p><p className="text-xs font-bold text-text-primary">{t('successStatus') || 'Success'}</p></div>
            </div>
          </div>
        </Card>
      )}
    </div>
  </div>

  <div className="pt-4 border-t border-border flex justify-end">
    <Button variant="primary" className="w-full sm:w-auto justify-center">{t('saveAllSettings') || 'Save All Settings'}</Button>
  </div>
</div>
  )
}
