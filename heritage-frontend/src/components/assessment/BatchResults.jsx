import { AlertTriangle, CheckCircle, ShieldX } from 'lucide-react';
import { DamageLabel } from './DamageLabel';
import { SeverityBar } from './SeverityBar';
import { ConfidenceChart } from './ConfidenceChart';

const CLASS_ICON = {
  Undamaged: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  'Partial Damage': <AlertTriangle className="h-4 w-4 text-amber-600" />,
  Damaged: <ShieldX className="h-4 w-4 text-[#A63A2A]" />,
};

const CRITICALITY_COLOR = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MODERATE: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-[#A63A2A] border-red-200',
};

function SummaryStats({ summary, total }) {
  const dist = summary?.class_distribution ?? {};
  const crit = summary?.criticality_distribution ?? {};

  return (
    <section className="heritage-card p-6">
      <h2 className="text-sm font-semibold tracking-tight text-text mb-5">
        <span className="heritage-ornament">Batch Summary</span>
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-bg p-4 text-center">
          <p className="text-2xl font-bold text-text">{total}</p>
          <p className="mt-1 text-xs text-text-muted">Images Assessed</p>
        </div>
        {Object.entries(dist).map(([cls, count]) => (
          <div key={cls} className="rounded-lg bg-bg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {CLASS_ICON[cls]}
              <p className="text-2xl font-bold text-text">{count}</p>
            </div>
            <p className="text-xs text-text-muted">{cls}</p>
          </div>
        ))}
      </div>

      {summary?.highest_priority_file && (
        <div className="mt-4 rounded-lg border border-[#A63A2A]/20 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Highest Priority
          </p>
          <p className="text-sm font-semibold text-[#A63A2A] truncate">
            {summary.highest_priority_file}
          </p>
        </div>
      )}
    </section>
  );
}

function BatchItemCard({ item, index }) {
  const critClass =
    CRITICALITY_COLOR[item.criticality] ?? 'bg-bg text-text-muted border-stone-200';

  return (
    <article className="heritage-card p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-text-muted">
            {index + 1}
          </span>
          <p className="truncate text-sm font-semibold text-text" title={item.filename}>
            {item.filename}
          </p>
        </div>
        {item.criticality && (
          <span
            className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${critClass}`}
          >
            {item.criticality}
          </span>
        )}
      </div>

      <DamageLabel label={item.predicted_class} confidence={item.confidence} size="sm" />

      {item.severity_score != null && (
        <div className="mt-3">
          <SeverityBar score={item.severity_score} label={item.severity_label} />
        </div>
      )}

      {item.class_probabilities?.length > 0 && (
        <div className="mt-3">
          <ConfidenceChart probabilities={item.class_probabilities} compact />
        </div>
      )}

      {item.gradcam_image_base64 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-text-muted mb-1.5">Grad-CAM</p>
          <img
            src={`data:image/png;base64,${item.gradcam_image_base64}`}
            alt={`Grad-CAM for ${item.filename}`}
            className="w-full rounded-lg object-cover"
            loading="lazy"
          />
        </div>
      )}

      <p className="mt-3 text-xs text-text-muted font-mono truncate">
        {item.inference_time_ms != null ? `${item.inference_time_ms.toFixed(0)} ms` : ''}
        {item.requires_human_review && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 font-sans font-semibold">
            ⚠ Review Required
          </span>
        )}
      </p>
    </article>
  );
}

export function BatchResults({ results }) {
  const items = results?.results ?? [];
  const summary = results?.summary;

  return (
    <div className="space-y-6">
      <SummaryStats summary={summary} total={items.length} />

      <div>
        <h2 className="text-sm font-semibold tracking-tight text-text mb-4">
          <span className="heritage-ornament">
            Results — sorted by severity (highest first)
          </span>
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <BatchItemCard key={item.filename ?? i} item={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
