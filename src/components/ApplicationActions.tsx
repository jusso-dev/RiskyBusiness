"use client";

import { Brain, FileDown, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState("");

  async function runScore() {
    setBusy("score");
    await fetch(`/api/applications/${applicationId}/score`, { method: "POST", body: JSON.stringify({ policyProfileId: "p2" }) });
    setBusy(null);
    router.refresh();
  }

  async function generateNote() {
    setBusy("note");
    await fetch(`/api/applications/${applicationId}/ai-note`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function exportReport() {
    setBusy("report");
    const response = await fetch(`/api/applications/${applicationId}/report`);
    const payload = await response.json();
    setReport(payload.markdown);
    setBusy(null);
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
      {report ? (
        <textarea className="input min-h-64 font-mono text-xs leading-5" value={report} readOnly aria-label="Markdown report" />
      ) : null}
    </div>
  );
}
