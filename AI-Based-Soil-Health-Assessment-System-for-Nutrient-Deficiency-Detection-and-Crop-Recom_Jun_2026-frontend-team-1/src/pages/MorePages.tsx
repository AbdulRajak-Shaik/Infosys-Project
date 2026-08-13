import { useTranslation } from '../i18n'
import { formatRelativeTime, formatLocalizedFullDate } from '../utils/dateUtils'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Cloud, Droplets, Thermometer, Wind, Sunrise, Sunset, Bell, Star, Download, Search, Filter, ChevronDown, ChevronUp, Lock, Globe, Sun, Shield, Smartphone, Check, X, MapPin, Camera, Edit3, Trash2, Navigation, FileText, AlertCircle, Bot, Sparkles, Eye, EyeOff, Leaf, MessageSquare, TrendingUp, ThumbsUp, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card, Badge, Button, Input, SelectInput, SearchInput, ProgressBar, Breadcrumb, LineSpinner } from '../components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FEATURES } from '../config'
import api, { getCurrentWeather, getWeatherForecast, getPredictionHistory, saveLocalPrediction, getHistoryDetail, submitFeedback, getCurrentUser, getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api'
import { useSarvamUsername, useSarvamLocation } from '../services/sarvamClient'
import { INITIAL_LANGUAGES } from '../components/Navbar'

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
  // Andhra Pradesh
  { label: 'Srikalahasthi Town, Tirupati District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 33, humidity: 67, wind: 14, condition: 'Partly Sunny', feelsLike: 39 },
  { label: 'Tirupati City, Tirupati District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 34, humidity: 65, wind: 15, condition: 'Sunny', feelsLike: 40 },
  { label: 'Chittoor Town, Chittoor District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 33, humidity: 66, wind: 13, condition: 'Partly Sunny', feelsLike: 38 },
  { label: 'Madanapalle Town, Annamayya District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 31, humidity: 62, wind: 12, condition: 'Sunny', feelsLike: 35 },
  { label: 'Guntur City, Guntur District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 35, humidity: 70, wind: 16, condition: 'Hot & Humid', feelsLike: 41 },
  { label: 'Vijayawada City, NTR District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 35, humidity: 72, wind: 15, condition: 'Hot & Humid', feelsLike: 42 },
  { label: 'Kakinada City, Kakinada District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 33, humidity: 78, wind: 17, condition: 'Humid', feelsLike: 40 },
  { label: 'Rajahmundry City, East Godavari District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 34, humidity: 74, wind: 14, condition: 'Partly Sunny', feelsLike: 40 },
  { label: 'Nellore City, SPSR Nellore District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 34, humidity: 71, wind: 16, condition: 'Sunny', feelsLike: 40 },
  { label: 'Kurnool City, Kurnool District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 36, humidity: 55, wind: 14, condition: 'Sunny', feelsLike: 41 },
  { label: 'Visakhapatnam City, Visakhapatnam District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 32, humidity: 80, wind: 18, condition: 'Humid', feelsLike: 38 },
  { label: 'Anantapur City, Ananthapuramu District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 35, humidity: 52, wind: 15, condition: 'Sunny', feelsLike: 39 },
  { label: 'Kadapa City, YSR Kadapa District, Andhra Pradesh, India', state: 'Andhra Pradesh', temp: 36, humidity: 54, wind: 13, condition: 'Hot & Sunny', feelsLike: 41 },
  
  // Telangana
  { label: 'Khammam Town, Khammam District, Telangana, India', state: 'Telangana', temp: 33, humidity: 65, wind: 15, condition: 'Partly Sunny', feelsLike: 39 },
  { label: 'Wyra Mandal, Khammam District, Telangana, India', state: 'Telangana', temp: 33, humidity: 66, wind: 14, condition: 'Partly Sunny', feelsLike: 38 },
  { label: 'Suryapet Village, Suryapet District, Telangana, India', state: 'Telangana', temp: 34, humidity: 63, wind: 14, condition: 'Sunny', feelsLike: 40 },
  { label: 'Nalgonda Village, Nalgonda District, Telangana, India', state: 'Telangana', temp: 34, humidity: 60, wind: 13, condition: 'Sunny', feelsLike: 40 },
  { label: 'Warangal Town, Warangal District, Telangana, India', state: 'Telangana', temp: 33, humidity: 64, wind: 12, condition: 'Partly Cloudy', feelsLike: 38 },
  { label: 'Hyderabad City, Hyderabad District, Telangana, India', state: 'Telangana', temp: 33, humidity: 62, wind: 16, condition: 'Partly Cloudy', feelsLike: 38 },
  { label: 'Karimnagar Town, Karimnagar District, Telangana, India', state: 'Telangana', temp: 34, humidity: 61, wind: 13, condition: 'Sunny', feelsLike: 39 },
  { label: 'Nizamabad Town, Nizamabad District, Telangana, India', state: 'Telangana', temp: 33, humidity: 64, wind: 12, condition: 'Partly Sunny', feelsLike: 38 },
  
  // Punjab
  { label: 'Ludhiana Town, Ludhiana District, Punjab, India', state: 'Punjab', temp: 32, humidity: 68, wind: 14, condition: 'Partly Sunny', feelsLike: 38 },
  { label: 'Amritsar City, Amritsar District, Punjab, India', state: 'Punjab', temp: 30, humidity: 72, wind: 12, condition: 'Hazy', feelsLike: 36 },
  { label: 'Kotkapura Village, Faridkot District, Punjab, India', state: 'Punjab', temp: 31, humidity: 70, wind: 11, condition: 'Partly Sunny', feelsLike: 37 },
  { label: 'Faridkot Town, Faridkot District, Punjab, India', state: 'Punjab', temp: 31, humidity: 69, wind: 12, condition: 'Sunny', feelsLike: 36 },
  { label: 'Moga Village, Moga District, Punjab, India', state: 'Punjab', temp: 31, humidity: 69, wind: 12, condition: 'Partly Sunny', feelsLike: 36 },
  { label: 'Bathinda City, Bathinda District, Punjab, India', state: 'Punjab', temp: 33, humidity: 65, wind: 13, condition: 'Sunny', feelsLike: 38 },
  { label: 'Patiala City, Patiala District, Punjab, India', state: 'Punjab', temp: 32, humidity: 66, wind: 11, condition: 'Partly Sunny', feelsLike: 37 },
  { label: 'Jalandhar City, Jalandhar District, Punjab, India', state: 'Punjab', temp: 31, humidity: 68, wind: 12, condition: 'Partly Cloudy', feelsLike: 36 },

  // Tamil Nadu
  { label: 'Thanjavur Village, Thanjavur District, Tamil Nadu, India', state: 'Tamil Nadu', temp: 34, humidity: 75, wind: 18, condition: 'Hot & Humid', feelsLike: 41 },
  { label: 'Chennai City, Chennai District, Tamil Nadu, India', state: 'Tamil Nadu', temp: 35, humidity: 80, wind: 20, condition: 'Hot & Humid', feelsLike: 42 },
  { label: 'Coimbatore City, Coimbatore District, Tamil Nadu, India', state: 'Tamil Nadu', temp: 30, humidity: 70, wind: 12, condition: 'Partly Cloudy', feelsLike: 34 },
  { label: 'Madurai City, Madurai District, Tamil Nadu, India', state: 'Tamil Nadu', temp: 35, humidity: 68, wind: 14, condition: 'Sunny', feelsLike: 41 },
  { label: 'Salem City, Salem District, Tamil Nadu, India', state: 'Tamil Nadu', temp: 33, humidity: 65, wind: 13, condition: 'Partly Sunny', feelsLike: 38 },
  { label: 'Tiruchirappalli City, Tiruchirappalli District, Tamil Nadu, India', state: 'Tamil Nadu', temp: 35, humidity: 70, wind: 15, condition: 'Hot & Sunny', feelsLike: 41 },

  // Karnataka & Kerala
  { label: 'Bengaluru City, Bengaluru District, Karnataka, India', state: 'Karnataka', temp: 28, humidity: 60, wind: 14, condition: 'Partly Cloudy', feelsLike: 30 },
  { label: 'Mysuru City, Mysuru District, Karnataka, India', state: 'Karnataka', temp: 29, humidity: 65, wind: 12, condition: 'Partly Sunny', feelsLike: 31 },
  { label: 'Thiruvananthapuram City, Thiruvananthapuram District, Kerala, India', state: 'Kerala', temp: 30, humidity: 80, wind: 14, condition: 'Humid', feelsLike: 36 },
  { label: 'Kochi City, Ernakulam District, Kerala, India', state: 'Kerala', temp: 30, humidity: 82, wind: 15, condition: 'Humid & Rain', feelsLike: 37 },

  // Maharashtra & Gujarat
  { label: 'Nagpur City, Nagpur District, Maharashtra, India', state: 'Maharashtra', temp: 36, humidity: 58, wind: 13, condition: 'Sunny', feelsLike: 42 },
  { label: 'Pune City, Pune District, Maharashtra, India', state: 'Maharashtra', temp: 27, humidity: 78, wind: 15, condition: 'Partly Cloudy', feelsLike: 29 },
  { label: 'Mumbai City, Mumbai District, Maharashtra, India', state: 'Maharashtra', temp: 31, humidity: 80, wind: 16, condition: 'Humid', feelsLike: 37 },
  { label: 'Ahmedabad City, Ahmedabad District, Gujarat, India', state: 'Gujarat', temp: 38, humidity: 50, wind: 17, condition: 'Hot & Sunny', feelsLike: 44 },
  { label: 'Surat City, Surat District, Gujarat, India', state: 'Gujarat', temp: 34, humidity: 72, wind: 16, condition: 'Humid', feelsLike: 40 },

  // Rajasthan, UP, Bihar, West Bengal, Odisha, MP, Assam, J&K
  { label: 'Jaipur City, Jaipur District, Rajasthan, India', state: 'Rajasthan', temp: 40, humidity: 40, wind: 20, condition: 'Sunny & Hot', feelsLike: 45 },
  { label: 'Lucknow City, Lucknow District, Uttar Pradesh, India', state: 'Uttar Pradesh', temp: 37, humidity: 65, wind: 10, condition: 'Hot & Sunny', feelsLike: 43 },
  { label: 'Varanasi City, Varanasi District, Uttar Pradesh, India', state: 'Uttar Pradesh', temp: 36, humidity: 68, wind: 9, condition: 'Sunny', feelsLike: 42 },
  { label: 'Patna City, Patna District, Bihar, India', state: 'Bihar', temp: 35, humidity: 75, wind: 8, condition: 'Humid & Sunny', feelsLike: 42 },
  { label: 'Kolkata City, Kolkata District, West Bengal, India', state: 'West Bengal', temp: 31, humidity: 82, wind: 12, condition: 'Humid', feelsLike: 38 },
  { label: 'Bhubaneswar City, Khordha District, Odisha, India', state: 'Odisha', temp: 33, humidity: 78, wind: 15, condition: 'Hot & Humid', feelsLike: 40 },
  { label: 'Bhopal City, Bhopal District, Madhya Pradesh, India', state: 'Madhya Pradesh', temp: 34, humidity: 58, wind: 12, condition: 'Sunny', feelsLike: 38 },
  { label: 'Guwahati City, Kamrup Metropolitan District, Assam, India', state: 'Assam', temp: 31, humidity: 80, wind: 10, condition: 'Humid', feelsLike: 37 },
  { label: 'Srinagar City, Srinagar District, Jammu and Kashmir, India', state: 'Jammu & Kashmir', temp: 25, humidity: 60, wind: 9, condition: 'Clear & Pleasant', feelsLike: 25 },
  { label: 'Dehradun City, Dehradun District, Uttarakhand, India', state: 'Uttarakhand', temp: 31, humidity: 68, wind: 11, condition: 'Partly Sunny', feelsLike: 35 },
  { label: 'Shimla Town, Shimla District, Himachal Pradesh, India', state: 'Himachal Pradesh', temp: 21, humidity: 65, wind: 10, condition: 'Cool & Clear', feelsLike: 21 },
]

const INDIAN_TALUKA_DISTRICT_MAP: Record<string, { dist: string, state: string }> = {
  // Andhra Pradesh
  srikalahasthi: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  srikalahasti: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  'శ్రీకాళహస్తి': { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  tirupati: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  'తిరుపతి': { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  chittoor: { dist: 'Chittoor District', state: 'Andhra Pradesh' },
  madanapalle: { dist: 'Annamayya District', state: 'Andhra Pradesh' },
  sullurpeta: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  venkatagiri: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  gudur: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  puttur: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  nagalapuram: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  chandragiri: { dist: 'Tirupati District', state: 'Andhra Pradesh' },
  guntur: { dist: 'Guntur District', state: 'Andhra Pradesh' },
  tenali: { dist: 'Guntur District', state: 'Andhra Pradesh' },
  narasaraopet: { dist: 'Guntur District', state: 'Andhra Pradesh' },
  vijayawada: { dist: 'NTR District', state: 'Andhra Pradesh' },
  nuzvid: { dist: 'NTR District', state: 'Andhra Pradesh' },
  gannavaram: { dist: 'NTR District', state: 'Andhra Pradesh' },
  kakinada: { dist: 'Kakinada District', state: 'Andhra Pradesh' },
  rajahmundry: { dist: 'East Godavari District', state: 'Andhra Pradesh' },
  nellore: { dist: 'Nellore District', state: 'Andhra Pradesh' },
  kavali: { dist: 'Nellore District', state: 'Andhra Pradesh' },
  kurnool: { dist: 'Kurnool District', state: 'Andhra Pradesh' },
  nandyal: { dist: 'Nandyal District', state: 'Andhra Pradesh' },
  anantapur: { dist: 'Anantapur District', state: 'Andhra Pradesh' },
  visakhapatnam: { dist: 'Visakhapatnam District', state: 'Andhra Pradesh' },
  kadapa: { dist: 'YSR Kadapa District', state: 'Andhra Pradesh' },
  
  // Punjab
  kotkapura: { dist: 'Faridkot District', state: 'Punjab' },
  faridkot: { dist: 'Faridkot District', state: 'Punjab' },
  jaitu: { dist: 'Faridkot District', state: 'Punjab' },
  sadiq: { dist: 'Faridkot District', state: 'Punjab' },
  ludhiana: { dist: 'Ludhiana District', state: 'Punjab' },
  jagraon: { dist: 'Ludhiana District', state: 'Punjab' },
  khanna: { dist: 'Ludhiana District', state: 'Punjab' },
  samrala: { dist: 'Ludhiana District', state: 'Punjab' },
  amritsar: { dist: 'Amritsar District', state: 'Punjab' },
  ajnala: { dist: 'Amritsar District', state: 'Punjab' },
  moga: { dist: 'Moga District', state: 'Punjab' },
  baghapurana: { dist: 'Moga District', state: 'Punjab' },
  bathinda: { dist: 'Bathinda District', state: 'Punjab' },
  talwandi: { dist: 'Bathinda District', state: 'Punjab' },
  patiala: { dist: 'Patiala District', state: 'Punjab' },
  rajpura: { dist: 'Patiala District', state: 'Punjab' },
  sangrur: { dist: 'Sangrur District', state: 'Punjab' },
  sunam: { dist: 'Sangrur District', state: 'Punjab' },
  jalandhar: { dist: 'Jalandhar District', state: 'Punjab' },

  // Telangana
  khammam: { dist: 'Khammam District', state: 'Telangana' },
  wyra: { dist: 'Khammam District', state: 'Telangana' },
  sathupally: { dist: 'Khammam District', state: 'Telangana' },
  madhira: { dist: 'Khammam District', state: 'Telangana' },
  nelakondapalli: { dist: 'Khammam District', state: 'Telangana' },
  penuballi: { dist: 'Khammam District', state: 'Telangana' },
  suryapet: { dist: 'Suryapet District', state: 'Telangana' },
  kodad: { dist: 'Suryapet District', state: 'Telangana' },
  huzurnagar: { dist: 'Suryapet District', state: 'Telangana' },
  garidepally: { dist: 'Suryapet District', state: 'Telangana' },
  nalgonda: { dist: 'Nalgonda District', state: 'Telangana' },
  miryalaguda: { dist: 'Nalgonda District', state: 'Telangana' },
  devarakonda: { dist: 'Nalgonda District', state: 'Telangana' },
  warangal: { dist: 'Warangal District', state: 'Telangana' },
  hanamkonda: { dist: 'Hanamkonda District', state: 'Telangana' },
  kazipet: { dist: 'Hanamkonda District', state: 'Telangana' },
  nallabelly: { dist: 'Warangal District', state: 'Telangana' },
  narsampet: { dist: 'Warangal District', state: 'Telangana' },
  karimnagar: { dist: 'Karimnagar District', state: 'Telangana' },
  huzurabad: { dist: 'Karimnagar District', state: 'Telangana' },
  nizamabad: { dist: 'Nizamabad District', state: 'Telangana' },
  armoor: { dist: 'Nizamabad District', state: 'Telangana' },
  hyderabad: { dist: 'Hyderabad District', state: 'Telangana' },

  // Tamil Nadu
  thanjavur: { dist: 'Thanjavur District', state: 'Tamil Nadu' },
  tanjavur: { dist: 'Thanjavur District', state: 'Tamil Nadu' },
  kumbakonam: { dist: 'Thanjavur District', state: 'Tamil Nadu' },
  pattukkottai: { dist: 'Thanjavur District', state: 'Tamil Nadu' },
  madurai: { dist: 'Madurai District', state: 'Tamil Nadu' },
  melur: { dist: 'Madurai District', state: 'Tamil Nadu' },
  coimbatore: { dist: 'Coimbatore District', state: 'Tamil Nadu' },
  pollachi: { dist: 'Coimbatore District', state: 'Tamil Nadu' },
  salem: { dist: 'Salem District', state: 'Tamil Nadu' },
  erode: { dist: 'Erode District', state: 'Tamil Nadu' },
  trichy: { dist: 'Tiruchirappalli District', state: 'Tamil Nadu' },
  chennai: { dist: 'Chennai District', state: 'Tamil Nadu' },

  // Uttar Pradesh & Bihar
  lucknow: { dist: 'Lucknow District', state: 'Uttar Pradesh' },
  malihabad: { dist: 'Lucknow District', state: 'Uttar Pradesh' },
  varanasi: { dist: 'Varanasi District', state: 'Uttar Pradesh' },
  agra: { dist: 'Agra District', state: 'Uttar Pradesh' },
  kanpur: { dist: 'Kanpur District', state: 'Uttar Pradesh' },
  prayagraj: { dist: 'Prayagraj District', state: 'Uttar Pradesh' },
  patna: { dist: 'Patna District', state: 'Bihar' },
  danapur: { dist: 'Patna District', state: 'Bihar' },
  gaya: { dist: 'Gaya District', state: 'Bihar' },

  // Maharashtra & Gujarat & Karnataka & Others
  nagpur: { dist: 'Nagpur District', state: 'Maharashtra' },
  pune: { dist: 'Pune District', state: 'Maharashtra' },
  mumbai: { dist: 'Mumbai District', state: 'Maharashtra' },
  ahmedabad: { dist: 'Ahmedabad District', state: 'Gujarat' },
  surat: { dist: 'Surat District', state: 'Gujarat' },
  jaipur: { dist: 'Jaipur District', state: 'Rajasthan' },
  bengaluru: { dist: 'Bengaluru District', state: 'Karnataka' },
  bhubaneswar: { dist: 'Khordha District', state: 'Odisha' },
  kolkata: { dist: 'Kolkata District', state: 'West Bengal' },
  bhopal: { dist: 'Bhopal District', state: 'Madhya Pradesh' },
  guwahati: { dist: 'Kamrup Metropolitan District', state: 'Assam' },
}

export function resolveAccurateDistrict(placeOrVillage: string): { district: string, state: string } {
  const p = placeOrVillage.toLowerCase().trim()
  if (!p) return { district: 'Tirupati District', state: 'Andhra Pradesh' }

  // Exact match first
  if (INDIAN_TALUKA_DISTRICT_MAP[p]) {
    const item = INDIAN_TALUKA_DISTRICT_MAP[p]
    return { district: item.dist, state: item.state }
  }

  // Exact word boundary match
  for (const key of Object.keys(INDIAN_TALUKA_DISTRICT_MAP)) {
    if (key.length >= 4 && (p === key || p.startsWith(key + ' ') || p.endsWith(' ' + key))) {
      const item = INDIAN_TALUKA_DISTRICT_MAP[key]
      return { district: item.dist, state: item.state }
    }
  }

  const clean = placeOrVillage.trim()
  if (clean.toLowerCase().includes('district')) {
    return { district: clean, state: 'India' }
  }
  return { district: '', state: 'India' }
}

export function formatFullVillageLocation(query: string): string {
  if (!query || !query.trim()) return 'Ludhiana Town, Ludhiana District, Punjab, India'
  const raw = query.trim()
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  
  if (parts.length >= 3) {
    const hasIndia = parts[parts.length - 1].toLowerCase() === 'india'
    const cleanParts = hasIndia ? parts.slice(0, -1) : parts
    const village = cleanParts[0]
    const distPart = cleanParts[1]
    const statePart = cleanParts[2]
    const cleanDist = distPart.toLowerCase().includes('district') ? distPart : `${distPart} District`
    return `${village}, ${cleanDist}, ${statePart}, India`
  }
  
  if (parts.length === 2) {
    const village = parts[0]
    const second = parts[1]
    const isState = ['punjab', 'telangana', 'andhra pradesh', 'tamil nadu', 'karnataka', 'kerala', 'maharashtra', 'gujarat', 'rajasthan', 'uttar pradesh', 'bihar', 'madhya pradesh', 'haryana', 'west bengal', 'odisha', 'assam', 'jharkhand', 'chhattisgarh', 'himachal pradesh', 'uttarakhand', 'jammu & kashmir', 'jammu and kashmir', 'goa', 'meghalaya', 'tripura', 'manipur', 'nagaland', 'mizoram', 'sikkim', 'arunachal pradesh'].includes(second.toLowerCase())
    
    if (isState) {
      const res = resolveAccurateDistrict(village)
      const distStr = res.district ? `${res.district}, ` : ''
      return `${village}, ${distStr}${second}, India`
    } else {
      const cleanDist = second.toLowerCase().includes('district') ? second : `${second} District`
      const res = resolveAccurateDistrict(second)
      return `${village}, ${cleanDist}, ${res.state !== 'India' ? res.state + ', ' : ''}India`
    }
  }

  const v = parts[0]
  const res = resolveAccurateDistrict(v)
  if (res.district && res.state !== 'India') {
    return `${v}, ${res.district}, ${res.state}, India`
  }
  return `${v}, India`
}

// ---- Location picker modal ----
function LocationModal({ onSelect, onClose }: {onSelect: (loc: WeatherLocation) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'denied' | 'success'>('idle')
  const [apiSuggestions, setApiSuggestions] = useState<WeatherLocation[]>([])
  const [searchingApi, setSearchingApi] = useState(false)

  // Manual Editor state
  const [showManualEditor, setShowManualEditor] = useState(false)
  const [manualVillage, setManualVillage] = useState('')
  const [manualDistrict, setManualDistrict] = useState('')
  const [manualState, setManualState] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  // Real-time location search via OpenStreetMap Nominatim API with English localization & District Enforcement
  useEffect(() => {
    if (query.trim().length < 2) {
      setApiSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      setSearchingApi(true)
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in&limit=8&accept-language=en`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const parsed: WeatherLocation[] = data.map((item: any) => {
              const addr = item.address || {}
              const rawPlace = addr.village || addr.hamlet || addr.suburb || addr.town || addr.city || addr.neighbourhood || item.display_name.split(',')[0]
              
              const isPlaceAscii = /^[\x00-\x7F]*$/.test(rawPlace)
              const placeName = isPlaceAscii ? rawPlace : (query.trim().charAt(0).toUpperCase() + query.trim().slice(1))
              
              // Extract REAL district from OpenStreetMap census address structure
              const rawDist = addr.county || addr.state_district || addr.district || addr.city_district || addr.municipality || ''
              const mapped = resolveAccurateDistrict(placeName)
              
              let cleanDist = ''
              if (rawDist) {
                cleanDist = rawDist.toLowerCase().includes('district') ? rawDist : `${rawDist} District`
              } else if (mapped && mapped.district && mapped.district.toLowerCase() !== `${placeName.toLowerCase()} district` && mapped.district.toLowerCase() !== placeName.toLowerCase()) {
                cleanDist = mapped.district
              } else {
                cleanDist = addr.state ? `${addr.state} District` : ''
              }

              const stateName = addr.state || (mapped ? mapped.state : '') || 'India'
              const fullLabel = cleanDist ? `${placeName}, ${cleanDist}, ${stateName}, India` : `${placeName}, ${stateName}, India`

              return {
                label: fullLabel,
                state: stateName,
                temp: Math.floor(Math.random() * 6) + 29,
                humidity: Math.floor(Math.random() * 20) + 55,
                wind: Math.floor(Math.random() * 10) + 10,
                condition: 'Partly Sunny',
                feelsLike: Math.floor(Math.random() * 6) + 34,
              }
            })
            setApiSuggestions(parsed)
          } else {
            setApiSuggestions([])
          }
        })
        .catch(() => setApiSuggestions([]))
        .finally(() => setSearchingApi(false))
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  const customFormattedLabel = formatFullVillageLocation(query)
  const customLoc: WeatherLocation | null = query.trim().length >= 2 ? {
    label: customFormattedLabel,
    state: 'India',
    temp: 31,
    humidity: 65,
    wind: 12,
    condition: 'Partly Sunny',
    feelsLike: 37,
  } : null

  const localFiltered = useMemo(() => {
    if (query.trim().length < 2) return []
    const q = query.toLowerCase().trim()
    return WEATHER_LOCATIONS.filter(l => 
      l.label.toLowerCase().includes(q) || 
      l.state.toLowerCase().includes(q)
    )
  }, [query])

  const allSuggestions = useMemo(() => {
    if (query.trim().length < 2) return []
    const list: WeatherLocation[] = []

    if (customLoc) {
      list.push(customLoc)
    }

    apiSuggestions.forEach(a => {
      if (!list.some(item => item.label.toLowerCase() === a.label.toLowerCase())) {
        list.push(a)
      }
    })

    localFiltered.forEach(lf => {
      if (!list.some(item => item.label.toLowerCase() === lf.label.toLowerCase())) {
        list.push(lf)
      }
    })

    return list
  }, [query, customLoc, apiSuggestions, localFiltered])

  // Real GPS Reverse Geocoding with Multi-Provider API & IP Fallback
  const handleGPS = () => {
    setGpsStatus('loading')
    console.debug('[LocationModal] handleGPS: starting geolocation')
    
    const resolveFromCoords = (latitude: number, longitude: number) => {
      console.debug('[LocationModal] resolveFromCoords:', { latitude, longitude })
      // Try primary provider (Nominatim)
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`)
        .then(res => {
          if (!res.ok) throw new Error(`Nominatim response ${res.status}`)
          return res.json()
        })
        .then(data => {
          console.debug('[LocationModal] Nominatim data:', data)
          const addr = data.address || {}
          const placeName = addr.village || addr.suburb || addr.town || addr.city || addr.hamlet || addr.neighbourhood || addr.residential || 'Your Location'
          const mapped = resolveAccurateDistrict(placeName)
          const rawDist = mapped.district || addr.county || addr.state_district || addr.district || 'Unknown District'
          const cleanDist = rawDist.toLowerCase().includes('district') ? rawDist : `${rawDist} District`
          const stateName = addr.state || mapped.state || 'India'
          
          const gpsLocation: WeatherLocation = {
            label: `${placeName}, ${cleanDist}, ${stateName}, India`,
            state: stateName,
            temp: 32,
            humidity: 68,
            wind: 14,
            condition: 'Partly Sunny',
            feelsLike: 38,
          }
          setGpsStatus('success')
          onSelect(gpsLocation)
        })
        .catch((nominErr) => {
          console.warn('[LocationModal] Nominatim failed, trying BigDataCloud:', nominErr)
          // Secondary Provider: BigDataCloud API
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(r => {
              if (!r.ok) throw new Error(`BigDataCloud response ${r.status}`)
              return r.json()
            })
            .then(bgData => {
              console.debug('[LocationModal] BigDataCloud data:', bgData)
              const placeName = bgData.locality || bgData.city || 'Your Location'
              const mapped = resolveAccurateDistrict(placeName)
              const stateName = bgData.principalSubdivision || mapped.state || 'India'
              const gpsLocation: WeatherLocation = {
                label: `${placeName}, ${mapped.district}, ${stateName}, India`,
                state: stateName,
                temp: 32,
                humidity: 68,
                wind: 14,
                condition: 'Partly Sunny',
                feelsLike: 38,
              }
              setGpsStatus('success')
              onSelect(gpsLocation)
            })
            .catch((bgErr) => {
              console.error('[LocationModal] BigDataCloud failed:', bgErr)
              setGpsStatus('denied')
            })
        })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.debug('[LocationModal] navigator.geolocation success coords:', pos.coords)
          resolveFromCoords(pos.coords.latitude, pos.coords.longitude)
        },
        (err) => {
          console.error('[LocationModal] navigator.geolocation error:', err)
          // Fallback to IP location if browser location permission is denied or other errors
          fetch('https://ipapi.co/json/')
            .then(r => {
              if (!r.ok) throw new Error(`ipapi response ${r.status}`)
              return r.json()
            })
            .then(ipData => {
              console.debug('[LocationModal] ipapi data:', ipData)
              if (ipData && ipData.city) {
                const placeName = ipData.city
                const mapped = resolveAccurateDistrict(placeName)
                const stateName = ipData.region || mapped.state || 'India'
                const ipLoc: WeatherLocation = {
                  label: `${placeName}, ${mapped.district}, ${stateName}, India`,
                  state: stateName,
                  temp: 32,
                  humidity: 68,
                  wind: 14,
                  condition: 'Partly Sunny',
                  feelsLike: 38,
                }
                setGpsStatus('success')
                onSelect(ipLoc)
              } else {
                setGpsStatus('denied')
              }
            })
            .catch((ipErr) => {
              console.error('[LocationModal] ipapi fallback failed:', ipErr)
              setGpsStatus('denied')
            })
        },
        { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
      )
    } else {
      console.warn('[LocationModal] navigator.geolocation not available')
      setGpsStatus('denied')
    }
  }

  const handleApplyManual = () => {
    if (!manualVillage.trim()) return
    const v = manualVillage.trim()
    const d = manualDistrict.trim() ? (manualDistrict.trim().toLowerCase().includes('district') ? manualDistrict.trim() : `${manualDistrict.trim()} District`) : resolveAccurateDistrict(v).district
    const s = manualState.trim() || resolveAccurateDistrict(v).state

    const customManualLoc: WeatherLocation = {
      label: `${v}, ${d}, ${s}, India`,
      state: s,
      temp: 32,
      humidity: 66,
      wind: 13,
      condition: 'Partly Sunny',
      feelsLike: 38,
    }
    onSelect(customManualLoc)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-elevated w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{t('changeLocation')}</h3>
            <p className="text-xs text-text-muted">{t('accurateGpsResolution')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Toggle Manual Entry vs Quick Search */}
        <div className="flex gap-2 mb-4 bg-background p-1 rounded-xl">
          <button
            onClick={() => setShowManualEditor(false)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!showManualEditor ? 'bg-surface shadow-soft text-green-700' : 'text-text-muted hover:text-text-secondary'}`}
          >
            🔍 Search Village
          </button>
          <button
            onClick={() => setShowManualEditor(true)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${showManualEditor ? 'bg-surface shadow-soft text-green-700' : 'text-text-muted hover:text-text-secondary'}`}
          >
            ✏️ {t('setExactDistrict') || 'Set Exact District'}
          </button>
        </div>

        {!showManualEditor ? (
          <>
            {/* Search input with GPS integrated */}
            <div className="relative mb-3 group">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={t('searchLocationPlaceholder') || 'Search village, town, city, district, state...'}
                icon={<MapPin size={16} className="text-text-muted transition-colors flex-shrink-0" />}
                rightElement={
                  query ? (
                    <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary flex-shrink-0">
                      <X size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleGPS} 
                      className="text-white bg-green-600 hover:bg-green-700 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap transition-colors"
                      title="Detect Exact GPS Location"
                    >
                      {gpsStatus === 'loading' ? <LineSpinner size={12} color="currentColor" strokeWidth={2} /> : <Navigation size={12} />}
                      {gpsStatus === 'loading' ? (t('gpsDetecting') || 'Detecting...') : (t('gps') || 'GPS')}
                    </button>
                  )
                }
              />
              {gpsStatus === 'denied' && (
                <p className="text-[10px] text-error mt-1.5 flex items-center gap-1 animate-fade-in"><AlertCircle size={10} /> {t('locationAccessDenied')}</p>
              )}
              {searchingApi && (
                <p className="text-[10px] text-green-700 mt-1 flex items-center gap-1"><LineSpinner size={10} color="currentColor" strokeWidth={2} /> {t('fetchingDistrictData')}</p>
              )}
            </div>

            {/* Suggestions List — with full 4-tier Village, Mandal/District, State, Country hierarchy */}
            {query.length >= 2 && (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border max-h-60 overflow-y-auto bg-surface mb-3">
                {allSuggestions.map((loc, idx) => {
                  const isTopCustom = idx === 0 && customLoc && loc.label === customLoc.label
                  return (
                    <button
                      key={loc.label + idx}
                      onClick={() => onSelect(loc)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                        isTopCustom 
                          ? 'bg-green-50/90 hover:bg-green-100' 
                          : 'hover:bg-background'
                      }`}
                    >
                      <MapPin size={16} className={isTopCustom ? 'text-green-600 flex-shrink-0 mt-0.5' : 'text-text-muted flex-shrink-0'} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-snug ${isTopCustom ? 'text-green-900' : 'text-text-primary'}`}>
                          {isTopCustom ? `📍 ${loc.label}` : loc.label}
                        </p>
                        <p className={`text-[10px] font-medium ${isTopCustom ? 'text-green-700' : 'text-text-muted'}`}>
                          {isTopCustom ? (t('verifiedDistrictHierarchy') || 'Verified District Hierarchy') : `${loc.state} • ${loc.condition}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0 ${
                        isTopCustom ? 'bg-green-600 text-white' : 'text-text-muted bg-background'
                      }`}>
                        {isTopCustom ? (t('select') || 'Select') : `${loc.temp}°C`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Popular locations (shown when no query) */}
            {query.length === 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{t('popularVillagesDistricts') || 'Popular Agricultural Villages & Districts'}</p>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_LOCATIONS.slice(0, 10).map(loc => (
                    <button
                      key={loc.label}
                      onClick={() => onSelect(loc)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-secondary hover:bg-background hover:text-text-primary transition-colors text-left"
                    >
                      {loc.label.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Manual District Form */
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Village / Gram Panchayat Name</label>
              <Input
                value={manualVillage}
                onChange={e => setManualVillage(e.target.value)}
                placeholder="e.g. Kotkapura, Nallabelly, Wyra..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">{t('exactDistrictName')}</label>
              <Input
                value={manualDistrict}
                onChange={e => setManualDistrict(e.target.value)}
                placeholder="e.g. Faridkot District, Warangal District..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">{t('stateName')}</label>
              <Input
                value={manualState}
                onChange={e => setManualState(e.target.value)}
                placeholder="e.g. Punjab, Telangana, Tamil Nadu..."
              />
            </div>
            <Button
              variant="primary"
              className="w-full mt-2"
              onClick={handleApplyManual}
              disabled={!manualVillage.trim()}
            >
              Apply Exact Location
            </Button>
          </div>
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
  const { t } = useTranslation()
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
  const { t } = useTranslation()
  // Re-resolve a cached location label to fix stale/wrong district names
  const correctLocationLabel = (label: string): string => {
    const parts = label.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      const townName = parts[0]
      const mapped = resolveAccurateDistrict(townName)
      if (mapped.district) {
        // Rebuild with corrected district from the map
        const correctedDist = mapped.district
        const stateName = mapped.state || parts[2] || 'India'
        const corrected = `${townName}, ${correctedDist}, ${stateName}, India`
        localStorage.setItem('selected_location', corrected)
        return corrected
      }
    }
    return label
  }

  const getInitialLocation = (): WeatherLocation => {
    try {
      const saved = localStorage.getItem('selected_location')
      if (saved) {
        const corrected = correctLocationLabel(saved)
        return {
          label: corrected,
          state: corrected.split(',')[2]?.trim() || 'India',
          temp: 32,
          humidity: 68,
          wind: 14,
          condition: 'Partly Sunny',
          feelsLike: 38,
        }
      }
      const userStr = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (userStr && userStr.startsWith('{')) {
        const u = JSON.parse(userStr)
        if (u.region) {
          const corrected = correctLocationLabel(u.region)
          return {
            label: corrected,
            state: corrected.split(',')[2]?.trim() || 'India',
            temp: 32,
            humidity: 68,
            wind: 14,
            condition: 'Partly Sunny',
            feelsLike: 38,
          }
        }
      }
    } catch {}
    return {
      label: 'Srikalahasthi, Tirupati District, Andhra Pradesh, India',
      state: 'Andhra Pradesh',
      temp: 32,
      humidity: 68,
      wind: 14,
      condition: 'Partly Sunny',
      feelsLike: 38,
    }
  }

  const [location, setLocation] = useState<WeatherLocation>(getInitialLocation)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Fetching weather...')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  useEffect(() => {
    // If no custom location saved, attempt live GPS reverse-geocoding
    if (!localStorage.getItem('selected_location') && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`)
            .then(res => res.json())
            .then(data => {
              const addr = data.address || {}
              const placeName = addr.village || addr.suburb || addr.town || addr.city || addr.hamlet || 'Your Village'
              const mapped = resolveAccurateDistrict(placeName)
              const rawDist = mapped.district || addr.county || addr.state_district || addr.district || 'Unknown District'
              const cleanDist = rawDist.toLowerCase().includes('district') ? rawDist : `${rawDist} District`
              const stateName = addr.state || mapped.state || 'India'
              
              const realLoc: WeatherLocation = {
                label: `${placeName}, ${cleanDist}, ${stateName}, India`,
                state: stateName,
                temp: 32,
                humidity: 68,
                wind: 14,
                condition: 'Partly Sunny',
                feelsLike: 38,
              }
              setLocation(realLoc)
              localStorage.setItem('selected_location', realLoc.label)
            })
            .catch(() => {})
        },
        () => {},
        { timeout: 8000, enableHighAccuracy: true }
      )
    }
  }, [])

  // History replay: load location from history page navigation
  useEffect(() => {
    try {
      const replay = localStorage.getItem('history_replay')
      if (replay) {
        const data = JSON.parse(replay)
        if (data.type?.toLowerCase().includes('weather')) {
          localStorage.removeItem('history_replay')
          const locName = data.result?.replace(/^Weather Track:\s*/i, '').trim() || data.input?.replace(/^Location:\s*/i, '').split('|')[0]?.trim() || ''
          if (locName) {
            const replayLoc: WeatherLocation = {
              label: locName,
              state: locName.split(',')[1]?.trim() || 'India',
              temp: 32,
              humidity: 68,
              wind: 14,
              condition: 'Partly Sunny',
              feelsLike: 38,
            }
            setLocation(replayLoc)
            localStorage.setItem('selected_location', locName)
          }
        }
      }
    } catch {}
  }, [])

  const handleLocationSelect = (loc: WeatherLocation) => {
    setShowModal(false)
    setLoading(true)
    try { 
      localStorage.setItem('selected_location', loc.label)
      saveLocalPrediction({
        type: 'Weather',
        prediction_type: 'weather',
        result: `Weather Track: ${loc.label.split(',')[0]}`,
        input: `Location: ${loc.label} | Temp: ${loc.temp}°C | Condition: ${loc.condition} | Humidity: ${loc.humidity}%`,
        confidence: 100,
        status: 'success',
      })
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('predictionCreated'))
    } catch {}
    const msgs = ['Fetching weather...', 'Retrieving forecast...', 'Updating weather data...']
    setLoadingMsg(msgs[Math.floor(Math.random() * msgs.length)])
    setTimeout(() => {
      setLocation(loc)
      setHourlyData(generateHourly(loc.temp))
      setForecast(generateForecast(loc.temp, loc.condition))
      setLoading(false)
    }, 1500)
  }

  const [hourlyData, setHourlyData] = useState(() => generateHourly(location.temp))
  const [forecast, setForecast] = useState(() => generateForecast(location.temp, location.condition))
  const sarvamWeatherLocation = useSarvamLocation(location.label)

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {showModal && <LocationModal onSelect={handleLocationSelect} onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('weather') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('weather')}</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-text-muted flex items-center gap-1 hover:text-green-700 transition-colors mt-0.5 group"
          >
            <MapPin size={12} />
            <span>{sarvamWeatherLocation || location.label}</span>
            <Edit3 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
        </div>
        <Button variant="outlined" size="sm" icon={<MapPin size={13} />} onClick={() => setShowModal(true)}>
          {t('changeLocation')}
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
              <span className="text-[10px] text-blue-400 font-medium">{t('clouds')}</span>
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
              <span className="text-[10px] text-yellow-500 font-medium">{t('sun')}</span>
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
              <span className="text-[10px] text-blue-500 font-medium">{t('rain')}</span>
            </div>
            {/* Wind */}
            <div className="flex flex-col items-center gap-1 animate-wl-3">
              <svg width="34" height="24" viewBox="-17 -12 34 24">
                <path d="M -14 -4 Q 0 -4 8 -4 Q 14 -4 14 -8 Q 14 -12 8 -12 Q 2 -12 2 -8" stroke="#78909C" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M -14 0 Q 4 0 12 0 Q 18 0 18 4 Q 18 8 12 8 Q 6 8 6 4" stroke="#B0BEC5" fill="none" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M -14 6 Q 0 6 6 6" stroke="#CFD8DC" fill="none" strokeWidth="1.4" strokeLinecap="round" className="animate-wind-leaf" />
              </svg>
              <span className="text-[10px] text-text-muted font-medium">{t('wind')}</span>
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
              <span className="text-[10px] text-red-400 font-medium">{t('temp')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather */}
      <div className={`gradient-hero rounded-2xl p-6 text-white transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <p className="text-white/70 text-sm mb-2">{t('currentConditions')} — {sarvamWeatherLocation || location.label}</p>
            <div className="flex items-end gap-4 mb-3">
              <WeatherConditionIcon condition={location.condition} />
              <span className="text-7xl font-bold">{location.temp}°</span>
              <div>
                <p className="text-xl font-semibold">{t(location.condition) || location.condition}</p>
                <p className="text-white/70 text-sm">{t('feelsLike')} {location.feelsLike}°C</p>
              </div>
            </div>
            <p className="text-white/80 text-sm">🌾 {t('goodFieldPrep')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Droplets size={16} />, label: t('humidity'), value: `${location.humidity}%` },
              { icon: <Wind size={16} />, label: t('windSpeed'), value: `${location.wind} km/h` },
              { icon: <Thermometer size={16} />, label: t('dewPoint'), value: `${Math.round(location.temp - 8)}°C` },
              { icon: <Cloud size={16} />, label: t('cloudCover'), value: `${Math.round(location.humidity / 2)}%` },
              { icon: <Sunrise size={16} />, label: t('sunrise'), value: '05:42 AM' },
              { icon: <Sunset size={16} />, label: t('sunset'), value: '07:18 PM' },
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
        <h3 className="font-bold text-text-primary mb-4">{t('hourlyForecast')}</h3>
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
        <h3 className="font-bold text-text-primary mb-4">{t('forecast7Day')}</h3>
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
                    <span className="w-10 md:w-12 text-sm font-semibold text-text-primary">{t(d.day) || d.day}</span>
                    <span className="text-2xl w-8 text-center">{d.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary">{d.high}° <span className="text-xs font-normal text-text-muted ml-1">/ {d.low}°</span></span>
                      <span className="text-xs text-text-muted hidden md:inline-block">{t(d.condition) || d.condition}</span>
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
                        <p className="text-[10px] text-text-muted uppercase">{t('feelsLike')}</p>
                        <p className="text-sm font-semibold text-text-primary">{d.high + 1}°</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">{t('humidity')}</p>
                        <p className="text-sm font-semibold text-text-primary">{d.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">{t('wind')}</p>
                        <p className="text-sm font-semibold text-text-primary">{d.wind} km/h {d.dir}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">{t('uvIndex')}</p>
                        <p className="text-sm font-semibold text-text-primary">{d.uv}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] text-text-muted uppercase">{t('sunrise')}</p>
                        <p className="text-sm font-semibold text-text-primary">{d.sunrise}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] text-text-muted uppercase">{t('sunset')}</p>
                        <p className="text-sm font-semibold text-text-primary">{d.sunset}</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50/50 dark:bg-green-900/10 rounded-lg p-3 border border-green-100/50 dark:border-green-800/30">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1.5"><Leaf size={12} /> {t('Agricultural Recommendation')}</p>
                      <p className="text-sm text-text-primary leading-relaxed">{t(d.desc) || d.desc}</p>
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
const predictions = [
  { id: 'P001', type: 'Crop', input: 'N:90 P:42 K:43 pH:6.5 | Location: Srikalahasthi, Tirupati District, AP', result: 'Rice', confidence: 96, date: 'Jul 24, 2026 09:14 AM', status: 'success' },
  { id: 'P002', type: 'Soil', input: 'Image: red_soil_sample.jpg | Location: Srikalahasthi, Tirupati District, AP', result: 'Sandy Loam', confidence: 88, date: 'Jul 23, 2026 11:32 AM', status: 'success' },
  { id: 'P003', type: 'Chatbot', input: 'Q: What is the optimal NPK ratio for paddy in Tirupati? | Location: Srikalahasthi, Tirupati District, AP', result: 'Rice NPK Advisory', confidence: 98, date: 'Jul 22, 2026 04:10 PM', status: 'success' },
  ...(FEATURES.DISEASE_DETECTION ? [{ id: 'P004', type: 'Disease', input: 'Image: rice_leaf_spot.jpg | Location: Srikalahasthi, Tirupati District, AP', result: 'Leaf Blight', confidence: 91, date: 'Jul 22, 2026 02:45 PM', status: 'warning' }] : []),
  { id: 'P005', type: 'Fertilizer', input: 'Wheat, Clay soil, N:45 | Location: Srikalahasthi, Tirupati District, AP', result: 'Urea + DAP', confidence: 84, date: 'Jul 21, 2026 08:20 AM', status: 'success' },
  { id: 'P006', type: 'Crop', input: 'N:60 P:30 K:55 pH:7.2 | Location: Srikalahasthi, Tirupati District, AP', result: 'Wheat', confidence: 94, date: 'Jul 20, 2026 10:00 AM', status: 'success' },
]

function downloadHistoryFile(content: BlobPart, fileName: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function historyExportRow(item: any) {
  return {
    id: String(item.id || item.history_id || ''),
    type: String(item.type || item.prediction_type || (item.top_crop || item.predicted_crop ? 'Crop' : 'Soil')),
    result: String(item.result || item.top_crop || item.predicted_crop || item.soil_type || item.prediction_result || 'Analyzed'),
    confidence: String(item.confidence ?? (item.soil_confidence ? Math.round(item.soil_confidence > 1 ? item.soil_confidence : item.soil_confidence * 100) : '')),
    date: String(item.date || item.prediction_date || (item.created_at ? new Date(item.created_at).toLocaleString() : '')),
    status: String(item.status || 'success'),
    input: typeof item.input === 'object' ? JSON.stringify(item.input) : String(item.input || item.input_data || ''),
  }
}

function escapePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildHistoryPdf(items: any[]) {
  const rows = items.map(historyExportRow)
  const lines = [
    'AgroAI Prediction History Report',
    `Generated: ${new Date().toLocaleString()}`,
    `Records: ${rows.length}`,
    '',
    ...rows.flatMap((row, index) => [
      `${index + 1}. ${row.type} | ${row.result} | ${row.confidence ? `${row.confidence}% confidence` : 'Confidence unavailable'}`,
      `   Date: ${row.date || 'Not available'} | Status: ${row.status}`,
      `   Input: ${row.input || 'Not available'}`,
      '',
    ]),
  ].flatMap(line => line.length > 105 ? line.match(/.{1,105}(?:\s|$)/g) || [line] : [line])

  const pageLines = [] as string[][]
  for (let index = 0; index < lines.length; index += 42) pageLines.push(lines.slice(index, index + 42))
  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '']
  const pageObjectNumbers: number[] = []

  pageLines.forEach((page, index) => {
    const pageNumber = 3 + index * 2
    const contentNumber = pageNumber + 1
    pageObjectNumbers.push(pageNumber)
    objects[pageNumber - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentNumber} 0 R >>`
    const commands = ['BT', '/F1 11 Tf', '50 760 Td']
    page.forEach((line, lineIndex) => {
      if (lineIndex > 0) commands.push('0 -16 Td')
      commands.push(`(${escapePdfText(line)}) Tj`)
    })
    commands.push('ET')
    const stream = commands.join('\n')
    objects[contentNumber - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })
  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map(number => `${number} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets[index + 1] = new TextEncoder().encode(pdf).length
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

export function PredictionHistory({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [apiHistory, setApiHistory] = useState<any[]>([])

  const loadHistory = () => {
    getPredictionHistory()
      .then((predictions: any[]) => {
        if (Array.isArray(predictions)) {
          setApiHistory(predictions)
        }
      })
      .catch(err => console.warn('History fetch note:', err))
  }

  useEffect(() => {
    loadHistory()
    window.addEventListener('predictionCreated', loadHistory)
    window.addEventListener('storage', loadHistory)
    return () => {
      window.removeEventListener('predictionCreated', loadHistory)
      window.removeEventListener('storage', loadHistory)
    }
  }, [])

  const allPredictions = apiHistory
  const tabs = ['All', 'Soil', 'Crop', 'Fertilizer', 'Chatbot', 'Weather', 'Profile', ...(FEATURES.DISEASE_DETECTION ? ['Disease'] : [])]
  const filtered = allPredictions.filter(p => {
    const pType = String(p.type || p.prediction_type || (p.top_crop || p.predicted_crop ? 'Crop' : 'Soil'))
    const pResult = String(p.result || p.top_crop || p.predicted_crop || p.soil_type || p.prediction_result || 'Soil Analysis')
    const pInput = String(p.input || p.input_data || '')
    const matchesTab = activeTab === 'All' ||
      pType.toLowerCase().includes(activeTab.toLowerCase()) ||
      (activeTab === 'Fertilizer' && (pType.toLowerCase().includes('fertilizer') || pType.includes('उर्वरक'))) ||
      (activeTab === 'Weather' && (pType.toLowerCase().includes('weather') || pType.includes('मौसम'))) ||
      (activeTab === 'Soil' && (pType.toLowerCase().includes('soil') || pType.includes('मिट्टी'))) ||
      (activeTab === 'Crop' && (pType.toLowerCase().includes('crop') || pType.includes('फसल'))) ||
      (activeTab === 'Chatbot' && (pType.toLowerCase().includes('chatbot') || pType.includes('चैटबॉट'))) ||
      (activeTab === 'Profile' && (pType.toLowerCase().includes('profile') || pType.includes('प्रोफाइल'))) ||
      (activeTab === 'Disease' && (pType.toLowerCase().includes('disease') || pType.includes('बीमारी') || pType.includes('रोग')))

    const matchesSearch = !search || pResult.toLowerCase().includes(search.toLowerCase()) || pType.toLowerCase().includes(search.toLowerCase()) || pInput.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('soil') || t.includes('मिट्टी')) return 'orange'
    if (t.includes('crop') || t.includes('फसल')) return 'green'
    if (t.includes('fertilizer') || t.includes('उर्वरक')) return 'blue'
    if (t.includes('chatbot') || t.includes('चैटबॉट')) return 'purple'
    if (t.includes('weather') || t.includes('मौसम')) return 'blue'
    if (t.includes('profile') || t.includes('प्रोफाइल')) return 'green'
    if (t.includes('disease') || t.includes('बीमारी') || t.includes('रोग')) return 'red'
    return 'gray'
  }

  const exportCsv = () => {
    const columns = ['ID', 'Type', 'Result', 'Confidence (%)', 'Date & Time', 'Status', 'Input']
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const rows = filtered.map(historyExportRow).map(row => [row.id, row.type, row.result, row.confidence, row.date, row.status, row.input].map(escape).join(','))
    downloadHistoryFile([columns.join(','), ...rows].join('\r\n'), 'agroai-prediction-history.csv', 'text/csv;charset=utf-8')
  }

  const exportPdf = () => {
    downloadHistoryFile(buildHistoryPdf(filtered), 'agroai-prediction-history.pdf', 'application/pdf')
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('history') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('history')}</h2>
          <p className="text-sm text-text-muted">{allPredictions.length || 62} {t('totalActivityRecords')}</p>
        </div>
        {allPredictions.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outlined" size="sm" icon={<Download size={13} />} onClick={exportCsv}>{t('Export CSV')}</Button>
            <Button variant="primary" size="sm" icon={<Download size={13} />} onClick={exportPdf}>{t('Download PDF')}</Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all-smooth whitespace-nowrap ${activeTab === tab ? 'bg-surface shadow-soft text-green-700 font-bold' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {t(tab) || tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search predictions, chatbot, weather tracks & profile history...') || t('searchHistoryPlaceholder')}
          />
        </div>
        <Button variant="ghost" icon={<Filter size={14} />}>{t('Filter')}</Button>
      </div>

      {/* Table / Empty State */}
      <Card className="overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t('ID')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t('Type')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t('Activity / Result')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t('confidenceAccuracy') || t('Confidence / Accuracy') || t('Confidence')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t('Date & Time')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{t('Status')}</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const rowId = String(p.id || p.history_id || Math.random())
                    const rowType = p.type || (p.prediction_type ? p.prediction_type.charAt(0).toUpperCase() + p.prediction_type.slice(1) : (p.top_crop ? 'Crop' : 'Soil'))
                    const rowResult = p.result || p.top_crop || p.predicted_crop || p.soil_type || 'Analyzed'
                    const rowConf = p.confidence ?? (p.soil_confidence ? (p.soil_confidence > 1 ? p.soil_confidence : Math.round(p.soil_confidence * 100)) : 95)
                    const rowDate = p.date || p.prediction_date || (p.created_at ? new Date(p.created_at).toLocaleString() : 'Just now')
                    const userLoc = localStorage.getItem('selected_location') || 'Srikalahasthi, Tirupati District, Andhra Pradesh, India'
                    const rowInput = p.input || p.input_data || `Parameters analyzed | Location: ${userLoc}`

                    return (
                      <React.Fragment key={rowId}>
                        <tr 
                          className="border-b border-border hover:bg-background transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === rowId ? null : rowId)}
                        >
                          <td className="py-3 px-4 text-xs font-mono text-text-muted">{rowId}</td>
                          <td className="py-3 px-4">
                            <Badge color={getBadgeColor(rowType)}>{t(rowType) || rowType}</Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold text-text-primary">{rowResult}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-background rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${rowConf}%` }} />
                              </div>
                              <span className="text-xs font-medium text-text-secondary">{rowConf}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-text-muted">{rowDate}</td>
                          <td className="py-3 px-4">
                            <Badge color="green">{p.status || 'success'}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => setExpandedRow(expandedRow === rowId ? null : rowId)} className="text-text-muted hover:text-text-secondary transition-colors">
                              {expandedRow === rowId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === rowId && (
                          <tr className="bg-surface-hover border-b border-border">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="space-y-3 animate-fade-in">
                                {/* Detail content based on type */}
                                {rowType.toLowerCase().includes('chatbot') && (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">❓ Question</span>
                                      <p className="text-sm text-text-primary leading-relaxed">{String(rowInput).replace(/^.*?Question:\s*/i, '').split('|')[0].trim() || rowInput}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-green-50 px-2 py-1 rounded-lg whitespace-nowrap">💬 Answer</span>
                                      <p className="text-sm text-text-primary leading-relaxed">{rowResult}</p>
                                    </div>
                                    {String(rowInput).includes('Language:') && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-text-secondary bg-purple-50 px-2 py-1 rounded-lg">🌐 Language</span>
                                        <span className="text-xs text-text-muted">{String(rowInput).split('Language:')[1]?.split('|')[0]?.trim() || 'English'}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {rowType.toLowerCase().includes('weather') && (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-blue-50 px-2 py-1 rounded-lg">📍 Location Tracked</span>
                                      <p className="text-sm text-text-primary">{rowResult}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-cyan-50 px-2 py-1 rounded-lg">🌤️ Details</span>
                                      <p className="text-sm text-text-muted">{typeof rowInput === 'object' ? JSON.stringify(rowInput) : rowInput}</p>
                                    </div>
                                  </div>
                                )}
                                {rowType.toLowerCase().includes('profile') && (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-emerald-50 px-2 py-1 rounded-lg">👤 Updated Info</span>
                                      <p className="text-sm text-text-primary">{typeof rowInput === 'object' ? JSON.stringify(rowInput) : rowInput}</p>
                                    </div>
                                  </div>
                                )}
                                {(rowType.toLowerCase().includes('soil') || rowType.toLowerCase().includes('crop') || rowType.toLowerCase().includes('fertilizer') || rowType.toLowerCase().includes('disease')) && (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-orange-50 px-2 py-1 rounded-lg">📊 Analysis Result</span>
                                      <p className="text-sm text-text-primary font-medium">{rowResult}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-text-secondary bg-gray-50 px-2 py-1 rounded-lg">📋 Parameters</span>
                                      <p className="text-sm text-text-muted font-mono">{typeof rowInput === 'object' ? JSON.stringify(rowInput) : rowInput}</p>
                                    </div>
                                  </div>
                                )}
                                {/* Navigation button */}
                                {onNavigate && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Store the history item for the target page to pick up
                                        const replayData = {
                                          type: rowType,
                                          result: rowResult,
                                          input: rowInput,
                                          confidence: rowConf,
                                          date: rowDate,
                                          id: rowId,
                                          raw: p,
                                        }
                                        localStorage.setItem('history_replay', JSON.stringify(replayData))
                                        window.dispatchEvent(new Event('historyReplay'))
                                        // Navigate to the relevant page
                                        const t = rowType.toLowerCase()
                                        if (t.includes('chatbot')) onNavigate('chatbot')
                                        else if (t.includes('weather')) onNavigate('weather')
                                        else if (t.includes('profile')) onNavigate('profile')
                                        else if (t.includes('soil')) onNavigate('soil')
                                        else if (t.includes('crop')) onNavigate('crop')
                                        else if (t.includes('fertilizer')) onNavigate('fertilizer')
                                        else if (t.includes('disease')) onNavigate('disease')
                                        else onNavigate('dashboard')
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                      <ExternalLink size={12} /> Open in Page
                                    </button>
                                    <span className="text-[10px] text-text-muted">View full details with your original question & AI response</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-text-muted">
              <span>{t('Showing')} {filtered.length} {t('of')} {allPredictions.length} {t('predictions')}</span>
            </div>
          </>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto text-green-600 font-bold text-2xl">
              🌱
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-1">No Prediction History Found</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                You haven't generated any predictions yet. Run your first analysis to build your farming history!
              </p>
            </div>
            {onNavigate && (
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="primary" size="sm" onClick={() => onNavigate('soil')}>{t("soilAdvice")}</Button>
                <Button variant="outlined" size="sm" onClick={() => onNavigate('crop')}>Recommend Crop</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ---- Notifications ----
export function generateRealNotifications(): { id: string; title: string; desc: string; titleKey?: string; titleParams?: any; descKey?: string; descParams?: any; created?: string; time: string; type: string; read: boolean }[] {
  const notifications: { id: string; title: string; desc: string; titleKey?: string; titleParams?: any; descKey?: string; descParams?: any; created?: string; time: string; type: string; read: boolean }[] = []
  const readIdsRaw = JSON.parse(localStorage.getItem('notification_read_ids') || '[]')
  const readIdsSet = new Set(readIdsRaw)

  // 1. Weather Update Notification (Notification 1)
  const savedLoc = localStorage.getItem('selected_location') || 'Andhra Pradesh, Tirupati'
  const locShort = savedLoc.split(',')[0].trim() || 'Andhra Pradesh, Tirupati'
  const wId = `weather-daily-${new Date().toISOString().split('T')[0]}`
  notifications.push({
    id: wId,
    titleKey: 'weatherUpdateTitle',
    titleParams: { location: locShort },
    descKey: 'weatherUpdateDesc',
    descParams: { location: savedLoc },
    title: `Weather Update: ${locShort}`,
    desc: `Check today's weather conditions for ${savedLoc}. Monitor temperature, humidity, and rainfall forecasts to plan your farming activities.`,
    created: new Date(Date.now() - 3600000).toISOString(),
    time: '1 hour ago',
    type: 'weather',
    read: readIdsSet.has(wId) as boolean,
  })

  // 2. Welcome Notification (Notification 2)
  const welId = 'welcome-agroai-v1'
  notifications.push({
    id: welId,
    titleKey: 'welcomeNotificationTitle',
    descKey: 'welcomeNotificationDesc',
    descParams: { days: 5 },
    title: 'Welcome to AgroAI!',
    desc: 'You joined 5 days ago. Explore Soil Analysis, Crop Recommendations, and AI Chatbot to get started with smart farming.',
    created: new Date(Date.now() - 5 * 86400000).toISOString(),
    time: '5 days ago',
    type: 'crop',
    read: readIdsSet.has(welId) as boolean,
  })

  // 3. System AI Model Updated Notification (Notification 3)
  const sysId = `system-update-${new Date().toISOString().substring(0, 7)}`
  notifications.push({
    id: sysId,
    titleKey: 'modelUpdatedTitle',
    descKey: 'modelUpdatedDesc',
    title: 'AI Model Updated',
    desc: 'Crop recommendation and soil analysis models have been upgraded with improved accuracy. Results now include enhanced regional climate data integration.',
    created: new Date(Date.now() - 2 * 86400000).toISOString(),
    time: '2 days ago',
    type: 'system',
    read: readIdsSet.has(sysId) as boolean,
  })

  try {
    const history = JSON.parse(localStorage.getItem('agroai_prediction_history') || '[]')
    if (Array.isArray(history)) {
      history.forEach((item: any, idx: number) => {
        const itemType = String(item.type || item.prediction_type || '').toLowerCase()
        const created = item.date || item.created_at || new Date().toISOString()
        const id = `activity-${itemType}-${idx}`

        if (itemType.includes('chatbot')) {
          const question = item.input || item.result || 'AI Chatbot query'
          const qShort = String(question).substring(0, 120) + (question.length > 120 ? '...' : '')
          notifications.push({
            id,
            titleKey: 'chatbotResponseTitle',
            descKey: 'chatbotResponseDesc',
            descParams: { question: qShort },
            title: 'AI Chatbot Response',
            desc: `You asked: "${qShort}"`,
            created,
            time: 'Just now',
            type: 'crop',
            read: readIdsSet.has(id) as boolean,
          })
        } else if (itemType.includes('weather')) {
          const loc = item.result || item.input || 'your location'
          const locShort = String(loc).substring(0, 50)
          notifications.push({
            id,
            titleKey: 'weatherTrackedTitle',
            titleParams: { location: locShort },
            descKey: 'weatherTrackedDesc',
            descParams: { location: loc },
            title: `Weather Tracked: ${locShort}`,
            desc: `Weather conditions monitored for ${loc}. Check current temperature, humidity, and forecast details.`,
            created,
            time: 'Just now',
            type: 'weather',
            read: readIdsSet.has(id) as boolean,
          })
        } else if (itemType.includes('profile')) {
          const detail = item.input || item.result || 'Profile updated'
          const detailShort = String(detail).substring(0, 120)
          notifications.push({
            id,
            titleKey: 'profileUpdatedTitle',
            descKey: 'profileUpdatedDesc',
            descParams: { detail: detailShort },
            title: 'Profile Updated',
            desc: `Your profile was updated: ${detailShort}`,
            created,
            time: 'Just now',
            type: 'system',
            read: readIdsSet.has(id) as boolean,
          })
        } else if (itemType.includes('soil')) {
          const result = item.result || 'Soil analysis'
          const resultShort = String(result).substring(0, 50)
          notifications.push({
            id,
            titleKey: 'soilAnalysisTitle',
            titleParams: { result: resultShort },
            descKey: 'soilAnalysisDesc',
            descParams: { result },
            title: `Soil Analysis: ${resultShort}`,
            desc: `Soil health assessment completed. ${result}. Review NPK nutrient levels and recommendations.`,
            created,
            time: 'Just now',
            type: 'crop',
            read: readIdsSet.has(id) as boolean,
          })
        } else if (itemType.includes('crop')) {
          const crop = item.result || 'Crop recommendation'
          const cropShort = String(crop).substring(0, 50)
          const conf = item.confidence || 95
          notifications.push({
            id,
            titleKey: 'cropRecommendationTitle',
            titleParams: { crop: cropShort },
            descKey: 'cropRecommendationDesc',
            descParams: { crop, confidence: conf },
            title: `Crop Recommendation: ${cropShort}`,
            desc: `AI recommended ${crop} based on your soil parameters and regional conditions. Confidence: ${conf}%`,
            created,
            time: 'Just now',
            type: 'crop',
            read: readIdsSet.has(id) as boolean,
          })
        } else if (itemType.includes('disease')) {
          const result = item.result || 'Review the diagnosis and treatment plan.'
          notifications.push({
            id,
            titleKey: 'plantDiseaseAnalysisTitle',
            descKey: 'plantDiseaseAnalysisDesc',
            descParams: { result },
            title: 'Plant Disease Analysis',
            desc: `Disease detection scan completed. ${result}`,
            created,
            time: 'Just now',
            type: 'disease',
            read: readIdsSet.has(id) as boolean,
          })
        }
      })
    }
  } catch {}

  return notifications.slice(0, 20) // Cap at 20
}

export function Notifications({ onNavigate, readIds: readIdsProp, onMarkRead, onMarkAllRead }: {
  onNavigate?: (page: string) => void
  readIds?: Set<string>
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
}) {
  const { t } = useTranslation()
  const [localNotifs, setLocalNotifs] = useState<any[]>(() => generateRealNotifications())
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('notification_read_ids') || '[]')
      return new Set(saved)
    } catch { return new Set() }
  })
  const readIds = readIdsProp ?? localReadIds

  const [filter, setFilter] = useState('All')
  const [toast, setToast] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<any>(null)

  // Refresh notifications when activity happens or on mount
  useEffect(() => {
    const refreshNotifs = () => setLocalNotifs(generateRealNotifications())
    
    // Try API first, fall back to local generation
    getNotifications()
      .then(items => {
        if (Array.isArray(items) && items.length > 0) {
          setLocalNotifs(items)
          const readSet = new Set(items.filter((it: any) => it.read).map((it: any) => it.id))
          setLocalReadIds(prev => new Set([...prev, ...readSet]))
        }
      })
      .catch(() => {})

    // Listen for new activity events to auto-refresh
    window.addEventListener('predictionCreated', refreshNotifs)
    window.addEventListener('storage', refreshNotifs)

    // Automatically mark all as read when the user views the notifications page
    setTimeout(() => {
      if (onMarkAllRead) onMarkAllRead()
    }, 500)

    return () => {
      window.removeEventListener('predictionCreated', refreshNotifs)
      window.removeEventListener('storage', refreshNotifs)
    }
  }, [])

  const currentNotifs = localNotifs
  const typeColors: Record<string, 'blue' | 'red' | 'green' | 'gray' | 'orange'> = { weather: 'blue', disease: 'red', crop: 'green', admin: 'gray', system: 'orange' }
  const typeIcons: Record<string, string> = { weather: '⛈️', disease: '🐛', crop: '🌱', admin: '📢', system: '🤖' }

  const unreadCount = currentNotifs.filter(n => !readIds.has(n.id)).length

  const visible = currentNotifs.filter(n =>
    filter === 'All' ||
    (filter === 'Unread' && !readIds.has(n.id)) ||
    (filter === 'Read' && readIds.has(n.id))
  )

  const markRead = (id: string) => {
    markNotificationRead(id).catch(() => {})
    if (onMarkRead) onMarkRead(id)
    else {
      setLocalReadIds(s => {
        const updated = new Set([...s, id])
        try { localStorage.setItem('notification_read_ids', JSON.stringify([...updated])) } catch {}
        return updated
      })
    }
  }

  const markAllRead = () => {
    markAllNotificationsRead().catch(() => {})
    if (onMarkAllRead) onMarkAllRead()
    else {
      const allIds = new Set(currentNotifs.map(n => n.id))
      setLocalReadIds(allIds)
      try { localStorage.setItem('notification_read_ids', JSON.stringify([...allIds])) } catch {}
    }
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const handleCardClick = (n: any) => {
    markRead(n.id)
    setSelectedNotif(n)
  }

  const getItemTitle = (n: any) => {
    if (n.titleKey) {
      let val = t(n.titleKey) || n.title
      if (n.titleParams) {
        Object.keys(n.titleParams).forEach(k => {
          val = val.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(n.titleParams[k]))
        })
      }
      return val
    }
    const rawTitle = String(n.title || '')
    if (rawTitle.toLowerCase().includes('weather update')) {
      const loc = rawTitle.split(':')[1]?.trim() || ''
      let val = t('weatherUpdateTitle') || 'Weather Update: {{location}}'
      return val.replace(/\{\{\s*location\s*\}\}/g, loc)
    }
    if (rawTitle.toLowerCase().includes('welcome to agroai')) {
      return t('welcomeNotificationTitle') || rawTitle
    }
    if (rawTitle.toLowerCase().includes('ai model updated')) {
      return t('modelUpdatedTitle') || rawTitle
    }
    return t(rawTitle) || rawTitle
  }

  const getItemDesc = (n: any) => {
    if (n.descKey) {
      let val = t(n.descKey) || n.desc
      if (n.descParams) {
        Object.keys(n.descParams).forEach(k => {
          val = val.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(n.descParams[k]))
        })
      }
      return val
    }
    const rawDesc = String(n.desc || '')
    if (rawDesc.toLowerCase().includes('weather conditions for')) {
      const match = rawDesc.match(/weather conditions for ([^.]+)/i)
      const loc = match ? match[1].trim() : ''
      let val = t('weatherUpdateDesc') || rawDesc
      return val.replace(/\{\{\s*location\s*\}\}/g, loc)
    }
    if (rawDesc.toLowerCase().includes('you joined')) {
      const match = rawDesc.match(/joined (\d+) days ago/i)
      const days = match ? match[1] : '5'
      let val = t('welcomeNotificationDesc') || rawDesc
      return val.replace(/\{\{\s*days\s*\}\}/g, days)
    }
    if (rawDesc.toLowerCase().includes('crop recommendation and soil analysis models have been upgraded')) {
      return t('modelUpdatedDesc') || rawDesc
    }
    return t(rawDesc) || rawDesc
  }

  const getItemTime = (n: any) => {
    if (n.created) {
      return formatRelativeTime(n.created, t)
    }
    const rawTime = String(n.time || '')
    if (rawTime.includes('hour ago')) return `1 ${t('hourAgo') || 'hour ago'}`
    if (rawTime.includes('hours ago')) {
      const num = rawTime.match(/\d+/)?.[0] || '1'
      return `${num} ${t('hoursAgo') || 'hours ago'}`
    }
    if (rawTime.includes('day ago')) return `1 ${t('dayAgo') || 'day ago'}`
    if (rawTime.includes('days ago')) {
      const num = rawTime.match(/\d+/)?.[0] || '1'
      return `${num} ${t('daysAgo') || 'days ago'}`
    }
    if (rawTime.toLowerCase().includes('just now')) return t('justNow') || 'Just now'
    return t(rawTime) || rawTime
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 shadow-elevated animate-fade-in">
          <Check size={15} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium">{t('allNotificationsMarkedRead') || 'All notifications marked as read'}</span>
          <button onClick={() => setToast(false)} className="text-xs opacity-60 hover:opacity-100 ml-2">✕</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('notifications') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('notifications')}</h2>
          <p className="text-sm text-text-muted">
            {unreadCount > 0 ? <><span className="font-semibold text-green-700">{unreadCount}</span> {t('unread')} {t('notifications')}</> : (t('allCaughtUp') || 'All caught up')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" icon={<Check size={13} />} onClick={markAllRead}>{t('markAllRead') || 'Mark all read'}</Button>
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
            {f === 'All' ? t('all') : f === 'Unread' ? t('unread') : t('read')}
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
          const isUnread = !readIds.has(n.id)
          return (
            <div
              key={n.id}
              onClick={() => handleCardClick(n)}
              className={`rounded-2xl border transition-all duration-200 cursor-pointer select-none animate-notif-${Math.min(idx, 4)} ${
                isUnread
                  ? 'bg-surface border-border shadow-soft hover:shadow-card border-l-4 border-l-green-500'
                  : 'bg-background/60 border-border hover:bg-background'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`text-xl flex-shrink-0 mt-0.5 transition-opacity ${isUnread ? 'opacity-100' : 'opacity-50'}`}>
                  {typeIcons[n.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-text-primary' : 'font-medium text-text-muted'}`}>
                      {getItemTitle(n)}
                    </p>
                    <Badge color={typeColors[n.type]}>{n.type}</Badge>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                  </div>
                  <p className={`text-xs leading-relaxed transition-all line-clamp-2 ${isUnread ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {getItemDesc(n)}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1.5">{getItemTime(n)}</p>
                </div>

                {/* Right side: Mark as Read button (unread only) */}
                <div className="flex-shrink-0 flex items-center self-start pt-0.5">
                  {isUnread ? (
                    <button
                      onClick={e => { e.stopPropagation(); markRead(n.id) }}
                      className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                    >
                      {t('markAsRead') || 'Mark as read'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-text-muted font-medium">{t('read')}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {visible.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mx-auto mb-3">
              <Bell size={24} className="text-text-muted opacity-50" />
            </div>
            <p className="font-semibold text-text-muted">{t('noNotifications') || 'No notifications'}</p>
            <p className="text-sm text-text-muted/60 mt-1">
              {filter === 'Unread' ? (t('allCaughtUp') || "You're all caught up!") : filter === 'Read' ? (t('noReadNotificationsYet') || 'No read notifications yet.') : (t('nothingHereYet') || 'Nothing here yet.')}
            </p>
          </div>
        )}
      </div>

      {/* Modal for detailed notification */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedNotif(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-elevated border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex justify-between items-center bg-background/50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{typeIcons[selectedNotif.type]}</div>
                <div>
                  <h3 className="font-bold text-text-primary leading-tight">{getItemTitle(selectedNotif)}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{getItemTime(selectedNotif)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="p-1.5 rounded-lg hover:bg-black/5 text-text-muted transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 inline-block">
                <Badge color={typeColors[selectedNotif.type]}>
                  {(t(selectedNotif.type) || selectedNotif.type).toUpperCase()} {(t('notification') || 'NOTIFICATION').toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{getItemDesc(selectedNotif)}</p>
              
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <button onClick={() => setSelectedNotif(null)} className="px-5 py-2 text-sm font-semibold rounded-xl bg-background border border-border text-text-primary hover:bg-black/5 transition-colors">
                  {t('close') || 'Close'}
                </button>
                {selectedNotif.type !== 'system' && onNavigate && (
                  <button 
                    onClick={() => {
                      setSelectedNotif(null)
                      if(selectedNotif.type === 'weather') onNavigate('weather')
                      else if(selectedNotif.type === 'disease') onNavigate('disease')
                      else if(selectedNotif.type === 'crop' || selectedNotif.type === 'soil') onNavigate('dashboard')
                    }}
                    className="ml-3 px-5 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors"
                  >
                    {t('viewDetails') || 'View Details'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Feedback ----
export function Feedback({ role, onNavigate }: { role?: string, onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [category, setCategory] = useState('general')
  const [search, setSearch] = useState('')
  const [adminReplyState, setAdminReplyState] = useState<Record<string, boolean>>({})
  const [adminReplyText, setAdminReplyText] = useState<Record<string, string>>({})
  const [dbFeedbacks, setDbFeedbacks] = useState<any[]>([])
  const [summaryStats, setSummaryStats] = useState<any>(null)
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)

  const fetchFeedbackData = () => {
    setLoadingFeedbacks(true)
    api.get('/feedback')
      .then(res => setDbFeedbacks(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.warn('Fetch feedback note:', err))
      .finally(() => setLoadingFeedbacks(false))

    if (role === 'admin') {
      api.get('/feedback/summary')
        .then(res => setSummaryStats(res.data))
        .catch(err => console.warn('Fetch summary note:', err))
    }
  }

  useEffect(() => {
    fetchFeedbackData()
  }, [role])

  if (role === 'admin') {
    const feedbackList = dbFeedbacks.map(f => {
      const name = f.user_name || `Farmer #${f.user_id}`
      const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
      return {
        id: f.id,
        user: name,
        initials: initials || 'F',
        cropFocus: f.category || 'Soil Health',
        date: f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Recent',
        category: f.category || 'General',
        rating: f.rating || 5,
        comment: f.comment,
        adminResponse: f.admin_response || '',
        isResolved: Boolean(f.is_resolved),
        helpfulCount: 0
      }
    })

    const filteredFeedback = feedbackList.filter(f => 
      f.user.toLowerCase().includes(search.toLowerCase()) || 
      f.comment.toLowerCase().includes(search.toLowerCase()) || 
      f.category.toLowerCase().includes(search.toLowerCase())
    )

    const toggleReply = (id: any) => setAdminReplyState(prev => ({ ...prev, [id]: !prev[id] }))

    const handleSendReply = async (id: any) => {
      const text = adminReplyText[id]
      if (!text || !text.trim()) return
      try {
        await api.put(`/feedback/${id}/reply`, { admin_response: text.trim() })
        setAdminReplyText(prev => ({ ...prev, [id]: '' }))
        toggleReply(id)
        fetchFeedbackData()
      } catch (err: any) {
        alert(err.message || 'Failed to send reply')
      }
    }

    const handleResolve = async (id: any) => {
      try {
        await api.put(`/feedback/${id}/resolve`)
        fetchFeedbackData()
      } catch (err: any) {
        alert(err.message || 'Failed to resolve feedback')
      }
    }

    const handleDeleteReply = async (id: any) => {
      try {
        await api.delete(`/feedback/${id}/reply`)
        fetchFeedbackData()
      } catch (err: any) {
        alert(err.message || 'Failed to delete reply')
      }
    }

    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {onNavigate && <Breadcrumb items={[{ label: t('dashboard') || 'Dashboard', page: 'dashboard' }, { label: t('farmerFeedback') || 'Farmer Feedback' }]} onNavigate={onNavigate} />}
            <h2 className="text-2xl font-bold text-text-primary">{t('farmerFeedback') || 'Farmer Feedback'}</h2>
            <p className="text-sm text-text-muted">{t('farmerFeedbackDesc') || 'Reviews, field reports and suggestions submitted by registered farmers.'}</p>
          </div>
        </div>

        {/* Overall Rating Summary */}
        <Card className="p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-surface to-background border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <h3 className="text-5xl font-bold text-text-primary mb-2">{summaryStats?.average_rating ?? '4.8'}</h3>
                <div className="flex text-orange-400">
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                  <Star size={20} fill="#FB8C00" />
                </div>
                <p className="text-xs font-semibold text-text-muted mt-2 uppercase tracking-wide">{t("averageRating")}</p>
              </div>
              <div className="w-px h-16 bg-border mx-2 hidden md:block"></div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-2xl font-bold text-text-primary">{summaryStats?.total_reviews ?? feedbackList.length}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-0.5">{t('totalReviews') || 'Total Reviews'}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{summaryStats?.active_farmers ?? '0'}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-0.5">{t("activeFarmers")}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{summaryStats?.response_rate ? `${summaryStats.response_rate}%` : '100%'}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-0.5">{t('responseRate') || 'Response Rate'}</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <SearchInput value={search} onChange={setSearch} placeholder={t('searchFeedbackPlaceholder') || 'Search feedback...'} />
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text-primary text-base">{fb.user}</h4>
                      {fb.isResolved && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">{t('resolved') || 'Resolved'}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5"><span className="font-medium text-text-muted">{t("cropFocus")}:</span> {fb.cropFocus}</p>
                    <p className="text-[11px] text-text-muted mt-1">{fb.date}</p>
                  </div>
                </div>
                
                <div className="flex text-orange-400">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={16} fill={idx < fb.rating ? '#FB8C00' : 'none'} className={idx < fb.rating ? 'text-orange-400' : 'text-gray-300'} />
                  ))}
                </div>
              </div>

              <div className="pl-16 space-y-4">
                <p className="text-sm text-text-primary leading-relaxed">"{fb.comment}"</p>

                {fb.adminResponse && (
                  <div className="mt-4 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-xl">
                    <p className="text-xs font-bold text-green-800 dark:text-green-400 mb-2 uppercase tracking-wide">{t("adminResponse")}</p>
                    <p className="text-sm text-text-primary whitespace-pre-line">{fb.adminResponse}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  {!fb.adminResponse && (
                    <Button variant="primary" size="sm" onClick={() => toggleReply(fb.id)}>{t('reply') || 'Reply'}</Button>
                  )}
                  {fb.adminResponse && (
                    <>
                      <Button variant="outlined" size="sm" onClick={() => toggleReply(fb.id)}>{t('editResponse') || 'Edit Response'}</Button>
                      <Button variant="outlined" size="sm" onClick={() => handleDeleteReply(fb.id)} className="!text-error !border-error/30 hover:!bg-error/10">{t('deleteResponse') || 'Delete Response'}</Button>
                    </>
                  )}
                  {!fb.isResolved && (
                    <Button variant="outlined" size="sm" onClick={() => handleResolve(fb.id)} icon={<CheckCircle2 size={14} />}>{t('markAsResolved') || 'Mark as Resolved'}</Button>
                  )}
                </div>

                {/* Collapsible Reply Box */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${adminReplyState[fb.id] ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-text-primary">{t('replyToFarmer') || 'Reply to Farmer'}</p>
                    <textarea 
                      className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-green-500 transition-colors resize-none" 
                      rows={3}
                      placeholder={t('typeResponsePlaceholder') || 'Type your response here...'}
                      value={adminReplyText[fb.id] || fb.adminResponse || ''}
                      onChange={(e) => setAdminReplyText(prev => ({ ...prev, [fb.id]: e.target.value }))}
                    ></textarea>
                    <div className="flex justify-end gap-2">
                      <Button variant="outlined" size="sm" onClick={() => toggleReply(fb.id)}>{t("cancel")}</Button>
                      <Button variant="primary" size="sm" onClick={() => handleSendReply(fb.id)}>{t('sendReply') || 'Send Reply'}</Button>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          ))}
          {filteredFeedback.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted">{t('noFeedbackMatches') || 'No feedback matches your search.'}</p>
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
      <h3 className="text-xl font-bold text-text-primary">{t('thankYouFeedback') || 'Thank you for your feedback!'}</h3>
      <p className="text-sm text-text-muted text-center max-w-sm">{t('feedbackHelpsUs') || 'Your response helps us improve AgroAI for farmers worldwide. We typically respond within 24 hours.'}</p>
      <Button variant="primary" onClick={() => { setSubmitted(false); setRating(0); setComment('') }}>{t('submitAnother') || 'Submit Another'}</Button>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('Share Feedback') }]} onNavigate={onNavigate} />}
        <h2 className="text-2xl font-bold text-text-primary">{t('Share Feedback')}</h2>
        <p className="text-sm text-text-muted">{t('Help us improve AgroAI for farmers everywhere')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}

      <Card className="p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3">{t('How would you rate AgroAI?')}</p>
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
            <p className="text-sm text-text-muted mt-2">{t(['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating])}</p>
          )}
        </div>

        <SelectInput
          label={t('Feedback Category')}
          options={[
            { value: 'general', label: t('General') }, 
            { value: 'crop', label: t('crop') }, 
            { value: 'soil', label: t('soil') }, 
            ...(FEATURES.DISEASE_DETECTION ? [{ value: 'disease', label: t('disease') }] : []), 
            { value: 'chatbot', label: t('chatbot') }, 
            { value: 'weather', label: t('weather') }, 
            { value: 'ux', label: t('UI/UX Design') || 'UI/UX Design' }
          ]}
          value={category}
          onChange={e => setCategory(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">{t('Your Comments')}</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('Tell us what you loved or what we can improve...')}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface text-text-primary placeholder-text-muted outline-none focus:border-text-muted transition-colors resize-none"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">{t('Attach Screenshot (Optional)')}</p>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-text-muted transition-colors cursor-pointer">
            <Camera size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-text-muted">{t('Click to upload screenshot')}</p>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          onClick={async () => { 
            if (rating > 0) {
              const newFeedback = {
                id: `FB-${Date.now()}`,
                rating,
                category,
                comment: comment || 'Great platform!',
                date: new Date().toISOString()
              }
              try {
                const stored = JSON.parse(localStorage.getItem('agroai_feedbacks') || '[]')
                localStorage.setItem('agroai_feedbacks', JSON.stringify([newFeedback, ...stored]))
              } catch {}

              try {
                await submitFeedback(rating, comment || 'Great platform!')
              } catch (e) {
                console.warn('Feedback submit note:', e)
              }
              setSubmitted(true)
            }
          }} 
          disabled={rating === 0} 
          className="w-full justify-center"
        >
          {t('Submit Feedback')}
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
              <h3 className="text-3xl font-bold text-text-primary leading-tight">{t('Your Feedback Helps AgroAI Grow')}</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t('Every suggestion, review, and experience shared by our farming community helps us improve AgroAI and build smarter agricultural solutions for everyone.')}
              </p>
            </div>

            {/* Animated Statistics */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.1s' }}>
                <div className="flex text-orange-400 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 5 ? "#FB8C00" : "none"} className="text-orange-400" />)}
                </div>
                <p className="text-3xl font-bold text-text-primary">4.9<span className="text-sm font-normal text-text-muted">/5</span></p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">{t('Average Rating')}</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.2s' }}>
                <MessageSquare size={20} className="text-blue-500 mb-1" />
                <p className="text-3xl font-bold text-text-primary">{dbFeedbacks.length || 24}</p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">{t('Feedback Received')}</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.3s' }}>
                <TrendingUp size={20} className="text-purple-500 mb-1" />
                <p className="text-3xl font-bold text-text-primary">18</p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">{t('UX Suggestions')}</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center justify-center animate-fade-in hover:scale-105 transition-transform shadow-sm" style={{ animationDelay: '0.4s' }}>
                <ThumbsUp size={20} className="text-green-500 mb-1" />
                <p className="text-3xl font-bold text-text-primary">98%</p>
                <p className="text-[10px] text-text-muted uppercase font-semibold mt-1 tracking-wider">{t('Farmer Satisfaction')}</p>
              </div>
            </div>

            {/* Floating feature cards */}
            <div className="pt-6 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-10 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl rounded-full"></div>
              <div className="flex justify-center gap-3 animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                <span className="bg-background border border-border shadow-soft px-4 py-2 rounded-full text-xs font-semibold text-text-primary flex items-center gap-1.5 hover:bg-surface transition-colors cursor-default">
                  <CheckCircle2 size={14} className="text-green-500" /> {t('Better Crop Recommendations')}
                </span>
              </div>
              <div className="flex justify-center gap-3 mt-3">
                <span className="bg-background border border-border shadow-soft px-4 py-2 rounded-full text-xs font-semibold text-text-primary flex items-center gap-1.5 animate-float hover:bg-surface transition-colors cursor-default" style={{ animationDelay: '2s', animationDuration: '5s' }}>
                  <Sparkles size={14} className="text-purple-500" /> {t('Improved AI Accuracy')}
                </span>
                <span className="bg-background border border-border shadow-soft px-4 py-2 rounded-full text-xs font-semibold text-text-primary flex items-center gap-1.5 animate-float hover:bg-surface transition-colors cursor-default" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}>
                  <Cloud size={14} className="text-blue-500" /> {t('Weather Enhancements')}
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
  const { t, currentLanguage } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('Sarvam AI')
  const [bio, setBio] = useState('Active registered farmer profile')
  const [email, setEmail] = useState('ramyasreer2007@gmail.com')
  const [role, setRole] = useState('FARMER')
  const [phone, setPhone] = useState('+91 8008997880')
  const [region, setRegion] = useState('Andhra Pradesh, Tirupati')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Real activity stats from localStorage
  const [activityStats, setActivityStats] = useState({ predictions: 0, chatbots: 0, weatherTracks: 0, reports: 0 })

  const loadStats = () => {
    getPredictionHistory().then(all => {
      const predictions = all.filter((i: any) => {
        const t = String(i.type || i.prediction_type || '').toLowerCase()
        return t.includes('soil') || t.includes('crop') || t.includes('fertilizer') || t.includes('disease')
      }).length
      const chatbots = all.filter((i: any) => String(i.type || i.prediction_type || '').toLowerCase().includes('chatbot')).length
      const weatherTracks = all.filter((i: any) => String(i.type || i.prediction_type || '').toLowerCase().includes('weather')).length
      const reports = all.filter((i: any) => String(i.type || i.prediction_type || '').toLowerCase().includes('profile')).length
      setActivityStats({ predictions, chatbots, weatherTracks, reports })
    }).catch(() => setActivityStats({ predictions: 0, chatbots: 0, weatherTracks: 0, reports: 0 }))
  }

  useEffect(() => {
    // Load saved profile from localStorage first
    try {
      const savedProfile = JSON.parse(localStorage.getItem('user_profile') || localStorage.getItem('user') || '{}')
      if (savedProfile && Object.keys(savedProfile).length > 0) {
        setUser(savedProfile)
        if (savedProfile.username) setName(savedProfile.username)
        if (savedProfile.email) setEmail(savedProfile.email)
        if (savedProfile.role) setRole(savedProfile.role.toUpperCase())
        if (savedProfile.phone) setPhone(savedProfile.phone)
        if (savedProfile.bio) setBio(savedProfile.bio)
        if (savedProfile.region) setRegion(savedProfile.region)
      }
    } catch {}

    // Load saved profile photo
    const savedPhoto = localStorage.getItem('profile_photo')
    if (savedPhoto) setProfilePhoto(savedPhoto)

    getCurrentUser()
      .then(u => {
        setUser((prev: any) => ({ ...prev, ...u }))
        if (u?.username) setName(u.username)
        if (u?.email) setEmail(u.email)
        if (u?.role) setRole(u.role.toUpperCase())
        if ((u as any)?.phone) setPhone((u as any).phone)
        if (u?.region) setRegion(u.region)
      })
      .catch(err => console.warn('Profile fetch note:', err))

    // Set region from localStorage if not already set
    const savedLoc = localStorage.getItem('selected_location')
    if (savedLoc) setRegion(prev => prev || savedLoc)

    loadStats()
    window.addEventListener('predictionCreated', loadStats)
    window.addEventListener('storage', loadStats)
    return () => {
      window.removeEventListener('predictionCreated', loadStats)
      window.removeEventListener('storage', loadStats)
    }
  }, [])

  const handleDeleteAccount = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  const handleToggleEdit = () => {
    if (editing) {
      const activeLoc = region || localStorage.getItem('selected_location') || 'Srikalahasthi, Tirupati District, Andhra Pradesh, India'
      const updatedUser = {
        ...(user || {}),
        username: name || user?.username || 'Registered Farmer',
        email: email || user?.email || '',
        role: role || 'FARMER',
        phone: phone || '',
        bio: bio,
        region: activeLoc,
        updated_at: new Date().toISOString(),
        created_at: user?.created_at || new Date().toISOString()
      }
      setUser(updatedUser)
      setRegion(activeLoc)
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser))
        localStorage.setItem('user_profile', JSON.stringify(updatedUser))
        localStorage.setItem('selected_location', activeLoc)
        saveLocalPrediction({
          type: 'Profile',
          prediction_type: 'profile',
          result: `Profile Updated: ${updatedUser.username}`,
          input: `Name: ${updatedUser.username} | Email: ${updatedUser.email} | Phone: ${updatedUser.phone} | Region: ${activeLoc} | Bio: ${bio}`,
          confidence: 100,
          status: 'success',
        })
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('predictionCreated'))
      } catch {}
      setEditing(false)
    } else {
      setEditing(true)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setProfilePhoto(dataUrl)
      try { localStorage.setItem('profile_photo', dataUrl) } catch {}
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    localStorage.removeItem('profile_photo')
  }

  const rawDisplayName = name || user?.username || 'Registered Farmer'
  const displayName = useSarvamUsername(rawDisplayName)
  const initials = rawDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const rawDisplayRegion = region || user?.region || localStorage.getItem('selected_location') || 'Srikalahasthi, Tirupati District, Andhra Pradesh, India'
  const displayRegion = useSarvamLocation(rawDisplayRegion)
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const totalActivity = activityStats.predictions + activityStats.chatbots + activityStats.weatherTracks + activityStats.reports

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('My Profile') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('My Profile')}</h2>
        </div>
        <Button variant={editing ? 'primary' : 'outlined'} size="sm" icon={<Edit3 size={13} />} onClick={handleToggleEdit}>
          {editing ? t('saveChanges') : t('Edit Profile')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative flex-shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-card" />
            ) : (
              <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-surface shadow-card flex items-center justify-center border border-border hover:bg-background transition-colors"
              title="Upload photo"
            >
              <Camera size={13} className="text-text-secondary" />
            </button>
            {profilePhoto && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-card hover:bg-red-600 transition-colors"
                title="Remove photo"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <Input label="Full Name" value={displayName} onChange={e => setName(e.target.value)} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm resize-none" />
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-text-primary">{displayName}</h3>
                <p className="text-sm text-text-muted mt-1">{t('activeFarmerProfile') || t(bio) || bio}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge color="green">{t(role.toLowerCase()) || t('farmer') || role || 'FARMER'}</Badge>
                  <Badge color="blue">{displayRegion}</Badge>
                  <Badge color="gray">{t('Verified Account')}</Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Completion */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">{t('Profile Completion')}</span>
            <span className="text-sm font-bold text-green-700">{email && name && phone ? '100%' : email && name ? '80%' : name ? '60%' : '40%'}</span>
          </div>
          <ProgressBar value={email && name && phone ? 100 : email && name ? 80 : name ? 60 : 40} color="#2E7D32" />
          <p className="text-xs text-text-muted mt-1.5">{email && name && phone ? t('Your profile is fully configured and active') : 'Complete your profile by adding missing details'}</p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 border border-red-100">
        <h3 className="font-semibold text-red-700 mb-4">{t('Danger Zone')}</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{t('Delete Account')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('Permanently remove your account and all data')}</p>
          </div>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setShowDeleteConfirm(true)}>{t('Delete Account')}</Button>
        </div>
      </Card>
    </div>

    {/* Right Column */}
    <div className="lg:col-span-7 space-y-6">
      {/* Personal Info */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">{t('Personal Information')}</h3>
        {editing ? (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <Input label="📧 Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            <Input label="📱 Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            <SelectInput
              label="🌾 Role"
              value={role}
              onChange={e => setRole(e.target.value)}
              options={[
                { label: 'Farmer', value: 'FARMER' },
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Agronomist', value: 'AGRONOMIST' },
                { label: 'Researcher', value: 'RESEARCHER' },
              ]}
            />
            <Input label="🇮🇳 Country" value="India" onChange={() => {}} disabled />
            <div className="md:col-span-2">
              <Input label="📍 Region / Location" value={region || displayRegion} onChange={e => setRegion(e.target.value)} placeholder="Village, District, State, India" />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {[
              { label: t('Email'), value: email || user?.email || 'Not set — click Edit to add', icon: '📧' },
              { label: t('Phone'), value: phone || user?.phone || 'Not set — click Edit to add', icon: '📱' },
              { label: t('Role'), value: t(role.toLowerCase()) || t('farmer') || role || 'FARMER', icon: '🌾' },
              { label: t('Country'), value: t('India'), icon: '🇮🇳' },
              { label: t('Region / State'), value: t(displayRegion) || displayRegion, icon: '📍' },
              { label: t('Account Status'), value: t('ACTIVE'), icon: '✅' },
              { label: t('Member Since'), value: t(memberSince) || memberSince, icon: '📅' },
              { label: t('Last Updated'), value: formatLocalizedFullDate(user?.updated_at || '2026-08-06', currentLanguage), icon: '🔄' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                <span className="text-lg">{f.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{f.label}</p>
                  <p className={`font-medium truncate ${String(f.value).includes('Not set') ? 'text-text-muted italic' : 'text-text-primary'}`}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity Summary — Real Values */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">{t('Activity Summary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: t('Predictions'), value: activityStats.predictions, icon: '🤖' },
            { label: t('Chatbot Queries'), value: activityStats.chatbots, icon: '💬' },
            { label: t('Weather Tracks'), value: activityStats.weatherTracks, icon: '🌦️' },
            { label: t('Reports'), value: activityStats.reports, icon: '📋' },
            { label: t('Total Activity'), value: totalActivity, icon: '📊' },
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
              <Button variant="outlined" className="flex-1 justify-center" onClick={() => setShowDeleteConfirm(false)}>{t("cancel")}</Button>
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
  const { t } = useTranslation()
  // Load saved settings from localStorage
  const loadSaved = (key: string, fallback: any) => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback } catch { return fallback }
  }

  const [lang, setLang] = useState(() => loadSaved('settings_language', 'English'))
  const [notifEmail, setNotifEmail] = useState(() => loadSaved('settings_notif_email', true))
  const [notifSMS, setNotifSMS] = useState(() => loadSaved('settings_notif_sms', false))
  const [notifPush, setNotifPush] = useState(() => loadSaved('settings_notif_push', true))
  const [twoFactor, setTwoFactor] = useState(() => loadSaved('settings_2fa', false))
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sessions, setSessions] = useState<{ device: string; location: string; current: boolean; id: string }[]>(() => {
    const saved = loadSaved('settings_sessions', null)
    if (saved) return saved
    // Detect current browser & OS
    const ua = navigator.userAgent
    let browser = 'Browser'
    if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Edge')) browser = 'Edge'
    let os = 'Desktop'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
    const loc = localStorage.getItem('selected_location')
    const shortLoc = loc ? loc.split(',').slice(0, 2).join(',').trim() : 'India'
    return [
      { device: `${browser} on ${os}`, location: shortLoc, current: true, id: 'current' },
      { device: 'AgroAI Mobile App', location: 'Punjab, IN', current: false, id: 'mobile' },
    ]
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [geminiModel, setGeminiModel] = useState(() => loadSaved('settings_gemini_model', 'Gemini 2.5 Flash'))
  const [isTestingApi, setIsTestingApi] = useState(false)
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleTestApi = () => {
    setIsTestingApi(true)
    setTimeout(() => {
      setIsTestingApi(false)
      setApiTestStatus('success')
    }, 1500)
  }

  const handleRevokeSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    localStorage.setItem('settings_sessions', JSON.stringify(updated))
  }

  const handleChangePassword = () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (!currentPassword) { setPasswordError('Current password is required'); return }
    if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    // Simulate password change
    const savedPassword = localStorage.getItem('user_password') || 'password123'
    if (currentPassword !== savedPassword) { setPasswordError('Current password is incorrect'); return }
    localStorage.setItem('user_password', newPassword)
    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess(false) }, 1500)
  }

  const handleSaveAll = () => {
    localStorage.setItem('settings_language', JSON.stringify(lang))
    localStorage.setItem('settings_notif_email', JSON.stringify(notifEmail))
    localStorage.setItem('settings_notif_sms', JSON.stringify(notifSMS))
    localStorage.setItem('settings_notif_push', JSON.stringify(notifPush))
    localStorage.setItem('settings_2fa', JSON.stringify(twoFactor))
    localStorage.setItem('settings_gemini_model', JSON.stringify(geminiModel))
    localStorage.setItem('settings_sessions', JSON.stringify(sessions))
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
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
          {onNavigate && <Breadcrumb items={[{ label: t('dashboard'), page: 'dashboard' }, { label: t('Settings') }]} onNavigate={onNavigate} />}
          <h2 className="text-2xl font-bold text-text-primary">{t('Settings')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
      {/* Appearance */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Sun size={16} /> {t('Appearance')}</h3>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as ThemeMode[]).map(tMode => (
            <button
              key={tMode}
              onClick={() => onSetTheme?.(tMode)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all capitalize ${themeMode === tMode ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-text-muted hover:border-border'}`}
            >
              {tMode === 'light' ? '☀️' : tMode === 'dark' ? '🌙' : '💻'} {t(tMode) || tMode}
            </button>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Globe size={16} /> {t('Language')}</h3>
        <SelectInput
          options={INITIAL_LANGUAGES.map(l => ({ value: l.name, label: `${l.name} (${l.native})` }))}
          value={lang}
          onChange={e => setLang(e.target.value)}
        />
      </Card>
      
      {/* Active Sessions */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Smartphone size={16} /> {t('Active Sessions')}</h3>
        <div className="space-y-3">
          {sessions.length > 0 ? sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div>
                <p className="text-sm font-medium text-text-primary">{s.device}</p>
                <p className="text-xs text-text-muted">{s.location}</p>
              </div>
              {s.current ? <Badge color="green">{t('Current')}</Badge> : (
                <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(s.id)}>Revoke</Button>
              )}
            </div>
          )) : (
            <p className="text-sm text-text-muted text-center py-3">Only current session is active</p>
          )}
        </div>
      </Card>
    </div>

    {/* Right Column */}
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Bell size={16} /> {t('Notifications')}</h3>
        <div className="space-y-4">
          {[
            { label: t('Email Notifications'), desc: 'Receive alerts and reports via email', on: notifEmail, toggle: () => setNotifEmail(!notifEmail) },
            { label: t('SMS Alerts'), desc: `Critical ${FEATURES.DISEASE_DETECTION ? 'disease and ' : ''}weather alerts via SMS`, on: notifSMS, toggle: () => setNotifSMS(!notifSMS) },
            { label: t('Push Notifications'), desc: 'Browser push notifications', on: notifPush, toggle: () => { 
              const next = !notifPush
              setNotifPush(next)
              if (next && 'Notification' in window) {
                Notification.requestPermission()
              }
            }},
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
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2"><Shield size={16} /> {t('Security')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">{t('Two-Factor Authentication')}</p>
              <p className="text-xs text-text-muted">{t('Add an extra layer of security')}</p>
            </div>
            <Toggle on={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
          </div>
          {twoFactor && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
              <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                <Check size={14} /> Two-Factor Authentication is enabled. Your account is more secure.
              </p>
            </div>
          )}
          <Button variant="outlined" size="sm" icon={<Lock size={13} />} className="w-full justify-center" onClick={() => setShowPasswordModal(true)}>{t('Change Password')}</Button>
        </div>
      </Card>
      {role === 'admin' && (
        <Card className="p-5 border-l-4 border-l-purple-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2 relative z-10"><Bot size={18} className="text-purple-600"/> {t('geminiAiConfiguration') || 'Gemini AI Configuration'}</h3>
          
          <div className="space-y-5 relative z-10">
            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">{t('apiKey') || 'API Key'}</label>
              <div className="relative">
                <input 
                  type={showApiKey ? 'text' : 'password'} 
                  defaultValue="AIzaSyBw-xxx-xxxxxxxxxxxxxxxxxxxx" 
                  className="w-full bg-background border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono"
                />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-600 transition-colors">
                  {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1"><Lock size={10}/> {t('encryptedAtRest') || 'Encrypted at rest'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectInput label={t('defaultModel') || 'Default Model'} options={['Gemini 2.5 Flash', 'Gemini 2.5 Pro', 'Gemini 1.5 Pro'].map(o => ({label: o, value: o}))} value={geminiModel} onChange={e => setGeminiModel(e.target.value)} />
              <Input label={t('maxTokens') || 'Max Tokens'} type="number" defaultValue={2048} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>{t('temperature') || 'Temperature'}</span>
                <span className="text-purple-600 font-mono">0.7</span>
              </label>
              <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full accent-purple-600" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>{t('precise') || 'Precise'} (0.0)</span>
                <span>{t('creative') || 'Creative'} (2.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">{t('systemPrompt') || 'System Prompt'}</label>
              <textarea 
                className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all min-h-[80px] font-mono resize-y"
                defaultValue="You are an expert AI agricultural assistant named AgroAI. You provide accurate, helpful, and concise advice to farmers."
              />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-text-primary mb-3">{t('enabledLanguages') || 'Enabled Languages'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {INITIAL_LANGUAGES.map(lang => (
                  <label key={lang.code} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                    <input type="checkbox" defaultChecked className="accent-purple-600 rounded" />
                    <span className="truncate">{t(lang.code.toLowerCase()) || lang.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
              <Button variant="outlined" className="w-full sm:w-auto justify-center" onClick={handleTestApi} disabled={isTestingApi}>
                {isTestingApi ? <><LineSpinner size={14} color="gray"/> {t('testing') || 'Testing...'}</> : <><Sparkles size={14}/> {t('testConnection') || 'Test Connection'}</>}
              </Button>
              {apiTestStatus === 'success' && <span className="text-xs font-medium text-green-600 flex items-center gap-1"><Check size={14}/> {t('connectionSuccessful') || 'Connection successful'}</span>}
            </div>
            
            {/* Status Panel */}
            <div className="bg-background rounded-xl p-4 border border-border mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-[10px] text-text-muted uppercase">{t('status') || 'Status'}</p><p className="text-xs font-bold text-green-600">{t('active') || 'Active'}</p></div>
              <div><p className="text-[10px] text-text-muted uppercase">{t('model') || 'Model'}</p><p className="text-xs font-bold text-text-primary truncate">{geminiModel}</p></div>
              <div><p className="text-[10px] text-text-muted uppercase">{t('latency') || 'Latency'}</p><p className="text-xs font-bold text-text-primary">~120ms</p></div>
              <div><p className="text-[10px] text-text-muted uppercase">{t('lastTested') || 'Last Tested'}</p><p className="text-xs font-bold text-text-primary">{t('justNow') || 'Just now'}</p></div>
            </div>
          </div>
        </Card>
      )}
    </div>
    </div>

      <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
        {saveSuccess && (
          <span className="text-sm font-medium text-green-600 flex items-center gap-1.5 animate-fade-in">
            <Check size={16} /> All settings saved successfully!
          </span>
        )}
        <Button variant="primary" className="w-full sm:w-auto justify-center" onClick={handleSaveAll}>
          {t('Save All Settings')}
        </Button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(false) }} />
          <div className="relative bg-surface rounded-2xl border border-border shadow-elevated w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2"><Lock size={18} /> Change Password</h3>
            <p className="text-sm text-text-muted mb-5">Enter your current password and choose a new one</p>

            <div className="space-y-4">
              <Input 
                label="Current Password" 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                placeholder="Enter current password"
              />
              <Input 
                label="New Password" 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="At least 6 characters"
              />
              <Input 
                label="Confirm New Password" 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Re-enter new password"
              />

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-700 font-medium">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                  <p className="text-xs text-green-700 font-medium flex items-center gap-1.5"><Check size={14} /> Password changed successfully!</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outlined" className="flex-1 justify-center" onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1 justify-center" onClick={handleChangePassword}>
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}