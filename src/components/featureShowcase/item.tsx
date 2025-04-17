import { cn } from "@/lib/utils";
import { type FunctionComponent, type JSX } from "react";

interface FeatureCardItemprops {
  title: string;
  description: string;
  icon: JSX.Element;
  isAvailable: boolean;
}

const FeatureCard: FunctionComponent<FeatureCardItemprops> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="hover:bg-muted/50 flex w-full flex-row items-center justify-start gap-5 rounded-lg p-3 transition-all hover:cursor-pointer">
      {/* LEFT */}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
        )}
      >
        {icon}
      </div>
      {/* RIGHT */}
      <div className="flex flex-col items-start justify-center gap-1">
        <h3 className={cn("text-lg font-semibold")}>{title}</h3>
        <p className={cn("text-md")}>{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
