import { borrowers, loanApplications, policyProfiles, riskSignals, scoreResults } from "./data";
import { balancedPolicy } from "./selectors";
import { scoreApplication } from "./scoring";
import type { Decision } from "@/types/domain";

const SCORE_BUCKETS = 10;
const SCORE_BUCKET_SIZE = 10;
const DECISIONS: Decision[] = ["approve", "manual_review", "decline"];

export function ensureScoredApplications() {
  if (scoreResults.length) return scoreResults;
  const policy = balancedPolicy();
  for (const application of loanApplications) {
    scoreResults.push(scoreApplication(application, policy));
  }
  return scoreResults;
}

export function dashboardOverview() {
  const scores = ensureScoredApplications();
  const totalScores = scores.length || 1;

  const averageRiskScore = scores.reduce((sum, score) => sum + score.totalRiskScore, 0) / totalScores;

  const counts = {
    approve: scores.filter((s) => s.decision === "approve").length,
    manual_review: scores.filter((s) => s.decision === "manual_review").length,
    decline: scores.filter((s) => s.decision === "decline").length
  };

  const byLoanType = loanApplications.reduce<Record<string, number>>((acc, application) => {
    acc[application.loanType] = (acc[application.loanType] ?? 0) + 1;
    return acc;
  }, {});

  const driverTotals = scores
    .flatMap((s) => s.signals)
    .reduce<Record<string, number>>((acc, signal) => {
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
      const total = policyScores.length || 1;
      return {
        policy: policy.name,
        approvalRate: policyScores.filter((s) => s.decision === "approve").length / total
      };
    }),
    signalCount: riskSignals.length
  };
}

export function analytics() {
  const scores = ensureScoredApplications();

  const distribution = Array.from({ length: SCORE_BUCKETS }, (_, index) => {
    const min = index * SCORE_BUCKET_SIZE;
    const max = min + SCORE_BUCKET_SIZE - 1;
    return {
      bucket: `${min}-${max}`,
      count: scores.filter((s) => s.totalRiskScore >= min && s.totalRiskScore <= max).length
    };
  });

  const byLoanTypeAggregate = loanApplications.reduce<Record<string, { total: number; count: number }>>((acc, application) => {
    const score = scores.find((s) => s.applicationId === application.id);
    const entry = acc[application.loanType] ?? { total: 0, count: 0 };
    entry.total += score?.totalRiskScore ?? 0;
    entry.count += 1;
    acc[application.loanType] = entry;
    return acc;
  }, {});

  const byLoanType = Object.entries(byLoanTypeAggregate).map(([loanType, item]) => ({
    loanType,
    averageScore: item.count > 0 ? item.total / item.count : 0
  }));

  const scatter = scores.map((score) => ({
    applicationId: score.applicationId,
    affordability: score.affordabilityScore,
    creditHistory: score.creditHistoryScore,
    total: score.totalRiskScore
  }));

  const trend = DECISIONS.map((decision) => ({
    decision,
    count: scores.filter((s) => s.decision === decision).length
  }));

  return { distribution, byLoanType, scatter, trend, overview: dashboardOverview() };
}
