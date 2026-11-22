import Dexie, { liveQuery, type EntityTable, type Transaction } from 'dexie'
import { useEffect, useState, type DependencyList } from 'react'
import { SEED_EXERCISES } from './seedExercises'
import type { Exercise, Goal, Plan, Workout } from './types'

export const db = new Dexie('gym-tracker') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
  plans: EntityTable<Plan, 'id'>
  goals: EntityTable<Goal, 'id'>
}

db.version(1).stores({
  exercises: 'id, name',
  workouts: 'id, startedAt',
})

// Starter exercises, added exactly once per device (new DB: populate; existing DB: v2 upgrade),
// so deleting or editing them later sticks. Skips names the user already created.
const seed = async (t: Transaction) => {
  const have = new Set((await t.table('exercises').toArray()).map((e: Exercise) => e.name.trim().toLowerCase()))
  await t.table('exercises').bulkAdd(SEED_EXERCISES.filter((e) => !have.has(e.name.toLowerCase())))
}
db.version(2).stores({}).upgrade(seed)
db.on('populate', seed)
db.version(3).stores({ plans: 'id, name', goals: 'id' })

// Ask the browser not to evict our data under storage pressure
navigator.storage?.persist?.()

export const newId = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()

/** Re-renders whenever the queried tables change. undefined while loading. */
export function useLive<T>(query: () => Promise<T>, deps: DependencyList = []): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: reportError }) // shows the error banner
    return () => sub.unsubscribe()
  }, deps)
  return value
}
