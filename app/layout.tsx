import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Toaster } from "sonner";
import localFont from "next/font/local";
import RegisterSW from "@/components/register-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const grifterBold = localFont({
  src: "../public/fonts/grifterbold.otf",
  variable: "--font-grifter-bold",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finova - Personal Finance Tracker",
  description: "Track your expenses, manage your budget, and achieve your financial goals",
  themeColor: "#111827",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/finova-logo.svg",
    apple: "/Finova.png",
    shortcut: "/Finova.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${inter.variable} font-inter antialiased `}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster />
        <RegisterSW />
      </body>
    </html>
  );
}
