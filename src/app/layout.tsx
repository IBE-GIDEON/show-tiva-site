import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Show Tiva",
  description: "The Ultimate Cinema Hub",
};

export default function RootLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        {auth}
      </body>
    </html>
  );
}
