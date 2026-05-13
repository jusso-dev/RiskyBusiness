import { riskSignals } from "@/lib/data";
import { json, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async () => json(riskSignals));
