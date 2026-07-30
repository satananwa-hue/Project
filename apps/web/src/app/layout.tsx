import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { ProfileAvatarButton, ReviewerProfileSheet, MobileProfileTrigger } from "@/components/reviewer-sidebar";
import { REPUTATION_LEVELS } from "@chiwitrakmaochaaowelarakkhrai/shared-types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "ChiWitRakMaoChaAoWelaRakKhrai";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Trusted Nightlife Reviews in Bangkok`,
    template: `%s | ${siteName}`,
  },
  description:
    "Discover bars and clubs in Bangkok through reviews from a trusted, invite-only community of reviewers.",
  openGraph: { siteName, type: "website" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-background text-foreground">
        {/* ── Top navigation ─────────────────────────────── */}
        <header className="flex-shrink-0 border-b border-white/5 bg-background/80 backdrop-blur-xl z-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {/* Brand */}
            <div className="flex items-center gap-7">
              <Link href="/" className="text-lg font-bold tracking-tight text-accent">
                {siteName}
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest uppercase text-muted">
                <Link href="/" className="hover:text-foreground transition-colors">Discovery</Link>
                <Link href="/venues" className="hover:text-foreground transition-colors">Venues</Link>
                {profile?.role === 'ADMINISTRATOR' && (
                  <Link href="/admin" className="text-accent hover:text-accent/80 transition-colors">Admin</Link>
                )}
              </nav>
            </div>

            {/* Right actions */}
            <nav className="flex items-center gap-3">
              {!profile && (
                <Link
                  href="/login"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Login
                </Link>
              )}
              {profile && (
                <ProfileAvatarButton
                  level={profile.reputationLevel}
                  levelName={REPUTATION_LEVELS[profile.reputationLevel] ?? "New Explorer"}
                  displayName={profile.displayName}
                />
              )}
            </nav>
          </div>
        </header>

        {/* ── Page content ───────────────────────────────── */}
        {/* pb-16 clears the fixed bottom nav on mobile */}
        <main className="flex-1 min-h-0 pb-16 md:pb-0">{children}</main>

        {/* ── Mobile bottom nav — fixed at viewport bottom ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-white/5 bg-background/90 backdrop-blur-xl z-50">
          <div className="flex justify-around items-center h-16 px-4">
            <Link href="/" className="flex flex-col items-center gap-0.5 text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-widest">Explore</span>
            </Link>
            <Link href="/venues" className="flex flex-col items-center gap-0.5 text-muted hover:text-foreground transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-widest">Venues</span>
            </Link>
            {profile ? (
              <MobileProfileTrigger>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
                <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
              </MobileProfileTrigger>
            ) : (
              <Link href="/login" className="flex flex-col items-center gap-0.5 text-muted hover:text-foreground transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
                <span className="text-[9px] font-bold uppercase tracking-widest">Login</span>
              </Link>
            )}
          </div>
        </nav>

        {/* ── Footer (non-home pages only, hidden on mobile) ─ */}
        <footer className="hidden md:block flex-shrink-0 border-t border-white/5 py-6 text-center text-xs text-muted/60">
          © {new Date().getFullYear()} {siteName}. Bangkok nightlife, reviewed by people who were actually there.
        </footer>

        {profile && <ReviewerProfileSheet profile={profile} />}
      </body>
    </html>
  );
}
