import { describe, expect, it } from 'vitest'
import { planExercises, addWeeks, e1rm, exerciseHistory, formatDate, formatDe, formatDuration, formatTotal, formatWeek, lastTime, muscleSets, prefill, weekStart, weekSummary } from './calc'
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
    expect(muscleSets([workout(new Date(), [pullups(0, 2)])])).toEqual({})
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

describe('formatDe', () => {
  it('German decimal comma, max one digit', () => {
    expect(formatDe(1.5)).toBe('1,5')
    expect(formatDe(3)).toBe('3')
    expect(formatDe(0)).toBe('0')
  })
})

describe('lastTime / prefill', () => {
  const a = workout(new Date(2026, 10, 20, 18), [pullups(2, 1)])
  const b = workout(new Date(2026, 10, 23, 18), [curls(1)])
  const c = workout(new Date(2026, 10, 25, 18), [pullups(3)])

  it('finds the most recent earlier workout with this exercise', () => {
    expect(lastTime([a, b, c], 'pullups', c.startedAt)?.startedAt).toBe(a.startedAt)
    expect(lastTime([a, b, c], 'pullups')?.startedAt).toBe(c.startedAt)
    expect(lastTime([b], 'pullups')).toBeUndefined()
  })

  it('prefill: last set today wins, else first working set of last time, else default', () => {
    const today = [{ id: 'x', reps: 5, weightKg: 42.5 }]
    expect(prefill(today, lastTime([a], 'pullups'))).toEqual({ weightKg: 42.5, reps: 5 })
    expect(prefill([], lastTime([a], 'pullups'))).toEqual({ weightKg: 10, reps: 8 }) // skips warm-up
    expect(prefill([], undefined)).toEqual({ weightKg: 20, reps: 10 })
  })
})

describe('exerciseHistory', () => {
  it('one point per workout, oldest first, warm-ups ignored', () => {
    const w1 = workout(new Date(2026, 10, 25), [
      { ...curls(0), sets: [{ id: '1', reps: 10, weightKg: 20 }, { id: '2', reps: 5, weightKg: 25 }, { id: '3', reps: 1, weightKg: 40, warmup: true }] },
    ])
    const w0 = workout(new Date(2026, 10, 20), [curls(1)])
    expect(exerciseHistory([w1, w0], 'curls')).toEqual([
      { startedAt: w0.startedAt, weight: 12.5, e1rm: 17.5, volume: 150 },
      { startedAt: w1.startedAt, weight: 25, e1rm: 29.2, volume: 325 },
    ])
  })
  it('e1rm: single rep equals weight', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(100, 0)).toBe(100)
  })
})

describe('formatDuration / formatDate', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(75)).toBe('1:15')
    expect(formatDuration(3725.9)).toBe('1:02:05')
  })
  it('German short date', () => {
    expect(formatDate(new Date(2026, 10, 23, 18).toISOString())).toBe('Mo., 23. Nov.')
  })
})

describe('formatWeek / formatTotal', () => {
  it('week range within and across months', () => {
    expect(formatWeek(new Date(2026, 10, 23))).toMatch(/^23\.\s?–\s?29\. Nov\.$/)
    expect(formatWeek(new Date(2026, 10, 30))).toMatch(/^30\. Nov\.\s?–\s?6\. Dez\.$/)
  })
  it('total duration', () => {
    expect(formatTotal(0)).toBe('0 min')
    expect(formatTotal(2700)).toBe('45 min')
    expect(formatTotal(8100)).toBe('2 h 15 min')
  })
})

describe('planExercises', () => {
  it('copies exercises in plan order, skipping deleted and archived ones', () => {
    const ex = (id: string, archived?: boolean) => ({ id, name: id.toUpperCase(), muscles: [{ muscleId: 'brust', weight: 1 as const }], archived, updatedAt: '' })
    const plan = { id: 'p', name: 'Push A', exerciseIds: ['b', 'gone', 'a', 'old'], updatedAt: '' }
    expect(planExercises(plan, [ex('a'), ex('b'), ex('old', true)])).toEqual([
      { exerciseId: 'b', name: 'B', muscles: [{ muscleId: 'brust', weight: 1 }], sets: [] },
      { exerciseId: 'a', name: 'A', muscles: [{ muscleId: 'brust', weight: 1 }], sets: [] },
    ])
  })
})
