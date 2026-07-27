"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import CrestBadge from "@/components/ui/CrestBadge";
import { CalendarIcon, MapPinIcon, ArrowRightIcon } from "@/components/ui/Icons";
import { homeMatches } from "@/data/homeMatches";

const heroVideos = [
  "/videos/hero-stadium.mp4",
  "/videos/pasion-1.mp4",
  "/videos/pasion-2.mp4",
];

// Same source of truth as the "Calendario de partidos de local" section:
// the next matches that aren't sold out, in schedule order.
const upcomingMatches = homeMatches.filter((m) => m.status !== "agotado").slice(0, 3);

export default function Hero() {
  const [index, setIndex] = useState(0);
  const match = upcomingMatches[index];

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % upcomingMatches.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Only two <video> elements ever exist in the DOM: the one on screen and the
  // one preloading the next clip. They swap roles each tick so the crossfade
  // never has more than two full-bleed videos decoding at once.
  const activeLayer = tick % 2;
  const activeSrc = heroVideos[tick % heroVideos.length];
  const nextSrc = heroVideos[(tick + 1) % heroVideos.length];
  const layerSrcs = activeLayer === 0 ? [activeSrc, nextSrc] : [nextSrc, activeSrc];

  return (
    <section id="inicio" className="relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0">
        {[0, 1].map((layer) => (
          <video
            key={layer}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              layer === activeLayer ? "opacity-100" : "opacity-0"
            }`}
            src={layerSrcs[layer]}
            poster="/images/gallery-tifo.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        ))}
        <div className="absolute inset-0 bg-navy-950/65" />
      </div>

      <Container className="relative flex min-h-[86vh] flex-col justify-center py-24">
        <div
          key={match.id}
          className="max-w-2xl animate-fade-in-up"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-300 backdrop-blur-sm">
            Boletas oficiales · Millonarios FC
          </span>

          <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Compra tus
            <br />
            <span className="text-gold-400">boletas</span>
          </h1>

          <p className="mt-6 max-w-md text-lg font-medium leading-relaxed text-white/70">
            Vive la pasión azul junto a Millonarios. Consigue tu puesto en El
            Campín en minutos.
          </p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-soft backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center -space-x-3">
                <CrestBadge initial="M" size="md" />
                <CrestBadge initial={match.rivalInitial} size="md" />
              </div>
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-white">
                  Millonarios <span className="text-white/40">vs</span>{" "}
                  {match.rival}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">
                  Liga BetPlay Dimayor
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/70">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-gold-400" />
                {match.date} · {match.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 text-gold-400" />
                {match.stadium}, Bogotá D.C.
              </span>
            </div>

            <div className="mt-6">
              <Button
                href={match.buyLink ?? `/comprar?match=${match.id}`}
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
          {upcomingMatches.map((m, i) => (
            <button
              key={m.id}
              aria-label={`Ver partido Millonarios vs ${m.rival}`}
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
