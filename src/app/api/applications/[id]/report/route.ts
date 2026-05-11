import { aiRiskNotes, borrowers, loanApplications, policyProfiles, scoreResults } from "@/lib/data";
import { json, notFound } from "@/lib/api";
import { applicationMarkdownReport } from "@/lib/reports";
import { scoreApplication } from "@/lib/scoring";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) return notFound("Application not found");
  const borrower = borrowers.find((item) => item.id === application.borrowerId);
  if (!borrower) return notFound("Borrower not found");
  const policy = policyProfiles.find((item) => item.name === "Balanced") ?? policyProfiles[0];
  const score = scoreResults.filter((item) => item.applicationId === id).at(-1) ?? scoreApplication(application, policy);
  const note = aiRiskNotes.find((item) => item.applicationId === id);
  return json({ markdown: applicationMarkdownReport({ borrower, application, policy, score, note }) });
}
