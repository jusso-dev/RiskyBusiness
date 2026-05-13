import { describe, expect, it } from "vitest";
import { borrowers, loanApplications, policyProfiles } from "../src/lib/data";
import { MockAiRiskNarrativeProvider } from "../src/lib/ai";
import { applicationSchema, borrowerSchema, policySchema } from "../src/lib/validation";
import { cashBufferMonths, debtToIncome, decide, loanToIncome, normalizeCreditScore, scoreApplication } from "../src/lib/scoring";

describe("RiskyBusiness scoring engine", () => {
  const borrower = borrowers[4];
  const application = loanApplications.find((item) => item.borrowerId === borrower.id)!;
  const policy = policyProfiles.find((item) => item.name === "Balanced")!;

  it("calculates debt-to-income", () => {
    expect(debtToIncome(borrower)).toBeCloseTo(borrower.existingDebtMonthlyPayments / borrower.monthlyIncome);
  });

  it("calculates loan-to-income", () => {
    expect(loanToIncome(application, borrower)).toBeCloseTo(application.requestedAmount / borrower.annualIncome);
  });

  it("calculates cash buffer", () => {
    expect(cashBufferMonths(borrower)).toBeCloseTo(borrower.savingsBalance / borrower.monthlyExpenses);
  });

  it("normalizes credit score so lower scores are riskier", () => {
    expect(normalizeCreditScore(580)).toBeGreaterThan(normalizeCreditScore(760));
  });

  it("weights signals and maps a total decision", () => {
    const score = scoreApplication(application, policy);
    expect(score.totalRiskScore).toBeGreaterThanOrEqual(0);
    expect(score.totalRiskScore).toBeLessThanOrEqual(100);
    expect(["approve", "manual_review", "decline"]).toContain(score.decision);
    expect(score.signals.find((signal) => signal.signalKey === "recent_defaults")?.weightedScore).toBeGreaterThan(0);
  });

  it("compares policy appetite through total scores", () => {
    const conservative = scoreApplication(application, policyProfiles[0]);
    const growth = scoreApplication(application, policyProfiles[2]);
    expect(Math.abs(conservative.totalRiskScore - growth.totalRiskScore)).toBeLessThan(0.2);
    expect(conservative.decision).toBeDefined();
    expect(growth.decision).toBeDefined();
  });

  it("returns mock AI narrative output", async () => {
    const score = scoreApplication(application, policy);
    const note = await new MockAiRiskNarrativeProvider().generateRiskNarrative({ borrower, application, score });
    expect(note.summary).toContain("simulated");
    expect(note.reviewQuestions.length).toBeGreaterThan(0);
  });

  it("validates borrower and application input", () => {
    expect(borrowerSchema.safeParse(borrower).success).toBe(true);
    expect(applicationSchema.safeParse(application).success).toBe(true);
  });

  it("decides decline, manual review, or approve based on policy thresholds", () => {
    expect(decide(policy.declineAtOrAboveScore, policy)).toBe("decline");
    expect(decide(policy.declineAtOrAboveScore + 5, policy)).toBe("decline");
    expect(decide(policy.approveBelowScore, policy)).toBe("manual_review");
    expect(decide(Math.max(0, policy.approveBelowScore - 1), policy)).toBe("approve");
  });

  it("rejects policies whose thresholds are out of order", () => {
    const result = policySchema.safeParse({
      name: "Broken",
      approveBelowScore: 80,
      manualReviewBelowScore: 40,
      declineAtOrAboveScore: 60,
      signalConfigs: [{ signalKey: "credit_score", enabled: true, weight: 1, warningThreshold: 10, highRiskThreshold: 5 }]
    });
    expect(result.success).toBe(false);
  });

  it("rejects application with collateral value but no collateral type", () => {
    const result = applicationSchema.safeParse({
      borrowerId: borrower.id,
      loanType: "personal_loan",
      requestedAmount: 10000,
      requestedTermMonths: 24,
      declaredPurpose: "test",
      interestRateEstimate: 9,
      collateralType: "none",
      collateralValue: 5000
    });
    expect(result.success).toBe(false);
  });
});
