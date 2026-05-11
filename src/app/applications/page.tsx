import Link from "next/link";
import { ApplicationForm } from "@/components/Forms";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { applicationsWithBorrowers } from "@/lib/selectors";
import { borrowers } from "@/lib/data";
import { currency } from "@/lib/utils";

export default function ApplicationsPage() {
  const applications = applicationsWithBorrowers();
  return (
    <>
      <PageHeader title="Applications" eyebrow="Loan requests">
        Submit synthetic applications, score them with a selected policy, and inspect stored signal-level explanations.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="panel p-5">
          <table className="table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Borrower</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td><Link className="font-black text-[color:var(--accent-strong)]" href={`/applications/${application.id}`}>{application.id}</Link></td>
                  <td>{application.borrower?.firstName} {application.borrower?.lastName}</td>
                  <td>{application.loanType.replaceAll("_", " ")}</td>
                  <td>{currency(application.requestedAmount)}</td>
                  <td>{application.latestScore ? <StatusBadge kind={application.latestScore.decision} /> : <StatusBadge kind={application.status === "submitted" ? "submitted" : "draft"} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ApplicationForm borrowers={borrowers} />
      </div>
    </>
  );
}
