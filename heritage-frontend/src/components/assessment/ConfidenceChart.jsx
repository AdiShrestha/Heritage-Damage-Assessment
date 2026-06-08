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
    <div className="rounded-lg border border-stone-custom-light bg-white px-3 py-2 text-sm shadow-card">
      <p className="font-semibold text-text">{item.class_name}</p>
      <p className="text-text-muted">{item.percentage.toFixed(1)}%</p>
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
      <div className="mb-3 text-sm font-semibold text-text-muted">Class Probabilities</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" horizontal={false} />
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
            tick={{ fill: '#6B6560', fontSize: 12, textAnchor: 'end' }}
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
              fill="#6B6560"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
