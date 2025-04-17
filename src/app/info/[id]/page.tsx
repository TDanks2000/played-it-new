import { api } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { notFound } from "next/navigation";
import GameHero from "@/features/gameInfo/components/gameHero";
import GameDetails from "@/features/gameInfo/components/gameDetails";
import GameSidebar from "@/features/gameInfo/components/gameSidebar";

const GameInfoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const game = await api.igdb.info({ id });

  if (!game) {
    notFound();
  }

  return (
    <HydrateClient>
      <main className="min-h-screen w-full bg-background px-4 md:px-8 lg:px-16 py-4 md:py-6 lg:py-8">
        <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
          <GameHero
            name={game.name}
            totalRating={game.total_rating}
            genres={game.genres}
            screenshotId={game.screenshots?.[0]?.image_id}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 md:gap-6 lg:gap-8">
            <GameDetails
              name={game.name}
              summary={game.summary}
              screenshots={game.screenshots}
            />
            <GameSidebar
              firstReleaseDate={game.first_release_date}
              platforms={game.platforms}
            />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
};

export default GameInfoPage;
