"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import HeroText from "./text";

const Hero = () => {
  return (
    <div className="relative flex h-screen w-full items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          className="h-full w-full object-cover object-center"
          src="https://www.gamespot.com/a/uploads/original/1632/16320660/4465136-atomfall_features_06.jpg"
          draggable={false}
          alt="background"
          fill
        />
        {/* Dark Overlay for better readability */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Game Name (Positioned inside the background) */}
        <div className="absolute bottom-16 left-2 p-5 text-white transition-all hover:underline hover:opacity-80">
          <Link href="#" className="text-xs">
            Atomfall
          </Link>
        </div>
      </div>

      {/* Hero Content */}
      <div className="absolute top-1/2 left-1/2 flex w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-6 text-center">
        {/* Hero Text */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 },
            },
          }}
          className="flex flex-col gap-3 text-center"
        >
          <HeroText>
            Track your <span className="text-purple-400">favorite games</span>
          </HeroText>
          <HeroText>
            Discover <span className="text-blue-300">what to play next</span>
          </HeroText>
          <HeroText>
            Share your ratings{" "}
            <span className="text-yellow-300">with friends</span>
          </HeroText>
        </motion.div>

        {/* Call-to-Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(buttonVariants({ size: "lg" }), "text-lg")}
          >
            Start Tracking Now
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
