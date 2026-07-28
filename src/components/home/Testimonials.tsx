"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { fetchTestimonials, type Testimonial } from "@/data/testimonials";

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="flex flex-col rounded-3xl border border-navy-900/5 bg-white p-8 shadow-card">
      <p className="text-sm font-medium leading-relaxed text-navy-700/70">
        &ldquo;{item.message}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3">
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
        <p className="font-display text-sm font-bold tracking-tight text-navy-950">{item.name}</p>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);

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
            <TestimonialCard key={item.id} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
