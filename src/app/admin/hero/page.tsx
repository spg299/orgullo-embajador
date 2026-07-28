"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface MatchRow {
  id: string;
  rival: string;
  match_date: string;
  match_time: string;
  status: "available" | "upcoming" | "sold_out";
  show_in_hero: boolean;
}

export default function AdminHeroPage() {
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const loading = matches === null;

  async function fetchMatches(): Promise<MatchRow[]> {
    const { data, error } = await supabase
      .from("matches")
      .select("id, rival, match_date, match_time, status, show_in_hero")
      .order("sort_order");
    return error ? [] : ((data as MatchRow[]) ?? []);
  }

  useEffect(() => {
    fetchMatches().then(setMatches);
  }, []);

  async function toggle(match: MatchRow) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        match: { ...match, show_in_hero: !match.show_in_hero },
      }),
    });
    fetchMatches().then(setMatches);
  }

  const matchList = matches ?? [];
  const selectedCount = matchList.filter((m) => m.show_in_hero && m.status !== "sold_out").length;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">Hero</h1>
      <p className="mt-1 text-sm font-medium text-navy-700/60">
        Elige qué partidos aparecen en el carrusel del Hero. El sitio muestra hasta 3, en orden de
        fecha, excluyendo los agotados. Actualmente hay {selectedCount} partido(s) elegible(s).
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-card">
        {loading ? (
          <p className="p-6 text-sm font-medium text-navy-700/60">Cargando...</p>
        ) : (
          <ul className="divide-y divide-navy-900/5">
            {matchList.map((match) => (
              <li key={match.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold text-navy-950">Millonarios vs {match.rival}</p>
                  <p className="text-sm text-navy-700/60">
                    {match.match_date} · {match.match_time}
                    {match.status === "sold_out" && " · Agotado (no se muestra en el Hero)"}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={match.show_in_hero}
                    disabled={match.status === "sold_out"}
                    onChange={() => toggle(match)}
                    className="h-5 w-5 rounded border-navy-900/25 text-royal-500 disabled:opacity-30"
                  />
                  <span className="text-sm font-medium text-navy-800">Mostrar</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
