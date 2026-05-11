import { aiRiskNotes, audit, auditLogs, borrowers, loanApplications, scoreResults } from "@/lib/data";
import { getAiProvider, toAiRiskNote } from "@/lib/ai";
import { json, notFound } from "@/lib/api";
import { scoreApplication } from "@/lib/scoring";
import { policyProfiles } from "@/lib/data";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) return notFound("Application not found");
  const borrower = borrowers.find((item) => item.id === application.borrowerId);
  if (!borrower) return notFound("Borrower not found");
  const score = scoreResults.filter((item) => item.applicationId === id).at(-1) ?? scoreApplication(application, policyProfiles.find((p) => p.name === "Balanced") ?? policyProfiles[0]);
  const provider = getAiProvider();
  const output = await provider.generateRiskNarrative({ borrower, application, score });
  const note = toAiRiskNote(id, score.id, process.env.AI_PROVIDER === "openai" ? "openai-compatible" : "mock", output);
  aiRiskNotes.unshift(note);
  auditLogs.unshift(audit("application", application.id, "ai_note_generated", "AI-assisted simulated risk note generated."));
  return json(note, { status: 201 });
}
