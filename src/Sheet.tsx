import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** iOS-style bottom sheet on a native modal <dialog>. The parent closes it by unmounting. */
export default function Sheet({
  title,
  onClose,
  action,
  children,
}: {
  title: string
  onClose: () => void
  action?: { label: string; onClick: () => void }
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  const [open, setOpen] = useState(false)

  // Children mount only once the dialog is shown, so they can measure and scroll (e.g. WeightWheel)
  useLayoutEffect(() => {
    ref.current?.showModal()
    setOpen(true)
  }, [])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault() // Escape: let React unmount instead of the browser closing it
        onClose()
      }}
      aria-labelledby={titleId}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-lg rounded-t-xl bg-bg text-label backdrop:bg-black/40"
    >
      <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center bg-bg px-2 pt-2">
        <button onClick={onClose} className="min-h-11 justify-self-start px-2 text-accent">
          Abbrechen
        </button>
        <h2 id={titleId} className="max-w-[55vw] truncate font-semibold">
          {title}
        </h2>
        {action && (
          <button onClick={action.onClick} className="min-h-11 justify-self-end px-2 font-semibold text-accent">
            {action.label}
          </button>
        )}
      </div>
      <div className="space-y-6 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">{open && children}</div>
    </dialog>
  )
}
