import { type IGDBReturnDataType } from "../index";

export type DefaultCardProps = IGDBReturnDataType;

export type GamesShowcaseProps = Partial<{
  type: "grid" | "carousel";
}>;
