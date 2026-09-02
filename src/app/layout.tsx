import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pozitif AI", template: "%s · Pozitif AI" },
  description: "Güvenli Navori yayın yönetimi",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
