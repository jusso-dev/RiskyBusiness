import { borrowers, loanApplications, policyProfiles, riskSignals, scoreResults } from "./data";
import { scoreApplication } from "./scoring";

export function ensureScoredApplications() {
  if (scoreResults.length) return scoreResults;
  const balanced = policyProfiles.find((p) => p.name === "Balanced") ?? policyProfiles[0];
  loanApplications.forEach((application) => {
    scoreResults.push(scoreApplication(application, balanced));
  });
  return scoreResults;
}

export function dashboardOverview() {
  const scores = ensureScoredApplications();
  const averageRiskScore = scores.reduce((sum, score) => sum + score.totalRiskScore, 0) / scores.length;
  const counts = {
    approve: scores.filter((s) => s.decision === "approve").length,
    manual_review: scores.filter((s) => s.decision === "manual_review").length,
    decline: scores.filter((s) => s.decision === "decline").length
  };
  const byLoanType = loanApplications.reduce<Record<string, number>>((acc, application) => {
    acc[application.loanType] = (acc[application.loanType] ?? 0) + 1;
    return acc;
  }, {});
  const driverTotals = scores.flatMap((s) => s.signals).reduce<Record<string, number>>((acc, signal) => {
    acc[signal.name] = (acc[signal.name] ?? 0) + signal.weightedScore;
    return acc;
  }, {});
  const highestRiskSignals = Object.entries(driverTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  return {
    totalApplications: loanApplications.length,
    totalBorrowers: borrowers.length,
    averageRiskScore,
    counts,
    byLoanType,
    recentScoredApplications: scores.slice(-7).reverse(),
    highestRiskSignals,
    approvalRateByPolicy: policyProfiles.map((policy) => {
      const policyScores = loanApplications.map((app) => scoreApplication(app, policy));
      return {
        policy: policy.name,
        approvalRate: policyScores.filter((s) => s.decision === "approve").length / policyScores.length
      };
    }),
    signalCount: riskSignals.length
  };
}

export function analytics() {
  const scores = ensureScoredApplications();
  const distribution = Array.from({ length: 10 }, (_, index) => {
    const min = index * 10;
    const max = min + 9;
    return {
      bucket: `${min}-${max}`,
      count: scores.filter((s) => s.totalRiskScore >= min && s.totalRiskScore <= max).length
    };
  });
  const byLoanType = Object.entries(
    loanApplications.reduce<Record<string, { total: number; count: number }>>((acc, application) => {
      const score = scores.find((s) => s.applicationId === application.id);
      const item = acc[application.loanType] ?? { total: 0, count: 0 };
      item.total += score?.totalRiskScore ?? 0;
      item.count += 1;
      acc[application.loanType] = item;
      return acc;
    }, {})
  ).map(([loanType, item]) => ({ loanType, averageScore: item.total / item.count }));
  const scatter = scores.map((score) => ({
    applicationId: score.applicationId,
    affordability: score.affordabilityScore,
    creditHistory: score.creditHistoryScore,
    total: score.totalRiskScore
  }));
  const trend = ["approve", "manual_review", "decline"].map((decision) => ({
    decision,
    count: scores.filter((s) => s.decision === decision).length
  }));
  return { distribution, byLoanType, scatter, trend, overview: dashboardOverview() };
}
