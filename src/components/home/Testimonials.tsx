"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import StarRating from "@/components/ui/StarRating";
import { ChatIcon, CloseIcon } from "@/components/ui/Icons";
import { fetchTestimonials, type Testimonial } from "@/data/testimonials";

function TestimonialCard({
  item,
  onViewScreenshot,
}: {
  item: Testimonial;
  onViewScreenshot: (item: Testimonial) => void;
}) {
  return (
    <div className="group flex flex-col rounded-3xl border border-navy-900/8 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <StarRating value={item.rating} size="h-4 w-4" />

      <p className="mt-4 flex-1 text-sm font-medium leading-relaxed text-navy-700/70">
        &ldquo;{item.message}&rdquo;
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URLs vary in host/size; next/image adds no real benefit here
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal-100 font-display font-bold text-royal-500">
              {item.name.slice(0, 1)}
            </div>
          )}
          <p className="truncate font-display text-sm font-bold tracking-tight text-navy-950">
            {item.name}
          </p>
        </div>

        {item.screenshotUrl && (
          <button
            type="button"
            onClick={() => onViewScreenshot(item)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-royal-50 px-3.5 py-2 text-xs font-semibold text-royal-600 transition-colors hover:bg-royal-100"
          >
            <ChatIcon className="h-3.5 w-3.5" />
            Ver conversación
          </button>
        )}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [screenshot, setScreenshot] = useState<Testimonial | null>(null);

  useEffect(() => {
    fetchTestimonials().then(setItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="bg-royal-50/60 py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>La hinchada opina</SectionEyebrow>
          <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
            Lo que dicen nuestros hinchas
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <TestimonialCard key={item.id} item={item} onViewScreenshot={setScreenshot} />
          ))}
        </div>
      </Container>

      {screenshot && screenshot.screenshotUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
          onClick={() => setScreenshot(null)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setScreenshot(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-navy-950/50 text-white transition-colors hover:bg-navy-950/70"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL; next/image adds no real benefit for a one-off modal view */}
            <img
              src={screenshot.screenshotUrl}
              alt={`Conversación con ${screenshot.name}`}
              className="max-h-[80vh] w-full object-contain"
            />
            <div className="border-t border-navy-900/8 p-4 text-center">
              <p className="font-display text-sm font-bold tracking-tight text-navy-950">
                Conversación con {screenshot.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
