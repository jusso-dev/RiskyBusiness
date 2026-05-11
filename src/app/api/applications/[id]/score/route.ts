import { audit, auditLogs, loanApplications, policyProfiles, scoreResults } from "@/lib/data";
import { badRequest, json, notFound, parseJson } from "@/lib/api";
import { scoreApplication } from "@/lib/scoring";
import { scoreRequestSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) return notFound("Application not found");
  const parsed = scoreRequestSchema.safeParse(await parseJson(request).catch(() => ({})));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  const policy = policyProfiles.find((item) => item.id === parsed.data.policyProfileId) ?? policyProfiles.find((item) => item.name === "Balanced") ?? policyProfiles[0];
  const result = scoreApplication(application, policy);
  scoreResults.push(result);
  application.status = result.decision === "approve" ? "approved" : result.decision === "decline" ? "declined" : "manual_review";
  auditLogs.unshift(audit("application", application.id, "score_run", `Scored with ${policy.name}: simulated ${result.decision.replace("_", " ")} at ${Math.round(result.totalRiskScore)}/100.`));
  return json(result, { status: 201 });
}
