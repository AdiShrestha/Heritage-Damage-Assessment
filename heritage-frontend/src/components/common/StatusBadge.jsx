export function StatusBadge({ status, label }) {
  const colors = {
    ok: 'bg-success',
    degraded: 'bg-warning',
    error: 'bg-primary',
    loading: 'bg-stone-custom',
  };

  const animation = status === 'loading' ? 'animate-pulse' : '';

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-text-muted shadow-card">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[status]} ${animation}`} />
      <span>{label}</span>
    </span>
  );
}
