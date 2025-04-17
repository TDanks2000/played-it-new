import { type DefaultCardProps } from "@/@types/shared/props";
import { cn, ensureDecimal } from "@/lib/utils";
import { ImageIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { type FC } from "react";
import IGDBImage from "../igdbImage";

const BannerCard: FC<DefaultCardProps> = ({
  id,
  name,
  cover,
  rating,
  genres,
}) => {
  const hasValidCover = cover && cover.image_id;

  return (
    <Link
      className="group h-full w-full overflow-hidden rounded-lg transition-all hover:opacity-80"
      href={`/info/${id}`}
    >
      <div
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-lg bg-cover bg-center transition-all"
      >
        {!hasValidCover ? (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ImageIcon size={48} className="text-muted-foreground opacity-50" />
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden">
            <IGDBImage
              imageId={cover.image_id}
              imageSize="cover_big"
              alt={name}
              fill
              className="object-cover object-center"
            />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-between bg-linear-to-t from-black/80 to-transparent p-4">
          {!!rating && rating > 0 ? (
            <div className="flex items-center justify-start">
              <div className="flex flex-row items-center gap-2 rounded-lg bg-black/80 px-3 py-1.5 text-sm font-bold">
                <StarIcon size={16} color="yellow" fill="yellow" />
                {ensureDecimal(rating / 10) ?? "??"}
              </div>
            </div>
          ) : <div />}
          <div>
            <h3 className="line-clamp-2 text-2xl font-bold text-white">
              {name}
            </h3>
            <p className="text-muted-foreground text-sm">
              {genres?.[0]?.name ?? null}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BannerCard;
