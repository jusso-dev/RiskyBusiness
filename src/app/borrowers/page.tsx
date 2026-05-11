import Link from "next/link";
import { BorrowerForm } from "@/components/Forms";
import { PageHeader } from "@/components/PageHeader";
import { borrowers, loanApplications } from "@/lib/data";
import { currency } from "@/lib/utils";

export default function BorrowersPage() {
  return (
    <>
      <PageHeader title="Borrowers" eyebrow="Simulated profiles">
        Demo borrower data is synthetic. Do not enter real personal data.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
        <div className="panel p-5">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Income</th>
                <th>Credit score</th>
                <th>Applications</th>
                <th>Risk notes</th>
              </tr>
            </thead>
            <tbody>
              {borrowers.map((borrower) => (
                <tr key={borrower.id}>
                  <td className="font-bold">{borrower.firstName} {borrower.lastName}</td>
                  <td>{currency(borrower.annualIncome)}</td>
                  <td>{borrower.creditScore}</td>
                  <td>{loanApplications.filter((app) => app.borrowerId === borrower.id).length}</td>
                  <td className="max-w-72 text-sm text-[color:var(--muted)]">{borrower.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href="/applications" className="button mt-5 w-fit">Create loan from borrower</Link>
        </div>
        <BorrowerForm />
      </div>
    </>
  );
}
