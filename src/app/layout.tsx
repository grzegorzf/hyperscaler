import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyperscaler | Holographic Cloud Architecture Simulator",
  description:
    "Interactive 60 FPS visual simulator comparing Horizontal Auto-Scaling vs Vertical Scaling with live queuing theory, Little's Law, Edge CDN caching, and Chaos Monkey.",
  keywords: [
    "hyperscaler",
    "cloud simulator",
    "auto-scaling",
    "load balancing",
    "queuing theory",
    "littles law",
    "horizontal scaling",
    "vertical scaling",
    "edge cdn",
    "canvas 60fps",
  ],
  authors: [{ name: "Antigravity Engineering" }],
  openGraph: {
    title: "Hyperscaler | Holographic Cloud Architecture Simulator",
    description:
      "Interactive 60 FPS visual simulator comparing Horizontal Auto-Scaling vs Vertical Scaling with live queuing theory, Edge CDN caching, and Chaos Monkey.",
    type: "website",
    locale: "en_US",
    siteName: "Hyperscaler Simulator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyperscaler | Holographic Cloud Architecture Simulator",
    description:
      "Interactive 60 FPS visual simulator comparing Horizontal Auto-Scaling vs Vertical Scaling with live queuing theory and packet dynamics.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#06090e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#06090e] text-slate-100 overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
