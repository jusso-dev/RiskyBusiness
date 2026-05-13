import { currency } from "./utils";
import type { AiRiskNote, Borrower, LoanApplication, RiskPolicyProfile, ScoreResult } from "@/types/domain";

const TOP_DRIVERS = 5;

export function applicationMarkdownReport({
  borrower,
  application,
  policy,
  score,
  note
}: {
  borrower: Borrower;
  application: LoanApplication;
  policy: RiskPolicyProfile;
  score: ScoreResult;
  note?: AiRiskNote;
}) {
  const lines: string[] = [
    `# RiskyBusiness Simulated Application Report`,
    ``,
    `> RiskyBusiness is a simulation and portfolio project only. It does not provide financial advice, credit advice, lending decisions, or real-world loan approvals.`,
    ``,
    `## Borrower Summary`,
    ``,
    `- Simulated borrower: ${borrower.firstName} ${borrower.lastName}`,
    `- Industry: ${borrower.industry}`,
    `- Annual income: ${currency(borrower.annualIncome)}`,
    `- Credit score: ${borrower.creditScore}`,
    ``,
    `## Loan Request`,
    ``,
    `- Type: ${application.loanType.replaceAll("_", " ")}`,
    `- Amount: ${currency(application.requestedAmount)}`,
    `- Term: ${application.requestedTermMonths} months`,
    `- Purpose: ${application.declaredPurpose}`,
    ``,
    `## Policy and Simulated Decision`,
    ``,
    `- Policy profile: ${policy.name}`,
    `- Simulated decision: ${score.decision.replace("_", " ")}`,
    `- Total score: ${Math.round(score.totalRiskScore)}/100`,
    `- Affordability: ${Math.round(score.affordabilityScore)}`,
    `- Credit history: ${Math.round(score.creditHistoryScore)}`,
    `- Stability: ${Math.round(score.stabilityScore)}`,
    ``,
    `## Top Risk Drivers`,
    ``,
    ...[...score.signals]
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, TOP_DRIVERS)
      .map((signal) => `- ${escapeMarkdown(signal.name)}: ${Math.round(signal.normalizedScore)}/100, weight ${signal.weight}`),
    ``,
    `## Signal Breakdown`,
    ``,
    `| Signal | Raw value | Score | Weight | Status |`,
    `|---|---:|---:|---:|---|`,
    ...score.signals.map((signal) =>
      `| ${escapeMarkdown(signal.name)} | ${formatRaw(signal.rawValue)} | ${Math.round(signal.normalizedScore)} | ${signal.weight} | ${signal.thresholdStatus} |`
    )
  ];

  if (note) {
    lines.push(``, `## AI Narrative`, ``, note.summary, ``, note.plainEnglishExplanation, ``, `Counterfactual: ${note.counterfactual}`);
  }

  return lines.join("\n");
}

function formatRaw(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|");
}
