import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { computeEffectivePermissions } from "@/lib/permissions/resolve";

function clientInfo(request?: Request) {
  const ipAddress = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request?.headers.get("x-real-ip") ?? null;
  const userAgent = request?.headers.get("user-agent") ?? null;
  return { ipAddress, userAgent };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        const { ipAddress, userAgent } = clientInfo(request);

        // Only known accounts get a LoginHistory row (the FK requires a real userId) — an
        // unrecognized email never reaches this point.
        if (!valid || user.status !== "ACTIVE") {
          await db.loginHistory.create({ data: { userId: user.id, event: "LOGIN_FAILED", ipAddress, userAgent } });
          return null;
        }

        await db.loginHistory.create({ data: { userId: user.id, event: "LOGIN_SUCCESS", ipAddress, userAgent } });
        await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }

      // Recomputed on every request (including the one right after sign-in, so permissions are
      // never momentarily stale) — also confirms the account hasn't been reset/suspended since
      // this token was issued, otherwise a stolen, still-open, or now-suspended session survives.
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            status: true,
            passwordChangedAt: true,
            suspendedAt: true,
            permissionOverrides: true,
            permissionRevocations: true,
            lastActiveAt: true,
            staffRole: { select: { permissions: true } },
          },
        });
        if (!dbUser) {
          token.invalidated = true;
          return token;
        }

        const resetAt = dbUser.passwordChangedAt ? Math.floor(dbUser.passwordChangedAt.getTime() / 1000) : null;
        const suspendedAt = dbUser.suspendedAt ? Math.floor(dbUser.suspendedAt.getTime() / 1000) : null;
        const iat = token.iat as number | undefined;
        if (dbUser.status !== "ACTIVE" || (iat && ((resetAt && resetAt > iat) || (suspendedAt && suspendedAt > iat)))) {
          token.invalidated = true;
          return token;
        }

        token.role = dbUser.role;
        token.status = dbUser.status;
        token.permissions = computeEffectivePermissions({
          role: dbUser.role,
          staffRolePermissions: dbUser.staffRole?.permissions,
          permissionOverrides: dbUser.permissionOverrides,
          permissionRevocations: dbUser.permissionRevocations,
        });

        // "Online now" (Staff & Roles dashboard) reads lastActiveAt, so it must be touched on
        // every active request, not just at login — throttled to once a minute so a page full of
        // admin nav clicks doesn't turn into a write per request.
        if (!dbUser.lastActiveAt || Date.now() - dbUser.lastActiveAt.getTime() > 60_000) {
          db.user.update({ where: { id: token.id as string }, data: { lastActiveAt: new Date() } }).catch(() => {});
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.invalidated) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as { permissions?: string[] }).permissions = (token.permissions as string[] | undefined) ?? [];
      }
      return session;
    },
  },
  events: {
    // JWT strategy signOut only receives the decoded token (no request), so no IP/UA here —
    // see clientInfo() above for where those are captured, on the login side.
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const userId = token?.id as string | undefined;
      if (userId) {
        await db.loginHistory.create({ data: { userId, event: "LOGOUT" } });
      }
    },
  },
});
