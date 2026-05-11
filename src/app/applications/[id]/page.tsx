import Link from "next/link";
import { ApplicationActions } from "@/components/ApplicationActions";
import { StatusBadge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { ScoreGauge } from "@/components/ScoreGauge";
import { applicationDetail } from "@/lib/selectors";
import { currency } from "@/lib/utils";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = applicationDetail(id);
  if (!detail || !detail.borrower) return <PageHeader title="Application not found" />;
  const { application, borrower, latestScore, notes, comparisons } = detail;
  const categoryScores = [
    ["Affordability", latestScore.affordabilityScore],
    ["Credit history", latestScore.creditHistoryScore],
    ["Stability", latestScore.stabilityScore],
    ["Behavioural", latestScore.behaviouralScore],
    ["Collateral", latestScore.collateralScore],
    ["Application", latestScore.applicationScore]
  ];
  return (
    <>
      <PageHeader
        title={`Application ${application.id}`}
        eyebrow="Application detail"
        action={<Link className="button secondary" href="/lab">Compare in Signal Lab</Link>}
      >
        {borrower.firstName} {borrower.lastName} requested {currency(application.requestedAmount)} for {application.declaredPurpose.toLowerCase()}.
      </PageHeader>
      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <ScoreGauge score={latestScore.totalRiskScore} decision={latestScore.decision} />
          <div className="panel p-5">
            <h2 className="text-lg font-black">Run actions</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Scoring uses the deterministic engine. AI notes summarize the stored result and do not alter the simulated outcome.</p>
            <div className="mt-4">
              <ApplicationActions applicationId={application.id} />
            </div>
          </div>
        </div>
        <section className="grid gap-5 xl:grid-cols-2">
          <div className="panel p-5">
            <h2 className="text-lg font-black">Borrower and loan request</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Field label="Borrower" value={`${borrower.firstName} ${borrower.lastName}`} />
              <Field label="Industry" value={borrower.industry} />
              <Field label="Annual income" value={currency(borrower.annualIncome)} />
              <Field label="Monthly expenses" value={currency(borrower.monthlyExpenses)} />
              <Field label="Credit score" value={borrower.creditScore.toString()} />
              <Field label="Savings" value={currency(borrower.savingsBalance)} />
              <Field label="Loan type" value={application.loanType.replaceAll("_", " ")} />
              <Field label="Term" value={`${application.requestedTermMonths} months`} />
            </dl>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">Category scores</h2>
            <div className="mt-4 grid gap-3">
              {categoryScores.map(([label, value]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-sm font-bold"><span>{label}</span><span>{Math.round(value as number)}</span></div>
                  <div className="h-2 rounded-full bg-[color:var(--panel-strong)]"><div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-black">Signal breakdown</h2>
          <table className="table mt-3">
            <thead>
              <tr>
                <th>Signal</th>
                <th>Raw</th>
                <th>Score</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {[...latestScore.signals].sort((a, b) => b.weightedScore - a.weightedScore).map((signal) => (
                <tr key={signal.signalKey}>
                  <td className="font-bold">{signal.name}</td>
                  <td>{Number(signal.rawValue).toFixed(2)}</td>
                  <td>{Math.round(signal.normalizedScore)}</td>
                  <td>{signal.weight}</td>
                  <td><StatusBadge kind={signal.thresholdStatus} /></td>
                  <td className="max-w-96 text-sm text-[color:var(--muted)]">{signal.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="grid gap-5 xl:grid-cols-2">
          <div className="panel p-5">
            <h2 className="text-lg font-black">Policy comparison</h2>
            <table className="table mt-3">
              <tbody>
                {comparisons.map(({ policy, score }) => (
                  <tr key={policy.id}>
                    <td className="font-bold">{policy.name}</td>
                    <td>{Math.round(score.totalRiskScore)}/100</td>
                    <td><StatusBadge kind={score.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">AI risk notes</h2>
            {notes.length ? notes.map((note) => (
              <div key={note.id} className="mt-3 border-t border-[color:var(--line)] pt-3 text-sm leading-6">
                <p className="font-bold">{note.summary}</p>
                <p className="mt-2 text-[color:var(--muted)]">{note.plainEnglishExplanation}</p>
                <p className="mt-2 text-[color:var(--muted)]">{note.counterfactual}</p>
              </div>
            )) : <p className="mt-3 text-sm text-[color:var(--muted)]">No AI note saved yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[color:var(--muted)]">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
