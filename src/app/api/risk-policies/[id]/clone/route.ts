import { audit, auditLogs, policyProfiles } from "@/lib/data";
import { json, notFound } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = policyProfiles.find((item) => item.id === id);
  if (!source) return notFound("Policy not found");
  const clone = {
    ...source,
    id: `p${policyProfiles.length + 1}`,
    name: `${source.name} Copy`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  policyProfiles.push(clone);
  auditLogs.unshift(audit("policy", clone.id, "policy_profile_cloned", `Policy profile cloned from ${source.name}.`));
  return json(clone, { status: 201 });
}
