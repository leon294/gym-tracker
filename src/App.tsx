import { useEffect, useState, type ReactNode } from 'react'
import Auswertung from './Auswertung'
import Exercises from './Exercises'
import Settings from './Settings'
import Training from './Training'

type TabId = 'training' | 'auswertung' | 'uebungen' | 'einstellungen'

// Filled glyphs, matching iOS tab bar convention (HIG tab-bars › "Prefer filled symbols")
const icons: Record<TabId, ReactNode> = {
  training: (
    <path d="M2 10h2V8a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2H2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm6-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-5H16v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v5H8V6Zm12 2a1 1 0 0 1 1 1v1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-1 1h-.5V8H20Z" />
  ),
  auswertung: (
    <path d="M4 13a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 8 13v6.5A1.5 1.5 0 0 1 6.5 21h-1A1.5 1.5 0 0 1 4 19.5V13Zm6-8A1.5 1.5 0 0 1 11.5 3.5h1A1.5 1.5 0 0 1 14 5v14.5a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5V5Zm6 4a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 20 9v10.5a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5V9Z" />
  ),
  uebungen: (
    <path d="M4.5 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5 .75h10a1.25 1.25 0 0 1 0 2.5h-10a1.25 1.25 0 0 1 0-2.5ZM4.5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5 .75h10a1.25 1.25 0 0 1 0 2.5h-10a1.25 1.25 0 0 1 0-2.5ZM4.5 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5 .75h10a1.25 1.25 0 0 1 0 2.5h-10a1.25 1.25 0 0 1 0-2.5Z" />
  ),
  einstellungen: (
    <path d="M10.3 2h3.4l.5 2.6a8 8 0 0 1 1.9 1.1l2.5-.9 1.7 3-2 1.7a8 8 0 0 1 0 2.2l2 1.7-1.7 3-2.5-.9a8 8 0 0 1-1.9 1.1l-.5 2.6h-3.4l-.5-2.6a8 8 0 0 1-1.9-1.1l-2.5.9-1.7-3 2-1.7a8 8 0 0 1 0-2.2l-2-1.7 1.7-3 2.5.9a8 8 0 0 1 1.9-1.1l.5-2.6ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" fillRule="evenodd" />
  ),
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'training', label: 'Training' },
  { id: 'auswertung', label: 'Auswertung' },
  { id: 'uebungen', label: 'Übungen' },
  { id: 'einstellungen', label: 'Einstellungen' },
]

const fromHash = (): TabId => {
  const h = location.hash.slice(1) as TabId
  return tabs.some((t) => t.id === h) ? h : 'training'
}

export default function App() {
  const [tab, setTab] = useState<TabId>(fromHash)
  const [error, setError] = useState<string | null>(null)

  // Writes are fire-and-forget, so a failing IndexedDB (full, private mode) surfaces here instead of silently
  useEffect(() => {
    const onError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const err = 'reason' in e ? e.reason : e.error
      const text = String(err?.message ?? err ?? 'Unbekannter Fehler')
      if (!text.includes('ResizeObserver')) setError(text) // harmless browser noise from charts
    }
    addEventListener('error', onError)
    addEventListener('unhandledrejection', onError)
    return () => {
      removeEventListener('error', onError)
      removeEventListener('unhandledrejection', onError)
    }
  }, [])

  // Hash keeps the tab across reloads and enables browser back
  useEffect(() => {
    const onHash = () => setTab(fromHash())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <main
        className="flex-1 overflow-y-auto px-4 pb-[calc(49px+env(safe-area-inset-bottom)+16px)]"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        {tab === 'uebungen' ? (
          <Exercises />
        ) : tab === 'training' ? (
          <Training />
        ) : tab === 'auswertung' ? (
          <Auswertung />
        ) : (
          <Settings />
        )}
      </main>

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-xl bg-card p-4 shadow-lg ring-1 ring-separator"
          style={{ top: 'max(env(safe-area-inset-top), 12px)' }}
        >
          <p className="flex-1 text-[15px]">
            <span className="font-semibold text-red">Fehler beim Speichern oder Laden.</span> Die letzte Änderung wurde eventuell nicht
            gespeichert. ({error})
          </p>
          <button onClick={() => setError(null)} className="min-h-11 px-1 font-semibold text-accent">
            OK
          </button>
        </div>
      )}

      <nav
        aria-label="Hauptnavigation"
        className="fixed inset-x-0 bottom-0 flex border-t-[0.5px] border-separator bg-bar backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((t) => {
          const active = t.id === tab
          return (
            <a
              key={t.id}
              href={`#${t.id}`}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[49px] flex-1 flex-col items-center justify-center gap-0.5 ${active ? 'text-accent' : 'text-label-2'}`}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                {icons[t.id]}
              </svg>
              <span className="text-[11px] leading-none font-medium">{t.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
