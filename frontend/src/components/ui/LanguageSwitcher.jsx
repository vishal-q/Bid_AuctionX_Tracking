import { useState, useRef, useEffect } from 'react'
import { Languages, Check } from 'lucide-react'
import { useLanguageStore } from '../../store/languageStore'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Change Language"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-muted)', padding: 6,
          display: 'flex', alignItems: 'center', gap: 4,
          borderRadius: 6, transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
      >
        <Languages size={16} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>{current.flag}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 300, overflow: 'hidden', minWidth: 150,
        }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'none', border: 'none',
                cursor: 'pointer', color: language === lang.code ? '#60a5fa' : 'var(--color-text)',
                fontSize: 13, textAlign: 'left',
                background: language === lang.code ? 'rgba(59,130,246,0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (language !== lang.code) e.currentTarget.style.background = 'var(--color-surface2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = language === lang.code ? 'rgba(59,130,246,0.08)' : 'transparent' }}
            >
              <span style={{ fontSize: 16 }}>{lang.flag}</span>
              <span style={{ flex: 1 }}>{lang.label}</span>
              {language === lang.code && <Check size={13} color="#60a5fa" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
