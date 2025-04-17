import { api } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { notFound, redirect } from "next/navigation";
import ClientGamesGrid from "@/features/games/components/clientGamesGrid";

export const dynamic = "force-dynamic";

const GenreGamesPage = async ({ params, searchParams }: { params: Promise<{genre: string}>, searchParams: { page?: string } }) => {
  try {
    const { genre } =  await params;
    const decodedGenre = decodeURIComponent(genre);
    
    // Fetch games by genre using the new TRPC endpoint
    const games = await api.igdb.by_genre({ genre: decodedGenre });
    
    // If no games found, redirect to homepage
    if (!games || games.length === 0) {
      redirect("/");
    }
    
    const currentPage = searchParams.page ? parseInt(searchParams.page) : 1;



    return (
      <HydrateClient>
        <main className="min-h-screen w-full bg-background px-2 md:px-4 lg:px-8 py-2 md:py-4">
          <div className="flex flex-col gap-2 md:gap-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              {decodedGenre} Games
            </h1>
            <p className="text-muted-foreground">
              Showing {games.length} games in the {decodedGenre} genre
            </p>
            <ClientGamesGrid 
              data={games} 
              initialPage={currentPage}
            />
          </div>
        </main>
      </HydrateClient>
    );
  } catch (error) {
    console.error("Error fetching genre games:", error);
    redirect("/");
  }
};

export default GenreGamesPage;