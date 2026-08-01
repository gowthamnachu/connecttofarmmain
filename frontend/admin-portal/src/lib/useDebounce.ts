import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook that returns a debounced version of any value.
 * Delays updating the value until the specified delay (default 250ms) has passed.
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delayMs])

  return debouncedValue
}

/**
 * Custom hook that returns a throttled event handler function.
 * Ensures the function is called at most once per specified limit (default 300ms).
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limitMs: number = 300
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastRun.current >= limitMs) {
      lastRun.current = now
      callback(...args)
    } else {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        lastRun.current = Date.now()
        callback(...args)
      }, limitMs - (now - lastRun.current))
    }
  }
}
