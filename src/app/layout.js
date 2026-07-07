import localFont from "next/font/local";
import "./globals.css";

const nowFont = localFont({
  src: [
    {
      path: "../../assets/fonts/Now-Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Now-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Now-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Now-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Now-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Now-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-now",
});

const jetbrainsMono = {
  variable: "font-mono",
};

export const metadata = {
  title: "Autonomous Industrial Control Tower",
  description: "Real-time AI-Agent Fleet Predictive Maintenance & Sourcing Orchestrator Dashboard",
  manifest: "/manifest.json",
};

import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${nowFont.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-slate-200 bg-[#06080c] min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
