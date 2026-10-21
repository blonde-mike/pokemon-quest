'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PokemonWithSpecies, BattleState } from '@/types/game'
import { calculateDamage, calculateExperience, checkLevelUp, checkEvolution, determineFirstAttacker } from '@/lib/battle'

export default function BattlePage() {
  const [loading, setLoading] = useState(true)
  const [playerPokemon, setPlayerPokemon] = useState<PokemonWithSpecies | null>(null)
  const [wildPokemon, setWildPokemon] = useState<PokemonWithSpecies | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>(['A wild Pokemon appeared!'])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleStatus, setBattleStatus] = useState<'active' | 'won' | 'lost' | 'fled'>('active')
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    initBattle()
  }, [])

  const initBattle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      // Get player's first party Pokemon
      const { data: partyData } = await supabase
        .from('user_pokemon')
        .select('*, species:pokemon_species(*)')
        .eq('user_id', user.id)
        .eq('is_in_party', true)
        .order('created_at')
        .limit(1)
        .single()

      if (!partyData) {
        addLog('No Pokemon in party!')
        return
      }

      // Generate wild Pokemon (random species, level 3-7)
      const wildLevel = 3 + Math.floor(Math.random() * 5)
      const { data: species } = await supabase
        .from('pokemon_species')
        .select('*')
        .limit(10)

      if (!species) return

      const randomSpecies = species[Math.floor(Math.random() * species.length)]

      const wild: PokemonWithSpecies = {
        id: 'wild',
        user_id: 'wild',
        species_id: randomSpecies.id,
        nickname: null,
        level: wildLevel,
        current_hp: randomSpecies.base_hp,
        max_hp: randomSpecies.base_hp,
        attack: randomSpecies.base_attack,
        defense: randomSpecies.base_defense,
        speed: randomSpecies.base_speed,
        experience: 0,
        experience_to_next_level: 100,
        is_in_party: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        species: randomSpecies,
      }

      setPlayerPokemon(partyData as PokemonWithSpecies)
      setWildPokemon(wild)

      // Determine who goes first
      const firstAttacker = determineFirstAttacker(partyData as PokemonWithSpecies, wild)
      setIsPlayerTurn(firstAttacker === 'player')

      addLog(`Wild ${randomSpecies.name} appeared!`)
      addLog(`Go! ${partyData.nickname || partyData.species.name}!`)

      if (firstAttacker === 'opponent') {
        setTimeout(() => enemyAttack(partyData as PokemonWithSpecies, wild), 2000)
      }

      setLoading(false)
    } catch (error) {
      console.error('Battle init error:', error)
    }
  }

  const addLog = (message: string) => {
    setBattleLog(prev => [...prev, message])
  }

  const playerAttack = async () => {
    if (!playerPokemon || !wildPokemon || !isPlayerTurn || processing) return

    setProcessing(true)
    const attackerName = playerPokemon.nickname || playerPokemon.species.name
    const defenderName = wildPokemon.species.name

    addLog(`${attackerName} attacks!`)

    const { damage, message } = calculateDamage(playerPokemon, wildPokemon)
    const newHp = Math.max(0, wildPokemon.current_hp - damage)

    addLog(`Dealt ${damage} damage!`)
    if (message) addLog(message)

    const updatedWild = { ...wildPokemon, current_hp: newHp }
    setWildPokemon(updatedWild)

    if (newHp <= 0) {
      addLog(`Wild ${defenderName} fainted!`)
      await handleVictory()
    } else {
      setIsPlayerTurn(false)
      setTimeout(() => enemyAttack(playerPokemon, updatedWild), 2000)
    }

    setProcessing(false)
  }

  const enemyAttack = (player: PokemonWithSpecies, wild: PokemonWithSpecies) => {
    if (battleStatus !== 'active') return

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
  }

  const handleVictory = async () => {
    if (!playerPokemon || !wildPokemon) return

    setBattleStatus('won')

    const expGained = calculateExperience(wildPokemon, true)
    const moneyGained = wildPokemon.level * 50

    addLog(`Gained ${expGained} EXP!`)
    addLog(`Gained $${moneyGained}!`)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update Pokemon EXP and check level up
    const newExp = playerPokemon.experience + expGained
    const levelCheck = checkLevelUp(
      newExp,
      playerPokemon.experience_to_next_level,
      playerPokemon.level
    )

    if (levelCheck.leveledUp) {
      addLog(`${playerPokemon.nickname || playerPokemon.species.name} grew to level ${levelCheck.newLevel}!`)

      // Check evolution
      const evoCheck = checkEvolution({ ...playerPokemon, level: levelCheck.newLevel })
      if (evoCheck.canEvolve) {
        addLog(`${playerPokemon.nickname || playerPokemon.species.name} is evolving!`)
      }
    }

    // Update database
    await supabase
      .from('user_pokemon')
      .update({
        experience: newExp,
        level: levelCheck.newLevel,
        experience_to_next_level: levelCheck.newExpToNext,
        current_hp: playerPokemon.max_hp, // Full heal after battle
      })
      .eq('id', playerPokemon.id)

    // Update money
    const { data: profile } = await supabase
      .from('profiles')
      .select('money')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ money: profile.money + moneyGained })
        .eq('id', user.id)
    }

    // Record battle
    await supabase.from('battles').insert({
      player1_id: user.id,
      player2_id: null,
      is_wild_battle: true,
      winner_id: user.id,
      experience_gained: expGained,
      money_gained: moneyGained,
      ended_at: new Date().toISOString(),
      battle_log: battleLog,
    })
  }

  const handleRun = () => {
    if (processing) return
    addLog('Got away safely!')
    setBattleStatus('fled')
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
        {/* Battle Field */}
        <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 mb-4">
          <div className="grid grid-cols-2 gap-8">
            {/* Wild Pokemon */}
            <div className="text-center">
              <div className="bg-red-100 rounded-lg p-4 border-2 border-red-400 mb-2">
                <h3 className="font-bold text-xl">Wild {wildPokemon.species.name}</h3>
                <p className="text-sm text-gray-600">Lv. {wildPokemon.level}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>HP:</span>
                    <span>{wildPokemon.current_hp}/{wildPokemon.max_hp}</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        wildPokemon.current_hp / wildPokemon.max_hp > 0.5 ? 'bg-green-500' :
                        wildPokemon.current_hp / wildPokemon.max_hp > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(wildPokemon.current_hp / wildPokemon.max_hp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center text-6xl">
                {wildPokemon.species.type_primary === 'Fire' ? '🔥' :
                 wildPokemon.species.type_primary === 'Water' ? '💧' :
                 wildPokemon.species.type_primary === 'Grass' ? '🌿' : '⭐'}
              </div>
            </div>

            {/* Player Pokemon */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-400 mb-2">
                <h3 className="font-bold text-xl">{playerPokemon.nickname || playerPokemon.species.name}</h3>
                <p className="text-sm text-gray-600">Lv. {playerPokemon.level}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>HP:</span>
                    <span>{playerPokemon.current_hp}/{playerPokemon.max_hp}</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        playerPokemon.current_hp / playerPokemon.max_hp > 0.5 ? 'bg-green-500' :
                        playerPokemon.current_hp / playerPokemon.max_hp > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(playerPokemon.current_hp / playerPokemon.max_hp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center text-6xl">
                {playerPokemon.species.type_primary === 'Fire' ? '🔥' :
                 playerPokemon.species.type_primary === 'Water' ? '💧' :
                 playerPokemon.species.type_primary === 'Grass' ? '🌿' : '⭐'}
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-black bg-opacity-80 rounded-lg p-4 mb-4 h-32 overflow-y-auto border-2 border-gray-600">
          {battleLog.slice(-4).map((log, i) => (
            <div key={i} className="text-white font-mono text-sm mb-1">
              &gt; {log}
            </div>
          ))}
        </div>

        {/* Battle Actions */}
        {battleStatus === 'active' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={playerAttack}
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
        )}

        {battleStatus !== 'active' && (
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
