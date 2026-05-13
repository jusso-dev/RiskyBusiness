import { audit, auditLogs, policyProfiles } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { policySchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const policy = policyProfiles.find((item) => item.id === id);
  if (!policy) throw new NotFoundError("Policy", id);
  return json(policy);
});

export const PUT = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const index = policyProfiles.findIndex((item) => item.id === id);
  if (index < 0) throw new NotFoundError("Policy", id);
  const data = await parseJsonBody(request, policySchema);
  policyProfiles[index] = { ...policyProfiles[index], ...data, updatedAt: new Date().toISOString() };
  auditLogs.unshift(audit("policy", id, "policy_profile_changed", `Policy profile ${policyProfiles[index].name} updated.`));
  return json(policyProfiles[index]);
});
