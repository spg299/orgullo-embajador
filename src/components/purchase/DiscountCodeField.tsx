"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function DiscountCodeField() {
  const [code, setCode] = useState("");

  return (
    <div className="rounded-2xl border border-dashed border-navy-900/15 bg-royal-50/50 p-5">
      <label
        htmlFor="discount-code"
        className="text-sm font-semibold text-navy-950"
      >
        ¿Tienes un código de descuento?
      </label>
      <div className="mt-3 flex gap-2">
        <input
          id="discount-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej. AZULCOL2026"
          className="w-full rounded-full border border-navy-900/12 bg-white px-5 py-2.5 text-sm text-navy-950 placeholder:text-navy-900/30 focus:border-royal-400 focus:outline-none focus:ring-2 focus:ring-royal-100"
        />
        <Button type="button" variant="secondary" size="sm" className="shrink-0">
          Aplicar
        </Button>
      </div>
    </div>
  );
}
