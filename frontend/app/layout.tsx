import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/context/AuthContext";
import { AccessibilityProvider } from "../lib/context/AccessibilityContext";

export const metadata: Metadata = {
  title: "DisaCare - Direktori Fasilitas Publik Inklusif Bandung",
  description: "Platform portal informasi dan direktori spasial aksesibilitas fasilitas publik di Kota Bandung bagi penyandang disabilitas.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Atkinson+Hyperlegible+Next:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body-md text-on-surface antialiased">
        <AuthProvider>
          <AccessibilityProvider>
            {children}
          </AccessibilityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
