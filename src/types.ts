import type { MuscleId } from './muscles'

export type MuscleWeight = { muscleId: MuscleId; weight: 1 | 0.5 }

export interface Exercise {
  id: string
  name: string
  muscles: MuscleWeight[]
  archived?: boolean
  updatedAt: string // ISO
}

export interface SetEntry {
  id: string
  reps: number
  weightKg: number // multiples of 2.5; 0 = bodyweight
  warmup?: boolean
}

export interface WorkoutExercise {
  exerciseId: string
  name: string // copy at training time
  muscles: MuscleWeight[] // copy at training time, so later edits don't rewrite history
  sets: SetEntry[]
}

export interface Workout {
  id: string
  planName?: string // training day it was started from, e.g. "Push A"
  startedAt: string // UTC ISO (toISOString), sortable, second precision
  endedAt?: string // missing while running
  durationSec?: number
  exercises: WorkoutExercise[]
  updatedAt: string
}

/** Training day template, e.g. "Push A": the exercises preloaded when a workout starts. */
export interface Plan {
  id: string
  name: string
  exerciseIds: string[] // in order
  updatedAt: string
}

/** Weekly target of weighted working sets for one muscle. id = muscle id. */
export interface Goal {
  id: MuscleId
  sets: number
  updatedAt: string
}
