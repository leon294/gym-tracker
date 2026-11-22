// Central muscle list. IDs are stable and stored in data; labels may change freely.
export const MUSCLES = [
  { id: 'brust', label: 'Brust' },
  { id: 'obere-brust', label: 'Obere Brust' },
  { id: 'latissimus', label: 'Latissimus' },
  { id: 'oberer-ruecken', label: 'Oberer Rücken/Trapez' },
  { id: 'unterer-ruecken', label: 'Unterer Rücken' },
  { id: 'vordere-schulter', label: 'Vordere Schulter' },
  { id: 'seitliche-schulter', label: 'Seitliche Schulter' },
  { id: 'hintere-schulter', label: 'Hintere Schulter' },
  { id: 'bizeps', label: 'Bizeps' },
  { id: 'trizeps', label: 'Trizeps' },
  { id: 'unterarme', label: 'Unterarme' },
  { id: 'bauch', label: 'Bauch' },
  { id: 'seitlicher-bauch', label: 'Seitlicher Bauch' },
  { id: 'quadrizeps', label: 'Quadrizeps' },
  { id: 'beinbeuger', label: 'Beinbeuger' },
  { id: 'sartorius', label: 'Sartorius' },
  { id: 'gesaess', label: 'Gesäß' },
  { id: 'adduktoren', label: 'Adduktoren' },
  { id: 'abduktoren', label: 'Abduktoren' },
  { id: 'waden', label: 'Waden' },
] as const

export type MuscleId = string

// Unknown IDs (e.g. a muscle later removed from the list) still show something
export const muscleLabel = (id: MuscleId) => MUSCLES.find((m) => m.id === id)?.label ?? id
