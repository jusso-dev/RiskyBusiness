import { audit, auditLogs, organisationId, policyProfiles } from "@/lib/data";
import { badRequest, json, parseJson } from "@/lib/api";
import { policySchema } from "@/lib/validation";

export async function GET() {
  return json(policyProfiles);
}

export async function POST(request: Request) {
  const parsed = policySchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  const policy = {
    id: `p${policyProfiles.length + 1}`,
    organisationId,
    ...parsed.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  policyProfiles.push(policy);
  auditLogs.unshift(audit("policy", policy.id, "policy_profile_created", `Policy profile ${policy.name} created.`));
  return json(policy, { status: 201 });
}
