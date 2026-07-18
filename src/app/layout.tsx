import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Providers from "./provider";

export const metadata: Metadata = {
  title: "IdiomYar",
  description: "Practice, remember, and review English idioms with flash cards, lessons, stories, and saved review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-dvh overflow-x-hidden bg-background customScrollBarStyle">
      <body className="min-h-dvh overflow-x-hidden bg-background font-interVariable text-foreground antialiased">
        <div className="min-h-dvh w-full overflow-x-hidden px-4 py-4 mobile:px-5 tablet:px-6 laptop:px-8">
          <Providers>
            <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[1440px] min-w-0 flex-col">
              {children}
            </div>
          </Providers>
          <Toaster />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
