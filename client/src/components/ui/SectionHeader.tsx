import type { ReactNode } from 'react';

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-xs">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl md:text-3xl dark:text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-xs text-slate-500 sm:text-sm dark:text-slate-400">{description}</p> : null}
    </div>
    {action ? <div className="w-full sm:w-auto">{action}</div> : null}
  </div>
);
