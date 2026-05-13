import { audit, auditLogs, borrowers, nextEntityId, organisationId } from "@/lib/data";
import { json, parseJsonBody, withErrorHandling } from "@/lib/api";
import { borrowerSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export const GET = withErrorHandling(async () => json(borrowers));

export const POST = withErrorHandling(async (request: Request) => {
  const data = await parseJsonBody(request, borrowerSchema);
  const borrower = {
    id: nextEntityId("b", borrowers),
    organisationId,
    ...data,
    createdAt: new Date().toISOString()
  };
  borrowers.push(borrower);
  auditLogs.unshift(audit("borrower", borrower.id, "borrower_created", `Simulated borrower ${borrower.firstName} ${borrower.lastName} created.`));
  logger.info("Borrower created", { id: borrower.id });
  return json(borrower, { status: 201 });
});
