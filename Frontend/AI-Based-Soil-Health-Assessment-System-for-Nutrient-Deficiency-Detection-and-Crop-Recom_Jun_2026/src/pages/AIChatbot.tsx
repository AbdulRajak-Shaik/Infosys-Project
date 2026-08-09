import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Plus, ThumbsUp, ThumbsDown, Copy, RefreshCw, Download, Mic, Image } from 'lucide-react'
import { Button } from '../components/ui'
import api from '../services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

import { FEATURES } from '../config'

const suggestedQuestions = [
  'What is the best crop for sandy loam soil with pH 6.5?',
  ...(FEATURES.DISEASE_DETECTION ? ['How do I treat leaf blight in rice plants?'] : ['How does soil pH affect wheat?']),
  'What is the optimal NPK ratio for wheat in Punjab?',
  'When is the best time to plant sugarcane in Maharashtra?',
  'How can I improve water retention in clay soil?',
]

const chatHistory = [
  { id: '1', title: 'Soil Analysis Questions', date: 'Jul 24' },
  ...(FEATURES.DISEASE_DETECTION ? [{ id: '2', title: 'Rice Disease Treatment', date: 'Jul 22' }] : [{ id: '2', title: 'Monsoon Crop Planning', date: 'Jul 22' }]),
  { id: '3', title: 'Fertilizer Schedule for Wheat', date: 'Jul 18' },
]

const aiResponses: Record<number, string> = {
  0: `Great question! For **sandy loam soil** with a pH of 6.5, here are my top recommendations:

**Best Crops:**
- 🌾 **Rice** — Excellent match (pH 5.5–7.0, good drainage ideal)
- 🌽 **Maize** — Thrives in well-drained sandy loam
- 🥜 **Groundnut** — Perfect for loose, well-aerated soil
- 🥕 **Carrots & Root Vegetables** — Outstanding for deep root penetration

**Key Growing Tips:**
1. Add organic matter (FYM @ 10 t/ha) to improve water retention
2. pH 6.5 is near-ideal — no lime or sulfur amendments needed
3. Irrigation: 2–3 times per week due to lower water retention
4. Apply fertilizers in split doses to prevent leaching

Would you like specific recommendations for any of these crops?`,
  1: `**Leaf Blight Treatment Protocol** 🌿

I can see this is urgent. Here's what to do immediately:

**Immediate Actions:**
- Stop nitrogen fertilization right away
- Drain the field if waterlogged
- Remove severely infected plant debris

**Chemical Treatment:**
\`\`\`
Copper Oxychloride 50WP — 3g per liter
Spray interval: Every 7-10 days
Coverage: 500L water per hectare
\`\`\`

**Biological Option:** Pseudomonas fluorescens 2.5 kg/ha as soil drench

**Prevention:**
- Use resistant varieties (IR-64, Pusa Basmati 1121)
- Maintain proper spacing (20×15 cm)
- Balanced NPK — avoid excess nitrogen

Recovery typically takes 2–3 weeks with proper treatment. Would you like me to create a detailed spray schedule?`,
}

function LanguageModal({ onSelect }: { onSelect: (lang: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-elevated p-8 max-w-sm w-full mx-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Bot size={22} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary text-center mb-2">Choose Conversation Language</h3>
        <p className="text-sm text-text-muted text-center mb-6">Select your preferred language for this chat session</p>
        <div className="space-y-3">
          <button
            onClick={() => onSelect('English')}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border rounded-xl hover:border-green-500 hover:bg-green-50 transition-all-smooth group"
          >
            <span className="text-2xl">🇬🇧</span>
            <div className="text-left">
              <p className="font-semibold text-text-primary group-hover:text-green-700">Continue in English</p>
              <p className="text-xs text-text-muted">Default language</p>
            </div>
          </button>
          <button
            onClick={() => onSelect('Hindi')}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border rounded-xl hover:border-green-500 hover:bg-green-50 transition-all-smooth group"
          >
            <span className="text-2xl">🇮🇳</span>
            <div className="text-left">
              <p className="font-semibold text-text-primary group-hover:text-green-700">Continue in Hindi</p>
              <p className="text-xs text-text-muted">Your preferred language from profile</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `**Namaste! I'm AgroAI Assistant** 🌱

I'm your intelligent farming companion, powered by advanced AI. I can help you with:

- 🌾 **Crop recommendations** based on your soil and climate
${FEATURES.DISEASE_DETECTION ? '- 🔬 **Disease diagnosis** from plant descriptions\n' : ''}- 💧 **Irrigation & fertilizer advice**
- ☁️ **Weather-based farming decisions**
- 📊 **Yield optimization strategies**

How can I assist you with your farm today?`,
      time: '10:00 AM',
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [language, setLanguage] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState('1')
  const [feedbacks, setFeedbacks] = useState<Record<string, 'up' | 'down'>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [historyList, setHistoryList] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const fetchChatHistory = async () => {
    try {
      setLoadingHistory(true)
      const res = await api.get('/chat-history')
      const mapped = res.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.user_message.substring(0, 24) + (item.user_message.length > 24 ? '...' : ''),
        date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        user_message: item.user_message,
        assistant_response: item.assistant_response
      }))
      setHistoryList(mapped)
      setLoadingHistory(false)

      if (mapped.length > 0 && activeChat === '1') {
        const first = mapped[0]
        setActiveChat(first.id)
        setMessages([
          { id: 'u-' + first.id, role: 'user', content: first.user_message, time: '' },
          { id: 'a-' + first.id, role: 'assistant', content: first.assistant_response, time: '' }
        ])
      }
    } catch (err) {
      console.error(err)
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchChatHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim()
    if (!msgText) return
    setInput('')

    const userMsgId = Date.now().toString()
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: msgText,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(m => [...m, userMsg])
    setIsTyping(true)

    try {
      const response = await api.post('/chat', {
        question: msgText
      })
      const assistantContent = response.data.response || response.data.english_response || 'No response from assistant.'
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setIsTyping(false)
      setMessages(m => [...m, aiMsg])
      fetchChatHistory()
    } catch (err: any) {
      setIsTyping(false)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Failed to fetch AI response. Please make sure the backend is running.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(m => [...m, aiMsg])
    }
  }

  const handleNewChat = () => {
    setShowLangModal(true)
  }

  const handleLangSelect = (lang: string) => {
    setLanguage(lang)
    setShowLangModal(false)
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: `New conversation started in **${lang}**. How can I help you today? 🌱`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-background px-1.5 py-0.5 rounded text-xs font-mono text-text-secondary">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-green-400 p-3 rounded-xl text-xs font-mono mt-2 overflow-x-auto">$1</pre>')
      .replace(/\n/g, '<br />')
  }

  return (
    <div className="flex h-[calc(100vh-64px)] animate-fade-in">
      {showLangModal && <LanguageModal onSelect={handleLangSelect} />}

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface border-r border-border p-4 gap-4">
        <Button variant="primary" icon={<Plus size={14} />} onClick={handleNewChat} className="w-full justify-center">New Chat</Button>

        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recent Chats</h4>
          <div className="space-y-1">
            {loadingHistory ? (
              <p className="text-xs text-text-muted px-3 py-2">Loading history...</p>
            ) : historyList.map(chat => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat.id)
                  setMessages([
                    { id: 'u-' + chat.id, role: 'user', content: chat.user_message, time: '' },
                    { id: 'a-' + chat.id, role: 'assistant', content: chat.assistant_response, time: '' }
                  ])
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all-smooth ${activeChat === chat.id ? 'bg-green-50 text-green-700 font-medium' : 'text-text-secondary hover:bg-background'}`}
              >
                <p className="truncate">{chat.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{chat.date}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Suggested</h4>
          <div className="space-y-1">
            {suggestedQuestions.slice(0, 3).map(q => (
              <button key={q} onClick={() => handleSend(q)} className="w-full text-left px-3 py-2 rounded-xl text-xs text-text-muted hover:bg-background hover:text-text-secondary transition-colors leading-relaxed">
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-3 bg-green-50 rounded-xl border border-green-100">
          <p className="text-xs font-semibold text-green-700 mb-1">Language: {language || 'English'}</p>
          <p className="text-[10px] text-green-600">Start New Chat to change language</p>
        </div>
      </aside>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm">AgroAI Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs text-text-muted">Online · Powered by GPT-4 Agriculture</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-background transition-colors"><Download size={16} /></button>
            <button className="lg:hidden p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-background transition-colors" onClick={handleNewChat}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={15} className="text-white" />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'bg-surface shadow-soft border border-border text-text-secondary rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[10px] text-text-muted">{msg.time}</span>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFeedbacks(f => ({ ...f, [msg.id]: 'up' }))}
                        className={`p-1 rounded transition-colors ${feedbacks[msg.id] === 'up' ? 'text-green-600' : 'text-gray-300 hover:text-green-500'}`}
                      ><ThumbsUp size={11} /></button>
                      <button
                        onClick={() => setFeedbacks(f => ({ ...f, [msg.id]: 'down' }))}
                        className={`p-1 rounded transition-colors ${feedbacks[msg.id] === 'down' ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                      ><ThumbsDown size={11} /></button>
                      <button className="p-1 rounded text-gray-300 hover:text-text-muted transition-colors"><Copy size={11} /></button>
                      <button className="p-1 rounded text-gray-300 hover:text-text-muted transition-colors"><RefreshCw size={11} /></button>
                    </div>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0 mt-1 text-white text-xs font-bold">
                  RF
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-surface shadow-soft border border-border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5">
                {/* AgroAI thinking — line-art plant in rotating AI ring, all strokes */}
                <svg width="30" height="30" viewBox="-15 -15 30 30" overflow="visible" className="animate-ring-breathe flex-shrink-0" aria-hidden="true">
                  {/* Outer ring — faint track */}
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#E8F5E9" strokeWidth="2" />
                  {/* Spinning arc — single stroke dash, not a full circle */}
                  <path d="M 0 -12 A 12 12 0 0 1 10.4 6"
                    stroke="#2E7D32" fill="none" strokeWidth="2" strokeLinecap="round"
                    className="animate-ai-ring" />
                  {/* Plant stem — stroke only */}
                  <path d="M 0 7 L 0 -1" stroke="#2E7D32" fill="none" strokeWidth="1.8" strokeLinecap="round" />
                  {/* Left leaf outline — no fill */}
                  <path d="M 0 3 C -4 1 -6 -3 -3 -6 C -1 -3 0 3 0 3"
                    stroke="#43A047" fill="none" strokeWidth="1.4" strokeLinecap="round"
                    className="animate-leaf-pulse" style={{ transformOrigin: '0px 3px' }} />
                  {/* Right leaf outline — no fill */}
                  <path d="M 0 -1 C 4 -3 6 -7 3 -9 C 1 -6 0 -1 0 -1"
                    stroke="#66BB6A" fill="none" strokeWidth="1.4" strokeLinecap="round"
                    className="animate-leaf-pulse-2" style={{ transformOrigin: '0px -1px' }} />
                  {/* AI node dots — tiny filled points at extremities */}
                  <circle cx="10" cy="-7" r="1.2" fill="#4DD0E1" className="animate-ai-particle-1" />
                  <circle cx="-10" cy="-7" r="1.2" fill="#4DD0E1" className="animate-ai-particle-2" />
                </svg>
                <span className="text-xs text-text-muted italic">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestedQuestions.slice(0, 3).map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="flex-shrink-0 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-secondary hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all-smooth max-w-[220px] text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-transparent px-4 py-4 pb-6 mt-auto">
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <div className="flex-1 flex items-end gap-2 px-4 py-3 rounded-lg border border-border bg-surface transition-all duration-200 focus-within:border-text-muted focus-within:ring-2 focus-within:ring-text-muted/25 shadow-sm">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={`Ask about crops, ${FEATURES.DISEASE_DETECTION ? 'diseases, ' : ''}weather, or fertilizers...`}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-muted resize-none max-h-28 leading-relaxed"
              />
              <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                <button className="p-1.5 text-text-muted hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"><Image size={16} /></button>
                <button className="p-1.5 text-text-muted hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"><Mic size={16} /></button>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-11 h-11 rounded-lg bg-primary-700 flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98] flex-shrink-0 shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-text-muted mt-2 text-center max-w-4xl mx-auto">AI responses are for guidance only. Always consult local agricultural experts.</p>
        </div>
      </div>
    </div>
  )
}
