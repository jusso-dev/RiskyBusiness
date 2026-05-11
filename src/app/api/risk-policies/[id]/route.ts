import { audit, auditLogs, policyProfiles } from "@/lib/data";
import { badRequest, json, notFound, parseJson } from "@/lib/api";
import { policySchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = policyProfiles.find((item) => item.id === id);
  if (!policy) return notFound("Policy not found");
  return json(policy);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = policyProfiles.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Policy not found");
  const parsed = policySchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  policyProfiles[index] = { ...policyProfiles[index], ...parsed.data, updatedAt: new Date().toISOString() };
  auditLogs.unshift(audit("policy", id, "policy_profile_changed", `Policy profile ${policyProfiles[index].name} updated.`));
  return json(policyProfiles[index]);
}
