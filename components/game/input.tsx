'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

export type GameButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b'

/**
 * One input event. `button` is the mapped gamepad button, or null when the
 * key has no mapping. `key` is the raw keyboard key ('' for touch buttons),
 * so text-entry scenes can read typed characters.
 */
export type GameInputEvent = { button: GameButton | null; key: string }

type Listener = (e: GameInputEvent) => void

type InputContextValue = {
  press: (e: GameInputEvent) => void
  subscribe: (fn: Listener) => () => void
}

const InputContext = createContext<InputContextValue | null>(null)

function mapKey(key: string): GameButton | null {
  switch (key) {
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    case 'Enter':
    case ' ':
    case 'z':
    case 'Z':
      return 'a'
    case 'Escape':
    case 'x':
    case 'X':
      return 'b'
    default:
      return null
  }
}

export function GameInputProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<Listener>())

  const press = useCallback((e: GameInputEvent) => {
    listeners.current.forEach((fn) => fn(e))
  }, [])

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn)
    return () => {
      listeners.current.delete(fn)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      const target = ev.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const button = mapKey(ev.key)
      if (button || ev.key === 'Backspace' || ev.key.length === 1) {
        ev.preventDefault()
      }
      press({ button, key: ev.key })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [press])

  const value = useMemo(() => ({ press, subscribe }), [press, subscribe])
  return <InputContext.Provider value={value}>{children}</InputContext.Provider>
}

export function useInputDispatch(): (e: GameInputEvent) => void {
  const ctx = useContext(InputContext)
  if (!ctx) throw new Error('useInputDispatch must be used inside GameInputProvider')
  return ctx.press
}

/** Subscribe to game input. The latest handler is always used. */
export function useGameInput(handler: Listener): void {
  const ctx = useContext(InputContext)
  if (!ctx) throw new Error('useGameInput must be used inside GameInputProvider')
  const handlerRef = useRef<Listener>(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => ctx.subscribe((e) => handlerRef.current(e)), [ctx])
}
