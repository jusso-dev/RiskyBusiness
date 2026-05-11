import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  children,
  action
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-normal text-[color:var(--accent-strong)]">{eyebrow}</p> : null}
        <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
        {children ? <div className="mt-3 max-w-[72ch] text-sm leading-6 text-[color:var(--muted)]">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
