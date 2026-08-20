import { useState, useRef, useEffect, type ChangeEvent, type PointerEvent } from 'react'
import { Bot, X, Send, Mic, Image as ImageIcon, Sparkles, Trash2, Copy, Check, Volume2, Camera, Upload, Globe } from 'lucide-react'

import { sendChatMessage, getAgronomicAiResponse, translateTextApi } from '../services/api'
import { useTranslation, Translate, useSarvamTranslation } from '../i18n'
import { useLanguage } from '../contexts/LanguageContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
}

const INDIAN_LANGUAGES = [
  { name: 'English', code: 'en-US', flag: '🇬🇧' },
  { name: 'Hindi', code: 'hi-IN', flag: '🇮🇳' },
  { name: 'Telugu', code: 'te-IN', flag: '🇮🇳' },
  { name: 'Tamil', code: 'ta-IN', flag: '🇮🇳' },
  { name: 'Kannada', code: 'kn-IN', flag: '🇮🇳' },
  { name: 'Malayalam', code: 'ml-IN', flag: '🇮🇳' },
  { name: 'Marathi', code: 'mr-IN', flag: '🇮🇳' },
  { name: 'Gujarati', code: 'gu-IN', flag: '🇮🇳' },
  { name: 'Bengali', code: 'bn-IN', flag: '🇮🇳' },
  { name: 'Punjabi', code: 'pa-IN', flag: '🇮🇳' },
  { name: 'Odia', code: 'or-IN', flag: '🇮🇳' },
  { name: 'Assamese', code: 'as-IN', flag: '🇮🇳' },
  { name: 'Urdu', code: 'ur-IN', flag: '🇮🇳' },
]

export default function FloatingChatbot() {
  const { t } = useTranslation()
  const { currentLanguage, setLanguage } = useLanguage()
  const languageDisplayName = (() => {
    const found = INDIAN_LANGUAGES.find(l => l.code.toLowerCase().startsWith(currentLanguage.toLowerCase()))
    return found?.name || (currentLanguage === 'en' ? 'English' : currentLanguage)
  })()

  const translatedAsk = useSarvamTranslation("Ask AgroAI in")
  const translatedListening = useSarvamTranslation("Listening in")
  const translatedOnline = useSarvamTranslation("Online")
  const translatedCleared = useSarvamTranslation("Chat cleared")

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: t('floatingChatbot.welcome') }
  ])
  const [input, setInput] = useState('')
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Dragging state for moving icon anywhere
  const [dragPosition, setDragPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('floating_chatbot_pos')
      if (saved) {
        const p = JSON.parse(saved)
        if (typeof p.x === 'number' && typeof p.y === 'number') return p
      }
    } catch {}
    return { x: window.innerWidth - 90, y: window.innerHeight - 90 }
  })
  
  const isDraggingRef = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const initialIconPos = useRef({ x: 0, y: 0 })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, isOpen])

  useEffect(() => {
    try {
      localStorage.setItem('floating_chatbot_pos', JSON.stringify(dragPosition))
    } catch {}
  }, [dragPosition])

  // Mouse / Touch Dragging Handler for FAB button
  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    isDraggingRef.current = false
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    initialIconPos.current = { ...dragPosition }

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - dragStartPos.current.x
      const dy = moveEv.clientY - dragStartPos.current.y

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        isDraggingRef.current = true
      }

      const newX = Math.max(10, Math.min(window.innerWidth - 70, initialIconPos.current.x + dx))
      const newY = Math.max(10, Math.min(window.innerHeight - 70, initialIconPos.current.y + dy))
      setDragPosition({ x: newX, y: newY })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove as unknown as EventListener)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove as unknown as EventListener)
    window.addEventListener('pointerup', onPointerUp)
  }

  const handleFabClick = () => {
    if (!isDraggingRef.current) {
      setIsOpen(prev => !prev)
    }
  }

  // Voice Recording handler
  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(t('floatingChatbot.voiceUnsupported'))
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const LOCALE_MAP: Record<string, string> = {
        en: 'en-US', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', gu: 'gu-IN', bn: 'bn-IN', pa: 'pa-IN', or: 'or-IN', as: 'as-IN', ur: 'ur-IN'
      }
      const speechLocale = LOCALE_MAP[currentLanguage] || `${currentLanguage}-IN`
      const langObj = INDIAN_LANGUAGES.find(l => l.code === speechLocale) || INDIAN_LANGUAGES[0]
      const recognition = new SpeechRecognition()
      recognition.lang = langObj.code
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setIsRecording(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
        }
        setIsRecording(false)
      }
      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsRecording(false)
    }
  }

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim()
    if (!msgText && !attachedImage) return
    const currentImg = attachedImage

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
    content: msgText || (currentImg ? t('floatingChatbot.uploadedImagePlaceholder') : ''),
      imageUrl: currentImg || undefined
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAttachedImage(null)
    setIsTyping(true)

    try {
      let replyText = ''
      if (currentImg && (!msgText || msgText === 'Uploaded crop/soil image for AI diagnosis')) {
        const engReport = t('floatingChatbot.aiImageAnalysisExample')
        if (currentLanguage !== 'en') {
          replyText = await translateTextApi(engReport, currentLanguage)
        } else {
          replyText = engReport
        }
      } else {
        const res = await sendChatMessage(msgText, undefined, currentLanguage)
        let raw = res.assistant_response || res.response || res.english_response
        if (typeof raw === 'object' && raw !== null) {
          raw = (raw as any).response || (raw as any).assistant_response || JSON.stringify(raw)
        }
        replyText = (typeof raw === 'string' && raw.trim()) ? raw : getAgronomicAiResponse(msgText, currentLanguage)
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAgronomicAiResponse(msgText, currentLanguage)
      }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: translatedCleared }])
  }

  const SUGGESTIONS = [
    t('floatingChatbot.suggestions.whatCropBest'),
    t('floatingChatbot.suggestions.treatYellowLeaves'),
    t('floatingChatbot.suggestions.nextRain')
  ]

  // Decide whether window appears above or below FAB depending on Y position
  const showAbove = dragPosition.y > 400

  return (
    <div
      className="fixed z-[1000] flex flex-col items-end"
      style={{ left: `${dragPosition.x}px`, top: `${dragPosition.y}px` }}
    >
      {/* File inputs */}
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageFileChange} />
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageFileChange} />

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-elevated p-5 max-w-xs w-full mx-4 border border-border">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <ImageIcon size={16} className="text-green-600" />
                {t('floatingChatbot.uploadModal.title')}
              </h3>
              <button onClick={() => setShowImageModal(false)} className="p-1 rounded-lg hover:bg-background text-text-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => { cameraInputRef.current?.click(); setShowImageModal(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 border border-border rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                  <Camera size={18} />
                </div>
                <div>
                  <p className="font-semibold text-xs text-text-primary">{t('floatingChatbot.uploadModal.takePhoto')}</p>
                  <p className="text-[10px] text-text-muted">{t('floatingChatbot.uploadModal.useCameraDesc')}</p>
                </div>
              </button>
              <button
                onClick={() => { fileInputRef.current?.click(); setShowImageModal(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 border border-border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                  <Upload size={18} />
                </div>
                <div>
                  <p className="font-semibold text-xs text-text-primary">{t('floatingChatbot.uploadModal.uploadFromDevice')}</p>
                  <p className="text-[10px] text-text-muted">{t('floatingChatbot.uploadModal.selectFromGallery')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-elevated p-4 max-w-xs w-full mx-4 max-h-[70vh] flex flex-col border border-border">
            <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <Globe size={16} className="text-green-600" />
                {t('floatingChatbot.selectLanguageTitle')}
              </h3>
              <button onClick={() => setShowLangModal(false)} className="p-1 rounded-lg hover:bg-background text-text-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {INDIAN_LANGUAGES.map(l => (
                <button
                  key={l.name}
                  onClick={() => { setLanguage(l.code.split('-')[0]); setShowLangModal(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-xs text-left transition-all ${currentLanguage === l.code.split('-')[0] ? 'border-green-500 bg-green-50 font-bold text-green-700' : 'border-border hover:bg-background'}`}
                >
                  <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                  <span className="text-[10px] text-text-muted font-mono">{l.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Popup Window */}
      {isOpen && (
        <div
          className={`absolute right-0 w-80 sm:w-96 max-h-[550px] h-[75vh] bg-surface rounded-2xl shadow-elevated border border-border flex flex-col overflow-hidden animate-fade-in ${showAbove ? 'bottom-16' : 'top-16'}`}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {/* Header */}
          <div className="p-3.5 gradient-primary text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-green-600 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  AgroAI Assistant
                  <button onClick={() => setShowLangModal(true)} className="bg-white/20 hover:bg-white/30 text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors">
                    {languageDisplayName} 🌐
                  </button>
                </h3>
                <p className="text-[10px] text-white/80 font-medium">{translatedOnline}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleClear} className="p-1 hover:bg-white/20 rounded-lg transition-colors" title={t('floatingChatbot.clearChat')}>
                <Trash2 size={15} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar bg-background">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs relative group ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-surface border border-border text-text-primary rounded-tl-sm shadow-sm'}`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Attached crop/soil sample" className="max-w-full rounded-lg mb-2 border border-white/20 shadow-sm max-h-36 object-cover" />
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap"><Translate text={msg.content} /></p>

                  {/* Actions on hover */}
                  {msg.role === 'assistant' && (
                    <div className="mt-1 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel()
                            const utterance = new SpeechSynthesisUtterance(msg.content)
                            window.speechSynthesis.speak(utterance)
                          }
                        }}
                        className="p-1 text-text-muted hover:text-green-600 rounded"
                        title={t('floatingChatbot.playVoice')}
                      >
                        <Volume2 size={12} />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 text-text-muted hover:text-blue-600 rounded"
                        title={t('floatingChatbot.copyMessage')}
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mr-2">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length < 3 && !isTyping && (
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto custom-scrollbar border-t border-border bg-background">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} className="flex-shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap">
                  <Translate text={s} />
                </button>
              ))}
            </div>
          )}

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="px-3 py-1.5 bg-surface border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={attachedImage} alt="Attachment" className="w-8 h-8 rounded object-cover border border-border" />
                <span className="text-[10px] text-text-primary font-semibold">{t('imageReadyForAi')}</span>
              </div>
              <button onClick={() => setAttachedImage(null)} className="p-1 rounded hover:bg-background text-text-muted">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-2.5 bg-surface border-t border-border">
            <div className={`flex items-center gap-1.5 bg-background border rounded-xl px-2.5 py-1.5 shadow-sm transition-all ${isRecording ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus-within:border-blue-500'}`}>
              {/* Image Upload Icon */}
              <button onClick={() => setShowImageModal(true)} className="text-text-muted hover:text-green-600 transition-colors p-1" title="Upload Image / Camera">
                <ImageIcon size={17} />
              </button>

              <input
                type="text"
                placeholder={isRecording ? `🎙️ ${translatedListening} ${languageDisplayName}...` : `${translatedAsk} ${languageDisplayName}...`}
                className={`flex-1 bg-transparent border-none outline-none text-xs text-text-primary px-1 ${isRecording ? 'placeholder-red-500 font-semibold animate-pulse' : ''}`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              />

              {/* Voice Mic Icon */}
              <button
                onClick={startVoiceRecording}
                className={`p-1 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-bounce' : 'text-text-muted hover:text-green-600'}`}
                title={`Voice Input (${languageDisplayName})`}
              >
                <Mic size={17} />
              </button>

              {/* Send Icon */}
              {(input.trim() || attachedImage) && (
                <button onClick={() => handleSend(input)} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-soft">
                  <Send size={13} />
                </button>
              )}
            </div>
            <div className="text-center mt-1.5 flex items-center justify-center gap-1">
              <Sparkles size={10} className="text-purple-500" />
              <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">{t("poweredBySarvamGemini")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Draggable Anywhere) */}
      <button
        onPointerDown={handlePointerDown}
        onClick={handleFabClick}
        className="h-14 w-14 rounded-full bg-[#2E7D32] text-white shadow-[0_8px_24px_rgba(22,101,52,0.45)] flex items-center justify-center hover:bg-[#1B5E20] hover:scale-105 active:scale-95 transition-transform relative group cursor-grab active:cursor-grabbing select-none"
        aria-label={isOpen ? 'Close AgroAI assistant' : 'Open AgroAI assistant'}
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
        {isOpen ? <X size={24} /> : <Bot size={26} />}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
        )}
      </button>
    </div>
  )
}
