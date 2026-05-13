"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, formatHttpError } from "@/lib/client";
import type { Borrower, RiskPolicyProfile } from "@/types/domain";

export function BorrowerForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const body = Object.fromEntries(formData.entries());
      await apiFetch("/api/borrowers", { method: "POST", body: JSON.stringify(body) });
      router.refresh();
    } catch (err) {
      setError(formatHttpError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="panel grid gap-4 p-5">
      <h2 className="text-lg font-black">Create simulated borrower</h2>
      <div className="form-grid">
        <Field name="firstName" label="First name" defaultValue="Taylor" />
        <Field name="lastName" label="Last name" defaultValue="Morgan" />
        <Field name="age" label="Age" type="number" defaultValue="33" />
        <Select name="employmentStatus" label="Employment" values={["employed", "self_employed", "contract", "unemployed", "retired"]} />
        <Field name="employmentLengthMonths" label="Employment months" type="number" defaultValue="30" />
        <Field name="annualIncome" label="Annual income" type="number" defaultValue="95000" />
        <Field name="monthlyIncome" label="Monthly income" type="number" defaultValue="7917" />
        <Field name="monthlyExpenses" label="Monthly expenses" type="number" defaultValue="4300" />
        <Field name="existingDebtMonthlyPayments" label="Debt payments" type="number" defaultValue="1100" />
        <Field name="creditScore" label="Credit score" type="number" defaultValue="690" />
        <Field name="creditHistoryLengthMonths" label="Credit history months" type="number" defaultValue="72" />
        <Field name="recentDefaultsCount" label="Recent defaults" type="number" defaultValue="0" />
        <Field name="recentHardInquiriesCount" label="Hard inquiries" type="number" defaultValue="2" />
        <Field name="addressStabilityMonths" label="Address months" type="number" defaultValue="24" />
        <Field name="dependants" label="Dependants" type="number" defaultValue="1" />
        <Field name="residencyStatus" label="Residency" defaultValue="Citizen" />
        <Field name="industry" label="Industry" defaultValue="Technology" />
        <Field name="savingsBalance" label="Savings" type="number" defaultValue="12000" />
        <Select name="bankTransactionRiskLevel" label="Transaction risk" values={["low", "medium", "high"]} />
      </div>
      <label className="label">
        Notes
        <textarea name="notes" className="input min-h-20" defaultValue="Synthetic profile for simulator testing." />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-bold text-[color:var(--red)]">
          {error}
        </p>
      ) : null}
      <button className="button w-fit" disabled={busy}>
        {busy ? "Creating..." : "Create borrower"}
      </button>
    </form>
  );
}

export function ApplicationForm({ borrowers }: { borrowers: Borrower[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const body = Object.fromEntries(formData.entries());
      await apiFetch("/api/applications", { method: "POST", body: JSON.stringify(body) });
      router.refresh();
    } catch (err) {
      setError(formatHttpError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="panel grid gap-4 p-4">
      <div>
        <h2 className="text-base font-black">Create application</h2>
        <p className="mt-1 text-sm leading-5 text-[color:var(--muted)]">Quick synthetic scenario. Advanced values can stay as defaults.</p>
      </div>
      <div className="grid gap-3">
        <label className="label">
          Borrower
          <select name="borrowerId" className="input">
            {borrowers.map((borrower) => (
              <option key={borrower.id} value={borrower.id}>
                {borrower.firstName} {borrower.lastName}
              </option>
            ))}
          </select>
        </label>
        <Select name="loanType" label="Loan type" values={["personal_loan", "car_loan", "business_loan", "equipment_finance", "debt_consolidation"]} />
        <Field name="requestedAmount" label="Requested amount" type="number" defaultValue="32000" />
        <div className="grid grid-cols-2 gap-3">
          <Field name="requestedTermMonths" label="Term" type="number" defaultValue="48" />
          <Field name="interestRateEstimate" label="Rate" type="number" defaultValue="12.4" />
        </div>
        <Field name="declaredPurpose" label="Purpose" defaultValue="Demo scenario" />
      </div>
      <details className="rounded-md border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-3">
        <summary className="cursor-pointer text-sm font-black">Collateral and status</summary>
        <div className="mt-3 grid gap-3">
          <Field name="collateralType" label="Collateral type" defaultValue="none" />
          <Field name="collateralValue" label="Collateral value" type="number" defaultValue="0" />
        </div>
      </details>
      {error ? (
        <p role="alert" className="text-sm font-bold text-[color:var(--red)]">
          {error}
        </p>
      ) : null}
      <button className="button w-fit" disabled={busy}>
        {busy ? "Creating..." : "Create application"}
      </button>
    </form>
  );
}

export function PolicyEditor({ policy }: { policy: RiskPolicyProfile }) {
  const router = useRouter();
  const [draft, setDraft] = useState(policy);
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/risk-policies/${policy.id}`, { method: "PUT", body: JSON.stringify(draft) });
      setSaved(true);
      router.refresh();
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
          <h2 className="text-lg font-black">{draft.name}</h2>
          <p className="text-sm text-[color:var(--muted)]">{draft.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {!saved ? <span className="text-xs font-bold text-[color:var(--amber)]">Unsaved changes</span> : null}
          <button
            className="button secondary"
            onClick={() => {
              setDraft(policy);
              setSaved(true);
              setError(null);
            }}
            disabled={busy}
          >
            Reset
          </button>
          <button className="button" onClick={save} disabled={busy || saved}>
            {busy ? "Saving..." : "Save version"}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-bold text-[color:var(--red)]">
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4">
        {draft.signalConfigs.map((config) => (
          <div key={config.signalKey} className="grid gap-2 border-t border-[color:var(--line)] pt-4 md:grid-cols-[190px_1fr_76px] md:items-center">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    signalConfigs: draft.signalConfigs.map((item) => (item.signalKey === config.signalKey ? { ...item, enabled: event.target.checked } : item))
                  });
                  setSaved(false);
                }}
              />
              {config.signalKey.replaceAll("_", " ")}
            </label>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={config.weight}
              onChange={(event) => {
                setDraft({
                  ...draft,
                  signalConfigs: draft.signalConfigs.map((item) => (item.signalKey === config.signalKey ? { ...item, weight: Number(event.target.value) } : item))
                });
                setSaved(false);
              }}
            />
            <span className="text-right text-sm font-black">{config.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", defaultValue }: { name: string; label: string; type?: string; defaultValue: string }) {
  return (
    <label className="label">
      {label}
      <input className="input" name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}

function Select({ name, label, values }: { name: string; label: string; values: string[] }) {
  return (
    <label className="label">
      {label}
      <select name={name} className="input">
        {values.map((value) => (
          <option key={value} value={value}>
            {value.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
