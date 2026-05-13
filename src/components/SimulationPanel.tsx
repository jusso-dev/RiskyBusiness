"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { apiFetch, formatHttpError } from "@/lib/client";
import type { RiskPolicyProfile, SimulationRun } from "@/types/domain";

export function SimulationPanel({ policies }: { policies: RiskPolicyProfile[] }) {
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<SimulationRun>("/api/simulations", {
        method: "POST",
        body: JSON.stringify({
          count: 100,
          riskiness: "balanced",
          policyProfileIds: policies.slice(0, 3).map((policy) => policy.id)
        })
      });
      setRun(result);
    } catch (err) {
      setError(formatHttpError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Batch simulation</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Generate 100 synthetic applications and compare policy outcomes.</p>
        </div>
        <button className="button" onClick={start} disabled={busy}>
          <Play size={16} />
          {busy ? "Running..." : "Run simulation"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-bold text-[color:var(--red)]">
          {error}
        </p>
      ) : null}
      {run ? (
        <table className="table mt-4">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Approve</th>
              <th>Review</th>
              <th>Decline</th>
              <th>Avg score</th>
            </tr>
          </thead>
          <tbody>
            {run.results.map((result) => {
              const policy = policies.find((item) => item.id === result.policyProfileId);
              return (
                <tr key={result.policyProfileId}>
                  <td className="font-bold">{policy?.name ?? result.policyProfileId}</td>
                  <td>{Math.round(result.approvalRate * 100)}%</td>
                  <td>{Math.round(result.manualReviewRate * 100)}%</td>
                  <td>{Math.round(result.declineRate * 100)}%</td>
                  <td>{Math.round(result.averageScore)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
