import { simulations } from "@/lib/data";
import { json, notFound } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const simulation = simulations.find((item) => item.id === id);
  if (!simulation) return notFound("Simulation not found");
  return json(simulation);
}
