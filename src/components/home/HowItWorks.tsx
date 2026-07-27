import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { CalendarIcon, TicketIcon, WhatsAppIcon, ArrowRightIcon } from "@/components/ui/Icons";

const steps = [
  {
    number: "01",
    icon: CalendarIcon,
    title: "Escoge el partido",
    description: "Explora el calendario y elige el partido al que quieres asistir.",
  },
  {
    number: "02",
    icon: TicketIcon,
    title: "Selecciona las boletas",
    description: "Elige la localidad, la cantidad y revisa el resumen de tu pedido.",
  },
  {
    number: "03",
    icon: WhatsAppIcon,
    title: "Continúa por WhatsApp",
    description: "Un asesor confirma tu compra y te guía hasta recibir tus boletas.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-comprar" className="bg-navy-950 py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Proceso simple</SectionEyebrow>
          <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Cómo funciona
          </h2>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex items-start gap-5">
              <div className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-4xl font-extrabold text-white/10">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/50">
                  {step.description}
                </p>
              </div>

              {i < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-gold-400">
                    <ArrowRightIcon className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
