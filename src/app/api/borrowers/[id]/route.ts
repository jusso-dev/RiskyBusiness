import { borrowers, loanApplications } from "@/lib/data";
import { badRequest, json, notFound, parseJson } from "@/lib/api";
import { borrowerSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const borrower = borrowers.find((item) => item.id === id);
  if (!borrower) return notFound("Borrower not found");
  return json({ borrower, applications: loanApplications.filter((app) => app.borrowerId === id) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = borrowers.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Borrower not found");
  const parsed = borrowerSchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  borrowers[index] = { ...borrowers[index], ...parsed.data };
  return json(borrowers[index]);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = borrowers.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Borrower not found");
  borrowers.splice(index, 1);
  return json({ ok: true });
}
