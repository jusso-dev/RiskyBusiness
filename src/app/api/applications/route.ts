import { applicationSchema } from "@/lib/validation";
import { applicationsWithBorrowers } from "@/lib/selectors";
import { audit, auditLogs, loanApplications, organisationId } from "@/lib/data";
import { badRequest, json, parseJson } from "@/lib/api";

export async function GET() {
  return json(applicationsWithBorrowers());
}

export async function POST(request: Request) {
  const parsed = applicationSchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  const application = {
    id: `a${loanApplications.length + 1}`,
    organisationId,
    ...parsed.data,
    createdAt: new Date().toISOString()
  };
  loanApplications.push(application);
  auditLogs.unshift(audit("application", application.id, "application_submitted", `Simulated ${application.loanType.replaceAll("_", " ")} application submitted.`));
  return json(application, { status: 201 });
}
