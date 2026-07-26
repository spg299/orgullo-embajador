"use client";

import { useEffect, useRef, useState } from "react";

const videos = [
  { src: "/videos/pasion-1.mp4", label: "Ambiente en El Campín" },
  { src: "/videos/pasion-2.mp4", label: "Hinchada de Millonarios" },
];

function VideoCard({
  src,
  label,
  delayMs = 0,
}: {
  src: string;
  label: string;
  delayMs?: number;
}) {
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
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 shadow-soft transition-all duration-700 ease-out ${
        inView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <video
        className="h-full w-full object-cover transition-transform duration-700 ease-out lg:group-hover:scale-105"
        src={src}
        aria-label={label}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/50 via-navy-950/0 to-navy-950/0" />
    </div>
  );
}

export default function PassionVideos() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-royal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="container-page relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            El Campín
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold text-white sm:text-5xl">
            Vive la pasión en El Campín
          </h2>
          <p className="mt-4 text-white/60">
            &ldquo;La mejor forma de vivir a Millonarios es desde la tribuna.
            Compra tus boletas y acompaña al equipo en el estadio.&rdquo;
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {videos.map((video, i) => (
            <VideoCard
              key={video.src}
              src={video.src}
              label={video.label}
              delayMs={i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
