import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0f766e', '#f59e0b', '#f43f5e', '#38bdf8', '#6366f1'];

export const CategoryPieChart = ({ data }: { data: { category: string; amount: number }[] }) => (
  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" innerRadius={58} outerRadius={90} paddingAngle={5}>
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
