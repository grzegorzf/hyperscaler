import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://grzegorzf.github.io/hyperscaler"),
  title: "Hyperscaler | Holographic Cloud Architecture & FinOps Simulator",
  description:
    "Interactive 60 FPS visual simulator comparing Horizontal Auto-Scaling vs Vertical Scaling with live queuing theory, Multi-Cloud AWS/GCP/Azure cost arbitrage, 99.99% SLO tracking, and Chaos Monkey.",
  keywords: [
    "hyperscaler",
    "cloud simulator",
    "finops",
    "aws pricing",
    "gcp pricing",
    "azure pricing",
    "cloud arbitrage",
    "auto-scaling",
    "load balancing",
    "queuing theory",
    "littles law",
    "horizontal scaling",
    "vertical scaling",
    "edge cdn",
    "canvas 60fps",
    "slo tracker",
  ],
  authors: [{ name: "Grzegorz Forysiak", url: "https://github.com/grzegorzf" }],
  openGraph: {
    title: "Hyperscaler | Holographic Cloud Architecture & FinOps Simulator",
    description:
      "Interactive 60 FPS visual simulator comparing Horizontal Auto-Scaling vs Vertical Scaling with live queuing theory, Multi-Cloud AWS/GCP/Azure cost arbitrage, and Chaos Monkey.",
    type: "website",
    url: "https://grzegorzf.github.io/hyperscaler",
    locale: "en_US",
    siteName: "Hyperscaler Simulator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyperscaler | Holographic Cloud Architecture & FinOps Simulator",
    description:
      "Interactive 60 FPS visual simulator comparing Horizontal Auto-Scaling vs Vertical Scaling with live queuing theory and packet dynamics.",
  },
  icons: {
    icon: "./icon.svg",
    apple: "./icon.svg",
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
