import type { Metadata, Viewport } from "next";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const title = "THE BET · SpaceX — Herman vs Dale";
const description =
  "Herman takes under, Kristoffer Dale takes over. SPCX strike $150.68, settled on the 19 Nov 2027 close. Loser pays dinner at Antoinetta.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title,
  description,
  applicationName: "THE BET",
  openGraph: {
    title,
    description,
    url: siteUrl(),
    siteName: "THE BET",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
