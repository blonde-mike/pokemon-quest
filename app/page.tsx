import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-800 to-pink-700 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl">
        <h1
          className="text-7xl font-bold text-white mb-4 drop-shadow-lg animate-pulse"
          style={{ fontFamily: 'monospace' }}
        >
          POKEMON QUEST
        </h1>

        <p className="text-2xl text-yellow-300 mb-8 font-bold" style={{ fontFamily: 'monospace' }}>
          ⚡ CATCH · BATTLE · TRADE · EVOLVE ⚡
        </p>

        <div className="bg-white bg-opacity-90 rounded-lg border-4 border-yellow-400 p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome, Trainer!</h2>
          <p className="text-lg text-gray-700 mb-6">
            Embark on an epic adventure in the world of Pokemon! Battle wild Pokemon,
            trade with other trainers, level up your team, and become the ultimate Pokemon Master!
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-100 p-4 rounded-lg border-2 border-red-400">
              <div className="text-4xl mb-2">⚔️</div>
              <h3 className="font-bold text-lg">Battle</h3>
              <p className="text-sm text-gray-600">Fight wild Pokemon and earn XP</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-400">
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="font-bold text-lg">Trade</h3>
              <p className="text-sm text-gray-600">Exchange Pokemon with trainers</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg border-2 border-green-400">
              <div className="text-4xl mb-2">📈</div>
              <h3 className="font-bold text-lg">Evolve</h3>
              <p className="text-sm text-gray-600">Level up and evolve your team</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg border-4 border-green-800 text-xl transition-transform hover:scale-105"
            >
              START ADVENTURE
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-6xl animate-bounce">
          <div>🔥</div>
          <div>💧</div>
          <div>🌿</div>
          <div>⚡</div>
        </div>
      </div>
    </div>
  )
}
