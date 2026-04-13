import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Duetto – Restrictions",
  description: "Group-level Restriction Rules prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.className} h-full`}>
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
