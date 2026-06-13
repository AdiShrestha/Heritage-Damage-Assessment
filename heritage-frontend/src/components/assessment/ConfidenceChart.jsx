import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
  Cell,
} from 'recharts';
import { CLASS_CONFIG } from '../../constants';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#d8c5b6] bg-[#fffaf3] px-3 py-2 text-sm shadow-elevated">
      <p className="font-display font-semibold text-[#251c19]">{item.class_name}</p>
      <p className="text-[#796a62]">{item.percentage.toFixed(1)}%</p>
    </div>
  );
}

export function ConfidenceChart({ probabilities }) {
  const data = probabilities.map((item) => ({
    ...item,
    percentage: item.probability * 100,
  }));

  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-[0.16em] uppercase text-[#9b6b57]">
        Class Probabilities
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3D4C6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="class_name"
            width={120}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#796A62', fontSize: 12, textAnchor: 'end' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
            {data.map((entry) => (
              <Cell key={entry.class_name} fill={CLASS_CONFIG[entry.class_name]?.color || '#8B2500'} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(value) => `${value.toFixed(1)}%`}
              fill="#796A62"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
