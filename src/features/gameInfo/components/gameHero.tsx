import Image from "next/image";
import { getImageUrl } from "../utils";
import Link from "next/link";

type GameHeroProps = {
  name: string;
  totalRating?: number;
  genres?: Array<{ id: number; name: string }>;
  screenshotId?: string;
};

export default function GameHero({
  name,
  totalRating,
  genres,
  screenshotId,
}: GameHeroProps) {
  return (
    <div className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] w-full overflow-hidden rounded-xl">
      {screenshotId && (
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(screenshotId, "1080p")}
            alt={`${name} hero image`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
      <div className="absolute bottom-0 flex w-full flex-col gap-4 p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{name}</h1>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {totalRating && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-bold text-black">
              {totalRating.toFixed(1)}%
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {genres?.map((genre) => (
              <Link 
                key={genre.id}
                href={`/games/genre/${encodeURIComponent(genre.name)}`}
                className="rounded-lg bg-primary/10 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm hover:bg-primary/20 transition-colors"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}