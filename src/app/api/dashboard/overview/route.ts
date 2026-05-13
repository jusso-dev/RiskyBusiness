import { dashboardOverview } from "@/lib/analytics";
import { json, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async () => json(dashboardOverview()));
