import { audit, auditLogs, nextEntityId, organisationId, policyProfiles } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { policySchema } from "@/lib/validation";

export const GET = withErrorHandling(async () => json(policyProfiles));

export const POST = withErrorHandling(async (request: Request) => {
  const data = await parseJsonBody(request, policySchema);
  if (policyProfiles.some((p) => p.name.toLowerCase() === data.name.toLowerCase())) {
    throw new ConflictError(`Policy profile '${data.name}' already exists`);
  }
  const now = new Date().toISOString();
  const policy = {
    id: nextEntityId("p", policyProfiles),
    organisationId,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  policyProfiles.push(policy);
  auditLogs.unshift(audit("policy", policy.id, "policy_profile_created", `Policy profile ${policy.name} created.`));
  logger.info("Policy profile created", { id: policy.id, name: policy.name });
  return json(policy, { status: 201 });
});
