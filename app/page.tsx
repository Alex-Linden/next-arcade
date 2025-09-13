import { GameCard } from "@/components/game-card";

export default function HomePage() {
  return (
    <>
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Next Arcade</h1>
        <p className="mt-2 text-muted-foreground">
          Tiny games, instant fun. Start with Tic-Tac-Toe — more on the way.
        </p>
      </section>

      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <GameCard
            title="Tic-Tac-Toe"
            description="Classic 3×3 — play against yourself."
            href="/games/tic-tac-toe"
            emoji="❌⭕"
          />
          <GameCard
            title="2048"
            description="Slide & merge to reach 2048."
            href="/games/2048"
            emoji="🔢"
          />
          <GameCard
            title="Snake"
            description="Eat apples. Don’t eat yourself."
            href="/games/snake"
            emoji="🐍"
          />
          <GameCard
            title="Lights Out"
            description="Toggle the plus. Turn all lights off."
            href="/games/lightsOut"
            emoji="💡"
          />
          <GameCard
            title="Minesweeper"
            description="Flag the bombs. Smile if you can."
            disabled
            emoji="💣"
          />
        </div>
      </section>
    </>
  );
}
