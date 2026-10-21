import Link from 'next/link'
import PixelSprite from '@/components/game/PixelSprite'
import { AQUAPUP, FLAMELING, LEAFLING } from '@/lib/pixel/sprites'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] p-6 text-center">
      <p className="font-pixel mb-6 text-[10px] tracking-widest text-[#ffd23f] sm:text-xs">
        CATCH · BATTLE · TRADE · EVOLVE
      </p>

      <h1 className="font-pixel text-3xl leading-[1.4] text-[#f8f8f8] drop-shadow-[6px_6px_0_#d7263d] sm:text-5xl">
        POKEMON
        <br />
        QUEST
      </h1>

      <div className="my-10 flex items-end gap-8 sm:gap-14">
        <PixelSprite sprite={FLAMELING} scale={4} className="pixel-bob" title="Flameling" />
        <PixelSprite sprite={AQUAPUP} scale={4} className="pixel-bob [animation-delay:0.33s]" title="Aquapup" />
        <PixelSprite sprite={LEAFLING} scale={4} className="pixel-bob [animation-delay:0.66s]" title="Leafling" />
      </div>

      <Link
        href="/auth/login"
        className="font-pixel pixel-blink text-sm text-[#f8f8f8] hover:text-[#ffd23f] sm:text-base"
      >
        PRESS START
      </Link>

      <p className="font-pixel mt-16 max-w-md text-[8px] leading-5 text-[#9a9aa8]">
        Fan project for learning. Not affiliated with Nintendo, Game Freak, or The Pokemon Company.
        All sprites are original pixel art.
      </p>
    </main>
  )
}
