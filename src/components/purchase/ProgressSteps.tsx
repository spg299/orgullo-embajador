import { CheckIcon } from "@/components/ui/Icons";

const steps = [
  { number: 1, label: "Selección del partido" },
  { number: 2, label: "Selección de boletas" },
  { number: 3, label: "Tus datos" },
  { number: 4, label: "Confirmación" },
];

export default function ProgressSteps({ current }: { current: number }) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, i) => {
        const state =
          step.number < current
            ? "done"
            : step.number === current
              ? "active"
              : "pending";

        return (
          <li key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                  state === "done"
                    ? "bg-royal-500 text-white"
                    : state === "active"
                      ? "bg-gold-500 text-navy-950"
                      : "bg-navy-900/8 text-navy-900/40"
                }`}
              >
                {state === "done" ? <CheckIcon className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  state === "pending" ? "text-navy-900/35" : "text-navy-900/80"
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`mx-2 mt-[-18px] h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mt-[-22px] ${
                  step.number < current ? "bg-royal-500" : "bg-navy-900/8"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
