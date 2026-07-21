import Link from "next/link";
import CrestBadge from "@/components/ui/CrestBadge";
import Button from "@/components/ui/Button";
import { CalendarIcon, MapPinIcon } from "@/components/ui/Icons";
import type { Match } from "@/data/matches";

export default function MatchCard({ match }: { match: Match }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-navy-900/5 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-navy-900 to-royal-600">
        <svg
          viewBox="0 0 400 140"
          className="absolute inset-0 h-full w-full opacity-70"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id={`mc-${match.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a56d6" />
              <stop offset="100%" stopColor="#0a0f24" />
            </linearGradient>
          </defs>
          <rect width="400" height="140" fill={`url(#mc-${match.id})`} />
          {Array.from({ length: 24 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 53) % 400}
              cy={30 + ((i * 29) % 90)}
              r={2}
              fill="#e0b84a"
              opacity={0.35}
            />
          ))}
        </svg>
        <span className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          {match.competition}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2.5">
            <CrestBadge initial={match.homeInitial} size="sm" />
            <CrestBadge initial={match.awayInitial} size="sm" />
          </div>
          <p className="font-display text-base font-bold text-navy-950">
            {match.home} <span className="text-navy-400">vs</span> {match.away}
          </p>
        </div>

        <div className="mt-4 space-y-2 text-sm text-navy-700/70">
          <p className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-royal-500" />
            {match.date} · {match.time}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-royal-500" />
            {match.stadium}, {match.city}
          </p>
        </div>

        <div className="mt-6">
          <Link href={`/comprar?match=${match.id}`} className="block">
            <Button variant="secondary" className="w-full">
              Comprar boletas
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
