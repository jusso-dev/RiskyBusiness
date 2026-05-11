import type { AiRiskNote, AuditLog, Borrower, LoanApplication, RiskPolicyProfile, RiskSignal, ScoreResult, SimulationRun } from "@/types/domain";

const now = "2026-05-11T10:00:00.000Z";
export const organisationId = "org-demo";

export const riskSignals: RiskSignal[] = [
  signal("credit_score", "Credit score", "Lower simulated credit score increases risk.", "credit_history", "lower_is_riskier", 300, 850, 45, 70, 11),
  signal("debt_to_income_ratio", "Debt to income", "Existing monthly debt payments divided by monthly income.", "affordability", "higher_is_riskier", 0, 0.8, 40, 65, 12),
  signal("income_stability", "Income stability", "Employment status and monthly income stability.", "stability", "lower_is_riskier", 0, 1, 35, 65, 7),
  signal("employment_length", "Employment length", "Shorter employment history increases simulated risk.", "stability", "lower_is_riskier", 0, 96, 35, 65, 7),
  signal("recent_defaults", "Recent defaults", "Recent defaults materially increase simulated credit history risk.", "credit_history", "higher_is_riskier", 0, 4, 35, 60, 12),
  signal("recent_hard_inquiries", "Hard inquiries", "Higher inquiry counts can indicate credit seeking pressure.", "behavioural", "higher_is_riskier", 0, 8, 35, 65, 5),
  signal("cash_buffer", "Cash buffer", "Savings balance divided by monthly expenses.", "affordability", "lower_is_riskier", 0, 12, 35, 65, 9),
  signal("address_stability", "Address stability", "Shorter time at address increases simulated stability risk.", "stability", "lower_is_riskier", 0, 84, 35, 65, 5),
  signal("loan_to_income_ratio", "Loan to income", "Requested amount divided by annual income.", "affordability", "higher_is_riskier", 0, 1.5, 40, 68, 9),
  signal("loan_to_value_ratio", "Loan to value", "Requested amount divided by collateral value when collateral exists.", "collateral", "higher_is_riskier", 0, 1.5, 45, 72, 6),
  signal("transaction_risk", "Transaction risk", "Simulated bank transaction risk level.", "behavioural", "higher_is_riskier", 0, 2, 35, 65, 6),
  signal("expense_ratio", "Expense ratio", "Monthly expenses divided by monthly income.", "affordability", "higher_is_riskier", 0, 1, 40, 68, 8),
  signal("industry_risk", "Industry risk", "Simulated sector volatility lookup.", "application", "higher_is_riskier", 0, 2, 35, 65, 4),
  signal("dependant_load", "Dependant load", "Dependants relative to income.", "affordability", "higher_is_riskier", 0, 5, 40, 70, 3),
  signal("requested_term_risk", "Requested term risk", "Longer requested terms increase uncertainty.", "application", "higher_is_riskier", 6, 120, 35, 65, 4)
];

export const borrowers: Borrower[] = [
  borrower("b1", "Ava", "Chen", 34, "employed", 88, 156000, 13000, 5200, 900, 812, 144, 0, 1, 72, 0, "Permanent resident", "Healthcare", 68000, "low", "Very strong profile with long history."),
  borrower("b2", "Noah", "Patel", 41, "employed", 64, 98000, 8167, 3900, 850, 704, 96, 0, 2, 48, 2, "Citizen", "Education", 24000, "low", "Stable income and moderate debt."),
  borrower("b3", "Mia", "Rodriguez", 38, "employed", 50, 210000, 17500, 9200, 5200, 681, 120, 0, 4, 30, 3, "Citizen", "Construction", 16000, "medium", "High income with high monthly commitments."),
  borrower("b4", "Ethan", "Nguyen", 29, "contract", 18, 64000, 5333, 2600, 300, 695, 60, 0, 1, 16, 0, "Temporary visa", "Hospitality", 9000, "medium", "Lower income but low existing debt."),
  borrower("b5", "Isla", "Walker", 45, "self_employed", 72, 122000, 10167, 6100, 2400, 588, 156, 2, 5, 60, 1, "Citizen", "Retail", 7000, "high", "Recent defaults drive review risk."),
  borrower("b6", "Leo", "Brown", 24, "employed", 7, 72000, 6000, 3200, 550, 668, 28, 0, 3, 8, 0, "Citizen", "Technology", 4200, "medium", "Short employment and credit history."),
  borrower("b7", "Grace", "Singh", 52, "employed", 132, 180000, 15000, 6400, 1300, 762, 220, 0, 0, 96, 2, "Permanent resident", "Logistics", 42000, "low", "Strong collateral profile."),
  borrower("b8", "Henry", "Taylor", 31, "employed", 28, 92000, 7667, 5800, 1400, 706, 80, 0, 2, 22, 1, "Citizen", "Professional services", 1200, "medium", "Weak cash buffer."),
  borrower("b9", "Sofia", "Martin", 47, "self_employed", 110, 240000, 20000, 11800, 4800, 735, 180, 0, 3, 84, 2, "Citizen", "Manufacturing", 36000, "medium", "Business borrower with variable expenses."),
  borrower("b10", "Jack", "O'Connor", 36, "employed", 34, 86000, 7167, 4200, 1600, 642, 72, 1, 3, 40, 2, "Citizen", "Transport", 6500, "medium", "Borderline manual review profile.")
];

export const loanApplications: LoanApplication[] = [
  app("a1", "b1", "car_loan", 42000, 48, "Hybrid vehicle", 7.8, "vehicle", 52000, "submitted"),
  app("a2", "b2", "personal_loan", 18000, 36, "Home improvements", 10.2, "none", 0, "submitted"),
  app("a3", "b3", "debt_consolidation", 68000, 60, "Consolidate unsecured debt", 12.5, "none", 0, "submitted"),
  app("a4", "b4", "personal_loan", 12000, 24, "Training course", 11.4, "none", 0, "draft"),
  app("a5", "b5", "business_loan", 75000, 72, "Retail fitout", 14.8, "inventory", 30000, "submitted"),
  app("a6", "b6", "car_loan", 28000, 60, "Used vehicle", 12.1, "vehicle", 26000, "submitted"),
  app("a7", "b7", "equipment_finance", 92000, 60, "Warehouse equipment", 9.4, "equipment", 145000, "submitted"),
  app("a8", "b8", "debt_consolidation", 35000, 48, "Credit card consolidation", 13.3, "none", 0, "submitted"),
  app("a9", "b9", "business_loan", 150000, 84, "New production line", 10.6, "equipment", 190000, "submitted"),
  app("a10", "b10", "personal_loan", 31000, 48, "Medical expenses", 13.8, "none", 0, "submitted"),
  app("a11", "b1", "personal_loan", 25000, 36, "Solar installation", 8.5, "none", 0, "submitted"),
  app("a12", "b2", "car_loan", 36000, 48, "Family vehicle", 9.9, "vehicle", 42000, "submitted"),
  app("a13", "b5", "debt_consolidation", 52000, 60, "Debt consolidation", 15.2, "none", 0, "submitted"),
  app("a14", "b7", "business_loan", 110000, 72, "Fleet expansion", 9.8, "vehicle", 160000, "submitted"),
  app("a15", "b8", "personal_loan", 22000, 36, "Relocation costs", 12.9, "none", 0, "submitted")
];

export const policyProfiles: RiskPolicyProfile[] = [
  policy("p1", "Conservative", "Lower tolerance for affordability and credit history risk.", 32, 62, 62, 1.2),
  policy("p2", "Balanced", "Default policy for demo scoring and policy comparison.", 40, 70, 70, 1),
  policy("p3", "Growth", "Higher risk appetite with softer review thresholds.", 48, 78, 78, 0.85),
  policy("p4", "Custom Sandbox", "Working profile for live signal tuning experiments.", 40, 70, 70, 1)
];

export const scoreResults: ScoreResult[] = [];
export const aiRiskNotes: AiRiskNote[] = [];
export const simulations: SimulationRun[] = [];
export const auditLogs: AuditLog[] = [
  auditEntry("borrower", "b1", "borrower_created", "Seed borrower Ava Chen created."),
  auditEntry("application", "a1", "application_submitted", "Seed application a1 submitted."),
  auditEntry("policy", "p2", "policy_profile_created", "Balanced risk policy profile created.")
];

function signal(key: string, name: string, description: string, category: RiskSignal["category"], direction: RiskSignal["direction"], minValue: number, maxValue: number, warningThreshold: number, highRiskThreshold: number, weight: number): RiskSignal {
  return {
    id: `s-${key}`,
    key,
    name,
    description,
    category,
    enabled: true,
    weight,
    direction,
    minValue,
    maxValue,
    warningThreshold,
    highRiskThreshold,
    explanationTemplate: `${name} produced a {score}/100 simulated risk contribution from raw value {raw}.`,
    createdAt: now,
    updatedAt: now
  };
}

function borrower(id: string, firstName: string, lastName: string, age: number, employmentStatus: Borrower["employmentStatus"], employmentLengthMonths: number, annualIncome: number, monthlyIncome: number, monthlyExpenses: number, existingDebtMonthlyPayments: number, creditScore: number, creditHistoryLengthMonths: number, recentDefaultsCount: number, recentHardInquiriesCount: number, addressStabilityMonths: number, dependants: number, residencyStatus: string, industry: string, savingsBalance: number, bankTransactionRiskLevel: Borrower["bankTransactionRiskLevel"], notes: string): Borrower {
  return {
    id,
    organisationId,
    firstName,
    lastName,
    age,
    employmentStatus,
    employmentLengthMonths,
    annualIncome,
    monthlyIncome,
    monthlyExpenses,
    existingDebtMonthlyPayments,
    creditScore,
    creditHistoryLengthMonths,
    recentDefaultsCount,
    recentHardInquiriesCount,
    addressStabilityMonths,
    dependants,
    residencyStatus,
    industry,
    savingsBalance,
    bankTransactionRiskLevel,
    notes,
    createdAt: now
  };
}

function app(id: string, borrowerId: string, loanType: LoanApplication["loanType"], requestedAmount: number, requestedTermMonths: number, declaredPurpose: string, interestRateEstimate: number, collateralType: string, collateralValue: number, status: LoanApplication["status"]): LoanApplication {
  return {
    id,
    organisationId,
    borrowerId,
    loanType,
    requestedAmount,
    requestedTermMonths,
    declaredPurpose,
    interestRateEstimate,
    collateralType,
    collateralValue,
    createdAt: now,
    status
  };
}

function policy(id: string, name: string, description: string, approveBelowScore: number, manualReviewBelowScore: number, factor: number): RiskPolicyProfile;
function policy(id: string, name: string, description: string, approveBelowScore: number, manualReviewBelowScore: number, declineAtOrAboveScore: number, factor: number): RiskPolicyProfile;
function policy(id: string, name: string, description: string, approveBelowScore: number, manualReviewBelowScore: number, declineAtOrAboveScore: number, factor = 1): RiskPolicyProfile {
  return {
    id,
    organisationId,
    name,
    description,
    approveBelowScore,
    manualReviewBelowScore,
    declineAtOrAboveScore,
    signalConfigs: riskSignals.map((s) => ({
      signalKey: s.key,
      enabled: s.enabled,
      weight: Math.round(s.weight * factor * 10) / 10,
      warningThreshold: s.warningThreshold,
      highRiskThreshold: s.highRiskThreshold
    })),
    createdAt: now,
    updatedAt: now
  };
}

export function audit(entityType: string, entityId: string, eventType: string, message: string): AuditLog {
  return auditEntry(entityType, entityId, eventType, message);
}

function auditEntry(entityType: string, entityId: string, eventType: string, message: string): AuditLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organisationId,
    entityType,
    entityId,
    eventType,
    message,
    createdAt: new Date().toISOString()
  };
}
