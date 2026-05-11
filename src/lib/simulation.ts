import { borrowers, loanApplications, policyProfiles, simulations } from "./data";
import { scoreApplication } from "./scoring";
import type { LoanApplication, SimulationRun } from "@/types/domain";

export function runSimulation(settings: SimulationRun["settings"]) {
  const generated = Array.from({ length: settings.count }, (_, index) => syntheticApplication(index, settings.riskiness));
  const results = settings.policyProfileIds.map((policyProfileId) => {
    const policy = policyProfiles.find((item) => item.id === policyProfileId) ?? policyProfiles[0];
    const scores = generated.map((application) => scoreApplication(application, policy));
    const driverCounts = scores.flatMap((score) => score.signals.slice().sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 1)).reduce<Record<string, number>>((acc, signal) => {
      acc[signal.name] = (acc[signal.name] ?? 0) + 1;
      return acc;
    }, {});
    return {
      policyProfileId,
      approvalRate: scores.filter((score) => score.decision === "approve").length / scores.length,
      manualReviewRate: scores.filter((score) => score.decision === "manual_review").length / scores.length,
      declineRate: scores.filter((score) => score.decision === "decline").length / scores.length,
      averageScore: scores.reduce((sum, score) => sum + score.totalRiskScore, 0) / scores.length,
      topDrivers: Object.entries(driverCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name)
    };
  });
  const run: SimulationRun = {
    id: `sim-${Date.now()}`,
    organisationId: "org-demo",
    status: "completed",
    settings,
    results,
    createdAt: new Date().toISOString()
  };
  simulations.unshift(run);
  return run;
}

function syntheticApplication(index: number, riskiness: "low" | "balanced" | "high"): LoanApplication {
  const borrower = borrowers[index % borrowers.length];
  const factor = riskiness === "low" ? 0.65 : riskiness === "high" ? 1.35 : 1;
  const base = loanApplications[index % loanApplications.length];
  return {
    ...base,
    id: `synthetic-${index}`,
    borrowerId: borrower.id,
    requestedAmount: Math.round(base.requestedAmount * factor),
    requestedTermMonths: Math.min(120, Math.round(base.requestedTermMonths * factor)),
    createdAt: new Date().toISOString()
  };
}
