import { AlertTriangle, ShieldCheck, ShieldX } from 'lucide-react';
import { CLASS_CONFIG } from '../../constants';
import { toPercent } from '../../utils/format';

const ICONS = {
  ShieldCheck,
  AlertTriangle,
  ShieldX,
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

export function DamageLabel({ label, confidence, size = 'md' }) {
  const config = CLASS_CONFIG[label] || CLASS_CONFIG.Damaged;
  const Icon = ICONS[config.icon] || ShieldX;

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border shadow-card ${sizeClasses[size]}`}
      style={{
        borderLeft: `4px solid ${config.color}`,
        borderColor: config.borderColor,
        backgroundColor: config.bgColor,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" style={{ color: config.color }} />
        <span className="truncate font-semibold text-text">{label}</span>
      </div>
      <span className="shrink-0 font-semibold" style={{ color: config.color }}>
        {toPercent(confidence)}
      </span>
    </div>
  );
}
