import { StatusBadge } from "./Badge";

export function ScoreGauge({ score, decision }: { score: number; decision: "approve" | "manual_review" | "decline" }) {
  const color = decision === "approve" ? "var(--green)" : decision === "manual_review" ? "var(--amber)" : "var(--red)";
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[color:var(--muted)]">Total risk score</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-5xl font-black" style={{ color }}>
              {Math.round(score)}
            </span>
            <span className="pb-2 text-sm font-bold text-[color:var(--muted)]">/ 100</span>
          </div>
        </div>
        <StatusBadge kind={decision} />
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[color:var(--panel-strong)]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: color }} />
      </div>
      <div className="mt-2 flex justify-between text-xs font-bold text-[color:var(--muted)]">
        <span>0 low</span>
        <span>40 review</span>
        <span>70 high</span>
      </div>
    </div>
  );
}
