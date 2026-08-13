import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Check, Globe, Plus, Search, X } from 'lucide-react'
import { INITIAL_LANGUAGES } from './Navbar'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslation } from '../i18n'

interface LanguageSelectorProps {
  compact?: boolean
  className?: string
}

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const { currentLanguage, setLanguage } = useLanguage()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [languages, setLanguages] = useState(INITIAL_LANGUAGES)

  const selected = languages.find(language => language.code === currentLanguage) || languages[0]
  const filtered = languages.filter(language =>
    `${language.name} ${language.native}`.toLowerCase().includes(search.toLowerCase()),
  )

  const selectLanguage = (code: string) => {
    setLanguage(code)
    setOpen(false)
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const addCustomLanguage = () => {
    const name = customName.trim()
    if (!name) return
    const code = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'custom'
    const language = { code, name, native: name, flag: '🌐' }
    setLanguages(previous => [...previous, language])
    setCustomName('')
    setShowCustom(false)
    selectLanguage(code)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-green-600 bg-white px-3 py-2 text-sm font-bold text-green-800 shadow-sm transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${className}`}
        title={t('selectLanguage')}
        aria-label={t('aria.selectLanguage')}
      >
        <Globe size={18} className="flex-shrink-0 text-green-700" />
        <span>{selected ? `${selected.flag} ${selected.native}` : t('selectLanguage')}</span>
      </button>

      {open &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-green-600 bg-white p-5 text-gray-900 shadow-2xl sm:p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 id="language-modal-title" className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Globe size={22} className="text-green-600" /> {t('selectLanguage')}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label={t('aria.closeLanguageModal')}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-600 sm:text-sm">{t('languageSelector_desc')}</p>

              <div className="relative my-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder={t('searchLanguage')}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  aria-label={t('searchLanguage')}
                />
              </div>

              <div className="min-h-0 flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {filtered.map(language => (
                  <button
                    type="button"
                    key={language.code}
                    onClick={() => selectLanguage(language.code)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition-colors ${
                      currentLanguage === language.code
                        ? 'border-2 border-green-600 bg-green-50 text-green-900 font-bold'
                        : 'border border-gray-200 bg-white text-gray-800 hover:border-green-500 hover:bg-green-50/50'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold sm:text-sm">{language.native}</span>
                      <span className="block truncate text-[10px] text-gray-500">{language.name}</span>
                    </span>
                    {currentLanguage === language.code && <Check size={16} className="flex-shrink-0 text-green-600 ml-1" />}
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                {!showCustom ? (
                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-400 p-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                  >
                    <Plus size={14} /> {t('addCustomLanguage')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={customName}
                      onChange={event => setCustomName(event.target.value)}
                      placeholder={t('enterLanguageName')}
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-green-600"
                      aria-label={t('enterLanguageName')}
                    />
                    <button
                      type="button"
                      onClick={addCustomLanguage}
                      className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                    >
                      {t('add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustom(false)}
                      className="p-1.5 text-gray-500 hover:text-gray-800"
                      aria-label={t('cancelAddingLanguage')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
