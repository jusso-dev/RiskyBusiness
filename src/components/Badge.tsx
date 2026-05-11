import { Circle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type BadgeKind = "approve" | "manual_review" | "decline" | "draft" | "submitted" | "scored" | "good" | "warning" | "high_risk";

const styles: Record<BadgeKind, { label: string; color: string; icon: typeof Circle }> = {
  approve: { label: "Simulated Approve", color: "oklch(0.42 0.11 148)", icon: CheckCircle2 },
  manual_review: { label: "Simulated Manual Review", color: "oklch(0.55 0.13 76)", icon: AlertTriangle },
  decline: { label: "Simulated Decline", color: "oklch(0.52 0.16 28)", icon: XCircle },
  draft: { label: "Draft", color: "oklch(0.45 0.025 178)", icon: Circle },
  submitted: { label: "Submitted", color: "oklch(0.43 0.11 230)", icon: Circle },
  scored: { label: "Scored", color: "oklch(0.42 0.11 148)", icon: CheckCircle2 },
  good: { label: "Good", color: "oklch(0.42 0.11 148)", icon: CheckCircle2 },
  warning: { label: "Warning", color: "oklch(0.55 0.13 76)", icon: AlertTriangle },
  high_risk: { label: "High risk", color: "oklch(0.52 0.16 28)", icon: XCircle }
};

export function StatusBadge({ kind }: { kind: BadgeKind }) {
  const item = styles[kind];
  const Icon = item.icon;
  return (
    <span className="badge" style={{ color: item.color }}>
      <Icon size={13} aria-hidden />
      {item.label}
    </span>
  );
}
