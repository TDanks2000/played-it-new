import { formatDate } from "../utils";

type GameSidebarProps = {
  firstReleaseDate?: number;
  platforms?: Array<{ id: number; name: string }>;
};

export default function GameSidebar({
  firstReleaseDate,
  platforms,
}: GameSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {firstReleaseDate && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Release Date
              </h3>
              <p className="text-foreground">
                {formatDate(firstReleaseDate)}
              </p>
            </div>
          )}
          {platforms && platforms.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <span
                    key={platform.id}
                    className="rounded-lg bg-primary/10 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm"
                  >
                    {platform.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}