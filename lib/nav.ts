import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Settings,
  Target,
  Timer,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Single key that jumps here when focus is not in a field. */
  shortcut?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "1" },
  { href: "/tasks", label: "Tugas", icon: ListChecks, shortcut: "2" },
  { href: "/analytics", label: "Analitik", icon: BarChart3, shortcut: "3" },
  { href: "/goals", label: "Tujuan", icon: Target, shortcut: "4" },
  { href: "/focus", label: "Fokus", icon: Timer, shortcut: "F" },
  { href: "/intentions", label: "Niat Jika-Maka", icon: Waypoints },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

/** Five slots for the mobile bottom bar. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tugas", icon: ListChecks },
  { href: "/focus", label: "Fokus", icon: Timer },
  { href: "/goals", label: "Tujuan", icon: Target },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface ShortcutDoc {
  keys: string[];
  description: string;
}

/** Rendered by the `?` reference modal; kept beside the bindings themselves. */
export const SHORTCUT_DOCS: { group: string; items: ShortcutDoc[] }[] = [
  {
    group: "Umum",
    items: [
      { keys: ["Ctrl", "K"], description: "Buka command palette" },
      { keys: ["?"], description: "Tampilkan daftar pintasan ini" },
      { keys: ["Esc"], description: "Tutup dialog, panel, atau input" },
    ],
  },
  {
    group: "Aksi",
    items: [
      { keys: ["N"], description: "Tambah tugas baru" },
      { keys: ["F"], description: "Buka sesi fokus" },
      { keys: ["Ctrl", "Enter"], description: "Kirim form yang sedang terbuka" },
    ],
  },
  {
    group: "Navigasi",
    items: [
      { keys: ["1"], description: "Dashboard" },
      { keys: ["2"], description: "Tugas" },
      { keys: ["3"], description: "Analitik" },
      { keys: ["4"], description: "Tujuan" },
    ],
  },
];
