import {
  DashboardIcon,
  ChartBarIcon,
  WalletIcon,
  TicketIcon,
  TagIcon,
  PhotoIcon,
  VideoIcon,
  StarIcon,
  UsersIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: typeof DashboardIcon;
}

export const navItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/finanzas", label: "Finanzas", icon: WalletIcon },
  { href: "/admin/ventas", label: "Ventas", icon: ChartBarIcon },
  { href: "/admin/matches", label: "Partidos", icon: TicketIcon },
  { href: "/admin/precios", label: "Precios", icon: TagIcon },
  { href: "/admin/logos", label: "Logos", icon: PhotoIcon },
  { href: "/admin/hero", label: "Hero", icon: VideoIcon },
  { href: "/admin/testimonials", label: "Testimonios", icon: StarIcon },
  { href: "/admin/users", label: "Usuarios", icon: UsersIcon },
  { href: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
];
