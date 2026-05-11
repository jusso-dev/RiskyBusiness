import { PageHeader } from "@/components/PageHeader";
import { RiskScatter, SimpleBarChart } from "@/components/Charts";
import { SimulationPanel } from "@/components/SimulationPanel";
import { analytics } from "@/lib/analytics";
import { policyProfiles } from "@/lib/data";

export default function AnalyticsPage() {
  const data = analytics();
  return (
    <>
      <PageHeader title="Portfolio analytics" eyebrow="Risk distribution">
        Explore simulated approval rates, score distributions, policy comparisons, and risk-driver patterns across the seed portfolio.
      </PageHeader>
      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="panel p-5">
            <h2 className="text-lg font-black">Risk score distribution</h2>
            <SimpleBarChart data={data.distribution} xKey="bucket" yKey="count" />
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">Average score by loan type</h2>
            <SimpleBarChart data={data.byLoanType.map((item) => ({ loanType: item.loanType.replaceAll("_", " "), averageScore: Math.round(item.averageScore) }))} xKey="loanType" yKey="averageScore" />
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">Decision trend</h2>
            <SimpleBarChart data={data.trend.map((item) => ({ decision: item.decision.replaceAll("_", " "), count: item.count }))} xKey="decision" yKey="count" />
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-black">Affordability vs credit history</h2>
            <RiskScatter data={data.scatter} />
          </div>
        </div>
        <SimulationPanel policies={policyProfiles} />
      </div>
    </>
  );
}
