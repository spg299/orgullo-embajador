import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import WhatsAppFloatingButton from "@/components/ui/WhatsAppFloatingButton";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orgullo Embajador | Boletas oficiales Millonarios FC",
  description:
    "Compra tus boletas para los partidos de Millonarios FC de forma rápida, segura y garantizada.",
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
