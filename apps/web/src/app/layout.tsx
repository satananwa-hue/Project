import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { ProfileAvatarButton, ReviewerProfileSheet } from "@/components/reviewer-sidebar";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Trusted Nightlife Reviews in Bangkok`,
    template: `%s | ${siteName}`,
  },
  description:
    "Discover bars and clubs in Bangkok through reviews from a trusted, invite-only community of reviewers.",
  openGraph: {
    siteName,
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Public users must never be able to tell the reviewer community exists -
  // logged out, this renders nothing more than a plain "Login" link; logged
  // in, the sidebar replaces it entirely. No "Become a Reviewer" marketing CTA.
  const profile = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {siteName}
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted">
              <Link href="/venues" className="hover:text-foreground">
                Venues
              </Link>
              {!profile && (
                <Link href="/login" className="hover:text-foreground">
                  Login
                </Link>
              )}
              {profile && (
                <ProfileAvatarButton
                  level={profile.reputationLevel}
                  levelName={REPUTATION_LEVELS[profile.reputationLevel] ?? "New Explorer"}
                />
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} {siteName}. Bangkok nightlife, reviewed by people who were actually there.
        </footer>
        {profile && <ReviewerProfileSheet profile={profile} />}
      </body>
    </html>
  );
}
