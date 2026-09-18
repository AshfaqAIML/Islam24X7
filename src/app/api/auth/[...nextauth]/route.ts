import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/** NextAuth handler — credentials login only (see src/lib/auth.ts). */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
