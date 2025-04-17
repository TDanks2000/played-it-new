import {
  AuthButtons,
  MobileMenu,
  NavLinks,
  SearchBar,
} from "@/components/navigation";
import { getCurrentUser } from "@/lib/auth/user";

const NavBar = async () => {
  const user = await getCurrentUser();

  return (
    <header className="bg-background/70 sticky top-0 z-50 flex h-16 items-center gap-4 border-b px-4 backdrop-blur-lg md:px-6">
      <NavLinks />
      <MobileMenu />
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <SearchBar />
        <AuthButtons user={user} />
      </div>
    </header>
  );
};

export default NavBar;
