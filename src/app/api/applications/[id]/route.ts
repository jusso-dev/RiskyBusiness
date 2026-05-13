import { borrowers, loanApplications } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { applicationDetail } from "@/lib/selectors";
import { applicationSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const detail = applicationDetail(id);
  if (!detail) throw new NotFoundError("Application", id);
  return json(detail);
});

export const PUT = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const index = loanApplications.findIndex((item) => item.id === id);
  if (index < 0) throw new NotFoundError("Application", id);
  const data = await parseJsonBody(request, applicationSchema);
  if (!borrowers.some((b) => b.id === data.borrowerId)) {
    throw new NotFoundError("Borrower", data.borrowerId);
  }
  loanApplications[index] = { ...loanApplications[index], ...data };
  return json(loanApplications[index]);
});
