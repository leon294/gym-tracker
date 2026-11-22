import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatDe, type HistoryPoint } from './calc'

const MODES = [
  { id: 'weight', short: 'Gewicht', title: 'Arbeitsgewicht (schwerster Satz)', unit: 'kg' },
  { id: 'e1rm', short: '1RM', title: 'Geschätztes 1RM (Epley)', unit: 'kg' },
  { id: 'volume', short: 'Volumen', title: 'Volumen (kg × Wdh.)', unit: 'kg' },
] as const

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })

export default function HistoryChart({ points }: { points: HistoryPoint[] }) {
  const [modeId, setModeId] = useState<(typeof MODES)[number]['id']>('weight')
  const mode = MODES.find((m) => m.id === modeId)!

  if (points.length === 0) return <p className="text-center text-label-2">Noch keine Arbeitssätze für diese Übung.</p>

  return (
    <>
      <div role="group" aria-label="Kennzahl" className="flex rounded-lg bg-fill p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setModeId(m.id)}
            aria-pressed={m.id === modeId}
            className={`h-9 flex-1 rounded-md text-[15px] font-medium ${m.id === modeId ? 'bg-seg shadow-sm' : 'text-label-2'}`}
          >
            {m.short}
          </button>
        ))}
      </div>

      <section className="rounded-xl bg-card p-4">
        <h3 className="mb-3 font-semibold">{mode.title}</h3>
        {points.length < 2 ? (
          <p className="text-label-2">Ab zwei Trainings erscheint hier der Verlauf.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--separator)" vertical={false} />
                <XAxis
                  dataKey="startedAt"
                  tickFormatter={shortDate}
                  tick={{ fill: 'var(--label-2)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  width={44}
                  tickFormatter={formatDe}
                  tick={{ fill: 'var(--label-2)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--label-2)', strokeWidth: 1 }}
                  contentStyle={{ background: 'var(--card)', border: '0.5px solid var(--separator)', borderRadius: 10, color: 'var(--label)' }}
                  labelFormatter={(iso) => formatDate(String(iso))}
                  formatter={(v) => [`${formatDe(Number(v))} ${mode.unit}`, mode.short]}
                />
                <Line
                  dataKey={mode.id}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Table view: exact values, readable without the chart */}
      <table className="w-full overflow-hidden rounded-xl bg-card text-[15px]">
        <thead className="text-left text-[13px] text-label-2">
          <tr>
            <th className="px-4 py-2 font-normal">Datum</th>
            <th className="px-4 py-2 text-right font-normal">{mode.short}</th>
          </tr>
        </thead>
        <tbody>
          {[...points].reverse().map((p) => (
            <tr key={p.startedAt} className="border-t-[0.5px] border-separator">
              <td className="px-4 py-2">{formatDate(p.startedAt)}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatDe(p[mode.id])} {mode.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
