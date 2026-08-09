import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Upload, Camera, Image, CheckCircle2, Download, RotateCcw, Leaf, Sprout, FlaskConical, Bug, AlertTriangle, Info, Sparkles, Bot, CloudRain, Droplets, Thermometer, RefreshCw, History, AlertCircle, Share2, Save, X, MapPin, Navigation, Search, Wind, Gauge, Clock, TrendingUp, ShieldAlert } from 'lucide-react'
import { Card, Button, Input, SelectInput, SearchInput, Badge, ProgressBar, Breadcrumb, LineSpinner } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FEATURES } from '../config'

// ---- Soil Classification ----
export function SoilClassification({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [stage, setStage] = useState<'upload' | 'processing' | 'result'>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    setStage('processing')
    setTimeout(() => setStage('result'), 2200)
  }

  const soilProbs = [
    { soil: 'Sandy Loam', prob: 72 },
    { soil: 'Clay Loam', prob: 18 },
    { soil: 'Silt Loam', prob: 6 },
    { soil: 'Sandy Clay', prob: 4 },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Soil Classification' }]} onNavigate={onNavigate} />}
        <h2 className="text-2xl font-bold text-text-primary">Soil Classification</h2>
        <p className="text-sm text-text-muted">Upload a soil sample image for AI-powered classification</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4">Upload Soil Image</h3>
          {stage === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all-smooth ${dragOver ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-400 hover:bg-green-50/50'}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Image size={28} className="text-green-600" />
              </div>
              <p className="font-semibold text-text-secondary mb-1">Drag & drop soil image</p>
              <p className="text-sm text-text-muted mb-4">PNG, JPG, HEIC up to 10MB</p>
              <div className="flex justify-center gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  <Button variant="primary" size="sm" icon={<Upload size={14} />} onClick={() => {}}>Upload File</Button>
                </label>
                <Button variant="outlined" size="sm" icon={<Camera size={14} />}>Use Camera</Button>
              </div>
            </div>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-12">
              {preview && <img src={preview} alt="Soil sample" className="w-32 h-32 rounded-xl object-cover shadow-card" />}
              <div className="flex items-center gap-2 text-green-700">
                <LineSpinner size={20} color="#2E7D32" strokeWidth={2} />
                <span className="font-semibold">AI is analyzing your soil sample...</span>
              </div>
              <div className="w-48">
                <ProgressBar value={75} color="#2E7D32" />
              </div>
              <p className="text-xs text-text-muted">Running CNN model inference...</p>
            </div>
          )}

          {stage === 'result' && preview && (
            <div>
              <img src={preview} alt="Soil sample" className="w-full h-48 rounded-xl object-cover shadow-soft mb-4" />
              <button onClick={() => { setStage('upload'); setPreview(null) }} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary">
                <RotateCcw size={13} /> Analyze new sample
              </button>
            </div>
          )}

          {stage === 'upload' && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Recent Analyses</h4>
              <div className="space-y-2">
                {['Red Loam - Jul 23', 'Black Cotton - Jul 21', 'Sandy Loam - Jul 18'].map(s => (
                  <div key={s} className="flex items-center gap-3 p-2.5 rounded-xl bg-background text-sm text-text-secondary">
                    <Leaf size={14} className="text-green-500 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Results */}
        {stage === 'result' ? (
          <div className="space-y-4">
            <Card className="p-5 border-l-4 border-green-500">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-text-muted font-medium">Predicted Soil Type</p>
                  <h3 className="text-2xl font-bold text-text-primary">Sandy Loam</h3>
                </div>
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">72% confidence</span>
                </div>
              </div>
              <p className="text-sm text-text-secondary">Sandy loam soil with good drainage properties. Ideal for root vegetables and most cereals. pH range: 6.0–7.0</p>
            </Card>

            <Card className="p-5">
              <h4 className="font-semibold text-text-primary mb-3">Probability Distribution</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={soilProbs} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="soil" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} formatter={(v) => [`${v}%`]} />
                  <Bar dataKey="prob" fill="#2E7D32" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h4 className="font-semibold text-text-primary mb-3">Suitable Crops</h4>
              <div className="flex flex-wrap gap-2">
                {['Wheat', 'Maize', 'Groundnut', 'Carrot', 'Potato', 'Barley', 'Oats'].map(c => (
                  <Badge key={c} color="green">{c}</Badge>
                ))}
              </div>
            </Card>

            <Button variant="primary" icon={<Download size={14} />} className="w-full justify-center">Download Soil Report (PDF)</Button>
          </div>
        ) : (
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-text-primary mb-4">How It Works</h4>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Upload Image', desc: 'Photograph soil sample in natural daylight against neutral background' },
                  { step: '2', title: 'AI Analysis', desc: 'Our CNN model processes 48 visual features to classify soil texture' },
                  { step: '3', title: 'Get Results', desc: 'Receive soil type, confidence score, and crop recommendations' },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.step}</div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{s.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Model Accuracy</span>
              </div>
              <p className="text-2xl font-bold text-green-700">96.4%</p>
              <p className="text-xs text-green-600">Validated on 185K samples across 12 soil types</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ---- Crop Recommendation ----

const loadingSteps = [
  { label: 'Analyzing Soil Image...', detail: 'Running CNN model on uploaded sample' },
  { label: 'Extracting Features...', detail: 'Identifying soil texture, color, and composition' },
  { label: 'Processing Soil Nutrients...', detail: 'Mapping N, P, K and pH profiles' },
  { label: 'Comparing Crop Profiles...', detail: 'Evaluating 22 crop species against parameters' },
  { label: 'Generating Recommendation...', detail: 'Finalizing AI prediction with confidence score' },
]

function FieldInput({
  label, unit, icon, placeholder, helper, value, onChange, error,
}: {
  label: string; unit: string; icon: React.ReactNode; placeholder: string; helper: string;
  value: string; onChange: (v: string) => void; error: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
        <span className="text-text-muted">{icon}</span>
        {label}
        {unit && <span className="text-text-muted font-normal">({unit})</span>}
      </label>
      <div className={`relative rounded-xl border transition-all-smooth bg-surface ${error ? 'border-red-300 ring-1 ring-red-200' : value ? 'border-green-300 ring-1 ring-green-100' : 'border-border hover:border-border'}`}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent font-medium text-text-primary placeholder-text-muted outline-none"
        />
        {value && !error && (
          <CheckCircle2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500" />
        )}
        {error && (
          <AlertCircle size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400" />
        )}
      </div>
      <p className="text-[10px] text-text-muted">{helper}</p>
    </div>
  )
}

function AILoadingPanel() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 2
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const s = Math.floor(progress / 20)
    setStep(Math.min(s, loadingSteps.length - 1))
  }, [progress])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[480px] gap-8 px-6">
      {/* Line-art botanical plant with AI scanner sweep */}
      <div className="relative flex items-center justify-center">
        {/* Outer dashed orbit ring — stroke only */}
        <div className="absolute w-48 h-48 rounded-full border border-green-100 border-dashed animate-spin-slow" style={{ animationDuration: '18s' }} />
        {/* Inner solid orbit ring */}
        <div className="absolute w-36 h-36 rounded-full border border-green-50" />

        {/* Plant SVG container with scanner overlay */}
        <div className="relative flex-shrink-0" style={{ width: 110, height: 148 }}>
          <svg viewBox="-55 -76 110 148" width="110" height="148" aria-hidden="true">
            {/* Roots */}
            <path d="M 0 60 C -14 70 -26 78 -32 90" stroke="#A5D6A7" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M 0 60 C 14 70 26 78 32 90" stroke="#A5D6A7" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M 0 60 C 0 72 1 80 2 92" stroke="#C8E6C9" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            {/* Stem */}
            <path d="M 0 60 L 0 -32" stroke="#2E7D32" fill="none" strokeWidth="3" strokeLinecap="round" />
            {/* Left leaf outline */}
            <path d="M 0 14 C -20 7 -32 -7 -26 -26 C -12 -14 0 14 0 14"
              stroke="#43A047" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Right leaf outline */}
            <path d="M 0 -4 C 20 -11 32 -26 26 -44 C 12 -30 0 -4 0 -4"
              stroke="#2E7D32" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Top bud outline */}
            <path d="M 0 -32 C -9 -46 -5 -58 0 -62 C 5 -58 9 -46 0 -32"
              stroke="#66BB6A" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* AI circuit traces */}
            <path d="M -26 -24 L -44 -24 L -48 -16" stroke="#4DD0E1" fill="none" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.65" />
            <circle cx="-48" cy="-16" r="2.2" stroke="#4DD0E1" fill="none" strokeWidth="1.1" strokeOpacity="0.75" />
            <path d="M 26 -42 L 44 -42 L 48 -34" stroke="#4DD0E1" fill="none" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.65" />
            <circle cx="48" cy="-34" r="2.2" stroke="#4DD0E1" fill="none" strokeWidth="1.1" strokeOpacity="0.75" />
          </svg>
          {/* Scanner line — brand green → teal gradient sweep */}
          <div
            className="animate-scanner-sweep pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(46,125,50,0.35), rgba(77,208,225,0.55), rgba(46,125,50,0.35), transparent)' }}
          />
        </div>
      </div>

      <div className="text-center animate-step" key={step}>
        <h3 className="text-lg font-bold text-text-primary mb-1">{loadingSteps[step].label}</h3>
        <p className="text-sm text-text-muted">{loadingSteps[step].detail}</p>
      </div>

      {/* Step indicators */}
      <div className="w-full max-w-xs space-y-2">
        {loadingSteps.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${i <= step ? 'opacity-100' : 'opacity-25'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
              i < step  ? 'border-green-500 bg-green-500' :
              i === step ? 'border-green-500 bg-transparent' :
              'border-border bg-transparent'
            }`}>
              {i < step
                ? <CheckCircle2 size={9} className="text-white" />
                : i === step
                  ? <LineSpinner size={9} color="#2E7D32" strokeWidth={2.2} />
                  : <span className="w-1.5 h-1.5 rounded-full bg-background block" />
              }
            </div>
            <span className={i === step ? 'font-semibold text-text-secondary' : i < step ? 'text-green-600' : 'text-text-muted'}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Vine progress — growing stem line with leaf tip */}
      <div className="w-full max-w-xs">
        <div className="relative h-1.5 bg-green-50 rounded-full overflow-visible border border-green-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#1B5E20,#2E7D32,#43A047)', boxShadow: '0 0 5px rgba(46,125,50,0.35)' }}
          />
          {/* Leaf tip at vine end */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-100"
            style={{ left: `${Math.max(progress, 3)}%` }}
          >
            <svg width="10" height="10" viewBox="-5 -5 10 10" aria-hidden="true">
              <path d="M 0 4 C -3 1 -4 -2 -1 -4 C 0 -2 0 4 0 4" stroke="#43A047" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 0 4 C 3 1 4 -2 1 -4 C 0 -2 0 4 0 4" stroke="#66BB6A" fill="none" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function AIEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[520px] gap-8 px-6 py-10">
      {/* Illustration — container sized to contain all orbit rings (128 + 2×48 = 224px) */}
      <div className="relative w-56 h-56 flex items-center justify-center flex-shrink-0">
        {/* Outer orbit ring */}
        <div className="absolute inset-0 rounded-full border border-green-50" />
        {/* Inner orbit ring: 224 - 2×24 = 176px */}
        <div className="absolute inset-6 rounded-full border border-green-100 border-dashed" />
        {/* Core circle */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center shadow-soft relative z-10">
          <div className="relative">
            <Sprout size={48} className="text-green-500" />
            <Sparkles size={18} className="text-orange-400 absolute -top-2 -right-3 animate-float" style={{ animationDelay: '0.5s' }} />
            <Bot size={16} className="text-blue-400 absolute -bottom-1 -left-3 animate-float" style={{ animationDelay: '1.2s' }} />
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold text-text-primary mb-3">Ready for AI Analysis</h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-sm">
          Upload a soil image, provide your soil parameters, and select your location. Weather information is automatically retrieved to generate an accurate AI-powered crop recommendation.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { icon: <Image size={18} className="text-green-600" />, label: 'AI Soil Analysis', desc: 'CNN-powered soil image analysis', bg: 'bg-green-50 border-green-100' },
          { icon: <CloudRain size={18} className="text-blue-600" />, label: 'Climate Matching', desc: 'Real-time weather auto-fetched from your location', bg: 'bg-blue-50 border-blue-100' },
          { icon: <Sparkles size={18} className="text-orange-500" />, label: 'Smart Crop Rec.', desc: 'AI combines soil image, parameters & live weather', bg: 'bg-orange-50 border-orange-100' },
        ].map(f => (
          <div key={f.label} className={`${f.bg} border rounded-xl p-3 text-center`}>
            <div className="flex justify-center mb-2">{f.icon}</div>
            <p className="text-[11px] font-semibold text-text-secondary leading-tight mb-0.5">{f.label}</p>
            <p className="text-[9px] text-text-muted leading-tight">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 max-w-sm">
        <AlertCircle size={13} className="flex-shrink-0 text-amber-500" />
        Required: Soil Image + Nitrogen + Phosphorus + Potassium + Soil pH. Temperature, humidity, and rainfall are automatically retrieved from your selected location.
      </div>
    </div>
  )
}

function ResultPanel({ imagePreview, onNewPrediction, onViewHistory }: {
  imagePreview: string | null
  onNewPrediction: () => void
  onViewHistory?: () => void
}) {
  const [visibleCards, setVisibleCards] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCards(v => {
        if (v >= 4) { clearInterval(timer); return v }
        return v + 1
      })
    }, 180)
    return () => clearInterval(timer)
  }, [])

  const cards = [
    // Card 1 — Soil Analysis
    <div key="soil" className="bg-surface rounded-2xl shadow-card border border-border p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <Leaf size={16} className="text-amber-600" />
        </div>
        <h4 className="font-bold text-text-primary">Soil Analysis</h4>
        <Badge color="green">AI Vision</Badge>
      </div>
      <div className="flex gap-4">
        {imagePreview ? (
          <img src={imagePreview} alt="Soil sample" className="w-20 h-20 rounded-xl object-cover shadow-soft flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <Leaf size={24} className="text-amber-400" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-xs text-text-muted">Predicted Soil Type</p>
            <p className="font-bold text-text-primary">Black Cotton Soil</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background rounded-lg px-2 py-1.5">
              <p className="text-text-muted">Confidence</p>
              <p className="font-bold text-green-700">98.2%</p>
            </div>
            <div className="bg-background rounded-lg px-2 py-1.5">
              <p className="text-text-muted">Pred. Time</p>
              <p className="font-bold text-text-secondary">0.34s</p>
            </div>
          </div>
          <p className="text-[10px] text-text-muted">Model: ResNet-50 v3.0</p>
        </div>
      </div>
    </div>,

    // Card 2 — Recommended Crop
    <div key="crop" className="bg-surface rounded-2xl shadow-card border border-l-4 border-green-500 p-5 animate-fade-in" style={{ borderLeftWidth: 4 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sprout size={16} className="text-white" />
          </div>
          <h4 className="font-bold text-text-primary">Recommended Crop</h4>
        </div>
        <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1 rounded-full">
          <CheckCircle2 size={12} className="text-green-600" />
          <span className="text-xs font-bold text-green-700">96.2%</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-4xl">
          🌾
        </div>
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Rice</h3>
          <p className="text-sm text-text-muted">Oryza sativa</p>
          <Badge color="green">Best Match</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Growing Season', value: 'Kharif (Jun–Nov)', icon: '🗓️' },
          { label: 'Suitable Region', value: 'Punjab, Haryana', icon: '📍' },
          { label: 'Expected Yield', value: '4.5–6.0 t/ha', icon: '📦' },
          { label: 'Water Req.', value: '1200–1500 mm', icon: '💧' },
          { label: 'Harvest Time', value: '90–120 days', icon: '⏱️' },
          { label: 'Difficulty', value: 'Moderate', icon: '⭐' },
        ].map(d => (
          <div key={d.label} className="flex items-start gap-1.5 bg-background rounded-lg px-2.5 py-2">
            <span className="text-sm flex-shrink-0">{d.icon}</span>
            <div>
              <p className="text-text-muted text-[9px]">{d.label}</p>
              <p className="font-semibold text-text-secondary">{d.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide mb-3">Top 5 Recommended Crops</h4>
        <div className="space-y-2">
          {[
            { rank: 1, name: 'Rice', conf: 96.2, color: 'bg-green-500' },
            { rank: 2, name: 'Maize', conf: 92.1, color: 'bg-blue-500' },
            { rank: 3, name: 'Sugarcane', conf: 88.5, color: 'bg-yellow-500' },
            { rank: 4, name: 'Cotton', conf: 84.3, color: 'bg-purple-500' },
            { rank: 5, name: 'Jute', conf: 79.8, color: 'bg-orange-500' },
          ].map(c => (
            <div key={c.rank} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted w-4">#{c.rank}</span>
                <span className="font-semibold text-text-primary text-sm">{c.name}</span>
              </div>
              <div className="flex items-center gap-3 w-32">
                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.conf}%` }} />
                </div>
                <span className="text-xs font-bold text-text-secondary w-8 text-right">{c.conf}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // Card 3 — AI Explanation
    <div key="explain" className="bg-surface rounded-2xl shadow-card border border-border p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Bot size={16} className="text-purple-600" />
        </div>
        <h4 className="font-bold text-text-primary">AI Explanation</h4>
        <Badge color="purple">Explainable AI</Badge>
      </div>
      <div className="bg-background rounded-xl p-4 border-l-3 border-purple-300" style={{ borderLeftWidth: 3 }}>
        <p className="text-sm text-text-secondary leading-relaxed">
          The uploaded soil image was classified as <strong>Black Cotton Soil</strong> with <strong>98.2% confidence</strong>. Based on your soil parameters — Nitrogen: 90 mg/kg, Phosphorus: 42 mg/kg, Potassium: 43 mg/kg, pH: 6.5 — combined with automatically retrieved weather conditions (Rainfall: 103mm, Temperature: 25°C, Humidity: 71%) from your selected location — <strong>Rice</strong> provides the highest expected yield under current environmental conditions.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Black Soil Detected', 'pH in Rice Range', 'Optimal Humidity', 'Sufficient Rainfall', 'Good NPK Balance'].map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold border border-green-100">
            <CheckCircle2 size={9} /> {tag}
          </span>
        ))}
      </div>
    </div>,

    // Card 4 — Recommendations
    <div key="recs" className="bg-surface rounded-2xl shadow-card border border-border p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Sparkles size={16} className="text-blue-600" />
        </div>
        <h4 className="font-bold text-text-primary">Recommendations</h4>
      </div>
      <div className="space-y-3">
        {[
          { icon: <FlaskConical size={14} className="text-green-600" />, title: 'Organic Fertilizer', desc: 'Apply FYM 10–15 t/ha, 2–3 weeks before transplanting. Supplement with vermicompost at 5 t/ha.', bg: 'bg-green-50 border-green-100' },
          { icon: <Droplets size={14} className="text-blue-600" />, title: 'Irrigation Advice', desc: 'Maintain 5–10 cm standing water during vegetative phase. Drain field 10 days before harvest.', bg: 'bg-blue-50 border-blue-100' },
          { icon: <Sprout size={14} className="text-amber-600" />, title: 'Planting Tips', desc: 'Transplant 20–25 day seedlings at 20×15 cm spacing. Best window: June 15 – July 15.', bg: 'bg-amber-50 border-amber-100' },
          { icon: <Bug size={14} className="text-orange-600" />, title: 'Disease Prevention', desc: 'Apply carbendazim seed treatment. Monitor for bacterial leaf blight during humid spells above 85%.', bg: 'bg-orange-50 border-orange-100' },
          { icon: <CheckCircle2 size={14} className="text-purple-600" />, title: 'Harvest Recommendation', desc: 'Harvest at 80% grain maturity (85–90 days after transplanting). Moisture content: 20–22%.', bg: 'bg-purple-50 border-purple-100' },
        ].map(r => (
          <div key={r.title} className={`flex gap-3 ${r.bg} border rounded-xl p-3`}>
            <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 shadow-soft">{r.icon}</div>
            <div>
              <p className="text-xs font-bold text-text-primary mb-0.5">{r.title}</p>
              <p className="text-[11px] text-text-muted leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,
  ]

  return (
    <div className="flex flex-col gap-4">
      {cards.slice(0, visibleCards)}
      {visibleCards >= 4 && (
        <div className="flex flex-wrap gap-2 animate-fade-in pt-1">
          <Button variant="primary" size="sm" icon={<Download size={13} />} className="flex-1 justify-center">Download PDF Report</Button>
          <Button variant="outlined" size="sm" icon={<Save size={13} />}>Save</Button>
          <Button variant="ghost" size="sm" icon={<Share2 size={13} />}>Share</Button>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={onNewPrediction}>New</Button>
          {onViewHistory && (
            <Button variant="ghost" size="sm" icon={<History size={13} />} onClick={onViewHistory}>History</Button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Location database for autocomplete ──
const LOCATIONS = [
  // Punjab
  { label: 'Kotkapura', sub: 'Faridkot, Punjab, India', district: 'Faridkot', state: 'Punjab', lat: 30.9818, lng: 74.7590 },
  { label: 'Ludhiana', sub: 'Ludhiana, Punjab, India', district: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { label: 'Amritsar', sub: 'Amritsar, Punjab, India', district: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { label: 'Bathinda', sub: 'Bathinda, Punjab, India', district: 'Bathinda', state: 'Punjab', lat: 30.2110, lng: 74.9455 },
  { label: 'Faridkot', sub: 'Faridkot, Punjab, India', district: 'Faridkot', state: 'Punjab', lat: 30.6680, lng: 74.7590 },
  { label: 'Muktsar', sub: 'Sri Muktsar Sahib, Punjab, India', district: 'Sri Muktsar Sahib', state: 'Punjab', lat: 30.4737, lng: 74.5158 },
  { label: 'Jaito', sub: 'Faridkot, Punjab, India', district: 'Faridkot', state: 'Punjab', lat: 30.4460, lng: 74.8930 },
  { label: 'Moga', sub: 'Moga, Punjab, India', district: 'Moga', state: 'Punjab', lat: 30.8178, lng: 75.1727 },
  { label: 'Patiala', sub: 'Patiala, Punjab, India', district: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869 },
  { label: 'Jalandhar', sub: 'Jalandhar, Punjab, India', district: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762 },
  { label: 'Chandigarh', sub: 'Chandigarh, UT, India', district: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  // Haryana
  { label: 'Hisar', sub: 'Hisar, Haryana, India', district: 'Hisar', state: 'Haryana', lat: 29.1508, lng: 75.7210 },
  { label: 'Karnal', sub: 'Karnal, Haryana, India', district: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905 },
  { label: 'Rohtak', sub: 'Rohtak, Haryana, India', district: 'Rohtak', state: 'Haryana', lat: 28.8955, lng: 76.6066 },
  { label: 'Sirsa', sub: 'Sirsa, Haryana, India', district: 'Sirsa', state: 'Haryana', lat: 29.5329, lng: 75.0248 },
  { label: 'Ambala', sub: 'Ambala, Haryana, India', district: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767 },
  // Delhi & NCR
  { label: 'New Delhi', sub: 'New Delhi, Delhi, India', district: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { label: 'Delhi', sub: 'Delhi, India', district: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { label: 'Noida', sub: 'Gautam Buddha Nagar, UP, India', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { label: 'Gurugram', sub: 'Gurugram, Haryana, India', district: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  // Maharashtra
  { label: 'Mumbai', sub: 'Mumbai, Maharashtra, India', district: 'Mumbai City', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { label: 'Pune', sub: 'Pune, Maharashtra, India', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { label: 'Nagpur', sub: 'Nagpur, Maharashtra, India', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { label: 'Nashik', sub: 'Nashik, Maharashtra, India', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { label: 'Solapur', sub: 'Solapur, Maharashtra, India', district: 'Solapur', state: 'Maharashtra', lat: 17.6860, lng: 75.9064 },
  { label: 'Latur', sub: 'Latur, Maharashtra, India', district: 'Latur', state: 'Maharashtra', lat: 18.4088, lng: 76.5604 },
  // Uttar Pradesh
  { label: 'Lucknow', sub: 'Lucknow, Uttar Pradesh, India', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { label: 'Agra', sub: 'Agra, Uttar Pradesh, India', district: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { label: 'Varanasi', sub: 'Varanasi, Uttar Pradesh, India', district: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { label: 'Kanpur', sub: 'Kanpur, Uttar Pradesh, India', district: 'Kanpur Nagar', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { label: 'Meerut', sub: 'Meerut, Uttar Pradesh, India', district: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  // Rajasthan
  { label: 'Jaipur', sub: 'Jaipur, Rajasthan, India', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { label: 'Jodhpur', sub: 'Jodhpur, Rajasthan, India', district: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { label: 'Udaipur', sub: 'Udaipur, Rajasthan, India', district: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { label: 'Kota', sub: 'Kota, Rajasthan, India', district: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  // Madhya Pradesh
  { label: 'Bhopal', sub: 'Bhopal, Madhya Pradesh, India', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { label: 'Indore', sub: 'Indore, Madhya Pradesh, India', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { label: 'Jabalpur', sub: 'Jabalpur, Madhya Pradesh, India', district: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  // Gujarat
  { label: 'Ahmedabad', sub: 'Ahmedabad, Gujarat, India', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { label: 'Surat', sub: 'Surat, Gujarat, India', district: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { label: 'Vadodara', sub: 'Vadodara, Gujarat, India', district: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { label: 'Rajkot', sub: 'Rajkot, Gujarat, India', district: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  // Tamil Nadu
  { label: 'Chennai', sub: 'Chennai, Tamil Nadu, India', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { label: 'Coimbatore', sub: 'Coimbatore, Tamil Nadu, India', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { label: 'Madurai', sub: 'Madurai, Tamil Nadu, India', district: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { label: 'Salem', sub: 'Salem, Tamil Nadu, India', district: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  // Andhra Pradesh & Telangana
  { label: 'Hyderabad', sub: 'Hyderabad, Telangana, India', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { label: 'Vijayawada', sub: 'Vijayawada, Andhra Pradesh, India', district: 'Krishna', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { label: 'Warangal', sub: 'Warangal, Telangana, India', district: 'Warangal', state: 'Telangana', lat: 17.9784, lng: 79.5941 },
  // Karnataka
  { label: 'Bengaluru', sub: 'Bengaluru, Karnataka, India', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { label: 'Mysuru', sub: 'Mysuru, Karnataka, India', district: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { label: 'Hubli', sub: 'Hubballi-Dharwad, Karnataka, India', district: 'Dharwad', state: 'Karnataka', lat: 15.3647, lng: 75.1240 },
  // Kerala
  { label: 'Thiruvananthapuram', sub: 'Thiruvananthapuram, Kerala, India', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { label: 'Kochi', sub: 'Ernakulam, Kerala, India', district: 'Ernakulam', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { label: 'Palakkad', sub: 'Palakkad, Kerala, India', district: 'Palakkad', state: 'Kerala', lat: 10.7867, lng: 76.6548 },
  // West Bengal
  { label: 'Kolkata', sub: 'Kolkata, West Bengal, India', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { label: 'Siliguri', sub: 'Darjeeling, West Bengal, India', district: 'Darjeeling', state: 'West Bengal', lat: 26.7271, lng: 88.3953 },
  { label: 'Asansol', sub: 'Paschim Bardhaman, West Bengal, India', district: 'Paschim Bardhaman', state: 'West Bengal', lat: 23.6739, lng: 86.9524 },
  // Bihar
  { label: 'Patna', sub: 'Patna, Bihar, India', district: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { label: 'Gaya', sub: 'Gaya, Bihar, India', district: 'Gaya', state: 'Bihar', lat: 24.7955, lng: 84.9994 },
  { label: 'Muzaffarpur', sub: 'Muzaffarpur, Bihar, India', district: 'Muzaffarpur', state: 'Bihar', lat: 26.1197, lng: 85.3910 },
  // Himachal Pradesh
  { label: 'Shimla', sub: 'Shimla, Himachal Pradesh, India', district: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { label: 'Manali', sub: 'Kullu, Himachal Pradesh, India', district: 'Kullu', state: 'Himachal Pradesh', lat: 32.2396, lng: 77.1887 },
  { label: 'Dharamshala', sub: 'Kangra, Himachal Pradesh, India', district: 'Kangra', state: 'Himachal Pradesh', lat: 32.2190, lng: 76.3234 },
  // J&K / Ladakh
  { label: 'Srinagar', sub: 'Srinagar, J&K, India', district: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0836, lng: 74.7973 },
  { label: 'Leh', sub: 'Leh, Ladakh, India', district: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5771 },
  { label: 'Kargil', sub: 'Kargil, Ladakh, India', district: 'Kargil', state: 'Ladakh', lat: 34.5539, lng: 76.1349 },
  // Assam & NE
  { label: 'Guwahati', sub: 'Kamrup, Assam, India', district: 'Kamrup Metropolitan', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { label: 'Dibrugarh', sub: 'Dibrugarh, Assam, India', district: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120 },
  // Odisha
  { label: 'Bhubaneswar', sub: 'Bhubaneswar, Odisha, India', district: 'Khordha', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { label: 'Cuttack', sub: 'Cuttack, Odisha, India', district: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8828 },
  // Jharkhand
  { label: 'Ranchi', sub: 'Ranchi, Jharkhand, India', district: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  // Chhattisgarh
  { label: 'Raipur', sub: 'Raipur, Chhattisgarh, India', district: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  // UTs
  { label: 'Pondicherry', sub: 'Puducherry, UT, India', district: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083 },
  { label: 'Port Blair', sub: 'South Andaman, A&N Islands, India', district: 'South Andaman', state: 'Andaman & Nicobar Islands', lat: 11.6234, lng: 92.7265 },
  { label: 'Daman', sub: 'Daman & Diu, UT, India', district: 'Daman', state: 'Daman & Diu', lat: 20.3974, lng: 72.8328 },
  { label: 'Silvassa', sub: 'Dadra & Nagar Haveli, UT, India', district: 'Dadra & Nagar Haveli', state: 'Dadra & Nagar Haveli', lat: 20.2766, lng: 73.0167 },
  { label: 'Kavaratti', sub: 'Lakshadweep, UT, India', district: 'Lakshadweep', state: 'Lakshadweep', lat: 10.5593, lng: 72.6358 },
]

interface LocationSuggestion {
  label: string; sub: string; district: string; state: string; lat: number; lng: number
}

interface WeatherData {
  temperature: number; humidity: number; rainfall: number
  windSpeed: number; condition: string; pressure: number
  conditionIcon: string; fetchedAt: string
}

interface LocationData {
  village: string; tehsil: string; district: string
  state: string; country: string; lat: number; lng: number
}

// Simulate realistic weather based on lat/lng + season
function simulateWeather(_lat: number, state: string): WeatherData {
  const month = new Date().getMonth()
  const isMonsoon = month >= 5 && month <= 9
  const isWinter = month <= 1 || month === 11
  const isHill = ['Himachal Pradesh', 'Ladakh', 'Jammu & Kashmir', 'Uttarakhand'].includes(state)

  const temp = isHill ? (isWinter ? 2 : 18) : isMonsoon ? 28 + Math.round(Math.random() * 4) : isWinter ? 16 + Math.round(Math.random() * 5) : 32 + Math.round(Math.random() * 4)
  const humidity = isMonsoon ? 78 + Math.round(Math.random() * 12) : isWinter ? 55 + Math.round(Math.random() * 15) : 42 + Math.round(Math.random() * 20)
  const rainfall = isMonsoon ? 60 + Math.round(Math.random() * 120) : isWinter ? 5 + Math.round(Math.random() * 15) : Math.round(Math.random() * 10)
  const conditions = isMonsoon
    ? [{ c: 'Partly Cloudy', i: '⛅' }, { c: 'Light Rain', i: '🌦️' }, { c: 'Thunderstorm', i: '⛈️' }]
    : isWinter
    ? [{ c: 'Clear Sky', i: '☀️' }, { c: 'Partly Cloudy', i: '⛅' }, { c: 'Foggy', i: '🌫️' }]
    : [{ c: 'Sunny', i: '☀️' }, { c: 'Partly Cloudy', i: '⛅' }, { c: 'Hot & Hazy', i: '🌤️' }]
  const cond = conditions[Math.floor(Math.random() * conditions.length)]
  return {
    temperature: temp, humidity, rainfall, windSpeed: 8 + Math.round(Math.random() * 14),
    condition: cond.c, conditionIcon: cond.i,
    pressure: 1008 + Math.round(Math.random() * 12),
    fetchedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }
}

// ── Weather preview card ──
function WeatherPreviewCard({ weather, location, onRefresh }: {
  weather: WeatherData; location: LocationData; onRefresh: () => void
}) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-card animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={12} className="text-blue-200" />
            <span className="text-xs text-blue-100 font-medium">{location.district}, {location.state}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{weather.temperature}°C</span>
            <span className="text-2xl mb-0.5">{weather.conditionIcon}</span>
          </div>
          <p className="text-sm text-blue-100">{weather.condition}</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-surface/15 hover:bg-surface/25 transition-colors"
          title="Refresh weather"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Droplets size={12} />, label: 'Humidity', value: `${weather.humidity}%` },
          { icon: <CloudRain size={12} />, label: 'Rainfall', value: `${weather.rainfall}mm` },
          { icon: <Wind size={12} />, label: 'Wind', value: `${weather.windSpeed} km/h` },
          { icon: <Gauge size={12} />, label: 'Pressure', value: `${weather.pressure}hPa` },
        ].map(m => (
          <div key={m.label} className="bg-surface/12 rounded-xl p-2 text-center">
            <div className="flex justify-center text-blue-200 mb-1">{m.icon}</div>
            <p className="text-[10px] text-blue-200 leading-none mb-0.5">{m.label}</p>
            <p className="text-xs font-bold">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2.5">
        <Clock size={10} className="text-blue-300" />
        <span className="text-[10px] text-blue-300">Last updated {weather.fetchedAt}</span>
        <span className="text-[10px] text-blue-300 ml-auto">Lat {location.lat.toFixed(4)}, Lng {location.lng.toFixed(4)}</span>
      </div>
    </div>
  )
}

// ── Location search autocomplete ──
function LocationSearch({ onSelect, onGPS, gpsState }: { onSelect: (loc: LocationSuggestion) => void, onGPS?: () => void, gpsState?: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = query.length >= 2
    ? LOCATIONS.filter(l =>
        l.label.toLowerCase().includes(query.toLowerCase()) ||
        l.district.toLowerCase().includes(query.toLowerCase()) ||
        l.state.toLowerCase().includes(query.toLowerCase()) ||
        l.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      {/* Search input container */}
        <SearchInput
          value={query}
          onChange={val => { setQuery(val); if (val.length >= 2) setOpen(true) }}
          placeholder="Search village, town, city, district, state..."
          icon={<MapPin size={16} className={`transition-colors ${focused ? 'text-primary-600' : 'text-text-muted'}`} />}
          containerClassName="w-full relative z-10"
          rightElement={
            query ? (
              <button onClick={() => { setQuery(''); setOpen(false) }} className="text-text-muted hover:text-text-primary flex-shrink-0 transition-colors">
                <X size={14} />
              </button>
            ) : onGPS ? (
              <button 
                onClick={onGPS} 
                disabled={gpsState === 'loading'}
                className="text-text-muted hover:text-text-primary flex items-center gap-1.5 px-2 py-0.5 rounded bg-background border border-border text-xs font-semibold whitespace-nowrap transition-colors"
              >
                {gpsState === 'loading' ? <LineSpinner size={12} color="currentColor" strokeWidth={2} /> : <Navigation size={12} className={gpsState === 'granted' ? 'text-green-600' : ''} />}
                GPS
              </button>
            ) : null
          }
        />

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-surface rounded-xl shadow-md border border-border overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
              {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} — India
            </span>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {suggestions.map((loc, i) => (
              <li key={i}>
                <button
                  onMouseDown={() => {
                    onSelect(loc)
                    setQuery(loc.label)
                    setOpen(false)
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-background transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                    <MapPin size={13} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{loc.label}</p>
                    <p className="text-[11px] text-text-muted truncate">{loc.sub}</p>
                  </div>
                  <div className="text-[10px] text-gray-300 self-center flex-shrink-0">
                    {loc.lat.toFixed(2)}°N
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 py-2 border-t border-border flex items-center gap-1.5">
            <Search size={10} className="text-gray-300" />
            <span className="text-[10px] text-text-muted">Powered by AgroAI Location DB · India coverage</span>
          </div>
        </div>
      )}

      {open && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-surface rounded-xl shadow-md border border-border px-4 py-6 text-center animate-fade-in">
          <MapPin size={20} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-text-muted">No locations found</p>
          <p className="text-xs text-text-muted mt-0.5">Try a different city, district or state name</p>
        </div>
      )}
    </div>
  )
}

export function CropRecommendation({ onNavigate, guestMode, guestPredictionDone, onPredictionComplete, guestCTA }: {
  onNavigate?: (page: string) => void
  guestMode?: boolean
  guestPredictionDone?: boolean
  onPredictionComplete?: () => void
  guestCTA?: ReactNode
}) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [stage, setStage] = useState<'idle' | 'loading' | 'result'>('idle')
  const [validated, setValidated] = useState(false)
  const [form, setForm] = useState({ N: '', P: '', K: '', ph: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Weather / location state
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [gpsState, setGpsState] = useState<'idle' | 'requesting' | 'success' | 'denied'>('idle')
  const [weatherFetching, setWeatherFetching] = useState(false)
  const [missingLocation, setMissingLocation] = useState(false)

  const soilFields = [
    { key: 'N', label: 'Nitrogen', unit: 'mg/kg', icon: <FlaskConical size={13} />, placeholder: 'e.g. 90', helper: 'Range: 0–200 mg/kg' },
    { key: 'P', label: 'Phosphorus', unit: 'mg/kg', icon: <FlaskConical size={13} />, placeholder: 'e.g. 42', helper: 'Range: 0–200 mg/kg' },
    { key: 'K', label: 'Potassium', unit: 'mg/kg', icon: <FlaskConical size={13} />, placeholder: 'e.g. 43', helper: 'Range: 0–200 mg/kg' },
    { key: 'ph', label: 'Soil pH', unit: '', icon: <AlertCircle size={13} />, placeholder: 'e.g. 6.5', helper: 'Scale: 0–14' },
  ]

  const allFilled = Object.values(form).every(v => v.trim() !== '')
  const hasWeather = !!weatherData && !!locationData
  const canPredict = !!imageFile && allFilled && hasWeather
  const fieldErrors = validated ? Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() === ''])) : {}

  const applyLocation = (loc: LocationSuggestion) => {
    const ld: LocationData = { village: loc.label, tehsil: loc.district, district: loc.district, state: loc.state, country: 'India', lat: loc.lat, lng: loc.lng }
    setLocationData(ld)
    setWeatherFetching(true)
    setTimeout(() => {
      setWeatherData(simulateWeather(loc.lat, loc.state))
      setWeatherFetching(false)
      setMissingLocation(false)
    }, 1100)
  }

  const handleGPS = () => {
    if (!navigator.geolocation) { setGpsState('denied'); return }
    setGpsState('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        // Find nearest location from our DB
        const nearest = LOCATIONS.reduce((best, loc) => {
          const dist = Math.hypot(loc.lat - lat, loc.lng - lng)
          const bestDist = Math.hypot(best.lat - lat, best.lng - lng)
          return dist < bestDist ? loc : best
        })
        setGpsState('success')
        applyLocation(nearest)
      },
      () => setGpsState('denied'),
      { timeout: 8000 }
    )
  }

  const handleRefreshWeather = () => {
    if (!locationData) return
    setWeatherFetching(true)
    setTimeout(() => {
      setWeatherData(simulateWeather(locationData.lat, locationData.state))
      setWeatherFetching(false)
    }, 900)
  }

  const handleFile = (file: File) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setUploadProgress(0)
    const iv = setInterval(() => setUploadProgress(p => { if (p >= 100) { clearInterval(iv); return 100 } return p + 8 }), 40)
  }

  const handlePredict = () => {
    setValidated(true)
    setMissingLocation(!hasWeather)
    if (!canPredict) return
    setStage('loading')
    setTimeout(() => {
      setStage('result')
      onPredictionComplete?.()
    }, 4200)
  }

  const handleReset = () => {
    setForm({ N: '', P: '', K: '', ph: '' })
    setImageFile(null); setImagePreview(null); setUploadProgress(0)
    setStage('idle'); setValidated(false); setMissingLocation(false)
    setLocationData(null); setWeatherData(null); setGpsState('idle')
  }

  const missingImage = validated && !imageFile
  const missingParams = validated && !allFilled

  // Pill bar items
  const pills = [
    { label: 'Soil Image', ok: !!imageFile },
    { label: 'Nitrogen', ok: !!form.N },
    { label: 'Phosphorus', ok: !!form.P },
    { label: 'Potassium', ok: !!form.K },
    { label: 'Soil pH', ok: !!form.ph },
    { label: 'Weather & Location', ok: hasWeather },
  ]

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Crop Recommendation' }]} onNavigate={onNavigate} />}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Sprout size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Crop Recommendation</h2>
            <p className="text-sm text-text-muted">Upload soil image · enter N, P, K, pH · select location · weather auto-fetched</p>
          </div>
        </div>
        {/* Input completion pills */}
        <div className="flex flex-wrap gap-2">
          {pills.map(p => (
            <span key={p.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-300 ${p.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-background border-border text-text-muted'}`}>
              {p.ok ? <CheckCircle2 size={10} /> : <div className="w-2 h-2 rounded-full border border-current" />}
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_3fr] gap-6 items-start">
        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">

          {/* 1. Soil Image Upload */}
          <div className={`bg-surface rounded-2xl shadow-card border p-5 ${missingImage ? 'border-red-200' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <Image size={14} className="text-green-600" />
                </div>
                <h3 className="font-bold text-text-primary text-sm">Upload Soil Image</h3>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">Required</span>
              </div>
              {imageFile && (
                <button onClick={() => { setImageFile(null); setImagePreview(null); setUploadProgress(0) }} className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {!imageFile ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all-smooth cursor-pointer group ${dragOver ? 'border-green-500 bg-green-50 scale-[1.01]' : missingImage ? 'border-red-300 bg-red-50/20' : 'border-border hover:border-green-400 hover:bg-green-50/40'}`}
              >
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                    <Upload size={11} className="text-white" />
                  </div>
                </div>
                <p className="font-bold text-text-secondary text-sm mb-1">Drag & Drop Soil Image</p>
                <p className="text-xs text-text-muted mb-3">or <span className="text-green-600 font-semibold">Browse Files</span></p>
                <p className="text-[10px] text-gray-300 mb-3">JPG, PNG, JPEG · Max 10 MB</p>
                <div className="flex justify-center gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 gradient-primary text-white text-xs font-semibold rounded-xl shadow-soft hover:opacity-90 transition-opacity">
                      <Upload size={11} /> Upload File
                    </span>
                  </label>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border-2 border-green-500 text-green-700 text-xs font-semibold rounded-xl hover:bg-green-50 transition-colors">
                    <Camera size={11} /> Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 animate-fade-in">
                <div className="relative rounded-xl overflow-hidden shadow-soft">
                  <img src={imagePreview!} alt="Soil sample" className="w-full h-36 object-cover" />
                  {uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                      <LineSpinner size={18} color="white" strokeWidth={2} />
                      <div className="w-28 bg-surface/30 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-surface transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-white text-xs font-semibold">{uploadProgress}%</p>
                    </div>
                  )}
                  {uploadProgress >= 100 && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-soft">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center"><Leaf size={10} className="text-amber-600" /></div>
                    <span className="font-medium truncate max-w-[130px]">{imageFile.name}</span>
                    <span className="text-text-muted">{(imageFile.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <label className="cursor-pointer text-blue-500 hover:text-blue-700 font-semibold">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                    Replace
                  </label>
                </div>
              </div>
            )}
            {missingImage && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                <AlertCircle size={11} /> Upload a soil image to continue
              </div>
            )}
          </div>

          {/* 2. Weather & Location Card */}
          <div className={`bg-surface rounded-xl shadow-sm border p-5 transition-all duration-300 ${missingLocation ? 'border-orange-200' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <CloudRain size={16} />
                </div>
                <h3 className="font-bold text-text-primary text-sm">Weather & Location</h3>
              </div>
              <span className="text-[10px] font-bold text-error bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">Required</span>
            </div>

            {gpsState === 'success' && weatherData && locationData ? (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 animate-fade-in mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-800">Location Detected</p>
                    <p className="text-[10px] text-green-600">{locationData.village} · {locationData.district}, {locationData.state}</p>
                  </div>
                  <button onClick={() => { setGpsState('idle'); setLocationData(null); setWeatherData(null) }} className="ml-auto p-1 rounded-lg text-green-400 hover:text-green-700">
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    { label: 'Latitude', value: `${locationData.lat.toFixed(4)}°N` },
                    { label: 'Longitude', value: `${locationData.lng.toFixed(4)}°E` },
                    { label: 'District', value: locationData.district },
                    { label: 'State', value: locationData.state },
                  ].map(d => (
                    <div key={d.label} className="bg-surface rounded-lg px-2 py-1.5 border border-green-100">
                      <p className="text-text-muted text-[9px]">{d.label}</p>
                      <p className="font-semibold text-text-secondary truncate">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <LocationSearch onSelect={applyLocation} onGPS={handleGPS} gpsState={gpsState} />
                {gpsState === 'denied' && (
                  <p className="text-[10px] text-error mt-1.5 flex items-center gap-1 animate-fade-in"><AlertCircle size={10} /> Location access denied. Please search manually.</p>
                )}
              </div>
            )}

            {/* Weather preview — appears after GPS or search */}
            {(weatherFetching || weatherData) && (
              <div className="mt-4 animate-fade-in">
                {weatherFetching ? (
                  <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3 border border-blue-100">
                    <LineSpinner size={18} color="#1E88E5" strokeWidth={2} />
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Fetching weather data...</p>
                      <p className="text-xs text-blue-400">Connecting to weather service</p>
                    </div>
                  </div>
                ) : weatherData && locationData ? (
                  <WeatherPreviewCard
                    weather={weatherData}
                    location={locationData}
                    onRefresh={handleRefreshWeather}
                  />
                ) : null}
              </div>
            )}

            {/* No internet fallback */}
            {gpsState === 'idle' && !weatherData && !weatherFetching && missingLocation && (
              <div className="mt-3 flex items-center gap-2 text-xs text-warning bg-orange-50 rounded-lg px-3 py-2 border border-orange-100 animate-fade-in">
                <AlertCircle size={12} /> Please detect or search your location to fetch weather data
              </div>
            )}
          </div>

          {/* 3. Soil Parameters */}
          <div className={`bg-surface rounded-2xl shadow-card border p-5 ${missingParams ? 'border-orange-200' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <FlaskConical size={14} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-text-primary text-sm">Soil Parameters</h3>
            </div>
            <p className="text-[11px] text-text-muted mb-4 ml-9">Enter the required soil parameters below. Temperature, humidity, and rainfall are automatically fetched from your selected location.</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {soilFields.map(f => (
                <FieldInput
                  key={f.key}
                  label={f.label}
                  unit={f.unit}
                  icon={f.icon}
                  placeholder={f.placeholder}
                  helper={f.helper}
                  value={form[f.key as keyof typeof form]}
                  onChange={v => set(f.key, v)}
                  error={!!fieldErrors[f.key]}
                />
              ))}
            </div>

            {/* Auto-sourced weather values (read-only display) */}
            {weatherData && (
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mb-4 animate-fade-in">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <CheckCircle2 size={9} /> Auto-fetched from weather data
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { icon: <Thermometer size={11} />, label: 'Temperature', value: `${weatherData.temperature}°C` },
                    { icon: <Droplets size={11} />, label: 'Humidity', value: `${weatherData.humidity}%` },
                    { icon: <CloudRain size={11} />, label: 'Rainfall', value: `${weatherData.rainfall}mm` },
                  ].map(w => (
                    <div key={w.label} className="bg-surface rounded-lg px-2 py-2 flex items-center gap-1.5">
                      <span className="text-blue-400">{w.icon}</span>
                      <div>
                        <p className="text-[9px] text-text-muted">{w.label}</p>
                        <p className="font-bold text-text-secondary">{w.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation checklist */}
            {validated && (
              <div className="mb-4 bg-background rounded-xl p-3 text-[11px] space-y-1.5 border border-border animate-fade-in">
                {[
                  { key: '_img', label: 'Soil image uploaded', ok: !!imageFile },
                  { key: '_loc', label: 'Weather & location detected', ok: hasWeather },
                  ...soilFields.map(f => ({ key: f.key, label: f.label + ' entered', ok: !!form[f.key as keyof typeof form] })),
                ].map(c => (
                  <div key={c.key} className="flex items-center gap-2">
                    {c.ok
                      ? <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                      : <AlertCircle size={11} className="text-red-400 flex-shrink-0" />}
                    <span className={c.ok ? 'text-text-muted' : 'text-red-500 font-medium'}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            {guestMode && guestPredictionDone && guestCTA ? (
              guestCTA
            ) : (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={handlePredict}
                    disabled={stage === 'loading'}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all-smooth shadow-soft ${canPredict ? 'gradient-primary text-white hover:opacity-90 hover:shadow-card active:scale-95' : 'bg-background text-text-muted cursor-not-allowed'}`}
                  >
                    {stage === 'loading'
                      ? <><LineSpinner size={15} color="white" strokeWidth={2} /> Predicting...</>
                      : <><Sparkles size={15} /> Predict Best Crop</>}
                  </button>
                  {!guestMode && (
                    <button onClick={handleReset} className="px-4 py-3 rounded-xl text-sm text-text-muted bg-background hover:bg-background transition-colors" title="Reset all">
                      <RefreshCw size={15} />
                    </button>
                  )}
                </div>
                {!canPredict && !validated && (
                  <p className="text-center text-[10px] text-text-muted mt-2">
                    {!imageFile && !hasWeather ? 'Requires: Soil Image + Location + Nitrogen + Phosphorus + Potassium + Soil pH' : !imageFile ? 'Upload a soil image to continue' : !hasWeather ? 'Select your location to auto-fetch weather data' : 'Complete all soil parameters (N, P, K, pH)'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="min-h-[520px] lg:sticky lg:top-20">
          {stage === 'idle' && <AIEmptyState />}
          {stage === 'loading' && <AILoadingPanel />}
          {stage === 'result' && <ResultPanel imagePreview={imagePreview} onNewPrediction={handleReset} onViewHistory={() => onNavigate?.('history')} />}
        </div>
      </div>
    </div>
  )
}

// ---- Fertilizer Recommendation ----
export function FertilizerRecommendation({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [stage, setStage] = useState<'idle' | 'loading' | 'result'>('idle')
  const [soilType, setSoilType] = useState('loamy')
  const [crop, setCrop] = useState('rice')
  const [form, setForm] = useState({ N: '', P: '', K: '' })

  const handlePredict = () => {
    setStage('loading')
    setTimeout(() => {
      setStage('result')
    }, 3500)
  }

  const handleReset = () => {
    setForm({ N: '', P: '', K: '' })
    setStage('idle')
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Fertilizer Recommendation' }]} onNavigate={onNavigate} />}
        <h2 className="text-2xl font-bold text-text-primary">Fertilizer Recommendation</h2>
        <p className="text-sm text-text-muted">Get personalized organic and chemical fertilizer advice</p>
      </div>
      <div className="grid lg:grid-cols-[2fr_3fr] gap-6 items-start">
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4">Crop & Soil Information</h3>
          <div className="space-y-4">
            <SelectInput label="Soil Type" options={[{ value: 'loamy', label: 'Loamy' }, { value: 'clay', label: 'Clay' }, { value: 'sandy', label: 'Sandy' }, { value: 'silt', label: 'Silt' }, { value: 'black', label: 'Black Cotton' }]} value={soilType} onChange={e => setSoilType(e.target.value)} />
            <SelectInput label="Current/Planned Crop" options={[{ value: 'rice', label: 'Rice' }, { value: 'wheat', label: 'Wheat' }, { value: 'maize', label: 'Maize' }, { value: 'cotton', label: 'Cotton' }, { value: 'sugarcane', label: 'Sugarcane' }]} value={crop} onChange={e => setCrop(e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="N (mg/kg)" placeholder="90" type="number" value={form.N} onChange={e => setForm(f => ({ ...f, N: e.target.value }))} />
              <Input label="P (mg/kg)" placeholder="42" type="number" value={form.P} onChange={e => setForm(f => ({ ...f, P: e.target.value }))} />
              <Input label="K (mg/kg)" placeholder="43" type="number" value={form.K} onChange={e => setForm(f => ({ ...f, K: e.target.value }))} />
            </div>
            <Button variant="primary" loading={stage === 'loading'} onClick={handlePredict} className="w-full justify-center">
              Get Fertilizer Advice
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {stage === 'idle' && (
            <Card className="p-8 flex flex-col items-center justify-center text-center min-h-[500px] border border-border shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="relative mb-12 w-48 h-48 flex items-center justify-center mx-auto mt-4">
                {/* Background rings */}
                <div className="absolute inset-0 rounded-full border border-border opacity-50"></div>
                <div className="absolute inset-6 rounded-full border border-green-500/20"></div>
                <div className="absolute inset-12 rounded-full border border-blue-500/20"></div>
                
                {/* Central AI Node */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-surface shadow-elevated border border-border flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 animate-pulse"></div>
                   <Leaf size={32} className="text-green-600 animate-leaf-pulse" />
                   <Sparkles size={16} className="text-purple-500 absolute top-4 right-4 animate-bounce" />
                </div>

                {/* Orbiting N Particle */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-surface border border-green-200 dark:border-green-800 shadow-sm flex items-center justify-center animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                    <span className="text-sm font-bold text-green-600">N</span>
                  </div>
                </div>

                {/* Orbiting P Particle */}
                <div className="absolute inset-6 animate-spin-slow" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-surface border border-orange-200 dark:border-orange-800 shadow-sm flex items-center justify-center animate-spin-slow" style={{ animationDuration: '12s', animationDirection: 'normal' }}>
                    <span className="text-sm font-bold text-orange-600">P</span>
                  </div>
                </div>

                {/* Orbiting K Particle */}
                <div className="absolute inset-12 animate-spin-slow" style={{ animationDuration: '16s' }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-surface border border-purple-200 dark:border-purple-800 shadow-sm flex items-center justify-center animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '16s' }}>
                    <span className="text-sm font-bold text-purple-600">K</span>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-text-primary mb-2">Ready to Generate Fertilizer Recommendation</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto mb-8">
                Provide your crop details and soil nutrient values. AgroAI will analyze nutrient deficiencies and recommend suitable organic and chemical fertilizers with dosage and application guidance.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-surface rounded-xl p-4 border border-border shadow-sm text-left opacity-80">
                  <div className="flex items-center gap-2 mb-2 text-green-600">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">Organic</span>
                  </div>
                  <div className="h-2 w-16 bg-border rounded mb-2"></div>
                  <div className="h-2 w-24 bg-border rounded"></div>
                </div>
                <div className="bg-surface rounded-xl p-4 border border-border shadow-sm text-left opacity-80">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">Chemical</span>
                  </div>
                  <div className="h-2 w-16 bg-border rounded mb-2"></div>
                  <div className="h-2 w-24 bg-border rounded"></div>
                </div>
                <div className="bg-surface rounded-xl p-4 border border-border shadow-sm text-left opacity-80">
                  <div className="flex items-center gap-2 mb-2 text-purple-600">
                    <Bot size={16} />
                    <span className="text-xs font-bold">Analysis</span>
                  </div>
                  <div className="h-2 w-16 bg-border rounded mb-2"></div>
                  <div className="h-2 w-24 bg-border rounded"></div>
                </div>
              </div>
            </Card>
          )}

          {stage === 'loading' && (
            <Card className="p-8 flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-20 h-20 rounded-full border-4 border-background border-t-green-500 animate-spin mb-6 shadow-sm" />
              <h3 className="text-xl font-bold text-text-primary mb-2 animate-pulse">Analyzing Soil Nutrients...</h3>
              <p className="text-sm text-text-muted">Computing optimal NPK ratios and generating schedules</p>
              
              <div className="w-full max-w-sm mt-8 space-y-4">
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-shimmer" style={{ width: '45%' }} />
                </div>
                <div className="flex justify-between text-xs text-text-muted font-medium">
                  <span>Checking organic options</span>
                  <span>45%</span>
                </div>
              </div>
            </Card>
          )}

          {stage === 'result' && (
            <div className="space-y-4 animate-fade-in-up">
              <Card className="p-5 border-l-4 border-green-500 relative overflow-hidden group hover:shadow-elevated transition-all-smooth">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FlaskConical size={64} />
                </div>
                <div className="flex items-start justify-between mb-4 relative">
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Recommended Fertilizer</p>
                    <h3 className="text-3xl font-bold text-text-primary">NPK 10:26:26</h3>
                    <p className="text-sm text-text-secondary mt-1">Optimal ratio for Rice in Loamy soil</p>
                  </div>
                  <Badge color="green">94% Match</Badge>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-5 hover:shadow-elevated transition-shadow">
                  <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Leaf size={18} className="text-green-500" />
                    Organic Recommendations
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-surface border border-border rounded-xl p-3 hover:border-green-300 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-text-primary group-hover:text-green-600 transition-colors">Vermicompost</p>
                        <Badge color="green">Primary</Badge>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">Application: <span className="font-semibold text-text-primary">2 tons/hectare</span></p>
                      <p className="text-[11px] text-text-muted">Apply during field preparation before sowing.</p>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-3 hover:border-green-300 transition-colors">
                      <p className="font-bold text-text-primary mb-1">Farm Yard Manure</p>
                      <p className="text-xs text-text-secondary mb-2">Application: <span className="font-semibold text-text-primary">5 tons/hectare</span></p>
                      <p className="text-[11px] text-text-muted">Mix thoroughly with soil 15 days prior.</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 hover:shadow-elevated transition-shadow">
                  <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <FlaskConical size={18} className="text-blue-500" />
                    Chemical Fertilizers
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-surface border border-border rounded-xl p-3 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-text-primary">DAP (18-46-0)</p>
                        <Badge color="blue">25 kg/ha</Badge>
                      </div>
                      <p className="text-xs text-text-secondary">Timing: <span className="font-medium">Basal application</span></p>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-3 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-text-primary">Urea (46-0-0)</p>
                        <Badge color="blue">50 kg/ha</Badge>
                      </div>
                      <p className="text-xs text-text-secondary">Timing: <span className="font-medium">Basal + Top-dress</span></p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <h4 className="font-semibold text-text-primary mb-4">Nutrient Deficiency</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-text-secondary">Nitrogen (N) - Deficient</span>
                      <span className="text-red-500">45%</span>
                    </div>
                    <ProgressBar value={45} color="#EF4444" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-text-secondary">Phosphorus (P) - Optimal</span>
                      <span className="text-green-500">82%</span>
                    </div>
                    <ProgressBar value={82} color="#10B981" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-text-secondary">Potassium (K) - Sufficient</span>
                      <span className="text-blue-500">95%</span>
                    </div>
                    <ProgressBar value={95} color="#3B82F6" />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="font-semibold text-text-primary mb-4">Application Schedule</h4>
                <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-border">
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-green-500 ring-4 ring-background" />
                    <p className="text-sm font-bold text-text-primary">Basal Dose <span className="font-normal text-text-muted ml-2">Day 0 (Sowing)</span></p>
                    <p className="text-xs text-text-secondary mt-1">Apply all FYM, full dose of DAP and MOP, and 1/3rd of Urea.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-background" />
                    <p className="text-sm font-bold text-text-primary">Vegetative Stage <span className="font-normal text-text-muted ml-2">Day 25-30</span></p>
                    <p className="text-xs text-text-secondary mt-1">Top-dress with 1/3rd of Urea after weeding.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-background" />
                    <p className="text-sm font-bold text-text-primary">Flowering Stage <span className="font-normal text-text-muted ml-2">Day 50-55</span></p>
                    <p className="text-xs text-text-secondary mt-1">Apply the remaining 1/3rd of Urea.</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { title: 'Higher Yield', icon: <TrendingUp size={16} /> },
                  { title: 'Better Roots', icon: <Sprout size={16} /> },
                  { title: 'Soil Health', icon: <Leaf size={16} /> },
                  { title: 'Reduced Loss', icon: <ShieldAlert size={16} /> }
                ].map(b => (
                  <div key={b.title} className="bg-surface rounded-xl p-3 border border-border shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:shadow-elevated transition-shadow">
                    <div className="text-green-500">{b.icon}</div>
                    <span className="text-xs font-semibold text-text-primary">{b.title}</span>
                  </div>
                ))}
              </div>

              <Card className="p-4 bg-amber-50/50 border border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-700/30">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-500 mb-2 text-sm">Safety Notes</p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 list-disc list-inside">
                      <li>Avoid applying fertilizers immediately before heavy rainfall.</li>
                      <li>Maintain proper irrigation after chemical application.</li>
                      <li>Avoid excess nitrogen to prevent pest susceptibility.</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={handleReset} className="flex-1 justify-center">Generate New</Button>
                <Button variant="primary" icon={<Download size={14} />} className="flex-1 justify-center">Download Plan</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Disease Detection ----
export function DiseaseDetection({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [stage, setStage] = useState<'upload' | 'processing' | 'result'>('upload')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = () => {
    setStage('processing')
    setTimeout(() => setStage('result'), 2000)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        {onNavigate && <Breadcrumb items={[{ label: 'Dashboard', page: 'dashboard' }, { label: 'Disease Detection' }]} onNavigate={onNavigate} />}
        <h2 className="text-2xl font-bold text-text-primary">Disease Detection</h2>
        <p className="text-sm text-text-muted">Upload a plant/leaf image for instant AI disease diagnosis</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-text-primary mb-4">Upload Plant Image</h3>
          {stage !== 'result' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile() }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all-smooth cursor-pointer ${dragOver ? 'border-orange-500 bg-orange-50' : 'border-border hover:border-orange-400 hover:bg-orange-50/50'}`}
              onClick={stage === 'upload' ? handleFile : undefined}
            >
              {stage === 'processing' ? (
                <div className="flex flex-col items-center gap-3">
                  {/* Leaf outline with scanner sweep */}
                  <div className="relative" style={{ width: 64, height: 64 }}>
                    <svg width="64" height="64" viewBox="-32 -32 64 64" aria-hidden="true">
                      {/* Outer leaf silhouette — stroke only */}
                      <path d="M 0 26 C -18 18 -28 4 -26 -12 C -14 -24 0 -28 0 -28 C 0 -28 14 -24 26 -12 C 28 4 18 18 0 26"
                        stroke="#FB8C00" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Midrib */}
                      <path d="M 0 26 L 0 -26" stroke="#FB8C00" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5" />
                      {/* Lateral veins */}
                      <path d="M 0 10 L 16 0 M 0 -4 L 18 -14 M 0 10 L -16 0 M 0 -4 L -18 -14"
                        stroke="#FB8C00" fill="none" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.35" />
                    </svg>
                    <div
                      className="animate-scanner-sweep pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(251,140,0,0.5), rgba(251,140,0,0.7), rgba(251,140,0,0.5), transparent)' }}
                    />
                  </div>
                  <p className="font-semibold text-text-secondary">Scanning for disease patterns...</p>
                  <ProgressBar value={65} color="#FB8C00" />
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
                    <Bug size={28} className="text-orange-600" />
                  </div>
                  <p className="font-semibold text-text-secondary mb-1">Click or drag plant image here</p>
                  <p className="text-sm text-text-muted mb-4">Leaf, stem, fruit photos accepted</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="accent" size="sm" icon={<Upload size={14} />} onClick={handleFile}>Upload Image</Button>
                    <Button variant="outlined" size="sm" icon={<Camera size={14} />}>Camera</Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <img
                  src="https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&h=300&fit=crop&auto=format"
                  alt="Plant disease sample"
                  className="w-full h-40 object-cover rounded-lg mb-2"
                />
                <p className="text-xs text-text-muted text-center">Analyzed image — Rice leaf</p>
              </div>
              <button onClick={() => setStage('upload')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary">
                <RotateCcw size={13} /> Analyze new image
              </button>
            </div>
          )}
        </Card>

        {stage === 'result' ? (
          <div className="space-y-4">
            <Card className="p-5 border-l-4 border-orange-500">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-text-muted font-medium">Detected Disease</p>
                  <h3 className="text-2xl font-bold text-text-primary">Leaf Blight</h3>
                  <p className="text-sm text-text-muted">Xanthomonas oryzae pv. oryzae</p>
                </div>
                <Badge color="orange">91.4% confident</Badge>
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-semibold text-text-primary mb-3">Symptoms Detected</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                {['Water-soaked lesions on leaf margins', 'Yellow to white stripes along leaf veins', 'Wavy bacterial ooze visible in morning', 'Wilting of young leaves (kresek symptom)'].map(s => (
                  <li key={s} className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h4 className="font-semibold text-text-primary mb-3">Treatment Protocol</h4>
              <div className="space-y-2">
                {[
                  { label: 'Chemical', value: 'Copper Oxychloride 50WP @ 3g/L spray' },
                  { label: 'Biological', value: 'Pseudomonas fluorescens 2.5 kg/ha' },
                  { label: 'Cultural', value: 'Drain field, reduce nitrogen application' },
                ].map(t => (
                  <div key={t.label} className="flex gap-3 bg-background rounded-xl p-3">
                    <Badge color={t.label === 'Chemical' ? 'blue' : t.label === 'Biological' ? 'green' : 'gray'}>{t.label}</Badge>
                    <p className="text-sm text-text-secondary flex-1">{t.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h4 className="font-semibold text-text-primary mb-3">Recommended Products</h4>
              <div className="flex flex-wrap gap-2">
                {['Blitox 50WP', 'Kocide 2000', 'Nordox 75WG', 'Copper Zine 36WP'].map(p => (
                  <span key={p} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">{p}</span>
                ))}
              </div>
            </Card>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="font-semibold text-red-700">Disease Alert — Nearby Area</span>
              </div>
              <p className="text-red-600">3 other farmers in Ludhiana district reported similar symptoms this week.</p>
            </div>

            <Button variant="primary" icon={<Download size={14} />} className="w-full justify-center">Download Disease Report</Button>
          </div>
        ) : (
          <Card className="p-6 flex flex-col gap-4">
            <h4 className="font-semibold text-text-primary">Detection Capabilities</h4>
            <div className="grid grid-cols-2 gap-3">
              {['Leaf Blight', 'Powdery Mildew', 'Rust Disease', 'Bacterial Wilt', 'Mosaic Virus', 'Root Rot'].map(d => (
                <div key={d} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2.5">
                  <Bug size={13} className="text-orange-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-text-secondary">{d}</span>
                </div>
              ))}
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-2xl font-bold text-orange-700">94.1%</p>
              <p className="text-xs text-orange-600">Disease detection accuracy on 50+ plant diseases</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
