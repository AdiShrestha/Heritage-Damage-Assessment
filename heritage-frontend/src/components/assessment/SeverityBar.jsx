export function SeverityBar({ score, label }) {
  const getColor = (value) => {
    if (value < 0.2) return 'bg-green-500';
    if (value < 0.4) return 'bg-emerald-500';
    if (value < 0.6) return 'bg-amber-500';
    if (value < 0.8) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getColorText = (value) => {
    if (value < 0.2) return 'text-green-600';
    if (value < 0.4) return 'text-emerald-600';
    if (value < 0.6) return 'text-amber-600';
    if (value < 0.8) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-12 rounded bg-bg px-1.5 py-1 text-center font-semibold">
            {(score * 100).toFixed(0)}%
          </div>
          <span className={`font-medium ${getColorText(score)}`}>{label}</span>
        </div>
      </div>
      <div className="h-3 w-full rounded-full bg-stone-custom-light overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
}
