import { type DefaultCardProps } from "@/@types/shared/props";
import { ensureDecimal } from "@/lib/utils";
import { ImageIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import IGDBImage from "../igdbImage";

const VerticalCard = ({
  id,
  name,
  cover,
  rating,
  genres,
}: DefaultCardProps) => {
  const hasValidCover = cover?.image_id;

  return (
    <Link
      className="group h-full w-full overflow-hidden rounded-lg transition-all hover:opacity-80"
      href={`/info/${id}`}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-cover bg-center transition-all">
        {!hasValidCover ? (
          <div className="bg-muted flex aspect-[2/3] w-full items-center justify-center">
            <ImageIcon size={48} className="text-muted-foreground opacity-50" />
          </div>
        ) : (
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <IGDBImage
              imageId={cover.image_id}
              imageSize="cover_big"
              alt={name}
              fill
              className="object-cover object-center"
            />
          </div>
        )}
        <div className="flex flex-col gap-2 p-4">
          {!!rating && rating > 0 && (
            <div className="flex items-center justify-start">
              <div className="bg-muted flex flex-row items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold">
                <StarIcon size={16} color="yellow" fill="yellow" />
                {ensureDecimal(rating / 10) ?? "??"}
              </div>
            </div>
          )}
          <div>
            <h3 className="line-clamp-2 text-xl font-bold">{name}</h3>
            <p className="text-muted-foreground text-sm">
              {genres?.[0]?.name ?? null}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VerticalCard;
