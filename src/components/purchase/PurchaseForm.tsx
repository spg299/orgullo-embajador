import type { ChangeEvent } from "react";
import type { BuyerFormErrors, BuyerFormValues } from "@/lib/purchaseFormValidation";

const baseInputClasses =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-navy-900/30 focus:outline-none focus:ring-2 transition-colors";

const validInputClasses = "border-navy-900/12 focus:border-royal-400 focus:ring-royal-100";
const invalidInputClasses = "border-rose-400 focus:border-rose-500 focus:ring-rose-100";

const labelClasses = "text-sm font-medium text-navy-900/80";
const errorClasses = "text-xs font-medium text-rose-500";

type Field = keyof BuyerFormValues;

export default function PurchaseForm({
  values,
  errors,
  touched,
  onChange,
  onBlur,
}: {
  values: BuyerFormValues;
  errors: BuyerFormErrors;
  touched: Partial<Record<Field, boolean>>;
  onChange: (field: Field, value: string | boolean) => void;
  onBlur: (field: Field) => void;
}) {
  function fieldError(field: Field) {
    return touched[field] ? errors[field] : undefined;
  }

  function inputClasses(field: Field) {
    return `${baseInputClasses} ${fieldError(field) ? invalidInputClasses : validInputClasses}`;
  }

  function handleText(field: Field) {
    return (e: ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value);
  }

  return (
    <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-card sm:p-8">
      <h3 className="font-display text-xl font-bold tracking-tight text-navy-950">
        Tus datos
      </h3>
      <p className="mt-1 text-sm font-medium text-navy-700/60">
        Usaremos esta información para confirmar tu compra y enviarte las
        boletas.
      </p>

      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClasses}>Nombre completo</span>
          <input
            type="text"
            placeholder="Ej. Juan Pérez Gómez"
            value={values.fullName}
            onChange={handleText("fullName")}
            onBlur={() => onBlur("fullName")}
            aria-invalid={Boolean(fieldError("fullName"))}
            className={inputClasses("fullName")}
          />
          {fieldError("fullName") && (
            <span className={errorClasses}>{fieldError("fullName")}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Número de documento</span>
          <input
            type="text"
            placeholder="Ej. 1020304050"
            value={values.documentNumber}
            onChange={handleText("documentNumber")}
            onBlur={() => onBlur("documentNumber")}
            aria-invalid={Boolean(fieldError("documentNumber"))}
            className={inputClasses("documentNumber")}
          />
          {fieldError("documentNumber") && (
            <span className={errorClasses}>{fieldError("documentNumber")}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>WhatsApp</span>
          <input
            type="tel"
            placeholder="Ej. 300 123 4567"
            value={values.whatsapp}
            onChange={handleText("whatsapp")}
            onBlur={() => onBlur("whatsapp")}
            aria-invalid={Boolean(fieldError("whatsapp"))}
            className={inputClasses("whatsapp")}
          />
          {fieldError("whatsapp") && (
            <span className={errorClasses}>{fieldError("whatsapp")}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Correo electrónico</span>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={values.email}
            onChange={handleText("email")}
            onBlur={() => onBlur("email")}
            aria-invalid={Boolean(fieldError("email"))}
            className={inputClasses("email")}
          />
          {fieldError("email") && <span className={errorClasses}>{fieldError("email")}</span>}
          <span className="mt-1 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-gold-600">
            <span aria-hidden="true">⚠️</span>
            Debe ser el mismo correo con el que estás registrado en la
            aplicación Quentro, ya que allí recibirás tus boletas. Este campo
            es obligatorio.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Confirmar correo electrónico</span>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={values.confirmEmail}
            onChange={handleText("confirmEmail")}
            onBlur={() => onBlur("confirmEmail")}
            aria-invalid={Boolean(fieldError("confirmEmail"))}
            className={inputClasses("confirmEmail")}
          />
          {fieldError("confirmEmail") && (
            <span className={errorClasses}>{fieldError("confirmEmail")}</span>
          )}
        </label>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={values.acceptedTerms}
              onChange={(e) => onChange("acceptedTerms", e.target.checked)}
              onBlur={() => onBlur("acceptedTerms")}
              aria-invalid={Boolean(fieldError("acceptedTerms"))}
              className="mt-1 h-4 w-4 shrink-0 rounded border-navy-900/25 text-royal-500 focus:ring-royal-300"
            />
            <span className="text-sm font-medium text-navy-700/70">
              Acepto los{" "}
              <span className="font-semibold text-royal-500">
                términos y condiciones
              </span>{" "}
              y la política de tratamiento de datos de Orgullo Embajador.
            </span>
          </label>
          {fieldError("acceptedTerms") && (
            <span className={errorClasses}>{fieldError("acceptedTerms")}</span>
          )}
        </div>
      </form>
    </div>
  );
}
