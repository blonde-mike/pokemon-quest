'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ARROW_DOWN,
  POKEBALL,
  PROFESSOR,
  SPECIES_SPRITES,
  type SpriteMap,
} from '@/lib/pixel/sprites'
import type { PokemonSpecies } from '@/types/database'
import GameScreen from './GameScreen'
import PixelSprite from './PixelSprite'
import DialogBox, { DialogSequence, wrapText } from './DialogBox'
import NameEntry from './NameEntry'
import { useGameInput } from './input'

type Mode =
  | 'loading'
  | 'intro'
  | 'name'
  | 'nameConfirm'
  | 'starter'
  | 'starterConfirm'
  | 'saving'
  | 'done'
  | 'error'

export type Starter = {
  id: number
  name: string
  type: string
  sprite: SpriteMap
  blurb: string
}

type SpeciesRow = Pick<PokemonSpecies, 'id' | 'name' | 'type_primary'>

export const STARTER_ORDER = ['Flameling', 'Aquapup', 'Leafling'] as const

const BLURBS: Record<string, string> = {
  Flameling: 'FIRE type. A hot-headed lizard. Its tail flame burns brighter when it is happy.',
  Aquapup: 'WATER type. A loyal puppy. It can hold its breath for a whole hour.',
  Leafling: 'GRASS type. A calm sprout. It naps in the sun to grow.',
}

const PROF = 'FERN'

/** Order species rows as Fire, Water, Grass and attach sprites and blurbs. */
export function buildStarters(rows: SpeciesRow[]): Starter[] {
  const byName = new Map(rows.map((r) => [r.name, r]))
  return STARTER_ORDER.flatMap((n) => {
    const row = byName.get(n)
    if (!row) return []
    return [{ id: row.id, name: row.name, type: row.type_primary, sprite: SPECIES_SPRITES[n], blurb: BLURBS[n] }]
  })
}

/** Optional starting state, used by previews and tests to skip the network. */
export type IntroPreview = {
  mode: Mode
  speciesRows?: SpeciesRow[]
  trainerName?: string
}

function LabBackdrop({ table = false }: Readonly<{ table?: boolean }>) {
  return (
    <>
      <div className="absolute left-0 right-0 bg-[#d8e8f0]" style={{ top: 0, height: 64 }} />
      <div className="absolute left-0 right-0 bg-[#1b1b2f]" style={{ top: 62, height: 2 }} />
      <div className="pixel-floor absolute left-0 right-0" style={{ top: 64, height: 40 }} />
      {table && (
        <>
          <div className="absolute bg-[#a86a35] border-2 border-[#1b1b2f]" style={{ left: 44, top: 74, width: 152, height: 28 }} />
          <div className="absolute bg-[#8b5a2b]" style={{ left: 48, top: 84, width: 144, height: 2 }} />
        </>
      )}
    </>
  )
}

/** Mounts the screen (which provides input) around the scene state machine. */
export default function IntroGame({ preview }: Readonly<{ preview?: IntroPreview }>) {
  return (
    <GameScreen>
      <IntroScenes preview={preview} />
    </GameScreen>
  )
}

function IntroScenes({ preview }: Readonly<{ preview?: IntroPreview }>) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [mode, setMode] = useState<Mode>(preview?.mode ?? 'loading')
  const [starters, setStarters] = useState<Starter[]>(() =>
    preview?.speciesRows ? buildStarters(preview.speciesRows) : []
  )
  const [trainerName, setTrainerName] = useState(preview?.trainerName ?? '')
  const [cursor, setCursor] = useState(1)
  const [yes, setYes] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorReturn, setErrorReturn] = useState<Mode>('starter')
  const skipFetch = Boolean(preview?.speciesRows)

  useEffect(() => {
    if (skipFetch) return
    let cancelled = false
    supabase
      .from('pokemon_species')
      .select('id, name, type_primary')
      .in('name', [...STARTER_ORDER])
      .then(({ data, error }) => {
        if (cancelled) return
        const built = buildStarters((data ?? []) as SpeciesRow[])
        if (error || built.length !== STARTER_ORDER.length) {
          setErrorMsg(error?.message ?? 'The lab is empty. The database still needs its seed data.')
          setErrorReturn('intro')
          setMode('error')
          return
        }
        setStarters(built)
        setMode('intro')
      })
    return () => {
      cancelled = true
    }
  }, [supabase, skipFetch])

  const chosen = starters[cursor]

  const save = async () => {
    if (!chosen) return
    setMode('saving')
    const { error } = await supabase.rpc('create_trainer', {
      p_trainer_name: trainerName,
      p_starter_species_id: chosen.id,
    })
    if (error) {
      const msg = error.message
      setErrorMsg(msg)
      setErrorReturn(/name/i.test(msg) ? 'name' : 'starter')
      setMode('error')
      return
    }
    setMode('done')
  }

  useGameInput((e) => {
    if (mode === 'starter') {
      if (e.button === 'left') setCursor((c) => (c + starters.length - 1) % starters.length)
      else if (e.button === 'right') setCursor((c) => (c + 1) % starters.length)
      else if (e.button === 'a') {
        setYes(true)
        setMode('starterConfirm')
      }
    } else if (mode === 'starterConfirm') {
      if (e.button === 'up' || e.button === 'down') setYes((v) => !v)
      else if (e.button === 'b') setMode('starter')
      else if (e.button === 'a') {
        if (yes) void save()
        else setMode('starter')
      }
    }
  })

  const introPages = [
    'Hello there! Welcome to the world of POKEMON!',
    `My name is ${PROF}. People call me the POKEMON PROF!`,
    'This world is inhabited by creatures called POKEMON. Some keep them as pets. Others battle with them.',
    'Now, tell me. What is your name?',
  ]

  const nameConfirmPages = [
    `Right! So your name is ${trainerName}!`,
    'Come into my lab. I have three POKEMON here for you to choose from.',
  ]

  const donePages = chosen
    ? [
        `${trainerName} received ${chosen.name.toUpperCase()}!`,
        'Your very own POKEMON legend is about to unfold!',
        'A world of dreams and adventures awaits! Let us go!',
      ]
    : []

  return (
    <>
      {mode === 'loading' && (
        <>
          <LabBackdrop />
          <DialogBox text="..." />
        </>
      )}

      {mode === 'intro' && (
        <>
          <LabBackdrop />
          <div className="absolute pixel-bob" style={{ left: 96, top: 14 }}>
            <PixelSprite sprite={PROFESSOR} scale={3} title={`Professor ${PROF}`} />
          </div>
          <DialogSequence key="intro" pages={introPages} onFinished={() => setMode('name')} />
        </>
      )}

      {mode === 'name' && (
        <>
          <NameEntry
            value={trainerName}
            onChange={setTrainerName}
            onSubmit={() => {
              setTrainerName((n) => n.trim())
              setMode('nameConfirm')
            }}
          />
          <DialogBox text={wrapText('Enter your name. Use arrows and A, or just type. END to finish.')} />
        </>
      )}

      {mode === 'nameConfirm' && (
        <>
          <LabBackdrop />
          <div className="absolute" style={{ left: 96, top: 14 }}>
            <PixelSprite sprite={PROFESSOR} scale={3} />
          </div>
          <DialogSequence key="nameConfirm" pages={nameConfirmPages} onFinished={() => setMode('starter')} />
        </>
      )}

      {(mode === 'starter' || mode === 'starterConfirm' || mode === 'saving') && chosen && (
        <>
          <LabBackdrop table />
          <div className="absolute" style={{ left: 16, top: 10 }}>
            <PixelSprite sprite={chosen.sprite} scale={3} title={chosen.name} className={mode === 'starter' ? 'pixel-bob' : ''} />
          </div>
          <div className="absolute" style={{ left: 72, top: 18 }}>
            {chosen.name.toUpperCase()}
          </div>
          <div className="absolute" style={{ left: 72, top: 32 }}>
            {chosen.type.toUpperCase()} type
          </div>
          {starters.map((s, i) => (
            <div key={s.id} className="absolute" style={{ left: 60 + i * 48, top: 66 }}>
              <PixelSprite sprite={POKEBALL} title={s.name} />
            </div>
          ))}
          {mode === 'starter' && (
            <div className="absolute pixel-blink" style={{ left: 62 + cursor * 48, top: 54 }}>
              <PixelSprite sprite={ARROW_DOWN} />
            </div>
          )}

          {mode === 'starter' && <DialogBox text={wrapText(chosen.blurb)} />}

          {mode === 'starterConfirm' && (
            <>
              <DialogBox text={wrapText(`So! You want ${chosen.name.toUpperCase()}, the ${chosen.type.toUpperCase()} POKEMON?`)} />
              <div className="pixel-frame absolute whitespace-pre px-[6px] py-[4px]" style={{ left: 176, top: 70, width: 56, height: 34 }}>
                {`${yes ? '>' : ' '}YES\n${yes ? ' ' : '>'}NO`}
              </div>
            </>
          )}

          {mode === 'saving' && <DialogBox text={wrapText(`${chosen.name.toUpperCase()} is getting ready...`)} />}
        </>
      )}

      {mode === 'done' && chosen && (
        <>
          <LabBackdrop />
          <div className="absolute pixel-bob" style={{ left: 96, top: 12 }}>
            <PixelSprite sprite={chosen.sprite} scale={3} title={chosen.name} />
          </div>
          <DialogSequence
            key="done"
            pages={donePages}
            onFinished={() => {
              router.push('/game')
              router.refresh()
            }}
          />
        </>
      )}

      {mode === 'error' && (
        <>
          <LabBackdrop />
          <div className="absolute" style={{ left: 96, top: 14 }}>
            <PixelSprite sprite={PROFESSOR} scale={3} />
          </div>
          <DialogSequence
            key={`error-${errorMsg}`}
            pages={[`Hmm... ${errorMsg}`, 'Let us try that again.']}
            onFinished={() => setMode(errorReturn)}
          />
        </>
      )}
    </>
  )
}
