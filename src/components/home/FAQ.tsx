import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { ChevronDownIcon } from "@/components/ui/Icons";

const faqs = [
  {
    question: "¿Cómo recibo mis boletas?",
    answer:
      "Las boletas son entregadas directamente por el equipo de Orgullo Embajador una vez se confirme la compra.",
  },
  {
    question: "¿Cómo compro una boleta?",
    answer:
      "Selecciona el partido, elige la localidad y envía tu solicitud mediante WhatsApp. Nuestro equipo se comunicará contigo para finalizar el proceso.",
  },
  {
    question: "¿Cómo realizo el pago?",
    answer:
      "El equipo de Orgullo Embajador indicará los medios de pago disponibles durante el proceso de compra.",
  },
  {
    question: "¿Las boletas son originales?",
    answer: "Sí. Todas las boletas entregadas por Orgullo Embajador son oficiales.",
  },
  {
    question: "¿Qué pasa si una localidad aparece agotada?",
    answer:
      'Cuando una localidad aparece como "Agotado" significa que ya no hay disponibilidad para esa zona del estadio.',
  },
];

export default function FAQ() {
  return (
    <section id="preguntas-frecuentes" className="bg-white py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Resolvemos tus dudas</SectionEyebrow>
          <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-navy-900/8 bg-white p-6 shadow-card transition-colors duration-300 open:border-royal-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold tracking-tight text-navy-950 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDownIcon className="h-5 w-5 shrink-0 text-royal-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm font-medium leading-relaxed text-navy-700/70">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
