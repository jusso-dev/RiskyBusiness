"use client";

import { useMemo, useState } from "react";
import { SimpleBarChart } from "./Charts";
import { ScoreGauge } from "./ScoreGauge";
import { currency } from "@/lib/utils";
import { scoreApplication } from "@/lib/scoring";
import type { Borrower, LoanApplication, RiskPolicyProfile } from "@/types/domain";

export function SignalLab({
  applications,
  borrowers,
  policies
}: {
  applications: LoanApplication[];
  borrowers: Borrower[];
  policies: RiskPolicyProfile[];
}) {
  const [applicationId, setApplicationId] = useState(applications[2]?.id ?? applications[0]?.id);
  const [policyId, setPolicyId] = useState("p2");
  const [dtiWeight, setDtiWeight] = useState(18);
  const [defaultsWeight, setDefaultsWeight] = useState(18);
  const [amountFactor, setAmountFactor] = useState(100);

  const application = applications.find((item) => item.id === applicationId) ?? applications[0];
  const borrower = borrowers.find((item) => item.id === application.borrowerId) ?? borrowers[0];
  const policy = policies.find((item) => item.id === policyId) ?? policies[0];
  const original = useMemo(() => scoreApplication(application, policy), [application, policy]);
  const tunedPolicy = {
    ...policy,
    signalConfigs: policy.signalConfigs.map((config) =>
      config.signalKey === "debt_to_income_ratio" ? { ...config, weight: dtiWeight } : config.signalKey === "recent_defaults" ? { ...config, weight: defaultsWeight } : config
    )
  };
  const current = scoreApplication(application, tunedPolicy, undefined, { requestedAmount: Math.round(application.requestedAmount * (amountFactor / 100)) });
  const waterfall = current.signals
    .slice()
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 8)
    .map((signal) => ({ name: signal.name, contribution: Math.round(signal.weightedScore / 10) / 10 }));

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="panel grid gap-4 p-5">
        <label className="label">
          Application
          <select className="input" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
            {applications.map((item) => {
              const b = borrowers.find((borrowerItem) => borrowerItem.id === item.borrowerId);
              return (
                <option key={item.id} value={item.id}>
                  {item.id} · {b?.firstName} {b?.lastName} · {item.loanType.replaceAll("_", " ")}
                </option>
              );
            })}
          </select>
        </label>
        <label className="label">
          Policy
          <select className="input" value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
            {policies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <Range label="Debt-to-income weight" value={dtiWeight} setValue={setDtiWeight} max={30} />
        <Range label="Recent defaults weight" value={defaultsWeight} setValue={setDefaultsWeight} max={30} />
        <Range label="Requested amount" value={amountFactor} setValue={setAmountFactor} min={60} max={140} suffix="%" />
        <div className="rounded-md bg-[color:var(--panel-strong)] p-3 text-sm leading-6">
          Current requested amount: <strong>{currency(Math.round(application.requestedAmount * (amountFactor / 100)))}</strong>. Original amount: {currency(application.requestedAmount)}.
        </div>
      </div>
      <div className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <ScoreGauge score={original.totalRiskScore} decision={original.decision} />
          <ScoreGauge score={current.totalRiskScore} decision={current.decision} />
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-black">Score waterfall</h2>
          <SimpleBarChart data={waterfall} xKey="name" yKey="contribution" />
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-black">What changed</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            The original outcome was simulated {original.decision.replace("_", " ")} at {Math.round(original.totalRiskScore)}/100. The tuned scenario is simulated {current.decision.replace("_", " ")} at {Math.round(current.totalRiskScore)}/100.
            Changed signals: debt-to-income weight, recent-defaults weight, and requested amount sensitivity.
          </p>
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, setValue, min = 0, max, suffix = "" }: { label: string; value: number; setValue: (value: number) => void; min?: number; max: number; suffix?: string }) {
  return (
    <label className="label">
      <span className="flex justify-between">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  );
}
