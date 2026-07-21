import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import MatchCard from "@/components/home/MatchCard";
import { upcomingMatches } from "@/data/matches";

export default function UpcomingMatches() {
  return (
    <section id="partidos" className="bg-white py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Calendario</SectionEyebrow>
          <h2 className="mt-5 font-display text-4xl font-bold text-navy-950 sm:text-5xl">
            Próximos partidos
          </h2>
          <p className="mt-4 text-navy-700/60">
            Elige el partido al que quieres asistir y asegura tu boleta antes
            de que se agote.
          </p>
        </div>

        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </Container>
    </section>
  );
}
