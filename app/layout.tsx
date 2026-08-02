import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import clsx from "clsx";

import { Providers } from "./providers";

import { BRAND_CONFIG } from "@/config/brand.config";
import { venueConfig } from "@/config/venue.config";
import { resolveVenueName } from "@/lib/oddmaki/venue-name";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { AppShell } from "@/components/app-shell";
import { NavigationProgress } from "@/components/navigation-progress";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CLUB_PAGES } from "@/config/clubPages";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const name = await resolveVenueName();
  const domain = BRAND_CONFIG.domain.replace(/^https?:\/\//, "");
  const metadataBase = new URL(
    `https://${domain.startsWith("www.") ? domain : `www.${domain}`}`,
  );
  const description =
    "Trade football match markets on Base — 1X2 and more. On-chain prediction markets powered by OddMaki. No bookmaker margin, peer-to-peer on Poly.Football.";

  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase,
    title: {
      default: `${name} — Football Prediction Markets on Base`,
      template: `%s | ${name}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: name,
      title: name,
      description,
      url: metadataBase,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(googleVerification ?
      { verification: { google: googleVerification } }
    : {}),
    icons: {
      icon: venueConfig.branding.favicon,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en" className="overflow-x-hidden">
      <head />
      <body
        className={clsx(
          "min-h-screen overflow-x-hidden max-w-[100vw] text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <NavigationProgress />
          <div className="relative flex min-h-screen flex-col overflow-x-hidden max-w-[100vw]">
            <Navbar />
            <AppShell>{children}</AppShell>
            <MobileBottomNav />
            <footer className="hidden w-full flex-col items-center justify-center gap-2 py-4 lg:flex">
              <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
                <Link
                  className="text-default-400 hover:text-primary transition-colors"
                  href="/info"
                >
                  How it works
                </Link>
                <Link
                  className="text-default-400 hover:text-primary transition-colors"
                  href="/about"
                >
                  About
                </Link>
                {CLUB_PAGES.map((club) => (
                  <Link
                    key={club.slug}
                    className="text-default-400 hover:text-primary transition-colors"
                    href={`/clubs/${club.slug}`}
                  >
                    {club.label}
                  </Link>
                ))}
              </nav>
              <span className="text-default-500 text-sm">
                <p>
                  &copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. All
                  rights reserved.
                </p>
              </span>
            </footer>
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
