import { borrowers, riskSignals } from "./data";
import type { Borrower, Decision, LoanApplication, RiskCategory, RiskPolicyProfile, ScoreResult, ScoreSignalResult, ThresholdStatus } from "@/types/domain";

export const modelVersion = "riskybusiness-rules-v1";

const categoryKeys: RiskCategory[] = ["affordability", "credit_history", "stability", "behavioural", "collateral", "application"];

export function debtToIncome(borrower: Borrower) {
  return safeRatio(borrower.existingDebtMonthlyPayments, borrower.monthlyIncome);
}

export function loanToIncome(application: LoanApplication, borrower: Borrower) {
  return safeRatio(application.requestedAmount, borrower.annualIncome);
}

export function cashBufferMonths(borrower: Borrower) {
  return safeRatio(borrower.savingsBalance, borrower.monthlyExpenses);
}

export function normalizeCreditScore(score: number) {
  return clamp(((850 - score) / 550) * 100);
}

export function decide(score: number, policy: RiskPolicyProfile): Decision {
  if (score < policy.approveBelowScore) return "approve";
  if (score < policy.declineAtOrAboveScore && score < policy.manualReviewBelowScore) return "manual_review";
  if (score < policy.declineAtOrAboveScore) return "manual_review";
  return "decline";
}

export function scoreApplication(application: LoanApplication, policy: RiskPolicyProfile, borrowerOverride?: Partial<Borrower>, applicationOverride?: Partial<LoanApplication>): ScoreResult {
  const baseBorrower = borrowers.find((b) => b.id === application.borrowerId);
  if (!baseBorrower) throw new Error(`Borrower ${application.borrowerId} not found`);

  const borrower = { ...baseBorrower, ...borrowerOverride };
  const loan = { ...application, ...applicationOverride };
  const signalResults = policy.signalConfigs
    .filter((config) => config.enabled)
    .map((config) => {
      const signal = riskSignals.find((s) => s.key === config.signalKey);
      if (!signal) return null;
      const rawValue = calculateRaw(signal.key, borrower, loan);
      const normalizedScore = normalizeSignal(signal.key, rawValue);
      const weightedScore = normalizedScore * config.weight;
      const thresholdStatus = threshold(normalizedScore, config.warningThreshold, config.highRiskThreshold);
      return {
        signalKey: signal.key,
        name: signal.name,
        category: signal.category,
        rawValue,
        normalizedScore,
        weightedScore,
        weight: config.weight,
        thresholdStatus,
        explanation: signal.explanationTemplate.replace("{score}", Math.round(normalizedScore).toString()).replace("{raw}", formatRaw(rawValue))
      } satisfies ScoreSignalResult;
    })
    .filter(Boolean) as ScoreSignalResult[];

  const totalWeight = signalResults.reduce((sum, item) => sum + item.weight, 0) || 1;
  const totalRiskScore = clamp(signalResults.reduce((sum, item) => sum + item.weightedScore, 0) / totalWeight);
  const decision = decide(totalRiskScore, policy);
  const categoryScores = Object.fromEntries(
    categoryKeys.map((category) => {
      const signals = signalResults.filter((s) => s.category === category);
      const weight = signals.reduce((sum, item) => sum + item.weight, 0);
      return [category, weight ? clamp(signals.reduce((sum, item) => sum + item.weightedScore, 0) / weight) : 0];
    })
  ) as Record<RiskCategory, number>;

  const topDrivers = [...signalResults].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);

  return {
    id: `score-${application.id}-${policy.id}-${Date.now()}`,
    applicationId: application.id,
    policyProfileId: policy.id,
    totalRiskScore,
    decision,
    confidence: confidenceFromSpread(signalResults),
    affordabilityScore: categoryScores.affordability,
    creditHistoryScore: categoryScores.credit_history,
    stabilityScore: categoryScores.stability,
    behaviouralScore: categoryScores.behavioural,
    collateralScore: categoryScores.collateral,
    applicationScore: categoryScores.application,
    explanationSummary: `Simulated ${decisionLabel(decision)} with ${Math.round(totalRiskScore)}/100 risk. Main drivers: ${topDrivers.map((d) => d.name).join(", ")}.`,
    modelVersion,
    createdAt: new Date().toISOString(),
    signals: signalResults
  };
}

export function comparePolicies(application: LoanApplication, policies: RiskPolicyProfile[]) {
  return policies.map((policy) => ({
    policy,
    score: scoreApplication(application, policy)
  }));
}

export function calculateRaw(key: string, borrower: Borrower, application: LoanApplication) {
  const transactionMap = { low: 0, medium: 1, high: 2 };
  const industryMap: Record<string, number> = {
    Healthcare: 0,
    Education: 0,
    Technology: 0.5,
    "Professional services": 0.5,
    Logistics: 0.75,
    Manufacturing: 1,
    Construction: 1.25,
    Transport: 1.2,
    Retail: 1.4,
    Hospitality: 1.5
  };

  switch (key) {
    case "credit_score":
      return borrower.creditScore;
    case "debt_to_income_ratio":
      return debtToIncome(borrower);
    case "income_stability":
      return borrower.employmentStatus === "employed" ? 1 : borrower.employmentStatus === "self_employed" ? 0.7 : borrower.employmentStatus === "contract" ? 0.55 : 0.2;
    case "employment_length":
      return borrower.employmentLengthMonths;
    case "recent_defaults":
      return borrower.recentDefaultsCount;
    case "recent_hard_inquiries":
      return borrower.recentHardInquiriesCount;
    case "cash_buffer":
      return cashBufferMonths(borrower);
    case "address_stability":
      return borrower.addressStabilityMonths;
    case "loan_to_income_ratio":
      return loanToIncome(application, borrower);
    case "loan_to_value_ratio":
      return application.collateralValue > 0 ? safeRatio(application.requestedAmount, application.collateralValue) : 1.2;
    case "transaction_risk":
      return transactionMap[borrower.bankTransactionRiskLevel];
    case "expense_ratio":
      return safeRatio(borrower.monthlyExpenses, borrower.monthlyIncome);
    case "industry_risk":
      return industryMap[borrower.industry] ?? 0.8;
    case "dependant_load":
      return borrower.dependants;
    case "requested_term_risk":
      return application.requestedTermMonths;
    default:
      return 0;
  }
}

export function normalizeSignal(key: string, raw: number) {
  switch (key) {
    case "credit_score":
      return normalizeCreditScore(raw);
    case "debt_to_income_ratio":
      return piecewise(raw, [
        [0.2, 18],
        [0.35, 42],
        [0.5, 72],
        [0.8, 100]
      ]);
    case "income_stability":
      return clamp((1 - raw) * 100);
    case "employment_length":
      return inverse(raw, 0, 72);
    case "recent_defaults":
      return clamp(raw * 38);
    case "recent_hard_inquiries":
      return clamp(raw * 14);
    case "cash_buffer":
      return inverse(raw, 0, 8);
    case "address_stability":
      return inverse(raw, 0, 60);
    case "loan_to_income_ratio":
      return piecewise(raw, [
        [0.25, 15],
        [0.5, 42],
        [0.8, 72],
        [1.5, 100]
      ]);
    case "loan_to_value_ratio":
      return piecewise(raw, [
        [0.5, 18],
        [0.8, 42],
        [1, 68],
        [1.5, 100]
      ]);
    case "transaction_risk":
      return raw * 50;
    case "expense_ratio":
      return piecewise(raw, [
        [0.35, 18],
        [0.55, 45],
        [0.75, 76],
        [1, 100]
      ]);
    case "industry_risk":
      return raw * 50;
    case "dependant_load":
      return clamp(raw * 16);
    case "requested_term_risk":
      return piecewise(raw, [
        [24, 12],
        [48, 36],
        [72, 68],
        [120, 100]
      ]);
    default:
      return 0;
  }
}

export function threshold(score: number, warning: number, high: number): ThresholdStatus {
  if (score >= high) return "high_risk";
  if (score >= warning) return "warning";
  return "good";
}

function piecewise(value: number, points: Array<[number, number]>) {
  if (value <= points[0][0]) return clamp((value / points[0][0]) * points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    if (value <= x2) {
      const ratio = (value - x1) / (x2 - x1);
      return clamp(y1 + ratio * (y2 - y1));
    }
  }
  return 100;
}

function inverse(value: number, min: number, max: number) {
  return clamp(100 - ((value - min) / (max - min)) * 100);
}

function safeRatio(numerator: number, denominator: number) {
  if (!denominator) return 1;
  return numerator / denominator;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function confidenceFromSpread(signals: ScoreSignalResult[]) {
  const highRiskCount = signals.filter((s) => s.thresholdStatus === "high_risk").length;
  const warningCount = signals.filter((s) => s.thresholdStatus === "warning").length;
  return clamp(92 - warningCount * 2 - highRiskCount * 3);
}

function decisionLabel(decision: Decision) {
  return decision === "approve" ? "approve" : decision === "manual_review" ? "manual review" : "decline";
}

function formatRaw(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
