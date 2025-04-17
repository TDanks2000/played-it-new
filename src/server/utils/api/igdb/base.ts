import { type IGDBAccessTokenResponse } from "@/@types";
import { defaultFields } from "@/server/utils/api/igdb/constants";

// Define types for IGDB API requests
export type IGDBEndpoint = "games";

export interface IGDBRequestOptions {
  fields?: string[];
  where?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

class IGDBApiBase {
  private clientId: string;
  private clientSecret: string;
  private clientAccessToken?: string;
  private tokenExpiration = 0;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getAccessToken() {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
      { method: "POST" },
    );

    if (!response.ok) {
      throw new Error("Failed to get access token");
    }

    const json = (await response.json()) as IGDBAccessTokenResponse;

    console.log(`Getting a new access token`);

    this.clientAccessToken = json.access_token;
    this.tokenExpiration = Date.now() + json.expires_in;
    return this.clientAccessToken;
  }

  checkAndRenewToken = async () =>
    !!(Date.now() >= this.tokenExpiration - 100) &&
    (await this.getAccessToken());

  /**
   * Makes a request to the IGDB API
   * @param endpoint The IGDB API endpoint
   * @param options Request options including fields, filters, and pagination
   * @returns Promise with the API response data
   */
  async makeReq<T = unknown>(
    endpoint: IGDBEndpoint,
    options: IGDBRequestOptions,
  ): Promise<T> {
    try {
      await this.checkAndRenewToken();

      if (!this.clientAccessToken) {
        throw new Error("There seems to be an issue with the access token");
      }

      // Construct the request body
      let requestBody = "";
      const fields = options.fields ?? [];
      requestBody += `fields ${[...fields, ...defaultFields].join(",")};`;

      if (options.sort) requestBody += ` sort ${options.sort};`;
      if (options.limit !== undefined) {
        const limit = Math.max(1, Math.min(options.limit, 500)); // Ensure limit is between 1 and 500
        requestBody += ` limit ${limit};`;
      }
      if (options.offset !== undefined) {
        const offset = Math.max(0, options.offset);
        requestBody += ` offset ${offset};`;
      }
      if (options.search) requestBody += ` search "${options.search}";`;
      if (options.where) requestBody += ` where ${options.where};`;

      const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
        method: "POST",
        headers: {
          "Client-ID": this.clientId,
          Authorization: `Bearer ${this.clientAccessToken}`,
        },
        body: requestBody ? requestBody : undefined,
        cache: "no-cache",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`IGDB API error (${res.status}): ${errorText}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      console.error("IGDB API request failed:", error);
      if (error instanceof Error) {
        throw error; // Preserve the original error message
      }
      throw new Error("Failed to fetch data from IGDB API");
    }
  }
}

export default IGDBApiBase;
