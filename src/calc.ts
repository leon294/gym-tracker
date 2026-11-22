import type { MuscleId } from './muscles'
import type { Exercise, Plan, SetEntry, Workout, WorkoutExercise } from './types'

export type MuscleSets = Record<MuscleId, number>

/** Weighted working sets per muscle. Warm-up sets count nothing. */
export function muscleSets(workouts: Workout[]): MuscleSets {
  const out: MuscleSets = {}
  for (const w of workouts)
    for (const ex of w.exercises) {
      const n = ex.sets.filter((s) => !s.warmup).length
      if (!n) continue // no zero entries for exercises without working sets
      for (const m of ex.muscles) out[m.muscleId] = (out[m.muscleId] ?? 0) + n * m.weight
    }
  return out
}

/** Monday 00:00 local time of the week containing d. */
export function weekStart(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

export function addWeeks(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n)
}

export interface WeekSummary {
  start: Date
  workouts: Workout[]
  count: number
  totalSec: number
  muscles: MuscleSets
}

/** Workouts that started in the week beginning at `start` (local Monday). */
export function weekSummary(all: Workout[], start: Date): WeekSummary {
  const from = start.getTime()
  const to = addWeeks(start, 1).getTime()
  const workouts = all
    .filter((w) => {
      const t = Date.parse(w.startedAt)
      return t >= from && t < to
    })
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  return {
    start,
    workouts,
    count: workouts.length,
    totalSec: workouts.reduce((s, w) => s + (w.durationSec ?? 0), 0),
    muscles: muscleSets(workouts),
  }
}

const deFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
/** German number, max one decimal: 1.5 → "1,5", 3 → "3" */
export const formatDe = (n: number) => deFmt.format(n)

export const workingSets = (sets: SetEntry[]) => sets.filter((s) => !s.warmup)

export interface LastTime {
  startedAt: string
  sets: SetEntry[]
}

/** Most recent workout started before `before` (ISO; default: any) with sets for this exercise. */
export function lastTime(workouts: Workout[], exerciseId: string, before?: string): LastTime | undefined {
  let best: LastTime | undefined
  for (const w of workouts) {
    if (before && w.startedAt >= before) continue
    const sets = w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets)
    if (sets.length && (!best || w.startedAt > best.startedAt)) best = { startedAt: w.startedAt, sets }
  }
  return best
}

/** Start values for a new set: last set of today, else first working set of last time. */
export function prefill(current: SetEntry[], last?: LastTime): { weightKg: number; reps: number } {
  const s = current.at(-1) ?? (last && (workingSets(last.sets)[0] ?? last.sets[0]))
  return s ? { weightKg: s.weightKg, reps: s.reps } : { weightKg: 20, reps: 10 }
}

/** Epley estimate; a single rep is its own 1RM. */
export const e1rm = (kg: number, reps: number) => (reps <= 1 ? kg : kg * (1 + reps / 30))

export interface HistoryPoint {
  startedAt: string
  weight: number // heaviest working set
  e1rm: number // best estimated 1RM
  volume: number // sum of kg × reps
}

/** One point per workout with working sets of this exercise, oldest first. */
export function exerciseHistory(workouts: Workout[], exerciseId: string): HistoryPoint[] {
  return workouts
    .flatMap((w) => {
      const sets = workingSets(w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets))
      if (!sets.length) return []
      return [
        {
          startedAt: w.startedAt,
          weight: Math.max(...sets.map((s) => s.weightKg)),
          e1rm: Math.round(Math.max(...sets.map((s) => e1rm(s.weightKg, s.reps))) * 10) / 10,
          volume: sets.reduce((a, s) => a + s.weightKg * s.reps, 0),
        },
      ]
    })
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
}

/** 1 → "1 Satz", 3 → "3 Sätze" */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const pad = (n: number) => String(n).padStart(2, '0')
/** 75 → "1:15", 3725 → "1:02:05" */
export function formatDuration(sec: number) {
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

const dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })
/** "Mo., 23. Nov." */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
/** "18:05" */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

const rangeFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' })
/** Monday..Sunday label: "23.–29. Nov." or "30. Nov. – 6. Dez." */
export const formatWeek = (start: Date) =>
  rangeFmt.formatRange(start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))

/** Total training time: 0 → "0 min", 8100 → "2 h 15 min" */
export function formatTotal(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h ? `${h} h ${m} min` : `${m} min`
}

/** Exercises a workout starts with for a training day; skips ones deleted or archived since. */
export function planExercises(plan: Plan, exercises: Exercise[]): WorkoutExercise[] {
  return plan.exerciseIds.flatMap((id) => {
    const e = exercises.find((x) => x.id === id && !x.archived)
    return e ? [{ exerciseId: e.id, name: e.name, muscles: e.muscles, sets: [] }] : []
  })
}
