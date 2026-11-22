import Dexie, { liveQuery, type EntityTable } from 'dexie'
import { useEffect, useState, type DependencyList } from 'react'
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

/** Re-renders whenever the queried tables change. undefined while loading. */
export function useLive<T>(query: () => Promise<T>, deps: DependencyList = []): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: reportError }) // shows the error banner
    return () => sub.unsubscribe()
  }, deps)
  return value
}
