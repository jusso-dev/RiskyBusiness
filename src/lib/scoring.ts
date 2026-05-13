import { borrowers, riskSignals } from "./data";
import { NotFoundError } from "./errors";
import { id } from "./ids";
import { CREDIT_SCORE_MAX, CREDIT_SCORE_MIN } from "./validation";
import type { Borrower, Decision, LoanApplication, RiskCategory, RiskPolicyProfile, ScoreResult, ScoreSignalResult, ThresholdStatus } from "@/types/domain";

export const modelVersion = "riskybusiness-rules-v1";

const CATEGORY_KEYS: readonly RiskCategory[] = ["affordability", "credit_history", "stability", "behavioural", "collateral", "application"];

const TRANSACTION_RISK_MAP: Record<Borrower["bankTransactionRiskLevel"], number> = { low: 0, medium: 1, high: 2 };

const INDUSTRY_RISK_MAP: Record<string, number> = {
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
const INDUSTRY_RISK_DEFAULT = 0.8;

const EMPLOYMENT_STABILITY: Record<Borrower["employmentStatus"], number> = {
  employed: 1,
  self_employed: 0.7,
  contract: 0.55,
  retired: 0.4,
  unemployed: 0.2
};

const NO_COLLATERAL_LTV = 1.2;

export function debtToIncome(borrower: Borrower): number {
  return safeRatio(borrower.existingDebtMonthlyPayments, borrower.monthlyIncome);
}

export function loanToIncome(application: LoanApplication, borrower: Borrower): number {
  return safeRatio(application.requestedAmount, borrower.annualIncome);
}

export function cashBufferMonths(borrower: Borrower): number {
  return safeRatio(borrower.savingsBalance, borrower.monthlyExpenses);
}

export function normalizeCreditScore(score: number): number {
  const range = CREDIT_SCORE_MAX - CREDIT_SCORE_MIN;
  return clamp(((CREDIT_SCORE_MAX - score) / range) * 100);
}

export function decide(score: number, policy: RiskPolicyProfile): Decision {
  if (score >= policy.declineAtOrAboveScore) return "decline";
  if (score >= policy.approveBelowScore) return "manual_review";
  return "approve";
}

export function scoreApplication(
  application: LoanApplication,
  policy: RiskPolicyProfile,
  borrowerOverride?: Partial<Borrower>,
  applicationOverride?: Partial<LoanApplication>
): ScoreResult {
  const baseBorrower = borrowers.find((b) => b.id === application.borrowerId);
  if (!baseBorrower) throw new NotFoundError("Borrower", application.borrowerId);

  const borrower: Borrower = { ...baseBorrower, ...borrowerOverride };
  const loan: LoanApplication = { ...application, ...applicationOverride };

  const signalResults: ScoreSignalResult[] = [];
  for (const config of policy.signalConfigs) {
    if (!config.enabled) continue;
    const signal = riskSignals.find((s) => s.key === config.signalKey);
    if (!signal) continue;
    const rawValue = calculateRaw(signal.key, borrower, loan);
    const normalizedScore = normalizeSignal(signal.key, rawValue);
    const weightedScore = normalizedScore * config.weight;
    signalResults.push({
      signalKey: signal.key,
      name: signal.name,
      category: signal.category,
      rawValue,
      normalizedScore,
      weightedScore,
      weight: config.weight,
      thresholdStatus: threshold(normalizedScore, config.warningThreshold, config.highRiskThreshold),
      explanation: signal.explanationTemplate
        .replace("{score}", Math.round(normalizedScore).toString())
        .replace("{raw}", formatRaw(rawValue))
    });
  }

  const totalWeight = signalResults.reduce((sum, item) => sum + item.weight, 0);
  const totalRiskScore = totalWeight > 0 ? clamp(signalResults.reduce((sum, item) => sum + item.weightedScore, 0) / totalWeight) : 0;

  const categoryScores = Object.fromEntries(
    CATEGORY_KEYS.map((category) => {
      const signals = signalResults.filter((s) => s.category === category);
      const weight = signals.reduce((sum, item) => sum + item.weight, 0);
      const value = weight > 0 ? clamp(signals.reduce((sum, item) => sum + item.weightedScore, 0) / weight) : 0;
      return [category, value];
    })
  ) as Record<RiskCategory, number>;

  const decision = decide(totalRiskScore, policy);
  const topDrivers = [...signalResults].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);
  const driversLabel = topDrivers.length ? topDrivers.map((d) => d.name).join(", ") : "no enabled signals";

  return {
    id: id("score"),
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
    explanationSummary: `Simulated ${decisionLabel(decision)} with ${Math.round(totalRiskScore)}/100 risk. Main drivers: ${driversLabel}.`,
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

export function calculateRaw(key: string, borrower: Borrower, application: LoanApplication): number {
  switch (key) {
    case "credit_score":
      return borrower.creditScore;
    case "debt_to_income_ratio":
      return debtToIncome(borrower);
    case "income_stability":
      return EMPLOYMENT_STABILITY[borrower.employmentStatus] ?? 0.2;
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
      return application.collateralValue > 0 ? safeRatio(application.requestedAmount, application.collateralValue) : NO_COLLATERAL_LTV;
    case "transaction_risk":
      return TRANSACTION_RISK_MAP[borrower.bankTransactionRiskLevel];
    case "expense_ratio":
      return safeRatio(borrower.monthlyExpenses, borrower.monthlyIncome);
    case "industry_risk":
      return INDUSTRY_RISK_MAP[borrower.industry] ?? INDUSTRY_RISK_DEFAULT;
    case "dependant_load":
      return borrower.dependants;
    case "requested_term_risk":
      return application.requestedTermMonths;
    default:
      return 0;
  }
}

export function normalizeSignal(key: string, raw: number): number {
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
      return clamp(raw * 50);
    case "expense_ratio":
      return piecewise(raw, [
        [0.35, 18],
        [0.55, 45],
        [0.75, 76],
        [1, 100]
      ]);
    case "industry_risk":
      return clamp(raw * 50);
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

function piecewise(value: number, points: Array<[number, number]>): number {
  if (points.length === 0) return 0;
  const [firstX, firstY] = points[0];
  if (value <= firstX) {
    return firstX === 0 ? clamp(firstY) : clamp((value / firstX) * firstY);
  }
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    if (value <= x2) {
      const span = x2 - x1;
      const ratio = span === 0 ? 0 : (value - x1) / span;
      return clamp(y1 + ratio * (y2 - y1));
    }
  }
  return 100;
}

function inverse(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 0;
  return clamp(100 - ((value - min) / span) * 100);
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return numerator > 0 ? 1 : 0;
  return numerator / denominator;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function confidenceFromSpread(signals: ScoreSignalResult[]): number {
  if (signals.length === 0) return 0;
  const highRiskCount = signals.filter((s) => s.thresholdStatus === "high_risk").length;
  const warningCount = signals.filter((s) => s.thresholdStatus === "warning").length;
  return clamp(92 - warningCount * 2 - highRiskCount * 3);
}

function decisionLabel(decision: Decision): string {
  switch (decision) {
    case "approve":
      return "approve";
    case "manual_review":
      return "manual review";
    case "decline":
      return "decline";
  }
}

function formatRaw(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
