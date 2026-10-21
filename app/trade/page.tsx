'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PokemonWithSpecies } from '@/types/game'
import type { Profile, Trade } from '@/types/database'

type TradeRow = Trade & {
  sender: Pick<Profile, 'trainer_name'> | null
  receiver: Pick<Profile, 'trainer_name'> | null
  sender_pokemon: PokemonWithSpecies | null
  receiver_pokemon: PokemonWithSpecies | null
}

function typeEmoji(type: string): string {
  if (type === 'Fire') return '🔥'
  if (type === 'Water') return '💧'
  if (type === 'Grass') return '🌿'
  return '⭐'
}

function describe(p: PokemonWithSpecies | null): { name: string; level: string } {
  if (!p) return { name: '???', level: 'Hidden' }
  return { name: p.nickname || p.species.name, level: `Lv. ${p.level}` }
}

export default function TradePage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myPokemon, setMyPokemon] = useState<PokemonWithSpecies[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null)
  const [trainerSearch, setTrainerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [pendingTrades, setPendingTrades] = useState<TradeRow[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      const { data: pokemon } = await supabase
        .from('user_pokemon')
        .select('*, species:pokemon_species(*)')
        .eq('user_id', user.id)

      setMyPokemon((pokemon ?? []) as PokemonWithSpecies[])

      const { data: trades } = await supabase
        .from('trades')
        .select(
          `
          *,
          sender:profiles!trades_sender_id_fkey(trainer_name),
          receiver:profiles!trades_receiver_id_fkey(trainer_name),
          sender_pokemon:user_pokemon!trades_sender_pokemon_id_fkey(
            *,
            species:pokemon_species(*)
          ),
          receiver_pokemon:user_pokemon!trades_receiver_pokemon_id_fkey(
            *,
            species:pokemon_species(*)
          )
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'pending')

      setPendingTrades((trades ?? []) as TradeRow[])
      setLoading(false)
    } catch (error) {
      console.error('Load error:', error)
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const searchTrainers = async () => {
    if (!trainerSearch.trim() || !userId) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('trainer_name', `%${trainerSearch}%`)
      .neq('id', userId)
      .limit(5)

    setSearchResults((data ?? []) as Profile[])
  }

  const createTradeOffer = async (receiverId: string) => {
    if (!selectedPokemon || !userId) {
      setNotice('Select one of your Pokemon first.')
      return
    }

    // Under the current RLS policies other trainers' Pokemon are not readable,
    // so this lookup returns nothing. Trading needs a server-side RPC.
    const { data: receiverPokemon } = await supabase
      .from('user_pokemon')
      .select('id')
      .eq('user_id', receiverId)
      .limit(1)
      .maybeSingle()

    if (!receiverPokemon) {
      setNotice('That trainer has no Pokemon available to trade.')
      return
    }

    const { error } = await supabase.from('trades').insert({
      sender_id: userId,
      receiver_id: receiverId,
      sender_pokemon_id: selectedPokemon,
      receiver_pokemon_id: receiverPokemon.id,
      status: 'pending',
    })

    if (error) {
      setNotice(`Trade offer failed: ${error.message}`)
    } else {
      setNotice('Trade offer sent!')
      setSelectedPokemon(null)
      setSearchResults([])
      setTrainerSearch('')
      void loadData()
    }
  }

  const acceptTrade = async (trade: TradeRow) => {
    await supabase
      .from('trades')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', trade.id)

    await supabase
      .from('user_pokemon')
      .update({ user_id: trade.receiver_id, is_in_party: false })
      .eq('id', trade.sender_pokemon_id)

    await supabase
      .from('user_pokemon')
      .update({ user_id: trade.sender_id, is_in_party: false })
      .eq('id', trade.receiver_pokemon_id)

    setNotice('Trade completed!')
    void loadData()
  }

  const rejectTrade = async (tradeId: string) => {
    await supabase
      .from('trades')
      .update({ status: 'rejected', completed_at: new Date().toISOString() })
      .eq('id', tradeId)

    void loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white font-pixel">TRADING CENTER</h1>
          <button
            onClick={() => router.push('/game')}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
          >
            Back
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded border-2 border-yellow-400 bg-yellow-50 px-4 py-3 text-gray-800">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 text-gray-900">
            <h2 className="text-2xl font-bold mb-4">Create Trade Offer</h2>

            <div className="mb-4">
              <p className="block font-bold mb-2">Select Your Pokemon:</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {myPokemon.map((pokemon) => (
                  <button
                    type="button"
                    key={pokemon.id}
                    onClick={() => setSelectedPokemon(pokemon.id)}
                    className={`p-3 border-2 rounded text-left transition-all ${
                      selectedPokemon === pokemon.id
                        ? 'border-yellow-400 bg-yellow-50 scale-105'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{typeEmoji(pokemon.species.type_primary)}</span>
                      <div>
                        <div className="font-bold text-sm">{pokemon.nickname || pokemon.species.name}</div>
                        <div className="text-xs text-gray-600">Lv. {pokemon.level}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="trainerSearch" className="block font-bold mb-2">
                Find Trainer:
              </label>
              <div className="flex gap-2">
                <input
                  id="trainerSearch"
                  type="text"
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  placeholder="Trainer name..."
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => void searchTrainers()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded"
                >
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="block font-bold">Results:</p>
                {searchResults.map((trainer) => (
                  <div key={trainer.id} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                    <div>
                      <div className="font-bold">{trainer.trainer_name}</div>
                      <div className="text-sm text-gray-600">🏆 {trainer.badges} badges</div>
                    </div>
                    <button
                      onClick={() => void createTradeOffer(trainer.id)}
                      disabled={!selectedPokemon}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Offer Trade
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 text-gray-900">
            <h2 className="text-2xl font-bold mb-4">Pending Trades</h2>

            {pendingTrades.length === 0 ? (
              <p className="text-gray-600">No pending trades</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingTrades.map((trade) => {
                  const isReceiver = trade.receiver_id === userId
                  const isOffer = trade.sender_id === userId
                  const offering = describe(trade.sender_pokemon)
                  const wanted = describe(trade.receiver_pokemon)

                  return (
                    <div key={trade.id} className="bg-gray-100 p-4 rounded border-2 border-gray-300">
                      <div className="font-bold mb-2">
                        {isOffer
                          ? `To: ${trade.receiver?.trainer_name ?? '???'}`
                          : `From: ${trade.sender?.trainer_name ?? '???'}`}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-red-100 rounded">
                          <div className="text-xs text-gray-600">Offering</div>
                          <div className="font-bold">{offering.name}</div>
                          <div className="text-sm">{offering.level}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-100 rounded">
                          <div className="text-xs text-gray-600">For</div>
                          <div className="font-bold">{wanted.name}</div>
                          <div className="text-sm">{wanted.level}</div>
                        </div>
                      </div>

                      {isReceiver && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => void acceptTrade(trade)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => void rejectTrade(trade.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {isOffer && (
                        <div className="text-center text-gray-600 text-sm">Waiting for response...</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
