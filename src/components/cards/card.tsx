import { type DefaultCardProps } from "@/@types/shared/props";
import DefaultCard from "@/components/cards/default";
import BannerCard from "./bannerCard";
import VerticalCard from "./verticalCard";

interface CardProps extends DefaultCardProps {
  type: "default" | "horizontal-rectangle" | "vertical-rectangle";
}

const Card = ({ type, ...data }: CardProps) => {
  switch (type) {
    case "default":
    default:
      return <DefaultCard {...data} />;
    case "horizontal-rectangle":
      return <BannerCard {...data} />;
    case "vertical-rectangle":
      return <VerticalCard {...data} />;
  }
};

export default Card;
