'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PokemonWithSpecies } from '@/types/game'
import type { PokemonSpecies } from '@/types/database'
import {
  calculateDamage,
  calculateExperience,
  checkLevelUp,
  checkEvolution,
  createWildPokemon,
  determineFirstAttacker,
} from '@/lib/battle'

type BattleStatus = 'active' | 'won' | 'lost' | 'fled'

function typeEmoji(type: string): string {
  if (type === 'Fire') return '🔥'
  if (type === 'Water') return '💧'
  if (type === 'Grass') return '🌿'
  return '⭐'
}

function hpColor(current: number, max: number): string {
  const ratio = current / max
  if (ratio > 0.5) return 'bg-green-500'
  if (ratio > 0.2) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function BattlePage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [playerPokemon, setPlayerPokemon] = useState<PokemonWithSpecies | null>(null)
  const [wildPokemon, setWildPokemon] = useState<PokemonWithSpecies | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleStatus, setBattleStatus] = useState<BattleStatus>('active')
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Timers read this instead of the stale closure value, so RUN really stops
  // the enemy's pending attack.
  const statusRef = useRef<BattleStatus>('active')
  useEffect(() => {
    statusRef.current = battleStatus
  }, [battleStatus])

  const addLog = useCallback((message: string) => {
    setBattleLog((prev) => [...prev, message])
  }, [])

  const enemyAttack = useCallback(
    (player: PokemonWithSpecies, wild: PokemonWithSpecies) => {
      if (statusRef.current !== 'active') return

      const attackerName = wild.species.name
      const defenderName = player.nickname || player.species.name

      addLog(`Wild ${attackerName} attacks!`)

      const { damage, message } = calculateDamage(wild, player)
      const newHp = Math.max(0, player.current_hp - damage)

      addLog(`${defenderName} took ${damage} damage!`)
      if (message) addLog(message)

      const updatedPlayer = { ...player, current_hp: newHp }
      setPlayerPokemon(updatedPlayer)

      if (newHp <= 0) {
        addLog(`${defenderName} fainted!`)
        setBattleStatus('lost')
        addLog('You lost the battle!')
      } else {
        setIsPlayerTurn(true)
      }
    },
    [addLog]
  )

  const initBattle = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: partyData } = await supabase
        .from('user_pokemon')
        .select('*, species:pokemon_species(*)')
        .eq('user_id', user.id)
        .eq('is_in_party', true)
        .order('created_at')
        .limit(1)
        .maybeSingle()

      if (!partyData) {
        setLoadError('You have no Pokemon in your party.')
        setLoading(false)
        return
      }

      const { data: species } = await supabase.from('pokemon_species').select('*').limit(10)
      if (!species || species.length === 0) {
        setLoadError('No wild Pokemon could be found.')
        setLoading(false)
        return
      }

      const player = partyData as PokemonWithSpecies
      const wild = createWildPokemon(species as PokemonSpecies[])

      setPlayerPokemon(player)
      setWildPokemon(wild)

      const firstAttacker = determineFirstAttacker(player, wild)
      setIsPlayerTurn(firstAttacker === 'player')

      addLog(`Wild ${wild.species.name} appeared!`)
      addLog(`Go! ${player.nickname || player.species.name}!`)

      if (firstAttacker === 'opponent') {
        setTimeout(() => enemyAttack(player, wild), 2000)
      }

      setLoading(false)
    } catch (error) {
      console.error('Battle init error:', error)
      setLoadError('Could not start the battle.')
      setLoading(false)
    }
  }, [supabase, router, addLog, enemyAttack])

  useEffect(() => {
    // Kick off the async load from a promise callback so state updates happen
    // after the effect body, not synchronously inside it.
    void Promise.resolve().then(initBattle)
  }, [initBattle])

  const handleVictory = async (player: PokemonWithSpecies, wild: PokemonWithSpecies, log: string[]) => {
    setBattleStatus('won')

    const expGained = calculateExperience(wild, true)
    const moneyGained = wild.level * 50

    const victoryLog = [...log, `Gained ${expGained} EXP!`, `Gained $${moneyGained}!`]
    addLog(`Gained ${expGained} EXP!`)
    addLog(`Gained $${moneyGained}!`)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const newExp = player.experience + expGained
    const levelCheck = checkLevelUp(newExp, player.experience_to_next_level, player.level)

    if (levelCheck.leveledUp) {
      addLog(`${player.nickname || player.species.name} grew to level ${levelCheck.newLevel}!`)
      const evoCheck = checkEvolution({ ...player, level: levelCheck.newLevel })
      if (evoCheck.canEvolve) {
        addLog(`${player.nickname || player.species.name} is evolving!`)
      }
    }

    await supabase
      .from('user_pokemon')
      .update({
        experience: newExp,
        level: levelCheck.newLevel,
        experience_to_next_level: levelCheck.newExpToNext,
        current_hp: player.max_hp,
      })
      .eq('id', player.id)

    const { data: profile } = await supabase.from('profiles').select('money').eq('id', user.id).single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ money: profile.money + moneyGained })
        .eq('id', user.id)
    }

    await supabase.from('battles').insert({
      player1_id: user.id,
      player2_id: null,
      is_wild_battle: true,
      winner_id: user.id,
      experience_gained: expGained,
      money_gained: moneyGained,
      ended_at: new Date().toISOString(),
      battle_log: victoryLog,
    })
  }

  const playerAttack = async () => {
    if (!playerPokemon || !wildPokemon || !isPlayerTurn || processing) return

    setProcessing(true)
    const attackerName = playerPokemon.nickname || playerPokemon.species.name
    const defenderName = wildPokemon.species.name

    const { damage, message } = calculateDamage(playerPokemon, wildPokemon)
    const newHp = Math.max(0, wildPokemon.current_hp - damage)

    const turnLog = [`${attackerName} attacks!`, `Dealt ${damage} damage!`]
    if (message) turnLog.push(message)
    turnLog.forEach(addLog)

    const updatedWild = { ...wildPokemon, current_hp: newHp }
    setWildPokemon(updatedWild)

    if (newHp <= 0) {
      addLog(`Wild ${defenderName} fainted!`)
      await handleVictory(playerPokemon, updatedWild, [...battleLog, ...turnLog, `Wild ${defenderName} fainted!`])
    } else {
      setIsPlayerTurn(false)
      setTimeout(() => enemyAttack(playerPokemon, updatedWild), 2000)
    }

    setProcessing(false)
  }

  const handleRun = () => {
    if (processing) return
    addLog('Got away safely!')
    setBattleStatus('fled')
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-600 flex flex-col items-center justify-center gap-6 p-4 text-center">
        <div className="text-white text-2xl">{loadError}</div>
        <button
          onClick={() => router.push('/game')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg border-4 border-blue-800"
        >
          RETURN TO GAME
        </button>
      </div>
    )
  }

  if (loading || !playerPokemon || !wildPokemon) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading battle...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="bg-red-100 rounded-lg p-4 border-2 border-red-400 mb-2">
                <h3 className="font-bold text-xl">Wild {wildPokemon.species.name}</h3>
                <p className="text-sm text-gray-600">Lv. {wildPokemon.level}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>HP:</span>
                    <span>
                      {wildPokemon.current_hp}/{wildPokemon.max_hp}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${hpColor(wildPokemon.current_hp, wildPokemon.max_hp)}`}
                      style={{ width: `${(wildPokemon.current_hp / wildPokemon.max_hp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center text-6xl">
                {typeEmoji(wildPokemon.species.type_primary)}
              </div>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-400 mb-2">
                <h3 className="font-bold text-xl">{playerPokemon.nickname || playerPokemon.species.name}</h3>
                <p className="text-sm text-gray-600">Lv. {playerPokemon.level}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>HP:</span>
                    <span>
                      {playerPokemon.current_hp}/{playerPokemon.max_hp}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${hpColor(playerPokemon.current_hp, playerPokemon.max_hp)}`}
                      style={{ width: `${(playerPokemon.current_hp / playerPokemon.max_hp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center text-6xl">
                {typeEmoji(playerPokemon.species.type_primary)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/80 rounded-lg p-4 mb-4 h-32 overflow-y-auto border-2 border-gray-600">
          {battleLog.slice(-4).map((log, i) => (
            <div key={`${i}-${log}`} className="text-white font-mono text-sm mb-1">
              &gt; {log}
            </div>
          ))}
        </div>

        {battleStatus === 'active' ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => void playerAttack()}
              disabled={!isPlayerTurn || processing}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg border-4 border-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚔️ ATTACK
            </button>
            <button
              onClick={handleRun}
              disabled={processing}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg border-4 border-gray-800 disabled:opacity-50"
            >
              🏃 RUN
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/game')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg border-4 border-blue-800"
          >
            RETURN TO GAME
          </button>
        )}
      </div>
    </div>
  )
}
