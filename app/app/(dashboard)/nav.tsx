"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CarFront,
  ClipboardList,
  Map,
  Settings,
} from "lucide-react";

const navigation = [
  { href: "/vehicles", label: "Vehicles", icon: CarFront },
  { href: "/map", label: "Map", icon: Map },
  { href: "/trips", label: "Trips", icon: ClipboardList },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-md border border-[var(--border)] bg-[rgba(9,13,18,0.72)] p-1">
      {navigation.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            className={`inline-flex min-h-10 items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[var(--accent-blue)] text-slate-950"
                : "text-[var(--text-soft)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
            }`}
            href={item.href}
            key={item.href}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
