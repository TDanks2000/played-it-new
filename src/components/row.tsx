import { type IGDBReturnDataType } from "@/@types";
import Card from "@/components/cards/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { type FC } from "react";

interface RowProps {
  cardType: "default" | "horizontal-rectangle" | "vertical-rectangle";
  data: IGDBReturnDataType[];
}

const Row: FC<RowProps> = ({ cardType, data }) => {
  if (!data?.length) return null;

  return (
    <Carousel
      opts={{
        align: "start",
        skipSnaps: true,
        dragFree: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2">
        {data.map((item, index) => (
          <CarouselItem key={index} className="basis-auto px-2">
            <Card type={cardType} {...item} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default Row;
