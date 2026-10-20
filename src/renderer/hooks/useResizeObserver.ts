import { useEffect } from 'react'

interface UseResizeObserverOptions {
  getTargets: () => ReadonlyArray<Element | null | undefined>
  onResize: () => void
}

export function useResizeObserver({
  getTargets,
  onResize,
}: UseResizeObserverOptions) {
  useEffect(() => {
    const targets = getTargets().filter(
      (target): target is Element => target != null,
    )

    if (targets.length === 0) {
      return
    }

    const observer = new ResizeObserver(onResize)

    for (const target of targets) {
      observer.observe(target)
    }

    return () => {
      observer.disconnect()
    }
  }, [getTargets, onResize])
}
