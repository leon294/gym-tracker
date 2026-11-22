import { useEffect, useState } from 'react'
import { makeBackup, newerOnly, parseBackup } from './backup'
import { formatDate, formatTime, plural } from './calc'
import { db, useLive } from './db'
import { caption, primary, title } from './Training'

const LAST_EXPORT = 'lastExport' // per-device reminder only, not app data

const readLastExport = () => {
  try {
    return localStorage.getItem(LAST_EXPORT)
  } catch {
    return null
  }
}

export default function Settings() {
  const exercises = useLive(() => db.exercises.toArray())
  const workouts = useLive(() => db.workouts.toArray())
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [persisted, setPersisted] = useState<boolean>()
  const [lastExport, setLastExport] = useState(readLastExport)
  const standalone =
    matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
  }, [])

  async function exportData() {
    const name = `gym-tracker-${new Date().toLocaleDateString('sv')}.json` // sv = YYYY-MM-DD, local date
    const file = new File([JSON.stringify(makeBackup(exercises ?? [], workouts ?? []), null, 2)], name, { type: 'application/json' })
    const done = () => {
      const now = new Date().toISOString()
      try {
        localStorage.setItem(LAST_EXPORT, now)
      } catch {
        /* reminder only */
      }
      setLastExport(now)
    }
    // iOS: the share sheet lets you "Save to Files"; elsewhere fall back to a normal download
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return done()
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    done()
  }

  async function importFile(f: File) {
    setMsg(null)
    try {
      const data = parseBackup(await f.text())
      const ex = newerOnly(await db.exercises.toArray(), data.exercises)
      const wo = newerOnly(await db.workouts.toArray(), data.workouts)
      await db.transaction('rw', db.exercises, db.workouts, async () => {
        await db.exercises.bulkPut(ex)
        await db.workouts.bulkPut(wo)
      })
      setMsg({ ok: true, text: `Import fertig: ${plural(ex.length, 'Übung', 'Übungen')} und ${plural(wo.length, 'Training', 'Trainings')} neu oder aktualisiert.` })
    } catch (e) {
      setMsg({ ok: false, text: `Import fehlgeschlagen: ${(e as Error).message}` })
    }
  }

  const row = 'flex justify-between gap-3 border-b-[0.5px] border-separator px-4 py-2.5 last:border-0'

  return (
    <div className="space-y-6">
      <h1 className={`mt-2 ${title}`}>Einstellungen</h1>

      <section>
        <h2 className={caption}>Datensicherung</h2>
        <div className="space-y-3 rounded-xl bg-card p-4">
          <p className="text-[15px] text-label-2">
            {plural(exercises?.length ?? 0, 'Übung', 'Übungen')} · {plural(workouts?.length ?? 0, 'Training', 'Trainings')}
            <br />
            {lastExport
              ? `Letzte Sicherung: ${formatDate(lastExport)}, ${formatTime(lastExport)} Uhr`
              : 'Noch keine Sicherung exportiert.'}
          </p>
          <button onClick={exportData} disabled={!exercises || !workouts} className={primary}>
            Daten exportieren
          </button>
          <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-bg font-semibold text-accent focus-within:ring-2 focus-within:ring-accent active:opacity-60">
            Daten importieren
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = '' // allow picking the same file again
                if (f) importFile(f)
              }}
            />
          </label>
        </div>
        <p className="mt-1.5 px-4 text-[13px] text-label-2">
          Der Export speichert alle Übungen und Trainings als JSON-Datei. Beim Import werden neue Einträge ergänzt und ältere Stände
          aktualisiert, es wird nichts gelöscht.
        </p>
        {msg && (
          <p role="alert" className={`mt-3 rounded-xl bg-card px-4 py-3 text-[15px] ${msg.ok ? '' : 'text-red'}`}>
            {msg.text}
          </p>
        )}
      </section>

      <section>
        <h2 className={caption}>Speicher</h2>
        <dl className="overflow-hidden rounded-xl bg-card">
          <div className={row}>
            <dt>Auf dem Home-Bildschirm</dt>
            <dd className="text-label-2">{standalone ? 'Ja' : 'Nein'}</dd>
          </div>
          <div className={row}>
            <dt>Dauerhafter Speicher</dt>
            <dd className="text-label-2">{persisted === undefined ? 'Unbekannt' : persisted ? 'Ja' : 'Nein'}</dd>
          </div>
        </dl>
        <p className="mt-1.5 px-4 text-[13px] text-label-2">
          Die Daten liegen nur auf diesem Gerät.
          {!standalone && ' Füge die App über „Teilen → Zum Home-Bildschirm“ hinzu, sonst kann Safari die Daten nach einigen Wochen ohne Nutzung löschen.'}{' '}
          Exportiere regelmäßig eine Sicherung.
        </p>
      </section>
    </div>
  )
}
