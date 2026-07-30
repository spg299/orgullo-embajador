"use client";

import { useState, type ReactNode } from "react";
import { PlusIcon } from "@/components/ui/Icons";

// A field that starts collapsed behind a plain-text trigger and expands
// in place — keeps optional fields (notes, observations) from padding out
// a form's primary flow when there's nothing in them yet.
export function CollapsibleField({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-royal-500 transition-colors hover:text-royal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/40"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }

  return <div className="flex flex-col gap-1.5">{children}</div>;
}
