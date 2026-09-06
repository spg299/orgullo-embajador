import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import FemalePurchaseFlow from "@/components/purchase/FemalePurchaseFlow";
import { fetchFemaleMatchById } from "@/data/femaleMatches";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Completa tu compra — Fútbol Femenino | Orgullo Embajador",
};

// Independent from /comprar (men's) — data/matches.ts, getMatchById, and
// PurchaseFlow.tsx are not imported here at all. There's no static
// fallback fixture for women's matches (unlike homeMatches.ts) since a
// missing/inactive id has no reasonable match to fall back to.
export default async function ComprarFemeninoPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const { match: matchId } = await searchParams;
  const femaleMatch = matchId ? await fetchFemaleMatchById(matchId) : null;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {femaleMatch ? (
          <FemalePurchaseFlow femaleMatch={femaleMatch} />
        ) : (
          <section className="bg-royal-50/40 py-24">
            <Container className="flex flex-col items-center text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-navy-950">
                Partido no encontrado
              </h1>
              <p className="mt-2 max-w-sm text-sm font-medium text-navy-700/60">
                Este partido femenino no existe o ya no está disponible.
              </p>
              <Button href="/" variant="primary" className="mt-6">
                Volver al inicio
              </Button>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
