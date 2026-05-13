import { aiRiskNotes, borrowers, loanApplications, scoreResults } from "@/lib/data";
import { json, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { applicationMarkdownReport } from "@/lib/reports";
import { balancedPolicy } from "@/lib/selectors";
import { scoreApplication } from "@/lib/scoring";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) throw new NotFoundError("Application", id);
  const borrower = borrowers.find((item) => item.id === application.borrowerId);
  if (!borrower) throw new NotFoundError("Borrower", application.borrowerId);

  const policy = balancedPolicy();
  const score = scoreResults.filter((item) => item.applicationId === id).at(-1) ?? scoreApplication(application, policy);
  const note = aiRiskNotes.find((item) => item.applicationId === id);
  return json({ markdown: applicationMarkdownReport({ borrower, application, policy, score, note }) });
});
