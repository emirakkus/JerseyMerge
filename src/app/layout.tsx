import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jersey Merge",
  description:
    "A physics merge puzzle: drop football jerseys, combine matching kits and build your way up to 2048.",
  applicationName: "Jersey Merge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jersey Merge",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F1B3D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Root layout fonts apply to every page in App Router. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {children}
      </body>
    </html>
  );
}
