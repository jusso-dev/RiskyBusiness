import { policyProfiles, simulations } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { BadRequestError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { runSimulation } from "@/lib/simulation";
import { simulationSchema } from "@/lib/validation";

export const GET = withErrorHandling(async () => json(simulations));

export const POST = withErrorHandling(async (request: Request) => {
  const data = await parseJsonBody(request, simulationSchema);
  const known = new Set(policyProfiles.map((p) => p.id));
  const unknown = data.policyProfileIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new BadRequestError("Unknown policyProfileIds", { unknown });
  }
  const run = runSimulation(data);
  logger.info("Simulation completed", { id: run.id, count: data.count, riskiness: data.riskiness, policies: data.policyProfileIds });
  return json(run, { status: 201 });
});
