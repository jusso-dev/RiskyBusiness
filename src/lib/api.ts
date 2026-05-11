import { NextResponse } from "next/server";

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(error: unknown) {
  return NextResponse.json({ error }, { status: 400 });
}
