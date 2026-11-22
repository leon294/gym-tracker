import { describe, expect, it } from 'vitest'
import { addWeeks, formatSets, muscleSets, weekStart, weekSummary } from './calc'
import type { Workout, WorkoutExercise } from './types'

const pullups = (sets: number, warmups = 0): WorkoutExercise => ({
  exerciseId: 'pullups',
  name: 'Klimmzüge',
  muscles: [
    { muscleId: 'latissimus', weight: 1 },
    { muscleId: 'bizeps', weight: 0.5 },
  ],
  sets: [
    ...Array.from({ length: warmups }, (_, i) => ({ id: `w${i}`, reps: 10, weightKg: 0, warmup: true })),
    ...Array.from({ length: sets }, (_, i) => ({ id: `s${i}`, reps: 8, weightKg: 10 })),
  ],
})

const curls = (sets: number): WorkoutExercise => ({
  exerciseId: 'curls',
  name: 'Bizeps-Curls',
  muscles: [{ muscleId: 'bizeps', weight: 1 }],
  sets: Array.from({ length: sets }, (_, i) => ({ id: `c${i}`, reps: 12, weightKg: 12.5 })),
})

const workout = (start: Date, exercises: WorkoutExercise[], durationSec?: number): Workout => ({
  id: start.toISOString(),
  startedAt: start.toISOString(),
  durationSec,
  exercises,
  updatedAt: start.toISOString(),
})

describe('muscleSets', () => {
  it('spec example: 3 sets pull-ups = Latissimus 3, Bizeps 1.5', () => {
    expect(muscleSets([workout(new Date(), [pullups(3)])])).toEqual({ latissimus: 3, bizeps: 1.5 })
  })

  it('ignores warm-up sets', () => {
    expect(muscleSets([workout(new Date(), [pullups(3, 2)])])).toEqual({ latissimus: 3, bizeps: 1.5 })
  })

  it('sums across exercises and workouts', () => {
    const a = workout(new Date(), [pullups(3), curls(2)])
    const b = workout(new Date(), [curls(1)])
    expect(muscleSets([a, b])).toEqual({ latissimus: 3, bizeps: 4.5 })
  })

  it('empty input gives empty result', () => {
    expect(muscleSets([])).toEqual({})
  })
})

describe('weekStart', () => {
  it('Monday stays Monday', () => {
    expect(weekStart(new Date(2026, 10, 23, 18, 30))).toEqual(new Date(2026, 10, 23))
  })
  it('Sunday 23:59 belongs to the previous Monday', () => {
    expect(weekStart(new Date(2026, 10, 29, 23, 59))).toEqual(new Date(2026, 10, 23))
  })
  it('works across DST change (25 Oct 2026)', () => {
    expect(weekStart(new Date(2026, 9, 25, 12))).toEqual(new Date(2026, 9, 19))
    expect(addWeeks(new Date(2026, 9, 19), 1)).toEqual(new Date(2026, 9, 26))
  })
})

describe('weekSummary', () => {
  const mon = new Date(2026, 10, 23)
  const all = [
    workout(new Date(2026, 10, 22, 23, 59), [curls(5)], 600), // Sunday before: excluded
    workout(new Date(2026, 10, 25, 18), [pullups(3)], 3600),
    workout(new Date(2026, 10, 23, 7), [curls(2)], 1800),
    workout(new Date(2026, 10, 30, 0, 0), [curls(5)], 600), // next Monday: excluded
    workout(new Date(2026, 10, 29, 10), [curls(1)]), // running, no duration yet
  ]
  const s = weekSummary(all, mon)

  it('counts only workouts of that week, sorted by start', () => {
    expect(s.count).toBe(3)
    expect(s.workouts.map((w) => new Date(w.startedAt).getDate())).toEqual([23, 25, 29])
  })
  it('sums duration, treating running workouts as 0', () => {
    expect(s.totalSec).toBe(5400)
  })
  it('aggregates weighted sets', () => {
    expect(s.muscles).toEqual({ bizeps: 4.5, latissimus: 3 })
  })
})

describe('formatSets', () => {
  it('German decimal comma, max one digit', () => {
    expect(formatSets(1.5)).toBe('1,5')
    expect(formatSets(3)).toBe('3')
    expect(formatSets(0)).toBe('0')
  })
})
