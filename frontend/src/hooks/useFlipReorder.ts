import { useCallback, useLayoutEffect, useRef } from 'react'

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useFlipReorder(keys: string[], duration = 650) {
  const nodes = useRef(new Map<string, HTMLElement>())
  const prevTops = useRef(new Map<string, number>())
  const inited = useRef(false)
  const timers = useRef<number[]>([])

  const order = keys.join('|')

  useLayoutEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    nodes.current.forEach(el => {
      el.style.transition = ''
      el.style.transform = ''
    })

    const current = new Map<string, number>()
    nodes.current.forEach((el, key) => {
      if (el && el.isConnected) current.set(key, el.getBoundingClientRect().top)
    })

    if (!inited.current) {
      inited.current = true
      prevTops.current = current
      return
    }

    const moved: { el: HTMLElement; dy: number }[] = []
    current.forEach((top, key) => {
      const before = prevTops.current.get(key)
      const el = nodes.current.get(key)
      if (before === undefined || !el) return
      const dy = before - top
      if (Math.abs(dy) > 0.5) moved.push({ el, dy })
    })
    prevTops.current = current
    if (!moved.length || reduceMotion()) return

    moved.forEach(({ el, dy }) => {
      el.style.transition = 'none'
      el.style.transform = `translate3d(0, ${dy}px, 0)`
    })

    const raf = requestAnimationFrame(() => {
      moved.forEach(({ el }) => {
        el.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
        el.style.transform = ''
      })
    })
    const t = window.setTimeout(() => {
      moved.forEach(({ el }) => {
        el.style.transition = ''
        el.style.transform = ''
      })
    }, duration + 40)
    timers.current = [t]

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [order, duration])

  return useCallback((key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el)
    else nodes.current.delete(key)
  }, [])
}
