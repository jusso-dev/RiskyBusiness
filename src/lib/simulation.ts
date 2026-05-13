import { borrowers, loanApplications, organisationId, policyProfiles, simulations } from "./data";
import { id } from "./ids";
import { scoreApplication } from "./scoring";
import type { Decision, LoanApplication, ScoreResult, SimulationRun, SimulationRunResult } from "@/types/domain";

const RISKINESS_FACTOR: Record<SimulationRun["settings"]["riskiness"], number> = {
  low: 0.65,
  balanced: 1,
  high: 1.35
};
const MAX_TERM_MONTHS = 120;
const TOP_DRIVERS_LIMIT = 5;

export function runSimulation(settings: SimulationRun["settings"]): SimulationRun {
  if (borrowers.length === 0 || loanApplications.length === 0 || policyProfiles.length === 0) {
    throw new Error("Cannot run simulation without seed borrowers, applications, and policies");
  }

  const generated = Array.from({ length: settings.count }, (_, index) => syntheticApplication(index, settings.riskiness));

  const results: SimulationRunResult[] = settings.policyProfileIds.map((policyProfileId) => {
    const policy = policyProfiles.find((item) => item.id === policyProfileId) ?? policyProfiles[0];
    const scores = generated.map((application) => scoreApplication(application, policy));
    return summariseScores(policyProfileId, scores);
  });

  const run: SimulationRun = {
    id: id("sim"),
    organisationId,
    status: "completed",
    settings,
    results,
    createdAt: new Date().toISOString()
  };
  simulations.unshift(run);
  return run;
}

function summariseScores(policyProfileId: string, scores: ScoreResult[]): SimulationRunResult {
  const total = scores.length || 1;
  const decisionCounts: Record<Decision, number> = {
    approve: scores.filter((s) => s.decision === "approve").length,
    manual_review: scores.filter((s) => s.decision === "manual_review").length,
    decline: scores.filter((s) => s.decision === "decline").length
  };

  const driverCounts = scores.reduce<Record<string, number>>((acc, score) => {
    const topSignal = [...score.signals].sort((a, b) => b.weightedScore - a.weightedScore)[0];
    if (topSignal) acc[topSignal.name] = (acc[topSignal.name] ?? 0) + 1;
    return acc;
  }, {});

  return {
    policyProfileId,
    approvalRate: decisionCounts.approve / total,
    manualReviewRate: decisionCounts.manual_review / total,
    declineRate: decisionCounts.decline / total,
    averageScore: scores.reduce((sum, score) => sum + score.totalRiskScore, 0) / total,
    topDrivers: Object.entries(driverCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_DRIVERS_LIMIT)
      .map(([name]) => name)
  };
}

function syntheticApplication(index: number, riskiness: SimulationRun["settings"]["riskiness"]): LoanApplication {
  const borrower = borrowers[index % borrowers.length];
  const base = loanApplications[index % loanApplications.length];
  const factor = RISKINESS_FACTOR[riskiness];
  return {
    ...base,
    id: `synthetic-${index}`,
    borrowerId: borrower.id,
    requestedAmount: Math.max(1000, Math.round(base.requestedAmount * factor)),
    requestedTermMonths: Math.min(MAX_TERM_MONTHS, Math.max(6, Math.round(base.requestedTermMonths * factor))),
    createdAt: new Date().toISOString()
  };
}
