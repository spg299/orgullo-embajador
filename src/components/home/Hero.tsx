"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import CrestBadge from "@/components/ui/CrestBadge";
import StadiumIllustration from "@/components/home/StadiumIllustration";
import { CalendarIcon, MapPinIcon, ArrowRightIcon } from "@/components/ui/Icons";
import { featuredMatches } from "@/data/matches";

export default function Hero() {
  const [index, setIndex] = useState(0);
  const match = featuredMatches[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featuredMatches.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="inicio" className="relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0">
        <StadiumIllustration className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />
      </div>

      <Container className="relative flex min-h-[86vh] flex-col justify-center py-24">
        <div
          key={match.id}
          className="max-w-2xl animate-fade-in-up"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300 backdrop-blur-sm">
            Boletas oficiales · Millonarios FC
          </span>

          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Compra tus
            <br />
            <span className="text-gold-400">boletas</span>
          </h1>

          <p className="mt-6 max-w-md text-lg text-white/70">
            Vive la pasión azul junto a Millonarios. Consigue tu puesto en El
            Campín en minutos.
          </p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-soft backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center -space-x-3">
                <CrestBadge initial={match.homeInitial} size="md" />
                <CrestBadge initial={match.awayInitial} size="md" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-white">
                  {match.home} <span className="text-white/40">vs</span>{" "}
                  {match.away}
                </p>
                <p className="text-xs uppercase tracking-wider text-gold-300">
                  {match.competition}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-gold-400" />
                {match.date} · {match.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 text-gold-400" />
                {match.stadium}, {match.city}
              </span>
            </div>

            <div className="mt-6">
              <Button
                href={`/comprar?match=${match.id}`}
                variant="primary"
                size="lg"
                icon={<ArrowRightIcon className="h-4 w-4" />}
                iconPosition="right"
                className="w-full sm:w-auto"
              >
                Comprar ahora
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2.5">
          {featuredMatches.map((m, i) => (
            <button
              key={m.id}
              aria-label={`Ver partido ${m.home} vs ${m.away}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-8 bg-gold-400" : "w-3 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
