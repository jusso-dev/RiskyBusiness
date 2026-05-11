import { PageHeader } from "@/components/PageHeader";
import { PolicyEditor } from "@/components/Forms";
import { policyProfiles } from "@/lib/data";

export default function RiskPoliciesPage() {
  return (
    <>
      <PageHeader title="Risk policy profiles" eyebrow="Weights and thresholds">
        Configure signal weights, review thresholds, and compare different simulated risk appetites.
      </PageHeader>
      <div className="grid gap-5">
        <div className="metric-grid">
          {policyProfiles.map((policy) => (
            <div key={policy.id} className="panel p-5">
              <h2 className="text-lg font-black">{policy.name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-[color:var(--muted)]">{policy.description}</p>
              <p className="mt-3 text-sm font-bold">Approve &lt; {policy.approveBelowScore} · Review &lt; {policy.manualReviewBelowScore} · Decline ≥ {policy.declineAtOrAboveScore}</p>
            </div>
          ))}
        </div>
        <PolicyEditor policy={policyProfiles.find((policy) => policy.name === "Custom Sandbox") ?? policyProfiles[0]} />
      </div>
    </>
  );
}
