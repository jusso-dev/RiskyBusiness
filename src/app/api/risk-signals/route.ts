import { riskSignals } from "@/lib/data";
import { json } from "@/lib/api";

export async function GET() {
  return json(riskSignals);
}
