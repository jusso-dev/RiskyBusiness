import { applicationSchema } from "@/lib/validation";
import { applicationsWithBorrowers } from "@/lib/selectors";
import { audit, auditLogs, borrowers, loanApplications, nextEntityId, organisationId } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const GET = withErrorHandling(async () => json(applicationsWithBorrowers()));

export const POST = withErrorHandling(async (request: Request) => {
  const data = await parseJsonBody(request, applicationSchema);
  if (!borrowers.some((b) => b.id === data.borrowerId)) {
    throw new NotFoundError("Borrower", data.borrowerId);
  }
  const application = {
    id: nextEntityId("a", loanApplications),
    organisationId,
    ...data,
    createdAt: new Date().toISOString()
  };
  loanApplications.push(application);
  auditLogs.unshift(audit("application", application.id, "application_submitted", `Simulated ${application.loanType.replaceAll("_", " ")} application submitted.`));
  logger.info("Application created", { id: application.id, borrowerId: application.borrowerId, loanType: application.loanType });
  return json(application, { status: 201 });
});
