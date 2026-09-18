"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Ends the admin session and returns to the library. */
export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/library" })}
      className="gap-1.5"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      Sign out
    </Button>
  );
}
