import { borrowers, loanApplications } from "@/lib/data";
import { json, noContent, parseJsonBody, withErrorHandling } from "@/lib/api";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { borrowerSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const borrower = borrowers.find((item) => item.id === id);
  if (!borrower) throw new NotFoundError("Borrower", id);
  return json({ borrower, applications: loanApplications.filter((app) => app.borrowerId === id) });
});

export const PUT = withErrorHandling(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const index = borrowers.findIndex((item) => item.id === id);
  if (index < 0) throw new NotFoundError("Borrower", id);
  const data = await parseJsonBody(request, borrowerSchema);
  borrowers[index] = { ...borrowers[index], ...data };
  return json(borrowers[index]);
});

export const DELETE = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const index = borrowers.findIndex((item) => item.id === id);
  if (index < 0) throw new NotFoundError("Borrower", id);
  const linked = loanApplications.filter((app) => app.borrowerId === id);
  if (linked.length > 0) {
    throw new ConflictError("Cannot delete borrower with existing applications", { applicationIds: linked.map((a) => a.id) });
  }
  borrowers.splice(index, 1);
  return noContent();
});
