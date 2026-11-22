import { useRef, useState } from 'react'
import {
  addWeeks,
  formatDate,
  formatDe,
  formatDuration,
  formatTime,
  formatTotal,
  formatWeek,
  muscleSets,
  plural,
  weekStart,
  weekSummary,
  workingSets,
} from './calc'
import { db, useLive } from './db'
import { muscleLabel } from './muscles'
import Sheet from './Sheet'
import { caption, setText, title, WorkoutEditor } from './Training'
import type { Workout } from './types'

const card = 'overflow-hidden rounded-xl bg-card'
const row = 'flex justify-between gap-3 border-b-[0.5px] border-separator px-4 py-2.5 last:border-0'
const countSets = (w: Workout) => w.exercises.reduce((a, x) => a + workingSets(x.sets).length, 0)
const sortedSums = (ws: Workout[]) => Object.entries(muscleSets(ws)).sort((a, b) => b[1] - a[1])

export default function Auswertung() {
  const workouts = useLive(() => db.workouts.toArray())
  const exercises = useLive(() => db.exercises.toArray())
  const [view, setView] = useState<'woche' | 'verlauf'>('woche')
  const [offset, setOffset] = useState(0)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  if (!workouts || !exercises) return null

  const edited = workouts.find((w) => w.id === editId)
  if (edited) return <WorkoutEditor w={edited} workouts={workouts} exercises={exercises} onDone={() => setEditId(null)} />

  const done = workouts.filter((w) => w.endedAt) // the running workout lives in the Training tab
  const detail = workouts.find((w) => w.id === detailId)

  return (
    <>
      <h1 className={`mt-2 mb-4 ${title}`}>Auswertung</h1>
      <div role="group" aria-label="Ansicht" className="mb-4 flex rounded-lg bg-fill p-0.5">
        {(['woche', 'verlauf'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`h-9 flex-1 rounded-md text-[15px] font-medium ${view === v ? 'bg-seg shadow-sm' : 'text-label-2'}`}
          >
            {v === 'woche' ? 'Woche' : 'Verlauf'}
          </button>
        ))}
      </div>

      {view === 'woche' ? (
        <Week workouts={done} offset={offset} setOffset={setOffset} onOpen={setDetailId} />
      ) : (
        <History workouts={done} onOpen={setDetailId} />
      )}

      {detail && (
        <Detail
          w={detail}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null)
            setEditId(detail.id)
          }}
        />
      )}
    </>
  )
}

function Week({
  workouts,
  offset,
  setOffset,
  onOpen,
}: {
  workouts: Workout[]
  offset: number
  setOffset: (n: number) => void
  onOpen: (id: string) => void
}) {
  const touch = useRef<{ x: number; y: number } | null>(null)
  const start = addWeeks(weekStart(new Date()), offset)
  const s = weekSummary(workouts, start)
  const sums = sortedSums(s.workouts)
  const max = sums[0]?.[1] ?? 0
  const go = (d: number) => setOffset(Math.min(0, offset + d)) // no future weeks
  const thisYear = start.getFullYear() === new Date().getFullYear()

  return (
    <div
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return
        const dx = e.changedTouches[0].clientX - touch.current.x
        const dy = e.changedTouches[0].clientY - touch.current.y
        touch.current = null
        if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) go(dx > 0 ? -1 : 1) // swipe right = older week
      }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={() => go(-1)} aria-label="Vorherige Woche" className="flex size-11 items-center justify-center text-[28px] text-accent">
          ‹
        </button>
        <div className="text-center" aria-live="polite">
          <p className="font-semibold">
            {formatWeek(start)}
            {!thisYear && ` ${start.getFullYear()}`}
          </p>
          <p className="text-[13px] text-label-2">
            {offset === 0 ? 'Diese Woche' : offset === -1 ? 'Letzte Woche' : `Vor ${-offset} Wochen`}
          </p>
        </div>
        <button
          onClick={() => go(1)}
          disabled={offset === 0}
          aria-label="Nächste Woche"
          className="flex size-11 items-center justify-center text-[28px] text-accent disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card px-4 py-3">
          <p className="text-[13px] text-label-2">Trainings</p>
          <p className="text-[28px] font-semibold tabular-nums">{s.count}</p>
        </div>
        <div className="rounded-xl bg-card px-4 py-3">
          <p className="text-[13px] text-label-2">Ø Dauer pro Training</p>
          <p className="text-[28px] font-semibold whitespace-nowrap tabular-nums max-[380px]:text-[22px] max-[380px]:leading-[42px]">
            {s.count ? formatTotal(s.totalSec / s.count) : '–'}
          </p>
        </div>
      </div>

      <section>
        <h2 className={caption}>Gewichtete Sätze pro Muskelgruppe</h2>
        {sums.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-center text-label-2">Keine Arbeitssätze in dieser Woche.</p>
        ) : (
          <ul className={card}>
            {sums.map(([id, n]) => (
              <li key={id} className="flex items-center gap-3 border-b-[0.5px] border-separator px-4 py-2.5 last:border-0">
                <span className="w-[38%] shrink-0 truncate">{muscleLabel(id)}</span>
                <span className="flex-1" aria-hidden="true">
                  <span className="block h-2 rounded-full bg-accent" style={{ width: `${Math.max(4, (n / max) * 100)}%` }} />
                </span>
                <span className="w-9 text-right font-semibold tabular-nums">{formatDe(n)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {s.workouts.length > 0 && (
        <section>
          <h2 className={caption}>Trainings dieser Woche</h2>
          <WorkoutList workouts={s.workouts} onOpen={onOpen} />
        </section>
      )}
    </div>
  )
}

function History({ workouts, onOpen }: { workouts: Workout[]; onOpen: (id: string) => void }) {
  if (!workouts.length) return <p className="rounded-xl bg-card px-4 py-6 text-center text-label-2">Noch keine Trainings gespeichert.</p>
  return <WorkoutList workouts={[...workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))} onOpen={onOpen} />
}

function WorkoutList({ workouts, onOpen }: { workouts: Workout[]; onOpen: (id: string) => void }) {
  return (
    <ul className={card}>
      {workouts.map((w) => (
        <li key={w.id} className="border-b-[0.5px] border-separator last:border-0">
          <button onClick={() => onOpen(w.id)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-separator">
            <span className="min-w-0 flex-1">
              <span className="block">
                {formatDate(w.startedAt)}, {formatTime(w.startedAt)} Uhr
              </span>
              <span className="block truncate text-[15px] text-label-2">
                {formatDuration(w.durationSec ?? 0)} · {plural(countSets(w), 'Satz', 'Sätze')}
                {w.exercises.length > 0 && ` · ${w.exercises.map((x) => x.name).join(', ')}`}
              </span>
            </span>
            <span aria-hidden="true" className="text-label-2">
              ›
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Detail({ w, onClose, onEdit }: { w: Workout; onClose: () => void; onEdit: () => void }) {
  const sums = sortedSums([w])

  async function remove() {
    if (!confirm('Dieses Training löschen? Das lässt sich nicht rückgängig machen.')) return
    await db.workouts.delete(w.id)
    onClose()
  }

  return (
    <Sheet title={formatDate(w.startedAt)} onClose={onClose} action={{ label: 'Bearbeiten', onClick: onEdit }}>
      <dl className={card}>
        <div className={row}>
          <dt>Start</dt>
          <dd className="text-label-2">{formatTime(w.startedAt)} Uhr</dd>
        </div>
        <div className={row}>
          <dt>Dauer</dt>
          <dd className="text-label-2 tabular-nums">{formatDuration(w.durationSec ?? 0)}</dd>
        </div>
        <div className={row}>
          <dt>Arbeitssätze</dt>
          <dd className="text-label-2">{countSets(w)}</dd>
        </div>
      </dl>

      {w.exercises.map((x, i) => {
        let n = 0
        return (
          <section key={i}>
            <h3 className={caption}>{x.name}</h3>
            <ul className={card}>
              {x.sets.map((s) => (
                <li key={s.id} className={row}>
                  <span className="text-label-2">{s.warmup ? 'Aufwärmsatz' : `Satz ${++n}`}</span>
                  <span className="tabular-nums">{setText(s)}</span>
                </li>
              ))}
              {x.sets.length === 0 && <li className={`${row} text-label-2`}>Keine Sätze</li>}
            </ul>
          </section>
        )
      })}

      {sums.length > 0 && (
        <section>
          <h3 className={caption}>Sätze pro Muskelgruppe</h3>
          <ul className={card}>
            {sums.map(([id, n]) => (
              <li key={id} className={row}>
                <span>{muscleLabel(id)}</span>
                <span className="font-semibold tabular-nums">{formatDe(n)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button onClick={remove} className="min-h-11 w-full rounded-xl bg-card text-red">
        Training löschen
      </button>
    </Sheet>
  )
}
