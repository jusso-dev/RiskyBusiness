import { simulations } from "@/lib/data";
import { badRequest, json, parseJson } from "@/lib/api";
import { runSimulation } from "@/lib/simulation";
import { simulationSchema } from "@/lib/validation";

export async function GET() {
  return json(simulations);
}

export async function POST(request: Request) {
  const parsed = simulationSchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  return json(runSimulation(parsed.data), { status: 201 });
}
