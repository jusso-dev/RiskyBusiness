import { loanApplications, policyProfiles } from "@/lib/data";
import { json, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { comparePolicies } from "@/lib/scoring";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) throw new NotFoundError("Application", id);
  return json(comparePolicies(application, policyProfiles));
});
