"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Route, Truck, BarChart3, Settings, Zap } from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  { href: "/",           label: "Dashboard",    icon: LayoutDashboard },
  { href: "/hubs",       label: "Hubs",         icon: MapPin },
  { href: "/routes",     label: "Routes",       icon: Route },
  { href: "/fleet",      label: "Fleet",        icon: Truck },
  { href: "/analytics",  label: "Analytics",    icon: BarChart3 },
  { href: "/optimizer",  label: "Optimizer",    icon: Zap },
  { href: "/settings",   label: "Settings",     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[var(--surface)] border-r flex flex-col shrink-0">
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--green)] flex items-center justify-center">
            <span className="text-xs font-bold text-black">BG</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">BiGeo</p>
            <p className="text-[10px] text-[var(--text-muted)]">Platform v2</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-[var(--green-dim)] text-[var(--green)] font-medium"
                : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t">
        <p className="text-[10px] text-[var(--text-muted)]">admin@bigeo.in</p>
      </div>
    </aside>
  );
}
