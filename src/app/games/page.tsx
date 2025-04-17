import MostAnticipatedShowcase from "@/features/gamesShowcase/components/mostAnticipated";
import NewReleasesShowcase from "@/features/gamesShowcase/components/newReleases";
import TopRatedShowcase from "@/features/gamesShowcase/components/topRated";

const GamesPage = () => {
  return (
    <div className="overflow-hidden p-5">
      <div className="flex flex-col gap-10">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-lg leading-6 font-medium">Top Rated</h1>
          <TopRatedShowcase />
        </div>

        <div className="flex w-full flex-col gap-2">
          <h1 className="text-lg leading-6 font-medium">New Releases</h1>
          <NewReleasesShowcase />
        </div>

        <div className="flex w-full flex-col gap-2">
          <h1 className="text-lg leading-6 font-medium">Most Anticipated</h1>
          <MostAnticipatedShowcase />
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
