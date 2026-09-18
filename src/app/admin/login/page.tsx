import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminConfigured } from "@/lib/admin";
import { StarLattice } from "@/components/decor/islamic-pattern";

export const metadata: Metadata = {
  title: "Admin sign-in",
  description: "Operator sign-in for the Islam24X7 admin console.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const configured = isAdminConfigured();

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <StarLattice
        tile={64}
        className="absolute inset-0 h-full w-full text-gold opacity-[0.06]"
        aria-hidden="true"
      />
      <div className="relative flex w-full flex-col items-center gap-4">
        <Suspense>
          <AdminLoginForm />
        </Suspense>
        {!configured ? (
          <p
            role="note"
            className="flex max-w-sm items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold-foreground dark:text-gold"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Admin backend is not configured yet — set ADMIN_PASSWORD_HASH
            (see .env.example) before signing in.
          </p>
        ) : null}
      </div>
    </main>
  );
}
