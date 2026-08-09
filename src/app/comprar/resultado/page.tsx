import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PaymentResult from "@/components/purchase/PaymentResult";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resultado del pago | Orgullo Embajador",
};

export default function ResultadoPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-royal-50/40">
        <Suspense fallback={null}>
          <PaymentResult />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
