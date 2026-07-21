import Container from "@/components/ui/Container";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { BoltIcon, ChatIcon, ShieldCheckIcon } from "@/components/ui/Icons";

const benefits = [
  {
    icon: BoltIcon,
    title: "Compra rápida",
    description:
      "Selecciona tu localidad, define la cantidad de boletas y confirma en minutos, sin filas ni complicaciones.",
  },
  {
    icon: ChatIcon,
    title: "Atención por WhatsApp",
    description:
      "Un asesor te acompaña durante todo el proceso para resolver dudas y confirmar tu compra personalmente.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Boletas garantizadas",
    description:
      "Todas las boletas están respaldadas y verificadas, para que disfrutes del partido con total tranquilidad.",
  },
];

export default function Benefits() {
  return (
    <section className="bg-royal-50/60 py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Por qué elegirnos</SectionEyebrow>
          <h2 className="mt-5 font-display text-4xl font-bold text-navy-950 sm:text-5xl">
            Confianza en cada compra
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-3xl border border-navy-900/5 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-500 to-navy-900 text-white transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-navy-950">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-700/60">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
