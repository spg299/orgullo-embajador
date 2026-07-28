"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Container from "@/components/ui/Container";
import CrestBadge from "@/components/ui/CrestBadge";
import MatchCtaButton from "@/components/home/MatchCtaButton";
import { CalendarIcon, MapPinIcon, ArrowRightIcon } from "@/components/ui/Icons";
import { homeMatches, fetchHomeMatches, MILLONARIOS_CREST } from "@/data/homeMatches";
import { heroVideos, fetchHeroVideos } from "@/data/heroVideos";

const AUTOPLAY_MS = 5000;
const RESUME_DELAY_MS = 6000;
const SLIDE_TRANSITION_MS = 500;
const DRAG_THRESHOLD_RATIO = 0.18;
const DRAG_DEADZONE_PX = 6;

export default function Hero() {
  // Seeded with the static fallback so the first paint is identical to
  // before; fetchHomeMatches then silently upgrades it to the live data
  // from /admin/matches once it resolves (or leaves it as-is if that fails).
  const [matchesData, setMatchesData] = useState(homeMatches);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [viewportWidthPx, setViewportWidthPx] = useState(1);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const hasCapturedPointer = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tick, setTick] = useState(0);
  const [videos, setVideos] = useState(heroVideos);

  useEffect(() => {
    fetchHomeMatches().then(setMatchesData);
    fetchHeroVideos().then(setVideos);
  }, []);

  // Same source of truth as the "Calendario de partidos de local" section:
  // the next matches that aren't sold out and are flagged for the Hero
  // (from /admin/hero), in schedule order.
  const upcomingMatches = useMemo(
    () =>
      matchesData.filter((m) => m.status !== "sold_out" && m.showInHero !== false).slice(0, 3),
    [matchesData],
  );

  // Clamped for rendering/arithmetic (not stored back into state) in case
  // the live data resolves with fewer matches than the fallback and `index`
  // would otherwise point past the end.
  const activeIndex = index < upcomingMatches.length ? index : 0;

  // Autoplay: advances every AUTOPLAY_MS unless the user is dragging or just
  // interacted (isPaused). Doesn't depend on index itself, so an
  // autoplay-triggered advance never restarts its own timer — the cadence
  // stays steady instead of feeling jumpy. Depends on upcomingMatches.length
  // so it re-subscribes correctly if the live data changes the slide count.
  useEffect(() => {
    if (isPaused || isDragging || upcomingMatches.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % upcomingMatches.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, isDragging, upcomingMatches.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, []);

  function pauseThenResume() {
    setIsPaused(true);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => setIsPaused(false), RESUME_DELAY_MS);
  }

  function goTo(next: number) {
    setIndex(
      ((next % upcomingMatches.length) + upcomingMatches.length) % upcomingMatches.length,
    );
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Deliberately no preventDefault/setPointerCapture here: doing either
    // unconditionally on pointerdown also swallowed the click on the
    // "Comprar ahora" link for a plain tap (setPointerCapture in particular
    // re-targets the *native* click to this wrapper instead of the link
    // underneath it). Both only kick in from handlePointerMove below, once
    // real drag movement is confirmed — a tap that never moves reaches the
    // link untouched.
    setViewportWidthPx(viewportRef.current?.offsetWidth || 1);
    dragStartX.current = e.clientX;
    hasCapturedPointer.current = false;
    setIsDragging(true);
    pauseThenResume();
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > DRAG_DEADZONE_PX) {
      e.preventDefault();
      if (!hasCapturedPointer.current) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
          hasCapturedPointer.current = true;
        } catch {
          // Some browsers/pointer types can report an id that's no longer
          // active by the time capture is requested; the drag still works
          // fine without capture in that case.
        }
      }
    }
    setDragX(delta);
  }

  function endDrag() {
    if (!isDragging) return;
    const ratio = dragX / viewportWidthPx;
    if (Math.abs(ratio) > DRAG_THRESHOLD_RATIO) {
      goTo(activeIndex + (ratio < 0 ? 1 : -1));
    }
    setIsDragging(false);
    setDragX(0);
    pauseThenResume();
  }

  // Only two <video> elements ever exist in the DOM: the one on screen and the
  // one preloading the next clip. They swap roles each tick so the crossfade
  // never has more than two full-bleed videos decoding at once.
  const activeLayer = tick % 2;
  const activeSrc = videos[tick % videos.length];
  const nextSrc = videos[(tick + 1) % videos.length];
  const layerSrcs = activeLayer === 0 ? [activeSrc, nextSrc] : [nextSrc, activeSrc];

  const dragPercent = isDragging ? (dragX / viewportWidthPx) * 100 : 0;

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
        <div className="max-w-2xl">
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

          <div
            ref={viewportRef}
            className="mt-10 touch-pan-y select-none overflow-hidden rounded-3xl"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="flex"
              style={{
                transform: `translateX(calc(${-activeIndex * 100}% + ${dragPercent}%))`,
                transition: isDragging
                  ? "none"
                  : `transform ${SLIDE_TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              }}
            >
              {upcomingMatches.map((m, i) => (
                <div
                  key={m.id}
                  className={`w-full shrink-0 rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-soft backdrop-blur-md transition-opacity sm:p-6 ${
                    i === activeIndex ? "opacity-100" : "opacity-60"
                  }`}
                  style={{ transitionDuration: `${SLIDE_TRANSITION_MS}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center -space-x-3">
                      <CrestBadge
                        initial="M"
                        size="md"
                        crestSrc={MILLONARIOS_CREST}
                        alt="Escudo de Millonarios FC"
                      />
                      <CrestBadge
                        initial={m.rivalInitial}
                        size="md"
                        crestSrc={m.rivalCrest}
                        alt={`Escudo de ${m.rival}`}
                      />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold tracking-tight text-white">
                        Millonarios <span className="text-white/40">vs</span>{" "}
                        {m.rival}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">
                        Liga BetPlay Dimayor
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/70">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-gold-400" />
                      {m.date} · {m.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4 text-gold-400" />
                      {m.stadium}, Bogotá D.C.
                    </span>
                  </div>

                  <div className="mt-6">
                    <MatchCtaButton
                      status={m.status}
                      href={m.buyLink ?? `/comprar?match=${m.id}`}
                      size="lg"
                      icon={<ArrowRightIcon className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2.5">
          {upcomingMatches.map((m, i) => (
            <button
              key={m.id}
              aria-label={`Ver partido Millonarios vs ${m.rival}`}
              onClick={() => {
                goTo(i);
                pauseThenResume();
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeIndex ? "w-8 bg-gold-400" : "w-3 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
