import type { Metadata } from "next";
import { Ubuntu_Sans } from "next/font/google";
import "./globals.css";

import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import Providers from "./providers";
import { AppToaster } from "./AppToaster";

const ubuntu = Ubuntu_Sans({
  variable: "--font-ubuntu-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowDesk",
  description: "Plan, assign, deliver—together.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={ubuntu.className}>
        <Providers>
          <Navbar />
          <AppToaster/>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
