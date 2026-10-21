import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const instant = false

export default async function GamePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/setup')
  }

  // Get party Pokemon
  const { data: party } = await supabase
    .from('user_pokemon')
    .select(`
      *,
      species:pokemon_species(*)
    `)
    .eq('user_id', user.id)
    .eq('is_in_party', true)
    .order('created_at')

  // Get inventory
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select(`
      *,
      item:items(*)
    `)
    .eq('user_id', user.id)

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-pink-700">
      {/* Header */}
      <div className="bg-black bg-opacity-50 border-b-4 border-yellow-400 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
              POKEMON QUEST
            </h1>
            <p className="text-yellow-400">Trainer: {profile.trainer_name}</p>
          </div>
          <div className="flex gap-6 text-white">
            <div>💰 ${profile.money}</div>
            <div>🏆 Badges: {profile.badges}</div>
            <form action={handleSignOut}>
              <button className="text-red-400 hover:text-red-300">Logout</button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Main Menu */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Link
            href="/battle"
            className="bg-red-600 hover:bg-red-700 text-white font-bold p-8 rounded-lg border-4 border-red-800 text-center text-2xl transition-transform hover:scale-105"
          >
            ⚔️ BATTLE
            <p className="text-sm mt-2 font-normal">Fight wild Pokemon or trainers</p>
          </Link>
          <Link
            href="/trade"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-8 rounded-lg border-4 border-blue-800 text-center text-2xl transition-transform hover:scale-105"
          >
            🔄 TRADE
            <p className="text-sm mt-2 font-normal">Trade Pokemon with others</p>
          </Link>
        </div>

        {/* Your Party */}
        <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'monospace' }}>YOUR PARTY</h2>
          <div className="grid grid-cols-3 gap-4">
            {party?.map((pokemon: any) => (
              <div key={pokemon.id} className="bg-gradient-to-b from-gray-100 to-gray-200 p-4 rounded-lg border-2 border-gray-400">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">
                      {pokemon.nickname || pokemon.species.name}
                    </h3>
                    <p className="text-sm text-gray-600">Lv. {pokemon.level}</p>
                  </div>
                  <span className="text-2xl">
                    {pokemon.species.type_primary === 'Fire' ? '🔥' :
                     pokemon.species.type_primary === 'Water' ? '💧' :
                     pokemon.species.type_primary === 'Grass' ? '🌿' : '⭐'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-bold">{pokemon.current_hp}/{pokemon.max_hp}</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(pokemon.current_hp / pokemon.max_hp) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>ATK: {pokemon.attack}</span>
                    <span>DEF: {pokemon.defense}</span>
                    <span>SPD: {pokemon.speed}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    EXP: {pokemon.experience}/{pokemon.experience_to_next_level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-lg border-4 border-yellow-400 p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'monospace' }}>INVENTORY</h2>
          <div className="grid grid-cols-4 gap-4">
            {inventory?.map((inv: any) => (
              <div key={inv.id} className="bg-gray-100 p-3 rounded border-2 border-gray-300 text-center">
                <div className="text-2xl mb-1">
                  {inv.item.type === 'potion' ? '🧪' :
                   inv.item.type === 'pokeball' ? '⚾' : '✨'}
                </div>
                <div className="font-bold text-sm">{inv.item.name}</div>
                <div className="text-gray-600 text-xs">x{inv.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
