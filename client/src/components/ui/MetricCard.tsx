import { Card } from './Card';

export const MetricCard = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <Card className="animate-floatIn">
    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    <h3 className="mt-3 text-3xl font-extrabold text-ink dark:text-white">{value}</h3>
    <div className="mt-4 h-px bg-slate-100 dark:bg-slate-800" />
    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
  </Card>
);
