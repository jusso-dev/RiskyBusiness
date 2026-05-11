import { loanApplications } from "@/lib/data";
import { badRequest, json, notFound, parseJson } from "@/lib/api";
import { applicationSchema } from "@/lib/validation";
import { applicationDetail } from "@/lib/selectors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = applicationDetail(id);
  if (!detail) return notFound("Application not found");
  return json(detail);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = loanApplications.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Application not found");
  const parsed = applicationSchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  loanApplications[index] = { ...loanApplications[index], ...parsed.data };
  return json(loanApplications[index]);
}
