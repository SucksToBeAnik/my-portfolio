import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { QuickAdd } from "@/components/QuickAdd";
import { SearchOverlay } from "@/components/SearchOverlay";
import { auth } from "@/lib/auth";
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

export const metadata: Metadata = {
  title: "Suckstobeanik",
  description: "Software engineer and builder.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
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
              <PageShell>{children}</PageShell>
              <BottomNav />
              <SearchOverlay />
              {session?.user && <QuickAdd />}
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
