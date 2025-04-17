"use client";

import { AuthButtons, MobileMenu, NavLinks, SearchBar } from "@/components/navigation";
import { usePathname } from "next/navigation";

const NavBar = () => {
  const pathname = usePathname().split("/");

  return (
    <header className="bg-background/70 sticky top-0 z-50 flex h-16 items-center gap-4 border-b px-4 backdrop-blur-lg md:px-6">
      <NavLinks pathname={pathname} />
      <MobileMenu pathname={pathname} />
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <SearchBar />
        <AuthButtons />
      </div>
    </header>
  );
};

export default NavBar;
