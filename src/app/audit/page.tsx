import { PageHeader } from "@/components/PageHeader";
import { auditLogs } from "@/lib/data";

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit log" eyebrow="Traceability">
        Tracks borrower creation, application submission, scoring, AI note generation, and policy profile changes.
      </PageHeader>
      <div className="panel p-5">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Entity</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString("en-AU")}</td>
                <td className="font-bold">{log.eventType.replaceAll("_", " ")}</td>
                <td>{log.entityType} · {log.entityId}</td>
                <td className="text-sm text-[color:var(--muted)]">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
