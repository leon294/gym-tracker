import { lazy, Suspense, useEffect, useState } from 'react'
import {
  exerciseHistory,
  formatDate,
  formatDe,
  formatDuration,
  formatTime,
  lastTime,
  muscleSets,
  prefill,
  workingSets,
  type LastTime,
} from './calc'
import { db, newId, nowIso, useLive } from './db'
import { musclesText } from './Exercises'
import { muscleLabel } from './muscles'
import Sheet from './Sheet'
import type { Exercise, SetEntry, Workout, WorkoutExercise } from './types'
import WeightWheel from './WeightWheel'

// Recharts is large; load it only when a history sheet opens (still precached for offline)
const HistoryChart = lazy(() => import('./HistoryChart'))

export const title = 'text-[34px] leading-[41px] font-bold tracking-tight'
export const primary = 'h-14 w-full rounded-2xl bg-accent text-[17px] font-semibold text-white active:opacity-70'
export const caption = 'mb-1.5 px-4 text-[13px] text-label-2 uppercase'
export const setText = (s: SetEntry) => `${formatDe(s.weightKg)} kg × ${s.reps}`

const saveWorkout = (w: Workout) => db.workouts.put({ ...w, updatedAt: nowIso() })

export default function Training() {
  const workouts = useLive(() => db.workouts.toArray())
  const exercises = useLive(() => db.exercises.toArray())
  if (!workouts || !exercises) return null

  const running = workouts.filter((w) => !w.endedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt)).at(-1)
  return running ? (
    <WorkoutEditor w={running} workouts={workouts} exercises={exercises} />
  ) : (
    <Idle last={workouts.reduce<Workout | undefined>((a, w) => (!a || w.startedAt > a.startedAt ? w : a), undefined)} />
  )
}

function Idle({ last }: { last?: Workout }) {
  const start = () => db.workouts.add({ id: newId(), startedAt: nowIso(), exercises: [], updatedAt: nowIso() })
  return (
    <>
      <h1 className={`mt-2 mb-4 ${title}`}>Training</h1>
      <section className="rounded-xl bg-card px-4 py-6 text-center text-label-2">
        {last
          ? `Letztes Training: ${formatDate(last.startedAt)}, ${formatTime(last.startedAt)} Uhr · ${formatDuration(last.durationSec ?? 0)}`
          : 'Noch kein Training gespeichert.'}
      </section>
      {/* thumb zone, above the tab bar */}
      <div className="fixed inset-x-4 bottom-[calc(49px+env(safe-area-inset-bottom)+16px)] mx-auto max-w-lg">
        <button onClick={start} className={primary}>
          Training starten
        </button>
      </div>
    </>
  )
}

type Modal =
  | { kind: 'pick'; replace?: number }
  | { kind: 'set'; ex: number; set?: SetEntry }
  | { kind: 'history'; ex: number }
  | { kind: 'end' }

/** Running workout (timer + Beenden), or a finished one being edited (onDone given). */
export function WorkoutEditor({
  w,
  workouts,
  exercises,
  onDone,
}: {
  w: Workout
  workouts: Workout[]
  exercises: Exercise[]
  onDone?: () => void
}) {
  const [now, setNow] = useState(Date.now())
  const [modal, setModal] = useState<Modal | null>(null)
  const close = () => setModal(null)

  // Timer is derived from startedAt, so it survives reloads, closing and device lock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const elapsed = Math.max(0, (now - Date.parse(w.startedAt)) / 1000)

  const setExercises = (list: WorkoutExercise[]) => saveWorkout({ ...w, exercises: list })
  const updateEx = (i: number, f: (x: WorkoutExercise) => WorkoutExercise) =>
    setExercises(w.exercises.map((x, j) => (j === i ? f(x) : x)))
  const last = (x: WorkoutExercise) => lastTime(workouts, x.exerciseId, w.startedAt)
  const sums = Object.entries(muscleSets([w])).sort((a, b) => b[1] - a[1])

  function pick(e: Exercise) {
    const copy = { exerciseId: e.id, name: e.name, muscles: e.muscles }
    if (modal?.kind === 'pick' && modal.replace !== undefined) updateEx(modal.replace, (x) => ({ ...x, ...copy }))
    else setExercises([...w.exercises, { ...copy, sets: [] }])
    close()
  }

  function replace(i: number) {
    const x = w.exercises[i]
    if (x.sets.length && !confirm(`„${x.name}“ ersetzen? Die ${x.sets.length} Sätze bleiben erhalten und zählen dann für die neue Übung.`)) return
    setModal({ kind: 'pick', replace: i })
  }

  function remove(i: number) {
    const x = w.exercises[i]
    if (x.sets.length && !confirm(`„${x.name}“ mit ${x.sets.length} Sätzen aus dem Training entfernen?`)) return
    setExercises(w.exercises.filter((_, j) => j !== i))
  }

  function saveSet(i: number, s: SetEntry) {
    updateEx(i, (x) => ({
      ...x,
      sets: x.sets.some((y) => y.id === s.id) ? x.sets.map((y) => (y.id === s.id ? s : y)) : [...x.sets, s],
    }))
    close()
  }

  function deleteSet(i: number, id: string) {
    updateEx(i, (x) => ({ ...x, sets: x.sets.filter((y) => y.id !== id) }))
    close()
  }

  return (
    <>
      {onDone ? (
        <header className="mt-2 mb-4 flex items-end justify-between">
          <div>
            <p className="text-[15px] text-label-2">
              {formatTime(w.startedAt)} Uhr · {formatDuration(w.durationSec ?? 0)}
            </p>
            <h1 className={title}>{formatDate(w.startedAt)}</h1>
          </div>
          <button onClick={onDone} className="min-h-11 px-1 font-semibold text-accent">
            Fertig
          </button>
        </header>
      ) : (
        <header className="mt-2 mb-4 flex items-end justify-between">
          <div>
            <p className="text-[15px] text-label-2">Training seit {formatTime(w.startedAt)} Uhr</p>
            <p className={`${title} tabular-nums`} role="timer" aria-label="Trainingsdauer">
              {formatDuration(elapsed)}
            </p>
          </div>
          <button onClick={() => setModal({ kind: 'end' })} className="min-h-11 px-1 font-semibold text-accent">
            Beenden
          </button>
        </header>
      )}

      {sums.length > 0 && (
        <section aria-label="Sätze pro Muskelgruppe" className="mb-4 flex flex-wrap gap-2">
          {sums.map(([id, n]) => (
            <span key={id} className="rounded-full bg-card px-3 py-1 text-[15px]">
              {muscleLabel(id)} <span className="font-semibold tabular-nums">{formatDe(n)}</span>
            </span>
          ))}
        </section>
      )}

      <div className="space-y-4">
        {w.exercises.map((x, i) => {
          const l = last(x)
          let n = 0
          return (
            <section key={i} className="overflow-hidden rounded-xl bg-card">
              <div className="px-4 pt-3">
                <h2 className="text-[20px] font-semibold">{x.name}</h2>
                <p className="text-[13px] text-label-2">{musclesText(x.muscles)}</p>
                <LastLine last={l} />
              </div>

              {x.sets.length > 0 && (
                <ul className="mt-2">
                  {x.sets.map((s) => (
                    <li key={s.id} className="border-t-[0.5px] border-separator">
                      <button
                        onClick={() => setModal({ kind: 'set', ex: i, set: s })}
                        className="flex min-h-11 w-full items-center gap-3 px-4 text-left active:bg-separator"
                      >
                        <span className="w-12 text-[15px] text-label-2">{s.warmup ? 'Aufw.' : `Satz ${++n}`}</span>
                        <span className="tabular-nums">{setText(s)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex border-t-[0.5px] border-separator text-[15px]">
                <button onClick={() => setModal({ kind: 'history', ex: i })} className="min-h-11 flex-1 text-accent">
                  Verlauf
                </button>
                <button onClick={() => replace(i)} className="min-h-11 flex-1 text-accent">
                  Ersetzen
                </button>
                <button onClick={() => remove(i)} className="min-h-11 flex-1 text-red">
                  Entfernen
                </button>
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() => setModal({ kind: 'set', ex: i })}
                  className="h-12 w-full rounded-xl bg-bg font-semibold text-accent active:opacity-60"
                >
                  + Satz hinzufügen
                </button>
              </div>
            </section>
          )
        })}
      </div>

      <button onClick={() => setModal({ kind: 'pick' })} className={`mt-4 ${primary}`}>
        + Übung hinzufügen
      </button>

      {modal?.kind === 'pick' && (
        <PickSheet
          exercises={exercises}
          title={modal.replace !== undefined ? 'Übung ersetzen' : 'Übung hinzufügen'}
          onPick={pick}
          onClose={close}
        />
      )}
      {modal?.kind === 'set' && (
        <SetSheet
          x={w.exercises[modal.ex]}
          set={modal.set}
          last={last(w.exercises[modal.ex])}
          onSave={(s) => saveSet(modal.ex, s)}
          onDelete={(id) => deleteSet(modal.ex, id)}
          onClose={close}
        />
      )}
      {modal?.kind === 'history' && (
        <Sheet title={w.exercises[modal.ex].name} onClose={close}>
          <Suspense fallback={<p className="text-center text-label-2">Lädt …</p>}>
            <HistoryChart points={exerciseHistory(workouts, w.exercises[modal.ex].exerciseId)} />
          </Suspense>
        </Sheet>
      )}
      {modal?.kind === 'end' && <EndSheet w={w} onClose={close} />}
    </>
  )
}

function LastLine({ last }: { last?: LastTime }) {
  if (!last) return <p className="mt-1 text-[15px] text-label-2">Noch nie trainiert.</p>
  const sets = workingSets(last.sets)
  return (
    <p className="mt-1 text-[15px] text-label-2">
      Zuletzt {formatDate(last.startedAt)}: {sets.length} {sets.length === 1 ? 'Satz' : 'Sätze'}
      {sets.length > 0 && ` · ${sets.map(setText).join(', ')}`}
    </p>
  )
}

function PickSheet({
  exercises,
  title,
  onPick,
  onClose,
}: {
  exercises: Exercise[]
  title: string
  onPick: (e: Exercise) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const active = exercises.filter((e) => !e.archived)
  const list = active.filter((e) => e.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <Sheet title={title} onClose={onClose}>
      {active.length === 0 ? (
        <p className="text-center text-label-2">
          Noch keine Übungen angelegt.{' '}
          <a href="#uebungen" className="font-semibold text-accent">
            Zu den Übungen
          </a>
        </p>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen"
            aria-label="Übungen suchen"
            className="h-11 w-full rounded-xl bg-card px-4 outline-none placeholder:text-label-2 focus-visible:ring-2 focus-visible:ring-accent"
          />
          <ul className="overflow-hidden rounded-xl bg-card">
            {list.map((e) => (
              <li key={e.id} className="border-b-[0.5px] border-separator last:border-0">
                <button onClick={() => onPick(e)} className="flex min-h-11 w-full flex-col items-start px-4 py-2.5 text-left active:bg-separator">
                  <span>{e.name}</span>
                  <span className="text-[15px] text-label-2">{musclesText(e.muscles)}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-4 py-6 text-center text-label-2">Keine Treffer für „{query.trim()}“.</li>}
          </ul>
        </>
      )}
    </Sheet>
  )
}

function SetSheet({
  x,
  set,
  last,
  onSave,
  onDelete,
  onClose,
}: {
  x: WorkoutExercise
  set?: SetEntry
  last?: LastTime
  onSave: (s: SetEntry) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const init = set ?? prefill(x.sets, last)
  const [kg, setKg] = useState(init.weightKg)
  const [reps, setReps] = useState(init.reps)
  const [warmup, setWarmup] = useState(set?.warmup ?? false)
  const nextNo = workingSets(x.sets).length + 1
  const stepBtn = 'flex size-11 items-center justify-center rounded-full bg-bg text-[24px] font-medium text-accent active:opacity-50 disabled:opacity-30'

  return (
    <Sheet title={set ? 'Satz bearbeiten' : warmup ? `${x.name}: Aufwärmsatz` : `${x.name}: Satz ${nextNo}`} onClose={onClose}>
      <LastLine last={last} />

      <section>
        <h3 className={caption}>Gewicht</h3>
        <WeightWheel value={kg} onChange={setKg} />
      </section>

      <section>
        <h3 className={caption} id="reps-label">
          Wiederholungen
        </h3>
        <div className="flex items-center justify-between rounded-xl bg-card px-3 py-2">
          <button onClick={() => setReps(reps - 1)} disabled={reps <= 1} aria-label="Eine Wiederholung weniger" className={stepBtn}>
            −
          </button>
          <output aria-labelledby="reps-label" aria-live="polite" className="text-[34px] font-semibold tabular-nums">
            {reps}
          </output>
          <button onClick={() => setReps(reps + 1)} disabled={reps >= 100} aria-label="Eine Wiederholung mehr" className={stepBtn}>
            +
          </button>
        </div>
      </section>

      <label className="flex min-h-11 items-center justify-between rounded-xl bg-card px-4">
        <span>
          Aufwärmsatz
          <span className="block text-[13px] text-label-2">Zählt nicht fürs Muskelvolumen</span>
        </span>
        {/* `switch` renders the native iOS switch in Safari 17.4+, a checkbox elsewhere */}
        <input type="checkbox" {...{ switch: "" }} checked={warmup} onChange={(e) => setWarmup(e.target.checked)} className="size-6 accent-[var(--accent)]" />
      </label>

      <button onClick={() => onSave({ id: set?.id ?? newId(), weightKg: kg, reps, warmup: warmup || undefined })} className={primary}>
        {set ? 'Änderungen sichern' : 'Satz speichern'}
      </button>
      {set && (
        <button onClick={() => confirm('Diesen Satz löschen?') && onDelete(set.id)} className="min-h-11 w-full text-red">
          Satz löschen
        </button>
      )}
    </Sheet>
  )
}

function EndSheet({ w, onClose }: { w: Workout; onClose: () => void }) {
  const [end] = useState(() => new Date())
  const durationSec = Math.round((end.getTime() - Date.parse(w.startedAt)) / 1000)
  const sets = w.exercises.reduce((a, x) => a + workingSets(x.sets).length, 0)
  const sums = Object.entries(muscleSets([w])).sort((a, b) => b[1] - a[1])

  const finish = () => saveWorkout({ ...w, endedAt: end.toISOString(), durationSec })
  const discard = () => confirm('Training verwerfen? Alle Sätze dieses Trainings werden gelöscht.') && db.workouts.delete(w.id)

  const row = 'flex justify-between border-b-[0.5px] border-separator px-4 py-2.5 last:border-0'
  return (
    <Sheet title="Training beenden" onClose={onClose}>
      <dl className="overflow-hidden rounded-xl bg-card">
        <div className={row}>
          <dt>Start</dt>
          <dd className="text-label-2">
            {formatDate(w.startedAt)}, {formatTime(w.startedAt)} Uhr
          </dd>
        </div>
        <div className={row}>
          <dt>Dauer</dt>
          <dd className="text-label-2 tabular-nums">{formatDuration(durationSec)}</dd>
        </div>
        <div className={row}>
          <dt>Übungen</dt>
          <dd className="text-label-2">{w.exercises.length}</dd>
        </div>
        <div className={row}>
          <dt>Arbeitssätze</dt>
          <dd className="text-label-2">{sets}</dd>
        </div>
      </dl>

      {sums.length > 0 && (
        <section>
          <h3 className={caption}>Sätze pro Muskelgruppe</h3>
          <ul className="overflow-hidden rounded-xl bg-card">
            {sums.map(([id, n]) => (
              <li key={id} className={row}>
                <span>{muscleLabel(id)}</span>
                <span className="font-semibold tabular-nums">{formatDe(n)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button onClick={finish} className={primary}>
        Training beenden und speichern
      </button>
      <button onClick={discard} className="min-h-11 w-full text-red">
        Training verwerfen
      </button>
    </Sheet>
  )
}
