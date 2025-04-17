import Image from "next/image";
import { getImageUrl } from "../utils";

type GameDetailsProps = {
  name: string;
  summary?: string;
  screenshots?: Array<{ id: number; image_id: string }>;
};

export default function GameDetails({
  name,
  summary,
  screenshots,
}: GameDetailsProps) {
  return (
    <div className="flex flex-col gap-6">
      {summary && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-semibold">About</h2>
          <p className="text-sm md:text-base text-muted-foreground">{summary}</p>
        </section>
      )}

      {screenshots && screenshots.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-semibold">Screenshots</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="aspect-video w-full overflow-hidden rounded-lg"
              >
                <Image
                  src={getImageUrl(screenshot.image_id)}
                  alt={`${name} screenshot`}
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}