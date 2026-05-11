import { riskSignals } from "@/lib/data";
import { badRequest, json, notFound, parseJson } from "@/lib/api";
import { z } from "zod";

const signalUpdate = z.object({
  enabled: z.boolean().optional(),
  weight: z.coerce.number().min(0).max(50).optional(),
  warningThreshold: z.coerce.number().min(0).max(100).optional(),
  highRiskThreshold: z.coerce.number().min(0).max(100).optional()
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = riskSignals.find((item) => item.id === id || item.key === id);
  if (!signal) return notFound("Risk signal not found");
  const parsed = signalUpdate.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  Object.assign(signal, parsed.data, { updatedAt: new Date().toISOString() });
  return json(signal);
}
