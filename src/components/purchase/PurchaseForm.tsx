const inputClasses =
  "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-navy-900/30 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-100";

const labelClasses = "text-sm font-medium text-navy-900/80";

export default function PurchaseForm() {
  return (
    <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
      <h3 className="font-display text-xl font-bold text-navy-950">
        Tus datos
      </h3>
      <p className="mt-1 text-sm text-navy-700/60">
        Usaremos esta información para confirmar tu compra y enviarte las
        boletas.
      </p>

      <form className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClasses}>Nombre completo</span>
          <input
            type="text"
            placeholder="Ej. Juan Pérez Gómez"
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Número de documento</span>
          <input
            type="text"
            placeholder="Ej. 1020304050"
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>WhatsApp</span>
          <input
            type="tel"
            placeholder="Ej. 300 123 4567"
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Correo electrónico</span>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Confirmar correo electrónico</span>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            className={inputClasses}
          />
        </label>

        <label className="flex items-start gap-3 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-navy-900/25 text-royal-500 focus:ring-royal-300"
          />
          <span className="text-sm text-navy-700/70">
            Acepto los{" "}
            <span className="font-semibold text-royal-500">
              términos y condiciones
            </span>{" "}
            y la política de tratamiento de datos de Orgullo Embajador.
          </span>
        </label>
      </form>
    </div>
  );
}
