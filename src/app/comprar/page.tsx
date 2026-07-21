import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PurchaseFlow from "@/components/purchase/PurchaseFlow";
import { getMatchById } from "@/data/matches";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Completa tu compra | Orgullo Embajador",
};

export default async function ComprarPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const { match: matchId } = await searchParams;
  const match = getMatchById(matchId);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PurchaseFlow match={match} />
      </main>
      <Footer />
    </>
  );
}
