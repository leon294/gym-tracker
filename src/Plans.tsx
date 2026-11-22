import { useState } from 'react'
import { plural } from './calc'
import { db, newId, nowIso } from './db'
import Sheet from './Sheet'
import type { Exercise, Plan } from './types'

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de', { numeric: true })
export const sortPlans = (plans: Plan[]) => [...plans].sort(byName)
export const planSummary = (p: Plan, exercises: Exercise[]) =>
  p.exerciseIds
    .map((id) => exercises.find((e) => e.id === id)?.name)
    .filter(Boolean)
    .join(', ')

export function PlanList({ plans, exercises, onEdit }: { plans: Plan[]; exercises: Exercise[]; onEdit: (p: Plan | 'new') => void }) {
  if (!plans.length)
    return (
      <section className="rounded-xl bg-card px-4 py-6 text-center">
        <p className="text-label-2">Noch keine Trainingstage, z. B. Push A, Pull A oder Legs A.</p>
        <button onClick={() => onEdit('new')} className="mt-2 min-h-11 font-semibold text-accent">
          Ersten Trainingstag anlegen
        </button>
      </section>
    )
  return (
    <>
      <ul className="overflow-hidden rounded-xl bg-card">
        {sortPlans(plans).map((p) => (
          <li key={p.id} className="border-b-[0.5px] border-separator last:border-0">
            <button onClick={() => onEdit(p)} className="flex min-h-11 w-full flex-col items-start px-4 py-2.5 text-left active:bg-separator">
              <span>{p.name}</span>
              <span className="line-clamp-2 text-[15px] text-label-2">
                {plural(p.exerciseIds.length, 'Übung', 'Übungen')} · {planSummary(p, exercises)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 px-4 text-[13px] text-label-2">Beim Training starten wählst du einen Trainingstag, seine Übungen sind dann schon eingetragen.</p>
    </>
  )
}

export function PlanEditor({
  plan,
  plans,
  exercises,
  onClose,
}: {
  plan: Plan | null
  plans: Plan[]
  exercises: Exercise[]
  onClose: () => void
}) {
  const [name, setName] = useState(plan?.name ?? '')
  const [ids, setIds] = useState<string[]>(plan?.exerciseIds ?? [])
  const [query, setQuery] = useState('')
  const [tried, setTried] = useState(false)

  const trimmed = name.trim()
  const chosen = ids.map((id) => exercises.find((e) => e.id === id)).filter((e): e is Exercise => !!e) // drops deleted ones
  const q = query.trim().toLowerCase()
  const available = exercises.filter((e) => !e.archived && !ids.includes(e.id) && e.name.toLowerCase().includes(q)).sort(byName)
  const error = !trimmed
    ? 'Bitte einen Namen eingeben.'
    : plans.some((p) => p.id !== plan?.id && p.name.trim().toLowerCase() === trimmed.toLowerCase())
      ? 'Einen Trainingstag mit diesem Namen gibt es schon.'
      : chosen.length === 0
        ? 'Bitte mindestens eine Übung hinzufügen.'
        : null

  const move = (i: number, d: number) => {
    const next = chosen.map((e) => e.id)
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setIds(next)
  }

  async function save() {
    setTried(true)
    if (error) return
    await db.plans.put({ id: plan?.id ?? newId(), name: trimmed, exerciseIds: chosen.map((e) => e.id), updatedAt: nowIso() })
    onClose()
  }

  async function remove() {
    if (!confirm(`Trainingstag „${plan!.name}“ löschen? Gespeicherte Trainings bleiben erhalten.`)) return
    await db.plans.delete(plan!.id)
    onClose()
  }

  const iconBtn = 'flex size-11 shrink-0 items-center justify-center text-accent disabled:opacity-25'
  const caption = 'mb-1.5 px-4 text-[13px] text-label-2 uppercase'

  return (
    <Sheet title={plan ? 'Trainingstag bearbeiten' : 'Neuer Trainingstag'} onClose={onClose} action={{ label: 'Sichern', onClick: save }}>
      <label className="block">
        <span className={`block ${caption}`}>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Push A"
          autoComplete="off"
          className="h-11 w-full rounded-xl bg-card px-4 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <section>
        <h3 className={caption}>Übungen ({chosen.length})</h3>
        <ol className="overflow-hidden rounded-xl bg-card">
          {chosen.map((e, i) => (
            <li key={e.id} className="flex items-center border-b-[0.5px] border-separator pl-4 last:border-0">
              <span className="w-6 shrink-0 text-[15px] text-label-2 tabular-nums">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${e.name} nach oben`} className={iconBtn}>
                ↑
              </button>
              <button onClick={() => move(i, 1)} disabled={i === chosen.length - 1} aria-label={`${e.name} nach unten`} className={iconBtn}>
                ↓
              </button>
              <button onClick={() => setIds(ids.filter((x) => x !== e.id))} aria-label={`${e.name} entfernen`} className={`${iconBtn} text-red`}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-5 8.75a1.25 1.25 0 0 0 0 2.5h10a1.25 1.25 0 0 0 0-2.5H7Z" />
                </svg>
              </button>
            </li>
          ))}
          {chosen.length === 0 && <li className="px-4 py-4 text-center text-label-2">Noch keine Übung, wähle unten welche aus.</li>}
        </ol>
      </section>

      {tried && error && (
        <p role="alert" className="px-4 text-[15px] text-red">
          {error}
        </p>
      )}

      <section>
        <h3 className={caption}>Übung hinzufügen</h3>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen"
          aria-label="Übungen suchen"
          className="mb-2 h-11 w-full rounded-xl bg-card px-4 outline-none placeholder:text-label-2 focus-visible:ring-2 focus-visible:ring-accent"
        />
        <ul className="overflow-hidden rounded-xl bg-card">
          {available.map((e) => (
            <li key={e.id} className="border-b-[0.5px] border-separator last:border-0">
              <button onClick={() => setIds([...chosen.map((x) => x.id), e.id])} className="flex min-h-11 w-full items-center gap-3 px-4 text-left active:bg-separator">
                <span aria-hidden="true" className="text-[20px] text-accent">
                  +
                </span>
                <span>{e.name}</span>
              </button>
            </li>
          ))}
          {available.length === 0 && (
            <li className="px-4 py-4 text-center text-label-2">{q ? `Keine Treffer für „${query.trim()}“.` : 'Alle Übungen sind schon drin.'}</li>
          )}
        </ul>
      </section>

      {plan && (
        <button onClick={remove} className="min-h-11 w-full rounded-xl bg-card text-red">
          Trainingstag löschen
        </button>
      )}
    </Sheet>
  )
}
