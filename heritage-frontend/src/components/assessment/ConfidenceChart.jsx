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
    <div className="rounded-lg border border-stone-custom-light bg-white px-3 py-2 text-sm shadow-elevated">
      <p className="font-display font-semibold text-text">{item.class_name}</p>
      <p className="text-text-muted">{item.percentage.toFixed(1)}%</p>
    </div>
  );
}

export function ConfidenceChart({ probabilities, compact = false }) {
  const data = probabilities.map((item) => ({
    ...item,
    percentage: item.probability * 100,
  }));

  const chartHeight = compact ? 90 : 160;
  const yAxisWidth = compact ? 90 : 120;

  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-wide uppercase text-text-muted">
        Class Probabilities
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: compact ? 8 : 30, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: compact ? 9 : 11 }}
          />
          <YAxis
            type="category"
            dataKey="class_name"
            width={yAxisWidth}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7A726C', fontSize: compact ? 10 : 12, textAnchor: 'end' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
            {data.map((entry) => (
              <Cell key={entry.class_name} fill={CLASS_CONFIG[entry.class_name]?.color || '#8B2500'} />
            ))}
            {!compact && (
              <LabelList
                dataKey="percentage"
                position="right"
                formatter={(value) => `${value.toFixed(1)}%`}
                fill="#7A726C"
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
