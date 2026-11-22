import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Workout } from './types'

export const db = new Dexie('gym-tracker') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
}

db.version(1).stores({
  exercises: 'id, name',
  workouts: 'id, startedAt',
})

// Ask the browser not to evict our data under storage pressure
navigator.storage?.persist?.()

export const newId = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()
