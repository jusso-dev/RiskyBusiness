import { aiRiskNotes } from "@/lib/data";
import { json, withErrorHandling } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  return json(aiRiskNotes.filter((note) => note.applicationId === id));
});
