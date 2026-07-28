import CrestBadge from "@/components/ui/CrestBadge";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/components/ui/Icons";
import { formatCOP } from "@/lib/format";
import type { Match } from "@/data/matches";
import type { Tier } from "@/data/tiers";

interface Selection {
  tier: Tier;
  quantity: number;
}

export default function OrderSummary({
  match,
  selections,
  subtotal,
  serviceFee,
  total,
}: {
  match: Match;
  selections: Selection[];
  subtotal: number;
  serviceFee: number;
  total: number;
}) {
  return (
    <div className="rounded-3xl border border-navy-900/8 bg-white shadow-card">
      <div className="border-b border-navy-900/8 p-6">
        <h3 className="font-display text-lg font-bold tracking-tight text-navy-950">
          Resumen del pedido
        </h3>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center -space-x-2.5">
            <CrestBadge
              initial={match.homeInitial}
              size="sm"
              crestSrc={match.homeCrest}
              alt={`Escudo de ${match.home}`}
            />
            <CrestBadge
              initial={match.awayInitial}
              size="sm"
              crestSrc={match.awayCrest}
              alt={`Escudo de ${match.away}`}
            />
          </div>
          <p className="font-display text-sm font-bold tracking-tight text-navy-950">
            {match.home} <span className="text-navy-400">vs</span> {match.away}
          </p>
        </div>

        <div className="mt-4 space-y-1.5 text-xs font-medium text-navy-700/60">
          <p className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-royal-500" />
            {match.date}
          </p>
          <p className="flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5 text-royal-500" />
            {match.time}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPinIcon className="h-3.5 w-3.5 text-royal-500" />
            {match.stadium}, {match.city}
          </p>
        </div>
      </div>

      <div className="p-6">
        {selections.length === 0 ? (
          <p className="rounded-xl bg-royal-50/60 px-4 py-6 text-center text-sm font-medium text-navy-700/50">
            Aún no has seleccionado boletas.
          </p>
        ) : (
          <ul className="space-y-3">
            {selections.map(({ tier, quantity }) => (
              <li
                key={tier.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="font-medium text-navy-800">
                    {tier.name}{" "}
                    <span className="text-navy-900/40">× {quantity}</span>
                  </span>
                </div>
                <span className="font-semibold text-navy-950">
                  {formatCOP(tier.price * quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-2.5 border-t border-navy-900/8 pt-5 text-sm font-medium">
          <div className="flex items-center justify-between text-navy-700/70">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-navy-700/70">
            <span>Costo de servicio</span>
            <span>{formatCOP(serviceFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-navy-900/10 pt-3 text-base font-bold tracking-tight text-navy-950">
            <span>Total</span>
            <span className="font-display text-royal-500">
              {formatCOP(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
