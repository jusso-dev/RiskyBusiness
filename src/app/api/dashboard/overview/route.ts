import { dashboardOverview } from "@/lib/analytics";
import { json } from "@/lib/api";

export async function GET() {
  return json(dashboardOverview());
}
