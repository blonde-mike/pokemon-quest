'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PokemonWithSpecies } from '@/types/game'

export default function TradePage() {
  const [loading, setLoading] = useState(true)
  const [myPokemon, setMyPokemon] = useState<PokemonWithSpecies[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null)
  const [trainerSearch, setTrainerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [pendingTrades, setPendingTrades] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      // Load my Pokemon
      const { data: pokemon } = await supabase
        .from('user_pokemon')
        .select('*, species:pokemon_species(*)')
        .eq('user_id', user.id)

      setMyPokemon(pokemon || [])

      // Load pending trades
      const { data: trades } = await supabase
        .from('trades')
        .select(`
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
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'pending')

      setPendingTrades(trades || [])
      setLoading(false)
    } catch (error) {
      console.error('Load error:', error)
    }
  }

  const searchTrainers = async () => {
    if (!trainerSearch.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('trainer_name', `%${trainerSearch}%`)
      .neq('id', user.id)
      .limit(5)

    setSearchResults(data || [])
  }

  const createTradeOffer = async (receiverId: string) => {
    if (!selectedPokemon) {
      alert('Please select a Pokemon to trade!')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get receiver's first Pokemon (simplified, in real app they'd select)
    const { data: receiverPokemon } = await supabase
      .from('user_pokemon')
      .select('id')
      .eq('user_id', receiverId)
      .limit(1)
      .single()

    if (!receiverPokemon) {
      alert('Trainer has no Pokemon!')
      return
    }

    const { error } = await supabase.from('trades').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      sender_pokemon_id: selectedPokemon,
      receiver_pokemon_id: receiverPokemon.id,
      status: 'pending',
    })

    if (error) {
      alert('Trade offer failed: ' + error.message)
    } else {
      alert('Trade offer sent!')
      setSelectedPokemon(null)
      setSearchResults([])
      setTrainerSearch('')
      loadData()
    }
  }

  const acceptTrade = async (trade: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update trade status
    await supabase
      .from('trades')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', trade.id)

    // Swap Pokemon ownership
    await supabase
      .from('user_pokemon')
      .update({ user_id: trade.receiver_id, is_in_party: false })
      .eq('id', trade.sender_pokemon_id)

    await supabase
      .from('user_pokemon')
      .update({ user_id: trade.sender_id, is_in_party: false })
      .eq('id', trade.receiver_pokemon_id)

    alert('Trade completed!')
    loadData()
  }

  const rejectTrade = async (tradeId: string) => {
    await supabase
      .from('trades')
      .update({ status: 'rejected', completed_at: new Date().toISOString() })
      .eq('id', tradeId)

    loadData()
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
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
            TRADING CENTER
          </h1>
          <button
            onClick={() => router.push('/game')}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Create Trade */}
          <div className="bg-white rounded-lg border-4 border-yellow-400 p-6">
            <h2 className="text-2xl font-bold mb-4">Create Trade Offer</h2>

            <div className="mb-4">
              <label className="block font-bold mb-2">Select Your Pokemon:</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {myPokemon.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    onClick={() => setSelectedPokemon(pokemon.id)}
                    className={`p-3 border-2 rounded cursor-pointer transition-all ${
                      selectedPokemon === pokemon.id
                        ? 'border-yellow-400 bg-yellow-50 scale-105'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {pokemon.species.type_primary === 'Fire' ? '🔥' :
                         pokemon.species.type_primary === 'Water' ? '💧' :
                         pokemon.species.type_primary === 'Grass' ? '🌿' : '⭐'}
                      </span>
                      <div>
                        <div className="font-bold text-sm">
                          {pokemon.nickname || pokemon.species.name}
                        </div>
                        <div className="text-xs text-gray-600">Lv. {pokemon.level}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-bold mb-2">Find Trainer:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  placeholder="Trainer name..."
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={searchTrainers}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded"
                >
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <label className="block font-bold">Results:</label>
                {searchResults.map((trainer) => (
                  <div key={trainer.id} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                    <div>
                      <div className="font-bold">{trainer.trainer_name}</div>
                      <div className="text-sm text-gray-600">🏆 {trainer.badges} badges</div>
                    </div>
                    <button
                      onClick={() => createTradeOffer(trainer.id)}
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

          {/* Pending Trades */}
          <div className="bg-white rounded-lg border-4 border-yellow-400 p-6">
            <h2 className="text-2xl font-bold mb-4">Pending Trades</h2>

            {pendingTrades.length === 0 ? (
              <p className="text-gray-600">No pending trades</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingTrades.map((trade) => {
                  const { data: { user } } = supabase.auth.getUser() as any
                  const isReceiver = trade.receiver_id === user?.id
                  const isOffer = trade.sender_id === user?.id

                  return (
                    <div key={trade.id} className="bg-gray-100 p-4 rounded border-2 border-gray-300">
                      <div className="font-bold mb-2">
                        {isOffer ? `To: ${trade.receiver.trainer_name}` : `From: ${trade.sender.trainer_name}`}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-red-100 rounded">
                          <div className="text-xs text-gray-600">Offering</div>
                          <div className="font-bold">{trade.sender_pokemon.species.name}</div>
                          <div className="text-sm">Lv. {trade.sender_pokemon.level}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-100 rounded">
                          <div className="text-xs text-gray-600">For</div>
                          <div className="font-bold">{trade.receiver_pokemon.species.name}</div>
                          <div className="text-sm">Lv. {trade.receiver_pokemon.level}</div>
                        </div>
                      </div>

                      {isReceiver && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptTrade(trade)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectTrade(trade.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {isOffer && (
                        <div className="text-center text-gray-600 text-sm">
                          Waiting for response...
                        </div>
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
