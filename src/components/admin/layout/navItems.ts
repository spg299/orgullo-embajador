import {
  DashboardIcon,
  ChartBarIcon,
  WalletIcon,
  CardIcon,
  TicketIcon,
  TagIcon,
  PhotoIcon,
  VideoIcon,
  StarIcon,
  UsersIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

export interface AdminNavChild {
  href: string;
  label: string;
}

export interface AdminNavItem {
  href: string;
  label: string;
  icon: typeof DashboardIcon;
  /** Optional one level of sub-items — Sidebar/MobileDrawer render this
   * item as a collapsible group instead of a direct link when present. */
  children?: AdminNavChild[];
}

export const navItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/finanzas", label: "Finanzas", icon: WalletIcon },
  { href: "/admin/ventas", label: "Ventas", icon: ChartBarIcon },
  { href: "/admin/wompi", label: "Wompi", icon: CardIcon },
  {
    href: "/admin/matches",
    label: "Partidos",
    icon: TicketIcon,
    children: [
      { href: "/admin/matches", label: "Partidos actuales" },
      { href: "/admin/matches/femeninos", label: "Partidos femeninos" },
    ],
  },
  {
    href: "/admin/precios",
    label: "Precios",
    icon: TagIcon,
    children: [
      { href: "/admin/precios", label: "Precios actuales" },
      { href: "/admin/precios/femeninos", label: "Precios femeninos" },
    ],
  },
  { href: "/admin/logos", label: "Logos", icon: PhotoIcon },
  { href: "/admin/hero", label: "Hero", icon: VideoIcon },
  { href: "/admin/testimonials", label: "Testimonios", icon: StarIcon },
  { href: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { href: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
];
