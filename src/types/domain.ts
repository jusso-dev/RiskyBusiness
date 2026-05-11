export type EmploymentStatus = "employed" | "self_employed" | "contract" | "unemployed" | "retired";
export type LoanType = "personal_loan" | "car_loan" | "business_loan" | "equipment_finance" | "debt_consolidation";
export type ApplicationStatus = "draft" | "submitted" | "scored" | "approved" | "declined" | "manual_review";
export type Decision = "approve" | "manual_review" | "decline";
export type RiskCategory = "affordability" | "credit_history" | "stability" | "behavioural" | "collateral" | "application";
export type Direction = "higher_is_riskier" | "lower_is_riskier" | "custom";
export type ThresholdStatus = "good" | "warning" | "high_risk";

export interface Borrower {
  id: string;
  organisationId: string;
  firstName: string;
  lastName: string;
  age: number;
  employmentStatus: EmploymentStatus;
  employmentLengthMonths: number;
  annualIncome: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebtMonthlyPayments: number;
  creditScore: number;
  creditHistoryLengthMonths: number;
  recentDefaultsCount: number;
  recentHardInquiriesCount: number;
  addressStabilityMonths: number;
  dependants: number;
  residencyStatus: string;
  industry: string;
  savingsBalance: number;
  bankTransactionRiskLevel: "low" | "medium" | "high";
  notes: string;
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  organisationId: string;
  borrowerId: string;
  loanType: LoanType;
  requestedAmount: number;
  requestedTermMonths: number;
  declaredPurpose: string;
  interestRateEstimate: number;
  collateralType: string;
  collateralValue: number;
  createdAt: string;
  status: ApplicationStatus;
}

export interface RiskSignal {
  id: string;
  key: string;
  name: string;
  description: string;
  category: RiskCategory;
  enabled: boolean;
  weight: number;
  direction: Direction;
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  highRiskThreshold: number;
  explanationTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskPolicySignalConfig {
  signalKey: string;
  enabled: boolean;
  weight: number;
  warningThreshold: number;
  highRiskThreshold: number;
}

export interface RiskPolicyProfile {
  id: string;
  organisationId: string;
  name: string;
  description: string;
  approveBelowScore: number;
  manualReviewBelowScore: number;
  declineAtOrAboveScore: number;
  signalConfigs: RiskPolicySignalConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface ScoreSignalResult {
  signalKey: string;
  name: string;
  category: RiskCategory;
  rawValue: number;
  normalizedScore: number;
  weightedScore: number;
  weight: number;
  thresholdStatus: ThresholdStatus;
  explanation: string;
}

export interface ScoreResult {
  id: string;
  applicationId: string;
  policyProfileId: string;
  totalRiskScore: number;
  decision: Decision;
  confidence: number;
  affordabilityScore: number;
  creditHistoryScore: number;
  stabilityScore: number;
  behaviouralScore: number;
  collateralScore: number;
  applicationScore: number;
  explanationSummary: string;
  modelVersion: string;
  createdAt: string;
  signals: ScoreSignalResult[];
}

export interface AiRiskNote {
  id: string;
  applicationId: string;
  scoreResultId: string;
  provider: string;
  summary: string;
  plainEnglishExplanation: string;
  reviewQuestions: string[];
  mitigationOptions: string[];
  counterfactual: string;
  promptMetadata: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organisationId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  message: string;
  createdAt: string;
}

export interface SimulationRun {
  id: string;
  organisationId: string;
  status: "queued" | "running" | "completed" | "failed";
  settings: {
    count: number;
    riskiness: "low" | "balanced" | "high";
    policyProfileIds: string[];
  };
  results: SimulationRunResult[];
  createdAt: string;
}

export interface SimulationRunResult {
  policyProfileId: string;
  approvalRate: number;
  manualReviewRate: number;
  declineRate: number;
  averageScore: number;
  topDrivers: string[];
}
