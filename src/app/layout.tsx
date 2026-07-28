import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import WhatsAppFloatingButton from "@/components/ui/WhatsAppFloatingButton";
import { SITE_URL } from "@/lib/email/config";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "Orgullo Embajador | Boletas oficiales Millonarios FC";
const DESCRIPTION =
  "Compra tus boletas para los partidos de Millonarios FC de forma rápida, segura y garantizada.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Orgullo Embajador",
  keywords: ["Millonarios FC", "boletas", "entradas", "El Campín", "Liga BetPlay", "Orgullo Embajador"],
  authors: [{ name: "Orgullo Embajador" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Orgullo Embajador",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a2f8c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-navy-950 font-sans">
        <AuthProvider>
          {children}
          <WhatsAppFloatingButton />
        </AuthProvider>
      </body>
    </html>
  );
}
