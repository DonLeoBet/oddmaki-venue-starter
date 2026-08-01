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

export async function generateMetadata(): Promise<Metadata> {
  const name = await resolveVenueName();

  return {
    title: {
      default: name,
      template: `%s - ${name}`,
    },
    description: venueConfig.branding.description,
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
            <footer className="w-full flex items-center justify-center py-3">
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
