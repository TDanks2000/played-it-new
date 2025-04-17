import type { GamesShowcaseProps } from "@/@types";
import GridLayout from "@/components/gridLayout";
import Row from "@/components/row";
import { api } from "@/trpc/server";
import { cache } from "react";

const getData = cache(async () => {
  return await api.igdb.new_releases({});
});

const NewReleasesShowcase = async ({
  type = "carousel",
}: GamesShowcaseProps) => {
  const data = await getData();

  if (type === "grid") return <GridLayout data={data} />;
  return <Row cardType="default" data={data} />;
};

export default NewReleasesShowcase;
