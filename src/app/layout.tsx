import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { PageShell } from "@/components/PageShell";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "@/lib/ThemeProvider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Suckstobeanik",
  description: "Software engineer and builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable}`}
      data-theme="dark"
    >
      <head>
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
        <ThemeProvider>
          <PageShell>{children}</PageShell>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
