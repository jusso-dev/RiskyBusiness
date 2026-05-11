import { aiRiskNotes } from "@/lib/data";
import { json } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return json(aiRiskNotes.filter((note) => note.applicationId === id));
}
