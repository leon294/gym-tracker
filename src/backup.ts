import type { Exercise, Workout } from './types'

export interface Backup {
  app: 'gym-tracker'
  version: 1
  exportedAt: string
  exercises: Exercise[]
  workouts: Workout[]
}

export const makeBackup = (exercises: Exercise[], workouts: Workout[]): Backup => ({
  app: 'gym-tracker',
  version: 1,
  exportedAt: new Date().toISOString(),
  exercises,
  workouts,
})

// `any` on purpose: this validates untyped JSON from a file
const isStr = (v: any): v is string => typeof v === 'string' && v.length > 0
const isNum = (v: any): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const isIso = (v: any) => isStr(v) && !Number.isNaN(Date.parse(v))
const isMuscles = (v: any) => Array.isArray(v) && v.every((m) => isStr(m?.muscleId) && (m.weight === 1 || m.weight === 0.5))
const isSet = (s: any) => isStr(s?.id) && isNum(s.reps) && isNum(s.weightKg) && (s.warmup === undefined || typeof s.warmup === 'boolean')

/** Parses and validates a backup file. Throws with a German message on bad input. */
export function parseBackup(text: string): { exercises: Exercise[]; workouts: Workout[] } {
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  if (data?.app !== 'gym-tracker' || !Array.isArray(data.exercises) || !Array.isArray(data.workouts))
    throw new Error('Das ist keine Gym-Tracker-Sicherung.')
  if (data.version !== 1) throw new Error('Diese Sicherung stammt von einer neueren App-Version.')

  data.exercises.forEach((e: any, i: number) => {
    if (!(isStr(e?.id) && isStr(e.name) && isMuscles(e.muscles) && isIso(e.updatedAt)))
      throw new Error(`Übung ${i + 1} in der Datei ist ungültig.`)
  })
  data.workouts.forEach((w: any, i: number) => {
    const ok =
      isStr(w?.id) &&
      isIso(w.startedAt) &&
      isIso(w.updatedAt) &&
      (w.endedAt === undefined || isIso(w.endedAt)) &&
      (w.durationSec === undefined || isNum(w.durationSec)) &&
      Array.isArray(w.exercises) &&
      w.exercises.every(
        (x: any) => isStr(x?.exerciseId) && typeof x.name === 'string' && isMuscles(x.muscles) && Array.isArray(x.sets) && x.sets.every(isSet),
      )
    if (!ok) throw new Error(`Training ${i + 1} in der Datei ist ungültig.`)
  })
  return { exercises: data.exercises, workouts: data.workouts }
}

/** Records from `incoming` that are new or newer (by updatedAt) than what exists. Never deletes. */
export function newerOnly<T extends { id: string; updatedAt: string }>(existing: T[], incoming: T[]): T[] {
  const have = new Map(existing.map((r) => [r.id, r.updatedAt]))
  return incoming.filter((r) => {
    const at = have.get(r.id)
    return at === undefined || r.updatedAt > at
  })
}
