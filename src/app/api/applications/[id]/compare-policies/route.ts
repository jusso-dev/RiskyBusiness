import { loanApplications, policyProfiles } from "@/lib/data";
import { json, notFound } from "@/lib/api";
import { comparePolicies } from "@/lib/scoring";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = loanApplications.find((item) => item.id === id);
  if (!application) return notFound("Application not found");
  return json(comparePolicies(application, policyProfiles));
}
