import { describe, expect, it } from 'vitest'
import { makeBackup, newerOnly, parseBackup } from './backup'
import type { Exercise, Workout } from './types'

const ex: Exercise = { id: 'e1', name: 'Klimmzüge', muscles: [{ muscleId: 'latissimus', weight: 1 }], updatedAt: '2026-11-20T10:00:00.000Z' }
const wo: Workout = {
  id: 'w1',
  startedAt: '2026-11-20T17:00:00.000Z',
  endedAt: '2026-11-20T18:00:00.000Z',
  durationSec: 3600,
  updatedAt: '2026-11-20T18:00:00.000Z',
  exercises: [{ exerciseId: 'e1', name: 'Klimmzüge', muscles: ex.muscles, sets: [{ id: 's1', reps: 8, weightKg: 10, warmup: true }] }],
}

describe('parseBackup', () => {
  it('round-trips an export', () => {
    const plan = { id: 'p1', name: 'Push A', exerciseIds: ['e1'], updatedAt: wo.updatedAt }
    const goal = { id: 'brust', sets: 12.5, updatedAt: wo.updatedAt }
    expect(parseBackup(JSON.stringify(makeBackup([ex], [{ ...wo, planName: 'Push A' }], [plan], [goal])))).toEqual({
      exercises: [ex],
      workouts: [{ ...wo, planName: 'Push A' }],
      plans: [plan],
      goals: [goal],
    })
  })

  it('accepts older files without plans and goals', () => {
    const { plans, goals, ...old } = makeBackup([ex], [wo])
    expect(plans.length + goals.length).toBe(0)
    expect(parseBackup(JSON.stringify(old))).toEqual({ exercises: [ex], workouts: [wo], plans: [], goals: [] })
  })

  it('rejects broken plans and goals', () => {
    expect(() => parseBackup(JSON.stringify(makeBackup([], [], [{ id: 'p', name: '', exerciseIds: [], updatedAt: wo.updatedAt }])))).toThrow('Trainingstag 1')
    expect(() => parseBackup(JSON.stringify(makeBackup([], [], [], [{ id: 'brust', sets: -2, updatedAt: wo.updatedAt }])))).toThrow('Ziel 1')
  })

  it('rejects non-JSON, foreign JSON and newer versions', () => {
    expect(() => parseBackup('nope')).toThrow('kein gültiges JSON')
    expect(() => parseBackup('{"foo":1}')).toThrow('keine Gym-Tracker-Sicherung')
    expect(() => parseBackup(JSON.stringify({ ...makeBackup([], []), version: 2 }))).toThrow('neueren App-Version')
  })

  it('names the broken record', () => {
    const badEx = { ...ex, muscles: [{ muscleId: 'bizeps', weight: 0.7 }] }
    expect(() => parseBackup(JSON.stringify(makeBackup([ex, badEx as Exercise], [])))).toThrow('Übung 2')
    const badSet = { ...wo, exercises: [{ ...wo.exercises[0], sets: [{ id: 's', reps: -1, weightKg: 10 }] }] }
    expect(() => parseBackup(JSON.stringify(makeBackup([], [badSet])))).toThrow('Training 1')
    const badDate = { ...wo, startedAt: 'gestern' }
    expect(() => parseBackup(JSON.stringify(makeBackup([], [badDate])))).toThrow('Training 1')
  })
})

describe('newerOnly', () => {
  it('keeps new and newer records, skips older or equal', () => {
    const existing = [
      { id: 'a', updatedAt: '2026-11-20' },
      { id: 'b', updatedAt: '2026-11-20' },
    ]
    const incoming = [
      { id: 'a', updatedAt: '2026-11-19' }, // older
      { id: 'b', updatedAt: '2026-11-21' }, // newer
      { id: 'c', updatedAt: '2026-11-01' }, // new
      { id: 'a', updatedAt: '2026-11-20' }, // equal
    ]
    expect(newerOnly(existing, incoming).map((r) => r.id + r.updatedAt)).toEqual(['b2026-11-21', 'c2026-11-01'])
  })
})

describe('seed exercises', () => {
  it('are valid, unique and use known muscles', async () => {
    const { SEED_EXERCISES } = await import('./seedExercises')
    const { MUSCLES } = await import('./muscles')
    const ids = new Set(MUSCLES.map((m) => m.id as string))
    expect(SEED_EXERCISES).toHaveLength(36)
    expect(parseBackup(JSON.stringify(makeBackup(SEED_EXERCISES, []))).exercises).toEqual(SEED_EXERCISES)
    expect(new Set(SEED_EXERCISES.map((e) => e.id)).size).toBe(36)
    expect(new Set(SEED_EXERCISES.map((e) => e.name.toLowerCase())).size).toBe(36)
    for (const e of SEED_EXERCISES) for (const m of e.muscles) expect(ids.has(m.muscleId), `${e.name}: ${m.muscleId}`).toBe(true)
  })
})
