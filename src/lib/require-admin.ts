import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * API-route guard for operator-only endpoints (uploads ingest/delete).
 * Public reads (/api/books, /api/uploads GET, downloads) stay open so the
 * website/app keep working without sign-in.
 *
 * Usage: `const denied = await requireAdmin(); if (denied) return denied;`
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) return null;
  } catch {
    /* misconfigured auth (e.g. no NEXTAUTH_SECRET) ⇒ deny */
  }
  return NextResponse.json(
    { error: "Admin sign-in required (POST /admin/login)." },
    { status: 401 }
  );
}
