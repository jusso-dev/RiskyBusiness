import { riskSignals } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { signalUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const signal = riskSignals.find((item) => item.id === id || item.key === id);
  if (!signal) throw new NotFoundError("Risk signal", id);
  const data = await parseJsonBody(request, signalUpdateSchema);

  const nextWarning = data.warningThreshold ?? signal.warningThreshold;
  const nextHigh = data.highRiskThreshold ?? signal.highRiskThreshold;
  if (nextWarning > nextHigh) {
    throw new ValidationError("highRiskThreshold must be greater than or equal to warningThreshold", {
      warningThreshold: nextWarning,
      highRiskThreshold: nextHigh
    });
  }

  Object.assign(signal, data, { updatedAt: new Date().toISOString() });
  return json(signal);
});
