import { borrowers, auditLogs, audit, organisationId } from "@/lib/data";
import { badRequest, json, parseJson } from "@/lib/api";
import { borrowerSchema } from "@/lib/validation";

export async function GET() {
  return json(borrowers);
}

export async function POST(request: Request) {
  const parsed = borrowerSchema.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  const borrower = {
    id: `b${borrowers.length + 1}`,
    organisationId,
    ...parsed.data,
    createdAt: new Date().toISOString()
  };
  borrowers.push(borrower);
  auditLogs.unshift(audit("borrower", borrower.id, "borrower_created", `Simulated borrower ${borrower.firstName} ${borrower.lastName} created.`));
  return json(borrower, { status: 201 });
}
