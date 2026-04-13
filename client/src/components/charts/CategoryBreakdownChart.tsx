import { formatCurrency } from '../../lib/utils';

const COLORS = ['bg-emerald-500', 'bg-amber-400', 'bg-rose-400', 'bg-sky-400', 'bg-indigo-400'];

export const CategoryBreakdownChart = ({ data }: { data: { category: string; amount: number }[] }) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (!data.length || !total) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        Add expenses to see category distribution.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = total ? Math.round((item.amount / total) * 100) : 0;

        return (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${COLORS[index % COLORS.length]}`} />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.category}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                <span className="ml-2 text-slate-400">{percentage}%</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-2 rounded-full ${COLORS[index % COLORS.length]}`} style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
