import { z } from "zod";

export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;

const nonNegative = z.coerce.number().nonnegative();
const nonNegativeInt = z.coerce.number().int().nonnegative();

export const borrowerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    age: z.coerce.number().int().min(18).max(100),
    employmentStatus: z.enum(["employed", "self_employed", "contract", "unemployed", "retired"]),
    employmentLengthMonths: nonNegativeInt.max(720),
    annualIncome: nonNegative.max(1e9),
    monthlyIncome: nonNegative.max(1e8),
    monthlyExpenses: nonNegative.max(1e8),
    existingDebtMonthlyPayments: nonNegative.max(1e8),
    creditScore: z.coerce.number().int().min(CREDIT_SCORE_MIN).max(CREDIT_SCORE_MAX),
    creditHistoryLengthMonths: nonNegativeInt.max(1200),
    recentDefaultsCount: nonNegativeInt.max(100),
    recentHardInquiriesCount: nonNegativeInt.max(100),
    addressStabilityMonths: nonNegativeInt.max(1200),
    dependants: nonNegativeInt.max(20),
    residencyStatus: z.string().trim().min(1).max(80),
    industry: z.string().trim().min(1).max(80),
    savingsBalance: nonNegative.max(1e10),
    bankTransactionRiskLevel: z.enum(["low", "medium", "high"]),
    notes: z.string().max(2000).optional().default("")
  })
  .superRefine((data, ctx) => {
    if (data.monthlyIncome > 0 && data.annualIncome > 0) {
      const expectedMonthly = data.annualIncome / 12;
      const drift = Math.abs(expectedMonthly - data.monthlyIncome) / expectedMonthly;
      if (drift > 0.25) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["monthlyIncome"],
          message: "monthlyIncome differs from annualIncome / 12 by more than 25%"
        });
      }
    }
    if (data.existingDebtMonthlyPayments > 0 && data.monthlyIncome === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["existingDebtMonthlyPayments"],
        message: "existingDebtMonthlyPayments requires non-zero monthlyIncome"
      });
    }
  });

export const applicationSchema = z
  .object({
    borrowerId: z.string().trim().min(1),
    loanType: z.enum(["personal_loan", "car_loan", "business_loan", "equipment_finance", "debt_consolidation"]),
    requestedAmount: z.coerce.number().min(1000).max(1e8),
    requestedTermMonths: z.coerce.number().int().min(6).max(120),
    declaredPurpose: z.string().trim().min(1).max(280),
    interestRateEstimate: z.coerce.number().min(0).max(60),
    collateralType: z.string().trim().max(80).optional().default("none"),
    collateralValue: z.coerce.number().min(0).max(1e10).optional().default(0),
    status: z.enum(["draft", "submitted", "scored", "approved", "declined", "manual_review"]).optional().default("submitted")
  })
  .superRefine((data, ctx) => {
    const hasCollateral = data.collateralType && data.collateralType !== "none";
    if (hasCollateral && data.collateralValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collateralValue"],
        message: "collateralValue must be greater than zero when collateralType is provided"
      });
    }
    if (!hasCollateral && data.collateralValue > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collateralType"],
        message: "collateralType is required when collateralValue is greater than zero"
      });
    }
  });

export const scoreRequestSchema = z.object({
  policyProfileId: z.string().trim().min(1).optional()
});

export const policySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().max(500).optional().default(""),
    approveBelowScore: z.coerce.number().min(0).max(100),
    manualReviewBelowScore: z.coerce.number().min(0).max(100),
    declineAtOrAboveScore: z.coerce.number().min(0).max(100),
    signalConfigs: z
      .array(
        z.object({
          signalKey: z.string().trim().min(1),
          enabled: z.boolean(),
          weight: z.coerce.number().min(0).max(50),
          warningThreshold: z.coerce.number().min(0).max(100),
          highRiskThreshold: z.coerce.number().min(0).max(100)
        })
      )
      .min(1)
  })
  .superRefine((data, ctx) => {
    if (data.approveBelowScore > data.manualReviewBelowScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualReviewBelowScore"],
        message: "manualReviewBelowScore must be greater than or equal to approveBelowScore"
      });
    }
    if (data.manualReviewBelowScore > data.declineAtOrAboveScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["declineAtOrAboveScore"],
        message: "declineAtOrAboveScore must be greater than or equal to manualReviewBelowScore"
      });
    }
    const keys = new Set<string>();
    for (const [index, config] of data.signalConfigs.entries()) {
      if (keys.has(config.signalKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["signalConfigs", index, "signalKey"],
          message: `duplicate signalKey '${config.signalKey}'`
        });
      }
      keys.add(config.signalKey);
      if (config.warningThreshold > config.highRiskThreshold) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["signalConfigs", index, "highRiskThreshold"],
          message: "highRiskThreshold must be greater than or equal to warningThreshold"
        });
      }
    }
  });

export const simulationSchema = z.object({
  count: z.coerce.number().int().min(10).max(500),
  riskiness: z.enum(["low", "balanced", "high"]),
  policyProfileIds: z.array(z.string().trim().min(1)).min(1).max(10)
});

export const signalUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    weight: z.coerce.number().min(0).max(50).optional(),
    warningThreshold: z.coerce.number().min(0).max(100).optional(),
    highRiskThreshold: z.coerce.number().min(0).max(100).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" })
  .superRefine((data, ctx) => {
    if (data.warningThreshold !== undefined && data.highRiskThreshold !== undefined && data.warningThreshold > data.highRiskThreshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highRiskThreshold"],
        message: "highRiskThreshold must be greater than or equal to warningThreshold"
      });
    }
  });
