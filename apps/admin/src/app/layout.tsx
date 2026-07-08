import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChiWitRakMaoChaAoWelaRakKhrai Admin",
  description: "Content administration for ChiWitRakMaoChaAoWelaRakKhrai",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-neutral-100">
        {profile && (
          <header className="border-b border-neutral-800">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                ChiWitRakMaoChaAoWelaRakKhrai <span className="text-amber-500">Admin</span>
              </Link>
              <nav className="flex items-center gap-6 text-sm text-neutral-400">
                <Link href="/" className="hover:text-neutral-100">
                  Dashboard
                </Link>
                <Link href="/venues/new" className="hover:text-neutral-100">
                  New Venue
                </Link>
                <span>{profile.username}</span>
              </nav>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
