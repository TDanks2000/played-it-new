import { type IGDBImageSize } from "@/@types";
import Image, { type ImageProps } from "next/image";
import { type FC } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface IGDBImageProps extends Omit<ImageProps, "src"> {
  imageSize?: IGDBImageSize;
  imageId: string;
  alt: string;
}

const IGDBImage: FC<IGDBImageProps> = ({
  imageSize = "original",
  imageId,
  alt,
  width,
  height,
  ...restProps
}) => {
  // Check if imageId is empty or invalid
  if (!imageId || imageId.trim() === "") {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted size-full relative",
          restProps.className
        )}
      >
        <ImageIcon 
          size={Math.min(Number(width), Number(height)) / 3 || 24} 
          className="text-muted-foreground opacity-50" 
        />
      </div>
    );
  }

  const src = `https://images.igdb.com/igdb/image/upload/t_${imageSize}/${imageId}.png`;

  return (
    <Image 
      {...restProps} 
      src={src} 
      alt={alt} 
      width={width} 
      height={height}
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAI8V7yQCgAAAABJRU5ErkJggg=="
      style={{ objectPosition: "center", objectFit: "cover", ...restProps.style }}
    />
  );
};

export default IGDBImage;
