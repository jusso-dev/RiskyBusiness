import { simulations } from "@/lib/data";
import { json, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const simulation = simulations.find((item) => item.id === id);
  if (!simulation) throw new NotFoundError("Simulation", id);
  return json(simulation);
});
