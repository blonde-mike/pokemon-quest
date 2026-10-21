'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [trainerName, setTrainerName] = useState('')
  const [starter, setStarter] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      } else {
        setCheckingAuth(false)
      }
    }
    void checkAuth()
  }, [router, supabase])

  const starters = [
    { id: 1, name: 'Flameling', type: 'Fire', description: 'A fiery lizard Pokemon' },
    { id: 4, name: 'Aquapup', type: 'Water', description: 'A water-type puppy Pokemon' },
    { id: 7, name: 'Leafling', type: 'Grass', description: 'A plant-based Pokemon' },
  ]

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!starter) {
      setError('Please select a starter Pokemon!')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          trainer_name: trainerName,
          money: 3000,
          badges: 0,
        })

      if (profileError) throw profileError

      // Get starter species data
      const { data: species, error: speciesError } = await supabase
        .from('pokemon_species')
        .select('*')
        .eq('id', starter)
        .single()

      if (speciesError) throw speciesError

      // Create starter Pokemon
      const { error: pokemonError } = await supabase
        .from('user_pokemon')
        .insert({
          user_id: user.id,
          species_id: starter,
          level: 5,
          current_hp: species.base_hp,
          max_hp: species.base_hp,
          attack: species.base_attack,
          defense: species.base_defense,
          speed: species.base_speed,
          experience: 0,
          experience_to_next_level: 100,
          is_in_party: true,
        })

      if (pokemonError) throw pokemonError

      // Give starter items
      const starterItems = [
        { item_id: 1, quantity: 5 },  // 5 Potions
        { item_id: 3, quantity: 10 }, // 10 Pokeballs
      ]

      for (const item of starterItems) {
        await supabase.from('user_inventory').insert({
          user_id: user.id,
          ...item,
        })
      }

      router.push('/game')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-700 to-green-500 flex items-center justify-center">
        <div className="text-white text-2xl">Checking authentication...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-700 to-green-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full border-4 border-yellow-400">
        <h1 className="text-4xl font-bold text-center mb-6 text-green-900" style={{ fontFamily: 'monospace' }}>
          WELCOME, TRAINER!
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label htmlFor="trainerName" className="block text-sm font-bold text-gray-700 mb-2">
              TRAINER NAME
            </label>
            <input
              id="trainerName"
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-green-500"
              required
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              CHOOSE YOUR STARTER POKEMON
            </label>
            <div className="grid grid-cols-3 gap-4">
              {starters.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStarter(s.id)}
                  className={`p-4 border-4 rounded-lg transition-all ${
                    starter === s.id
                      ? 'border-yellow-400 bg-yellow-50 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
                    <span className="text-4xl">{s.type === 'Fire' ? '🔥' : s.type === 'Water' ? '💧' : '🌿'}</span>
                  </div>
                  <h3 className="font-bold text-center">{s.name}</h3>
                  <p className="text-xs text-gray-600 text-center">{s.type}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !starter}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded border-2 border-green-800 disabled:opacity-50"
          >
            {loading ? 'STARTING ADVENTURE...' : 'BEGIN ADVENTURE!'}
          </button>
        </form>
      </div>
    </div>
  )
}
