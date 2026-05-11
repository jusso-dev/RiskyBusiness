import { PageHeader } from "@/components/PageHeader";
import { SignalLab } from "@/components/SignalLab";
import { borrowers, loanApplications, policyProfiles } from "@/lib/data";

export default function LabPage() {
  return (
    <>
      <PageHeader title="Signal Tuning Lab" eyebrow="Live what-if analysis">
        Adjust signal weights and application values, re-run deterministic scoring in the browser, and compare original versus current simulated outcomes.
      </PageHeader>
      <SignalLab applications={loanApplications} borrowers={borrowers} policies={policyProfiles} />
    </>
  );
}
