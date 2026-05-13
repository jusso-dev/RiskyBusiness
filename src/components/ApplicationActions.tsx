"use client";

import { Brain, FileDown, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, formatHttpError } from "@/lib/client";
import type { AiRiskNote, ScoreResult } from "@/types/domain";

type Busy = "score" | "note" | "report" | null;

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function runScore() {
    setBusy("score");
    setError(null);
    try {
      await apiFetch<ScoreResult>(`/api/applications/${applicationId}/score`, {
        method: "POST",
        body: JSON.stringify({ policyProfileId: "p2" })
      });
      router.refresh();
    } catch (err) {
      setError(formatHttpError(err));
    } finally {
      setBusy(null);
    }
  }

  async function generateNote() {
    setBusy("note");
    setError(null);
    try {
      await apiFetch<AiRiskNote>(`/api/applications/${applicationId}/ai-note`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(formatHttpError(err));
    } finally {
      setBusy(null);
    }
  }

  async function exportReport() {
    setBusy("report");
    setError(null);
    try {
      const payload = await apiFetch<{ markdown: string }>(`/api/applications/${applicationId}/report`);
      setReport(payload.markdown);
    } catch (err) {
      setError(formatHttpError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button className="button" onClick={runScore} disabled={busy === "score"}>
          <Play size={16} />
          {busy === "score" ? "Scoring..." : "Run score"}
        </button>
        <button className="button secondary" onClick={generateNote} disabled={busy === "note"}>
          <Brain size={16} />
          {busy === "note" ? "Generating..." : "Generate AI note"}
        </button>
        <button className="button secondary" onClick={exportReport} disabled={busy === "report"}>
          <FileDown size={16} />
          Export Markdown
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-bold text-[color:var(--red)]">
          {error}
        </p>
      ) : null}
      {report ? (
        <textarea className="input min-h-64 font-mono text-xs leading-5" value={report} readOnly aria-label="Markdown report" />
      ) : null}
    </div>
  );
}
