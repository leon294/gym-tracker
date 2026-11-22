# Gym-Tracker – Spezifikation und Arbeitsauftrag (v2, 22.11.2026)

Diese Datei ist der Startpunkt für Claude Code. Bitte zuerst komplett lesen, dann mit Phase 1 beginnen.

## 1. Ziel
Eine eigene Trainings-App fürs Handy (PWA, Home-Bildschirm, offline nutzbar), von Grund auf neu gebaut. Kein fester Trainingsplan: Ich starte ein Training, wähle Übungen frei aus, trage Satz für Satz Gewicht und Wiederholungen ein. Die App zählt automatisch die Sätze pro Muskelgruppe (ganze und halbe Sätze) und zeigt das pro Training und pro Woche.

Rahmen:
- Sprache der gesamten App: **Deutsch**. Einheit: **Kilogramm**. Datumsformat deutsch (z. B. „Mo., 23. Nov."), 24-Stunden-Uhrzeit, Woche beginnt am **Montag**.
- Die App ist nur für mich, kein Mehrbenutzerbetrieb.
- Garmin-/Pulsdaten-Anbindung ist **nicht Teil dieses Auftrags** (siehe Abschnitt 9).

## 2. Technik (Vorschlag, darf begründet geändert werden)
- React, TypeScript, Vite, Tailwind CSS
- PWA über vite-plugin-pwa (Offline, Home-Bildschirm, Icons)
- Lokale Speicherung im Gerät über IndexedDB (z. B. mit Dexie). Export und Import aller Daten als JSON-Datei als Backup.
- Diagramme mit Recharts
- Tests mit Vitest für die Rechenlogik (Satz-Gewichtung, Wochenaggregation)
- Hosting über GitHub Pages, Veröffentlichung per GitHub Action bei Push auf `main`
- Cloud-Sync (z. B. Firebase mit Login) ist **später optional**. Das Datenmodell soll das nicht verbauen (eindeutige IDs, Zeitstempel für „zuletzt geändert").

## 3. Funktionen

### 3.1 Training
- Button „Training starten": speichert `startedAt` (Datum und Uhrzeit) und startet einen sichtbaren Timer.
- Der Timer rechnet aus Zeitstempeln (`jetzt − startedAt`), nicht mit einem Zähler. Ein laufendes Training übersteht Schließen der App, Neuladen und Gerätesperre.
- „Training beenden": speichert `endedAt` und `durationSec`. Vorher Bestätigung und Zusammenfassung.
- Während des Trainings: Übung aus der Übungsliste wählen (Suche). Beliebig viele Übungen, Reihenfolge frei. Eine Übung lässt sich jederzeit durch eine andere ersetzen oder entfernen, auch mit bereits eingetragenen Sätzen (dann Rückfrage).
- Pro Übung werden Sätze einzeln erfasst: **Gewicht (kg)** und **Wiederholungen**. Die Satznummer wird automatisch hochgezählt. Sätze lassen sich nachträglich bearbeiten und löschen.
- Gewichtseingabe: **Scroll-Rad** wie ein iOS-Picker (Scroll-Snap, Haptik wenn möglich) in **2,5-kg-Schritten**. Vorbelegung mit dem Gewicht des letzten Satzes beziehungsweise des letzten Trainings. Gewicht 0 ist erlaubt (Körpergewicht).
- Wiederholungen: Stepper mit Plus und Minus, vorbelegt mit dem letzten Wert.
- Aufwärmsätze: Ein Satz lässt sich als „Aufwärmsatz" markieren. Aufwärmsätze zählen **nicht** fürs Muskelvolumen und nicht für Verlauf-Auswertungen.
- Vor dem Eintragen sieht man pro Übung das **letzte Training** dieser Übung: Datum, Anzahl Sätze und Gewicht mal Wiederholungen je Satz.
- Pro Übung ein **Verlaufsgraph** (zeitlicher Verlauf des Arbeitsgewichts, geschätztes 1RM und/oder Volumen; Umschalter).
- Fortlaufende Anzeige im Training: Sätze pro Muskelgruppe, kumuliert über das laufende Training.

### 3.2 Übungen
- Übungsliste mit Suche. Anfangs ist die Liste leer, ich lege Übungen **manuell** an. Später kommt ein Import aus einer Excel-Datei dazu (Struktur liefere ich nach).
- Neue Übung: Name, dazu eine oder mehrere Zeilen „Muskelgruppe plus Gewichtung". Die Muskelgruppe wählt man aus einem Dropdown/Picker mit der festen Liste (Abschnitt 4). Die Gewichtung ist nur **1** (ganzer Satz) oder **0,5** (halber Satz). Mit „+" fügt man eine weitere Zeile hinzu.
- Übungen lassen sich bearbeiten (auch Muskelgruppen) und archivieren. Änderungen der Zuordnung gelten nur für künftige Trainings, bereits gespeicherte Trainings behalten ihre ursprüngliche Gewichtung (Zuordnung beim Speichern des Trainings als Kopie mitspeichern).
- Beispiel: Klimmzüge = Latissimus 1 und Bizeps 0,5. Bizeps-Curls = Bizeps 1.

### 3.3 Berechnung
- Pro Satz (kein Aufwärmsatz) erhält jede zugeordnete Muskelgruppe ihre Gewichtung gutgeschrieben.
- Beispiel: Drei Sätze Klimmzüge ergeben Latissimus 3,0 und Bizeps 1,5.
- Anzeige mit höchstens einer Nachkommastelle, deutsch (Komma), z. B. „1,5".
- Diese Logik gehört in eine reine Funktion mit Unit-Tests.

### 3.4 Auswertung
- **Pro Training:** Datum, Startzeit, Dauer, Übungen mit Sätzen, Sätze pro Muskelgruppe.
- **Wochen-Dashboard:** Startseite der Auswertung. Die aktuelle Woche wird zuerst gezeigt. Mit Pfeilen und Wischgeste blättert man zwischen Wochen (Zeitleiste). Anzeige: Anzahl Trainings, Gesamtdauer, gewichtete Sätze pro Muskelgruppe (Liste oder Balken), Liste der Trainings der Woche.
- **Verlauf:** Liste aller Trainings, Detailansicht, Training nachträglich bearbeiten und löschen.
- Später: Wochenziele pro Muskelgruppe (Soll gegen Ist). Datenmodell soll das zulassen.

## 4. Muskelgruppen (fest, Vorschlag)
Brust, Obere Brust, Latissimus, Oberer Rücken/Trapez, Unterer Rücken, Vordere Schulter, Seitliche Schulter, Hintere Schulter, Bizeps, Trizeps, Unterarme, Bauch, Seitlicher Bauch, Quadrizeps, Beinbeuger, Gesäß, Adduktoren, Abduktoren, Waden.

Die Liste liegt zentral in einer Datei und ist leicht änderbar. Ich liefere später die endgültige Liste. Im Datenmodell Muskelgruppen über stabile IDs (nicht über den Anzeigenamen) referenzieren.

## 5. Datenmodell (Entwurf)
```ts
type MuscleId = string; // stabile ID, z. B. "latissimus"

interface Exercise {
  id: string;
  name: string;
  muscles: { muscleId: MuscleId; weight: 1 | 0.5 }[];
  archived?: boolean;
  updatedAt: string; // ISO
}

interface SetEntry {
  id: string;
  reps: number;
  weightKg: number;     // Vielfache von 2,5; 0 erlaubt
  warmup?: boolean;
}

interface WorkoutExercise {
  exerciseId: string;
  name: string;                                  // Kopie zum Zeitpunkt des Trainings
  muscles: { muscleId: MuscleId; weight: 1 | 0.5 }[]; // Kopie zum Zeitpunkt des Trainings
  sets: SetEntry[];
}

interface Workout {
  id: string;
  startedAt: string;  // ISO mit Zeitzone, Datum plus Uhrzeit
  endedAt?: string;   // fehlt, solange das Training läuft
  durationSec?: number;
  exercises: WorkoutExercise[];
  updatedAt: string;
}
```
Start- und Endzeit werden sekundengenau gespeichert.

## 6. Design
- Apple-nah: iOS-Look, klare Typografie (System-Schrift `-apple-system`/SF), Tab-Leiste unten, Bottom Sheets, Picker-Räder, abgerundete Karten, Dark Mode folgt dem System.
- Große Touch-Ziele, einhändig bedienbar im Gym. Wichtige Aktionen (Satz hinzufügen) unten im Daumenbereich.
- Hinweis: Plugin „frontend-design" kann für das Design genutzt werden, falls installiert.
- Tabs: **Training**, **Auswertung** (Wochen-Dashboard und Verlauf), **Übungen**, **Einstellungen** (Export/Import).

## 7. Arbeitsweise und Reihenfolge für Claude Code
Bitte in Phasen arbeiten, nach jeder Phase lauffähig, kurzer Stand an mich:

1. **Gerüst:** Vite, React, TypeScript, Tailwind, PWA, Navigation mit den vier Tabs, Deutsch, Dark Mode. Git-Repo, GitHub-Pages-Deployment per Action.
2. **Daten und Rechenlogik:** Datenmodell, IndexedDB, Satz-Gewichtung und Wochenaggregation mit Vitest-Tests.
3. **Übungen:** Anlegen, Bearbeiten, Archivieren, Muskelgruppen-Picker mit 1 oder 0,5.
4. **Training:** Start, Timer, Übung wählen, Sätze erfassen (Scroll-Rad 2,5 kg), letztes Training anzeigen, Verlaufsgraph, Beenden, Zusammenfassung.
5. **Auswertung:** Wochen-Dashboard mit Blättern, Trainingsverlauf, Bearbeiten und Löschen.
6. **Feinschliff:** Export/Import als JSON, Leerzustände, Fehlerfälle, Performance auf dem Handy testen.

Vor Phase 1 bitte kurz mit mir klären, wie das GitHub-Repo heißen soll und ob ich es selbst anlege.

## 8. Später (nicht jetzt umsetzen)
- Excel-Import der Übungsliste
- Wochenziele pro Muskelgruppe (Soll/Ist)
- Cloud-Sync mit Login
- Satzpausen-Timer

## 9. Zurückgestellt: Garmin CIRQA und Herzfrequenz
Vorerst nicht umsetzen. Nur beachten: `startedAt` und `endedAt` sauber speichern, damit Pulsdaten später dem Training zugeordnet werden können. Recherche-Stand: Das Band sendet die Herzfrequenz per Bluetooth LE und ANT+ (manuell am Band aktivieren). Web Bluetooth gibt es nicht in Safari auf dem iPhone. Die Garmin-Connect-API ist genehmigungspflichtig (eine „Personal"-Stufe ist laut Garmin-Seite ungeprüft). Firmware 2.50 hatte einen Bluetooth-Broadcast-Fehler.
