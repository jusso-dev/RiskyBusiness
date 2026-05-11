import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { SimpleBarChart } from "@/components/Charts";
import { StatusBadge } from "@/components/Badge";
import { dashboardOverview } from "@/lib/analytics";
import { borrowers, loanApplications } from "@/lib/data";
import { currency } from "@/lib/utils";

export default function DashboardPage() {
  const overview = dashboardOverview();
  return (
    <>
      <PageHeader
        eyebrow="RiskyBusiness"
        title="Loan risk simulator dashboard"
        action={
          <Link className="button" href="/lab">
            Open Signal Lab <ArrowRight size={16} />
          </Link>
        }
      >
        Portfolio-grade simulator for borrower profiles, deterministic risk scoring, policy tuning, explainability, audit history, and AI-assisted notes.
      </PageHeader>
      <div className="grid gap-5">
        <Disclaimer />
        <section className="metric-grid">
          <Metric label="Applications" value={overview.totalApplications.toString()} />
          <Metric label="Borrowers" value={overview.totalBorrowers.toString()} />
          <Metric label="Average risk score" value={Math.round(overview.averageRiskScore).toString()} />
          <Metric label="Risk signals" value={overview.signalCount.toString()} />
        </section>
        <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-black">Applications by loan type</h2>
              <Link href="/applications" className="text-sm font-bold text-[color:var(--accent-strong)]">
                View all
              </Link>
            </div>
            <SimpleBarChart data={Object.entries(overview.byLoanType).map(([loanType, count]) => ({ loanType: loanType.replaceAll("_", " "), count }))} xKey="loanType" yKey="count" />
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">Simulated decisions</h2>
            <div className="mt-4 grid gap-3">
              <DecisionRow label="Approve" count={overview.counts.approve} kind="approve" />
              <DecisionRow label="Manual review" count={overview.counts.manual_review} kind="manual_review" />
              <DecisionRow label="Decline" count={overview.counts.decline} kind="decline" />
            </div>
          </div>
        </section>
        <section className="grid gap-5 xl:grid-cols-2">
          <div className="panel p-5">
            <h2 className="text-lg font-black">Recent scored applications</h2>
            <table className="table mt-3">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Amount</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentScoredApplications.slice(0, 6).map((score) => {
                  const app = loanApplications.find((item) => item.id === score.applicationId);
                  const borrower = borrowers.find((item) => item.id === app?.borrowerId);
                  return (
                    <tr key={score.id}>
                      <td>{borrower?.firstName} {borrower?.lastName}</td>
                      <td>{currency(app?.requestedAmount ?? 0)}</td>
                      <td><StatusBadge kind={score.decision} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">Highest risk signals</h2>
            <div className="mt-4 grid gap-3">
              {overview.highestRiskSignals.map((signal) => (
                <div key={signal.name}>
                  <div className="mb-1 flex justify-between text-sm font-bold">
                    <span>{signal.name}</span>
                    <span>{Math.round(signal.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[color:var(--panel-strong)]">
                    <div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${Math.min(100, signal.total / 20)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm font-bold text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}

function DecisionRow({ label, count, kind }: { label: string; count: number; kind: "approve" | "manual_review" | "decline" }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-3">
      <StatusBadge kind={kind} />
      <span className="text-2xl font-black">{count}</span>
    </div>
  );
}
