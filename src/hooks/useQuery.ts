import { useState, useEffect, useRef } from 'react'

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

export function invalidate(...keys: string[]) {
  for (const key of keys) {
    listeners.get(key)?.forEach((fn) => fn())
  }
}

export function useQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  deps: unknown[],
): T | undefined {
  const [data, setData] = useState<T>()
  const fnRef = useRef(queryFn)
  fnRef.current = queryFn

  useEffect(() => {
    let active = true

    const doFetch = () => {
      fnRef.current()
        .then((d) => { if (active) setData(d) })
        .catch((err) => console.error(`[useQuery:${key}]`, err))
    }

    doFetch()

    const set = listeners.get(key) ?? new Set<Listener>()
    set.add(doFetch)
    listeners.set(key, set)

    return () => {
      active = false
      set.delete(doFetch)
      if (set.size === 0) listeners.delete(key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps])

  return data
}
