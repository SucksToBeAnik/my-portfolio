import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { BottomNav } from "@/components/BottomNav";
import { NavHistoryTracker } from "@/components/NavHistoryTracker";
import { PageShell } from "@/components/PageShell";
import { QuickAdd } from "@/components/QuickAdd";
import { SearchOverlay } from "@/components/SearchOverlay";
import { QueryProvider } from "@/lib/QueryProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const siteUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Al Jami Islam Anik — Software Engineer",
    template: "%s",
  },
  description:
    "Al Jami Islam Anik — software engineer from Dhaka, Bangladesh. Projects, books, writing, and more.",
  applicationName: "Al Jami Islam Anik",
  authors: [{ name: "Al Jami Islam Anik", url: siteUrl }],
  creator: "Al Jami Islam Anik",
  publisher: "Al Jami Islam Anik",
  keywords: [
    "Al Jami Islam Anik",
    "Al Jami Islam",
    "Anik",
    "Suckstobeanik",
    "software engineer",
    "frontend engineer",
    "Dhaka",
    "Bangladesh",
    "BRAC University",
  ],
  openGraph: {
    title: "Al Jami Islam Anik — Software Engineer",
    description:
      "Al Jami Islam Anik — software engineer from Dhaka, Bangladesh. Projects, books, writing, and more.",
    siteName: "Al Jami Islam Anik",
    images: [{ url: "/profile.jpeg", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Jami Islam Anik — Software Engineer",
    description: "Al Jami Islam Anik — software engineer from Dhaka, Bangladesh.",
    images: ["/profile.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${inter.variable}`} data-theme="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme) document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider>
            <QueryProvider>
              <NavHistoryTracker />
              <PageShell>{children}</PageShell>
              <BottomNav />
              <SearchOverlay />
              <QuickAdd />
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
