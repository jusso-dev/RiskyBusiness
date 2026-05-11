import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ClipboardList, FileText, Gauge, Landmark, ScrollText, Settings, SlidersHorizontal, Users } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiskyBusiness",
  description: "Portfolio-grade loan risk simulation and explainable decisioning demo."
};

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/borrowers", label: "Borrowers", icon: Users },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/risk-policies", label: "Risk Policies", icon: SlidersHorizontal },
  { href: "/lab", label: "Signal Lab", icon: BarChart3 },
  { href: "/analytics", label: "Analytics", icon: Landmark },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell-grid">
          <aside className="sidebar">
            <Link href="/" className="mb-7 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-[oklch(0.86_0.08_178)] text-[color:var(--accent-strong)]">
                <FileText size={20} />
              </span>
              <span>
                <span className="block text-lg font-black">RiskyBusiness</span>
                <span className="block text-xs text-[oklch(0.77_0.02_170)]">AI loan risk simulator</span>
              </span>
            </Link>
            <nav className="grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold text-[oklch(0.90_0.012_170)] hover:bg-[oklch(0.30_0.04_178)]">
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 rounded-lg border border-[oklch(0.40_0.04_178)] p-3 text-xs leading-5 text-[oklch(0.80_0.018_170)]">
              Deterministic scores drive outcomes. AI notes are narrative summaries only and never override the simulated score.
            </div>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
