"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/ui/Container";
import CrestBadge from "@/components/ui/CrestBadge";
import MatchCtaButton from "@/components/home/MatchCtaButton";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/components/ui/Icons";
import {
  homeMatches,
  fetchHomeMatches,
  MILLONARIOS_CREST,
  type HomeMatch,
  type MatchStatus,
} from "@/data/homeMatches";

const statusConfig: Record<MatchStatus, { label: string; className: string }> = {
  sold_out: {
    label: "SOLD OUT",
    className: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  },
  upcoming: {
    label: "Próximamente",
    className: "border-gold-400/30 bg-gold-500/15 text-gold-300",
  },
  available: {
    label: "Disponible",
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  },
};

function StatusBadge({ status }: { status: MatchStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

function MatchCalendarCard({ match, delayMs }: { match: HomeMatch; delayMs: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`group flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-700 ease-out hover:-translate-y-1.5 hover:border-gold-400/30 hover:bg-white/[0.06] ${
        inView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center -space-x-3">
          <CrestBadge
            initial="M"
            size="sm"
            crestSrc={MILLONARIOS_CREST}
            alt="Escudo de Millonarios FC"
          />
          <CrestBadge
            initial={match.rivalInitial}
            size="sm"
            crestSrc={match.rivalCrest}
            alt={`Escudo de ${match.rival}`}
          />
        </div>
        <StatusBadge status={match.status} />
      </div>

      <p className="mt-4 font-display text-lg font-bold tracking-tight text-white">
        Millonarios <span className="text-white/40">vs</span> {match.rival}
      </p>

      <div className="mt-3 space-y-1.5 text-sm font-medium text-white/60">
        <p className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-gold-400" />
          {match.date}
        </p>
        <p className="flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4 text-gold-400" />
          {match.time}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPinIcon className="h-4 w-4 text-gold-400" />
          {match.stadium}
        </p>
      </div>

      <div className="mt-6">
        <MatchCtaButton
          status={match.status}
          href={match.buyLink ?? `/comprar?match=${match.id}`}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default function HomeMatchesCalendar() {
  // Seeded with the static fallback for an identical first paint; upgraded
  // silently to the live /admin/matches data once the fetch resolves.
  const [matches, setMatches] = useState(homeMatches);

  useEffect(() => {
    fetchHomeMatches().then(setMatches);
  }, []);

  return (
    <section id="partidos" className="relative overflow-hidden bg-navy-950 py-24">
      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-royal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />

      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            Calendario
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Calendario de partidos de local
          </h2>
          <p className="mt-4 font-medium leading-relaxed text-white/60">
            Compra tus boletas para acompañar al Embajador en El Campín.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match, i) => (
            <MatchCalendarCard key={match.id} match={match} delayMs={(i % 3) * 120} />
          ))}
        </div>
      </Container>
    </section>
  );
}
