import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/Icons";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="font-medium text-admin-text-muted transition-colors hover:text-admin-text"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-admin-text" : "font-medium text-admin-text-muted"}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRightIcon className="h-3.5 w-3.5 text-admin-text-muted/50" />}
          </span>
        );
      })}
    </nav>
  );
}
