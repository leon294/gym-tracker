import { useLayoutEffect, useRef } from 'react'
import { formatDe } from './calc'

const STEP = 2.5
const MAX = 500
const ROW = 44 // px per value; wheel shows 5 rows
const VALUES = Array.from({ length: MAX / STEP + 1 }, (_, i) => i * STEP)
const clamp = (v: number) => Math.min(MAX, Math.max(0, v))

/** iOS-picker-like weight wheel in 2.5 kg steps, plus −/+ buttons and arrow keys. */
export default function WeightWheel({ value, onChange }: { value: number; onChange: (kg: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const shown = useRef(value)

  useLayoutEffect(() => {
    ref.current!.scrollTop = (value / STEP) * ROW
  }, []) // initial position only; later changes scroll via set()

  const set = (v: number) => {
    v = clamp(v)
    shown.current = v
    onChange(v)
    ref.current!.scrollTop = (v / STEP) * ROW // instant: smooth scroll + snap can stall and desync the value
  }

  const onScroll = () => {
    const v = clamp(Math.round(ref.current!.scrollTop / ROW) * STEP)
    if (v === shown.current) return
    shown.current = v
    navigator.vibrate?.(5) // Android only; iOS Safari has no vibrate API
    onChange(v)
  }

  const btn = 'flex size-11 shrink-0 items-center justify-center rounded-full bg-bg text-[24px] font-medium text-accent active:opacity-50'

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-3">
      <button onClick={() => set(value - STEP)} aria-label="2,5 kg weniger" className={btn}>
        −
      </button>
      <div className="relative h-[220px] flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-[88px] h-11 rounded-lg bg-bg" />
        <div
          ref={ref}
          onScroll={onScroll}
          role="spinbutton"
          tabIndex={0}
          aria-label="Gewicht"
          aria-valuemin={0}
          aria-valuemax={MAX}
          aria-valuenow={value}
          aria-valuetext={`${formatDe(value)} Kilogramm`}
          onKeyDown={(e) => {
            const d = { ArrowUp: -1, ArrowDown: 1, PageUp: -4, PageDown: 4 }[e.key]
            if (d) {
              e.preventDefault()
              set(value + d * STEP)
            }
          }}
          className="relative h-full snap-y snap-mandatory overflow-y-scroll py-[88px] outline-none [mask-image:linear-gradient(transparent,black_35%,black_65%,transparent)] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-scrollbar]:hidden"
        >
          {VALUES.map((v) => (
            <div
              key={v}
              onClick={() => set(v)}
              className={`flex h-11 snap-center items-center justify-center text-[22px] tabular-nums ${v === value ? 'font-semibold' : 'text-label-2'}`}
            >
              {formatDe(v)}
            </div>
          ))}
        </div>
        <span className="pointer-events-none absolute top-[88px] right-3 flex h-11 items-center text-label-2">kg</span>
      </div>
      <button onClick={() => set(value + STEP)} aria-label="2,5 kg mehr" className={btn}>
        +
      </button>
    </div>
  )
}
