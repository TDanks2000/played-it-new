import { type IGDBReturnDataType } from "@/@types";
import { env } from "@/env";
import IGDBApiBase, { type IGDBRequestOptions } from "@/server/utils/api/igdb/base";

// Default values for API requests
const DEFAULT_LIMIT = 20;
const MIN_RATING_COUNT = 7;

class IGDBWrapper extends IGDBApiBase {
  constructor() {
    super(env.TWITCH_CLIENT_ID ?? "", env.TWITCH_CLIENT_SECRET ?? "");
  }

  async info(id: string): Promise<IGDBReturnDataType | undefined> {
    if (!id) throw new Error("Game ID is required");
    
    const igdbData = await this.makeReq<IGDBReturnDataType[]>("games", {
      where: `id = ${id}`,
      limit: 1,
    });

    return igdbData?.[0];
  }

  async search(query: string, limit = DEFAULT_LIMIT, offset = 0): Promise<IGDBReturnDataType[]> {
    if (!query) throw new Error("Search query is required");
    
    return await this.makeReq<IGDBReturnDataType[]>("games", {
      search: query,
      limit,
      offset,
    });
  }

  async mostAnticipated(limit = DEFAULT_LIMIT, offset = 0): Promise<IGDBReturnDataType[]> {
    return await this.makeReq<IGDBReturnDataType[]>("games", {
      where: `hypes != null & first_release_date > ${Math.floor(Date.now() / 1000)}`,
      sort: "hypes desc",
      limit,
      offset,
    });
  }

  async newReleases(limit = DEFAULT_LIMIT, offset = 0): Promise<IGDBReturnDataType[]> {
    const now = Math.floor(Date.now() / 1000);
    const threeMonthsAgo = now - 7776000; // 90 days in seconds

    return await this.makeReq<IGDBReturnDataType[]>("games", {
      where: `first_release_date >= ${threeMonthsAgo} & first_release_date <= ${now} & rating_count >= ${MIN_RATING_COUNT}`,
      sort: "first_release_date desc",
      limit,
      offset,
    });
  }

  async topRated(limit = DEFAULT_LIMIT, offset = 0): Promise<IGDBReturnDataType[]> {
    return await this.makeReq<IGDBReturnDataType[]>("games", {
      where: `aggregated_rating >= ${MIN_RATING_COUNT} & aggregated_rating != n & aggregated_rating_count > 7  & version_parent = null & category = 0`,
      sort: "aggregated_rating desc",
      limit,
      offset,
    });
  }

  async byGenre(genre: string, limit = DEFAULT_LIMIT, offset = 0): Promise<IGDBReturnDataType[]> {
    if (!genre) throw new Error("Genre is required");

    return await this.makeReq<IGDBReturnDataType[]>("games", {
      where: `genres.name = \"${genre}\" & rating_count >= ${MIN_RATING_COUNT}`,
      sort: "rating desc",
      limit,
      offset,
    });
  }
}

const igdb = new IGDBWrapper();

export default igdb;
