import type { MuscleId } from './muscles'
import type { Workout } from './types'

export type MuscleSets = Record<MuscleId, number>

/** Weighted working sets per muscle. Warm-up sets count nothing. */
export function muscleSets(workouts: Workout[]): MuscleSets {
  const out: MuscleSets = {}
  for (const w of workouts)
    for (const ex of w.exercises) {
      const n = ex.sets.filter((s) => !s.warmup).length
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

const setsFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
/** 1.5 → "1,5", 3 → "3" */
export const formatSets = (n: number) => setsFmt.format(n)
