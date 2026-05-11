import { PageHeader } from "@/components/PageHeader";
import { Disclaimer } from "@/components/Disclaimer";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" eyebrow="Simulator controls">
        Runtime configuration for AI provider mode, default policy, demo data, and disclaimer text.
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-black">AI provider</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <Setting label="AI_PROVIDER" value={process.env.AI_PROVIDER || "mock"} />
            <Setting label="OPENAI_BASE_URL" value={process.env.OPENAI_BASE_URL || "not configured"} />
            <Setting label="OPENAI_MODEL" value={process.env.OPENAI_MODEL || "not configured"} />
            <Setting label="Fallback behaviour" value="Mock provider is used when no compatible API key is configured." />
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-black">Scoring mode</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <Setting label="Decision engine" value="Deterministic rules engine" />
            <Setting label="Default policy" value="Balanced" />
            <Setting label="Score range" value="0-39 approve, 40-69 manual review, 70-100 decline" />
            <Setting label="Demo mode" value="Enabled" />
          </dl>
        </div>
        <div className="xl:col-span-2">
          <Disclaimer />
        </div>
      </div>
    </>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[color:var(--muted)]">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
