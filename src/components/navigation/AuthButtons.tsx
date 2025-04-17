"use client";

import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";
import Link from "next/link";

interface AuthButtonsProps {
  user: Session["user"] | null;
}

const AuthButtons = ({ user }: AuthButtonsProps) => {
  if (user?.id) {
    return (
      <div className="flex items-center gap-4">
        <Button asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/logout">Logout</Link>
        </Button>
      </div>
    );
  }

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
