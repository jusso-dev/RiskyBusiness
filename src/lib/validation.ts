import { z } from "zod";

export const borrowerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.coerce.number().int().min(18).max(100),
  employmentStatus: z.enum(["employed", "self_employed", "contract", "unemployed", "retired"]),
  employmentLengthMonths: z.coerce.number().int().min(0),
  annualIncome: z.coerce.number().min(0),
  monthlyIncome: z.coerce.number().min(0),
  monthlyExpenses: z.coerce.number().min(0),
  existingDebtMonthlyPayments: z.coerce.number().min(0),
  creditScore: z.coerce.number().min(300).max(850),
  creditHistoryLengthMonths: z.coerce.number().int().min(0),
  recentDefaultsCount: z.coerce.number().int().min(0),
  recentHardInquiriesCount: z.coerce.number().int().min(0),
  addressStabilityMonths: z.coerce.number().int().min(0),
  dependants: z.coerce.number().int().min(0),
  residencyStatus: z.string().min(1),
  industry: z.string().min(1),
  savingsBalance: z.coerce.number().min(0),
  bankTransactionRiskLevel: z.enum(["low", "medium", "high"]),
  notes: z.string().optional().default("")
});

export const applicationSchema = z.object({
  borrowerId: z.string().min(1),
  loanType: z.enum(["personal_loan", "car_loan", "business_loan", "equipment_finance", "debt_consolidation"]),
  requestedAmount: z.coerce.number().min(1000),
  requestedTermMonths: z.coerce.number().int().min(6).max(120),
  declaredPurpose: z.string().min(1),
  interestRateEstimate: z.coerce.number().min(0).max(60),
  collateralType: z.string().optional().default("none"),
  collateralValue: z.coerce.number().min(0).optional().default(0),
  status: z.enum(["draft", "submitted", "scored", "approved", "declined", "manual_review"]).optional().default("submitted")
});

export const scoreRequestSchema = z.object({
  policyProfileId: z.string().min(1).optional()
});

export const policySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  approveBelowScore: z.coerce.number().min(0).max(100),
  manualReviewBelowScore: z.coerce.number().min(0).max(100),
  declineAtOrAboveScore: z.coerce.number().min(0).max(100),
  signalConfigs: z.array(
    z.object({
      signalKey: z.string().min(1),
      enabled: z.boolean(),
      weight: z.coerce.number().min(0).max(50),
      warningThreshold: z.coerce.number().min(0).max(100),
      highRiskThreshold: z.coerce.number().min(0).max(100)
    })
  )
});

export const simulationSchema = z.object({
  count: z.coerce.number().int().min(10).max(500),
  riskiness: z.enum(["low", "balanced", "high"]),
  policyProfileIds: z.array(z.string()).min(1)
});
