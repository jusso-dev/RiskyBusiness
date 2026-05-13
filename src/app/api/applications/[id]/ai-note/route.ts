import { aiRiskNotes, audit, auditLogs, borrowers, loanApplications, scoreResults } from "@/lib/data";
import { getAiProvider, toAiRiskNote } from "@/lib/ai";
import { json, withErrorHandling } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { balancedPolicy } from "@/lib/selectors";
import { scoreApplication } from "@/lib/scoring";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) throw new NotFoundError("Application", id);
  const borrower = borrowers.find((item) => item.id === application.borrowerId);
  if (!borrower) throw new NotFoundError("Borrower", application.borrowerId);

  const score = scoreResults.filter((item) => item.applicationId === id).at(-1) ?? scoreApplication(application, balancedPolicy());

  const provider = getAiProvider();
  const output = await provider.generateRiskNarrative({ borrower, application, score });
  const note = toAiRiskNote(id, score.id, provider.name, output);
  aiRiskNotes.unshift(note);
  auditLogs.unshift(audit("application", application.id, "ai_note_generated", "AI-assisted simulated risk note generated."));
  logger.info("AI risk note generated", { applicationId: id, provider: provider.name });
  return json(note, { status: 201 });
});
