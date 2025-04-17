"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const AuthButtons = () => {
  return (
    <div className="flex items-center gap-4">
      <Button asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Sign Up</Link>
      </Button>
      {/* User dropdown menu can be added here in the future */}
    </div>
  );
};

export default AuthButtons;