import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { ChevronDownIcon } from "@/components/ui/Icons";

const faqs = [
  {
    question: "¿Cómo recibo mis boletas?",
    answer:
      "Las boletas se entregan a través de la aplicación Quentro. Después de confirmar el pago, nuestro equipo transferirá las entradas al mismo correo electrónico con el que estás registrado en Quentro.",
  },
  {
    question: "¿Necesito tener Quentro?",
    answer:
      "Sí. Es obligatorio tener una cuenta registrada en la aplicación Quentro, ya que las boletas se entregan únicamente por ese medio.",
  },
  {
    question: "¿Cómo compro una boleta?",
    answer:
      "Selecciona el partido, elige la localidad, completa tus datos y envía tu solicitud por WhatsApp. Un asesor confirmará el pago y realizará la transferencia de las boletas a tu cuenta de Quentro.",
  },
  {
    question: "¿Cómo realizo el pago?",
    answer:
      "Después de enviar tu solicitud, uno de nuestros asesores te indicará los medios de pago disponibles. Una vez confirmado el pago, se realizará la transferencia de las boletas.",
  },
  {
    question: "¿Las boletas son originales?",
    answer:
      "Sí. Todas las boletas son oficiales y se transfieren mediante Quentro, la plataforma autorizada para la gestión de entradas.",
  },
  {
    question: "¿Qué pasa si una localidad aparece agotada?",
    answer:
      'Si una localidad aparece como "Agotado", significa que ya no hay disponibilidad para esa zona del estadio.',
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
