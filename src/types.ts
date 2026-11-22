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
  startedAt: string // UTC ISO (toISOString), sortable, second precision
  endedAt?: string // missing while running
  durationSec?: number
  exercises: WorkoutExercise[]
  updatedAt: string
}
