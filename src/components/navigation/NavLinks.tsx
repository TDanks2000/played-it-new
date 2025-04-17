"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type NavLinksProps = {
  pathname: string[];
  isMobile?: boolean;
};

const NavLinks = ({ pathname, isMobile = false }: NavLinksProps) => {
  return (
    <nav
      className={cn(
        isMobile
          ? "grid gap-6 text-lg font-medium"
          : "hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6",
      )}
    >
      <Link
        href="/"
        className={cn(
          "flex size-10 items-center gap-2 overflow-hidden text-lg font-semibold",
          !isMobile && "hover:text-primary transition-all md:text-base",
        )}
      >
        <Image
          alt="PlayedIT Logo"
          src="/logo.png"
          width={50}
          height={50}
          className="size-full overflow-hidden object-contain"
        />
        <span className="sr-only">PlayedIT</span>
      </Link>
      <Link
        href="/"
        className={cn(
          isMobile
            ? "hover:text-foreground"
            : "text-muted-foreground transition-all hover:opacity-90",
          {
            "text-foreground": pathname[1] === "",
          },
        )}
      >
        Home
      </Link>
      <Link
        href="/games"
        className={cn(
          isMobile
            ? "text-muted-foreground hover:text-foreground"
            : "text-muted-foreground transition-all hover:opacity-90",
          {
            "text-foreground": pathname[1] === "games",
          },
        )}
      >
        Games
      </Link>
    </nav>
  );
};

export default NavLinks;
