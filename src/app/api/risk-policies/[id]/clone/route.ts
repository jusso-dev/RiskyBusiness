import { audit, auditLogs, nextEntityId, policyProfiles } from "@/lib/data";
import { json, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const source = policyProfiles.find((item) => item.id === id);
  if (!source) throw new NotFoundError("Policy", id);
  const now = new Date().toISOString();
  const clone = {
    ...source,
    id: nextEntityId("p", policyProfiles),
    name: uniqueCloneName(`${source.name} Copy`),
    signalConfigs: source.signalConfigs.map((config) => ({ ...config })),
    createdAt: now,
    updatedAt: now
  };
  policyProfiles.push(clone);
  auditLogs.unshift(audit("policy", clone.id, "policy_profile_cloned", `Policy profile cloned from ${source.name}.`));
  return json(clone, { status: 201 });
});

function uniqueCloneName(base: string): string {
  if (!policyProfiles.some((p) => p.name === base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base} ${i}`;
    if (!policyProfiles.some((p) => p.name === candidate)) return candidate;
  }
  return `${base} ${Date.now()}`;
}
