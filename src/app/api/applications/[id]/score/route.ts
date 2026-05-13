import { audit, auditLogs, loanApplications, policyProfiles, scoreResults } from "@/lib/data";
import { json, parseOptionalJsonBody, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { balancedPolicy } from "@/lib/selectors";
import { scoreApplication } from "@/lib/scoring";
import { scoreRequestSchema } from "@/lib/validation";
import type { ApplicationStatus, Decision } from "@/types/domain";

const DECISION_TO_STATUS: Record<Decision, ApplicationStatus> = {
  approve: "approved",
  decline: "declined",
  manual_review: "manual_review"
};

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) throw new NotFoundError("Application", id);

  const body = await parseOptionalJsonBody(request, scoreRequestSchema);
  const policy = body.policyProfileId
    ? policyProfiles.find((item) => item.id === body.policyProfileId) ?? null
    : balancedPolicy();
  if (!policy) throw new NotFoundError("Risk policy", body.policyProfileId);

  const result = scoreApplication(application, policy);
  scoreResults.push(result);
  application.status = DECISION_TO_STATUS[result.decision];
  auditLogs.unshift(audit("application", application.id, "score_run", `Scored with ${policy.name}: simulated ${result.decision.replace("_", " ")} at ${Math.round(result.totalRiskScore)}/100.`));
  logger.info("Application scored", { applicationId: application.id, policyId: policy.id, decision: result.decision, totalRiskScore: result.totalRiskScore });
  return json(result, { status: 201 });
});
