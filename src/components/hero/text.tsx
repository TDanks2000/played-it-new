"use client";

import { cn } from "@/lib/utils";
import { type HTMLMotionProps, motion } from "framer-motion";
import { type PropsWithChildren } from "react";

type Props = PropsWithChildren<HTMLMotionProps<"p">>;

const HeroText = ({ children, className, ...props }: Props) => {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "text-xl leading-tight font-extrabold text-white shadow-black/50 md:text-3xl lg:text-4xl",
        className,
      )}
      {...props}
    >
      {children}
    </motion.p>
  );
};

export default HeroText;
