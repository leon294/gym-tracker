import { useState } from 'react'
import { formatDe } from './calc'
import { db, newId, nowIso, useLive } from './db'
import { MUSCLES, muscleLabel } from './muscles'
import Sheet from './Sheet'
import type { Exercise, MuscleWeight } from './types'

export const musclesText = (ms: MuscleWeight[]) =>
  ms.map((m) => (m.weight === 1 ? muscleLabel(m.muscleId) : `${muscleLabel(m.muscleId)} ${formatDe(m.weight)}`)).join(' · ')

export default function Exercises() {
  const all = useLive(() => db.exercises.toArray())
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null)

  const q = query.trim().toLowerCase()
  const list = (all ?? [])
    .filter((e) => (showArchived || !e.archived) && e.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  const archivedCount = all?.filter((e) => e.archived).length ?? 0

  return (
    <>
      <header className="mt-2 mb-3 flex items-center justify-between">
        <h1 className="text-[34px] leading-[41px] font-bold tracking-tight">Übungen</h1>
        <button
          onClick={() => setEditing('new')}
          aria-label="Neue Übung"
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-accent active:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M12 4a1.25 1.25 0 0 1 1.25 1.25v5.5h5.5a1.25 1.25 0 0 1 0 2.5h-5.5v5.5a1.25 1.25 0 0 1-2.5 0v-5.5h-5.5a1.25 1.25 0 0 1 0-2.5h5.5v-5.5A1.25 1.25 0 0 1 12 4Z" />
          </svg>
        </button>
      </header>

      {all && all.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen"
          aria-label="Übungen suchen"
          className="mb-4 h-11 w-full rounded-xl bg-card px-4 outline-none placeholder:text-label-2 focus-visible:ring-2 focus-visible:ring-accent"
        />
      )}

      {all?.length === 0 ? (
        <section className="rounded-xl bg-card px-4 py-6 text-center">
          <p className="text-label-2">Noch keine Übungen angelegt.</p>
          <button onClick={() => setEditing('new')} className="mt-2 min-h-11 font-semibold text-accent">
            Erste Übung anlegen
          </button>
        </section>
      ) : (
        <ul className="overflow-hidden rounded-xl bg-card">
          {list.map((e) => (
            <li key={e.id} className="border-b-[0.5px] border-separator last:border-0">
              <button
                onClick={() => setEditing(e)}
                className={`flex min-h-11 w-full flex-col items-start px-4 py-2.5 text-left active:bg-separator ${e.archived ? 'opacity-50' : ''}`}
              >
                <span>
                  {e.name}
                  {e.archived && <span className="text-label-2"> (archiviert)</span>}
                </span>
                <span className="text-[15px] text-label-2">{musclesText(e.muscles)}</span>
              </button>
            </li>
          ))}
          {all && list.length === 0 && (
            <li className="px-4 py-6 text-center text-label-2">
              {q ? `Keine Treffer für „${query.trim()}“.` : 'Alle Übungen sind archiviert.'}
            </li>
          )}
        </ul>
      )}

      {archivedCount > 0 && (
        <button onClick={() => setShowArchived(!showArchived)} className="mt-3 min-h-11 w-full text-accent">
          {showArchived ? 'Archivierte ausblenden' : `Archivierte anzeigen (${archivedCount})`}
        </button>
      )}

      {editing && (
        <Editor exercise={editing === 'new' ? null : editing} all={all ?? []} onClose={() => setEditing(null)} />
      )}
    </>
  )
}

function Editor({ exercise, all, onClose }: { exercise: Exercise | null; all: Exercise[]; onClose: () => void }) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [muscles, setMuscles] = useState<MuscleWeight[]>(exercise?.muscles ?? [{ muscleId: '', weight: 1 }])
  const [tried, setTried] = useState(false)

  const trimmed = name.trim()
  const rows = muscles.filter((m) => m.muscleId)
  const duplicate = all.some(
    (e) => e.id !== exercise?.id && !e.archived && e.name.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  const error = !trimmed
    ? 'Bitte einen Namen eingeben.'
    : duplicate
      ? 'Eine Übung mit diesem Namen gibt es schon.'
      : rows.length === 0
        ? 'Bitte mindestens eine Muskelgruppe wählen.'
        : null

  const setRow = (i: number, patch: Partial<MuscleWeight>) =>
    setMuscles(muscles.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  async function save() {
    setTried(true)
    if (error) return
    await db.exercises.put({
      id: exercise?.id ?? newId(),
      name: trimmed,
      muscles: rows,
      archived: exercise?.archived,
      updatedAt: nowIso(),
    })
    onClose()
  }

  async function toggleArchive() {
    await db.exercises.update(exercise!.id, { archived: !exercise!.archived, updatedAt: nowIso() })
    onClose()
  }

  return (
    <Sheet title={exercise ? 'Übung bearbeiten' : 'Neue Übung'} onClose={onClose} action={{ label: 'Sichern', onClick: save }}>
        <label className="block">
          <span className="mb-1.5 block px-4 text-[13px] text-label-2 uppercase">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Klimmzüge"
            autoComplete="off"
            className="h-11 w-full rounded-xl bg-card px-4 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <section>
          <h3 className="mb-1.5 px-4 text-[13px] text-label-2 uppercase">Muskelgruppen</h3>
          <ul className="overflow-hidden rounded-xl bg-card">
            {muscles.map((m, i) => (
              <li key={i} className="flex items-center gap-2 border-b-[0.5px] border-separator py-1.5 pr-2 pl-1">
                <button
                  onClick={() => setMuscles(muscles.filter((_, j) => j !== i))}
                  aria-label="Muskelgruppe entfernen"
                  className="flex size-11 shrink-0 items-center justify-center text-red"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-5 8.75a1.25 1.25 0 0 0 0 2.5h10a1.25 1.25 0 0 0 0-2.5H7Z" />
                  </svg>
                </button>
                <select
                  value={m.muscleId}
                  onChange={(e) => setRow(i, { muscleId: e.target.value })}
                  aria-label="Muskelgruppe"
                  className={`h-11 min-w-0 flex-1 bg-transparent outline-none ${m.muscleId ? '' : 'text-label-2'}`}
                >
                  <option value="">Muskelgruppe wählen</option>
                  {MUSCLES.filter((o) => o.id === m.muscleId || !muscles.some((x) => x.muscleId === o.id)).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div role="group" aria-label="Gewichtung" className="flex shrink-0 rounded-lg bg-bg p-0.5">
                  {([1, 0.5] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setRow(i, { weight: w })}
                      aria-pressed={m.weight === w}
                      className={`h-9 w-12 rounded-md text-[15px] font-medium ${m.weight === w ? 'bg-card shadow-sm' : 'text-label-2'}`}
                    >
                      {formatDe(w)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
            {muscles.length < MUSCLES.length && (
              <li>
                <button
                  onClick={() => setMuscles([...muscles, { muscleId: '', weight: 1 }])}
                  className="flex min-h-11 w-full items-center gap-2 px-4 text-accent"
                >
                  + Muskelgruppe hinzufügen
                </button>
              </li>
            )}
          </ul>
          <p className="mt-1.5 px-4 text-[13px] text-label-2">1 = ganzer Satz, 0,5 = halber Satz pro ausgeführtem Satz.</p>
        </section>

        {tried && error && (
          <p role="alert" className="px-4 text-[15px] text-red">
            {error}
          </p>
        )}

        {exercise && (
          <button onClick={toggleArchive} className="min-h-11 w-full rounded-xl bg-card text-accent">
            {exercise.archived ? 'Wiederherstellen' : 'Archivieren'}
          </button>
        )}
    </Sheet>
  )
}
