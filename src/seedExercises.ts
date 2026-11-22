import type { Exercise } from './types'

// Starter exercises from the user's training plans (GK, Push/Pull/Legs, Push/Pull), seeded once per device.
// Weights derived from the plans' volume column. Stable ids so a later file import doesn't duplicate them.
const AT = '2026-11-22T00:00:00.000Z'

type Seed = [id: string, name: string, muscles: Exercise['muscles']]

const SEED: Seed[] = [
  ['xl-adduktoren', 'Adduktoren', [{ muscleId: 'adduktoren', weight: 1 }]],
  ['xl-bauchpresse', 'Bauchpresse', [{ muscleId: 'bauch', weight: 1 }]],
  ['xl-beinbeuger-liegend', 'Beinbeuger (liegend)', [{ muscleId: 'beinbeuger', weight: 1 }, { muscleId: 'sartorius', weight: 0.5 }]],
  ['xl-beinbeuger-sitzend', 'Beinbeuger (sitzend)', [{ muscleId: 'beinbeuger', weight: 1 }, { muscleId: 'sartorius', weight: 1 }]],
  ['xl-beinpresse', 'Beinpresse', [{ muscleId: 'quadrizeps', weight: 1 }, { muscleId: 'gesaess', weight: 1 }, { muscleId: 'adduktoren', weight: 1 }]],
  ['xl-beinpresse-einbeinig', 'Beinpresse (einbeinig)', [{ muscleId: 'quadrizeps', weight: 1 }, { muscleId: 'gesaess', weight: 1 }, { muscleId: 'adduktoren', weight: 1 }]],
  ['xl-beinstrecker-nach-hinten-gelehnt', 'Beinstrecker (nach hinten gelehnt)', [{ muscleId: 'quadrizeps', weight: 1 }]],
  ['xl-brosep-flys-kurzhantel', 'Brosep Flys (Kurzhantel)', [{ muscleId: 'obere-brust', weight: 1 }, { muscleId: 'brust', weight: 0.5 }, { muscleId: 'vordere-schulter', weight: 0.5 }]],
  ['xl-brustpresse-flach', 'Brustpresse (flach)', [{ muscleId: 'brust', weight: 1 }, { muscleId: 'obere-brust', weight: 0.5 }, { muscleId: 'vordere-schulter', weight: 1 }, { muscleId: 'trizeps', weight: 0.5 }]],
  ['xl-brustpresse-schraeg', 'Brustpresse (schräg)', [{ muscleId: 'obere-brust', weight: 1 }, { muscleId: 'brust', weight: 0.5 }, { muscleId: 'vordere-schulter', weight: 1 }, { muscleId: 'trizeps', weight: 0.5 }]],
  ['xl-butterfly-reverse', 'Butterfly Reverse', [{ muscleId: 'hintere-schulter', weight: 1 }]],
  ['xl-curls-beliebig', 'Curls (beliebig)', [{ muscleId: 'bizeps', weight: 1 }]],
  ['xl-curls-hinter-dem-koerper', 'Curls (hinter dem Körper)', [{ muscleId: 'bizeps', weight: 1 }]],
  ['xl-flys-maschine', 'Flys (Maschine)', [{ muscleId: 'brust', weight: 1 }, { muscleId: 'obere-brust', weight: 0.5 }, { muscleId: 'vordere-schulter', weight: 0.5 }]],
  ['xl-hackenschmidt', 'Hackenschmidt', [{ muscleId: 'quadrizeps', weight: 1 }, { muscleId: 'gesaess', weight: 1 }, { muscleId: 'adduktoren', weight: 1 }]],
  ['xl-lat-pull-around', 'Lat Pull Around', [{ muscleId: 'latissimus', weight: 1 }, { muscleId: 'bizeps', weight: 0.5 }]],
  ['xl-lat-rudern-eng', 'Lat-Rudern (eng)', [{ muscleId: 'latissimus', weight: 1 }, { muscleId: 'oberer-ruecken', weight: 0.5 }, { muscleId: 'bizeps', weight: 0.5 }]],
  ['xl-lat-rudern-maschine', 'Lat-Rudern (Maschine)', [{ muscleId: 'latissimus', weight: 1 }, { muscleId: 'oberer-ruecken', weight: 0.5 }, { muscleId: 'bizeps', weight: 0.5 }]],
  ['xl-latzug-breit', 'Latzug (breit)', [{ muscleId: 'latissimus', weight: 1 }, { muscleId: 'oberer-ruecken', weight: 0.5 }, { muscleId: 'bizeps', weight: 0.5 }, { muscleId: 'hintere-schulter', weight: 0.5 }]],
  ['xl-latzug-eng', 'Latzug (eng)', [{ muscleId: 'latissimus', weight: 1 }, { muscleId: 'oberer-ruecken', weight: 0.5 }, { muscleId: 'bizeps', weight: 0.5 }, { muscleId: 'hintere-schulter', weight: 0.5 }]],
  ['xl-preacher-curls-weggedreht', 'Preacher Curls (weggedreht)', [{ muscleId: 'bizeps', weight: 1 }]],
  ['xl-rdls-knie-leicht-gebeugt', 'RDLs (Knie leicht gebeugt)', [{ muscleId: 'beinbeuger', weight: 1 }, { muscleId: 'gesaess', weight: 1 }, { muscleId: 'adduktoren', weight: 1 }]],
  ['xl-seitheben-kabelturm', 'Seitheben (Kabelturm)', [{ muscleId: 'seitliche-schulter', weight: 1 }]],
  ['xl-seitheben-kurzhanteln', 'Seitheben (Kurzhanteln)', [{ muscleId: 'seitliche-schulter', weight: 1 }]],
  ['xl-seitheben-maschine', 'Seitheben (Maschine)', [{ muscleId: 'seitliche-schulter', weight: 1 }]],
  ['xl-seitheben-stehend', 'Seitheben (stehend)', [{ muscleId: 'seitliche-schulter', weight: 1 }]],
  ['xl-shruggs-leicht-vorgelehnt', 'Shruggs (leicht vorgelehnt)', [{ muscleId: 'oberer-ruecken', weight: 1 }]],
  ['xl-shruggs-stark-vorgelehnt', 'Shruggs (stark vorgelehnt)', [{ muscleId: 'oberer-ruecken', weight: 1 }]],
  ['xl-super-incline-multipresse', 'Super Incline (Multipresse)', [{ muscleId: 'obere-brust', weight: 1 }, { muscleId: 'brust', weight: 0.5 }, { muscleId: 'vordere-schulter', weight: 1 }, { muscleId: 'trizeps', weight: 0.5 }]],
  ['xl-t-bar-rudern', 'T-Bar Rudern', [{ muscleId: 'oberer-ruecken', weight: 1 }, { muscleId: 'latissimus', weight: 0.5 }, { muscleId: 'hintere-schulter', weight: 1 }]],
  ['xl-trapez-rudern', 'Trapez Rudern', [{ muscleId: 'oberer-ruecken', weight: 1 }, { muscleId: 'latissimus', weight: 0.5 }, { muscleId: 'hintere-schulter', weight: 1 }]],
  ['xl-trapez-rudern-breit', 'Trapez Rudern (breit)', [{ muscleId: 'oberer-ruecken', weight: 1 }, { muscleId: 'latissimus', weight: 0.5 }, { muscleId: 'hintere-schulter', weight: 1 }]],
  ['xl-trizeps-oberarm-oben', 'Trizeps (Oberarm oben)', [{ muscleId: 'trizeps', weight: 1 }]],
  ['xl-trizeps-oberarm-unten', 'Trizeps (Oberarm unten)', [{ muscleId: 'trizeps', weight: 1 }]],
  ['xl-wadenheben-stehend', 'Wadenheben (stehend)', [{ muscleId: 'waden', weight: 1 }]],
  ['xl-ueberzuege', 'Überzüge', [{ muscleId: 'latissimus', weight: 1 }]],
]

export const SEED_EXERCISES: Exercise[] = SEED.map(([id, name, muscles]) => ({ id, name, muscles, updatedAt: AT }))
