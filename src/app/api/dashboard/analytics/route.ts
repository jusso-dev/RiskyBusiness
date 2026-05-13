import { analytics } from "@/lib/analytics";
import { json, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async () => json(analytics()));
