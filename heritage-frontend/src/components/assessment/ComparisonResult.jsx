import { AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { SeverityBar } from './SeverityBar';

export function ComparisonResult({ result }) {
  const {
    change_label,
    cosine_distance,
    severity_t1,
    severity_t2,
    severity_delta,
    severity_label_t1,
    severity_label_t2,
    predicted_class_t1,
    predicted_class_t2,
    recommendation,
    site_id,
  } = result;

  const getTrendIcon = () => {
    if (severity_delta > 0.1) return <TrendingDown className="h-5 w-5 text-red-600" />;
    if (severity_delta < -0.1) return <TrendingUp className="h-5 w-5 text-green-600" />;
    return <Minus className="h-5 w-5 text-amber-600" />;
  };

  const getChangeColor = () => {
    if (change_label === 'SIGNIFICANT_DETERIORATION') return 'text-red-600';
    if (change_label === 'DETERIORATING') return 'text-orange-600';
    if (change_label === 'SIGNIFICANT_IMPROVEMENT') return 'text-green-600';
    if (change_label === 'IMPROVING') return 'text-emerald-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-6">
      {/* Change Detection Header */}
      <section className="heritage-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getTrendIcon()}
              <h2 className="text-lg font-semibold text-text">Change Detected</h2>
            </div>
            <p className={`text-2xl font-bold ${getChangeColor()}`}>{change_label}</p>
            {site_id && (
              <p className="mt-3 text-xs text-text-muted">Site ID: {site_id}</p>
            )}
          </div>
          <div className="rounded-lg bg-bg p-4 text-center">
            <p className="text-xs font-semibold text-text-muted">Cosine Distance</p>
            <p className="text-xl font-bold text-text mt-1">{cosine_distance.toFixed(3)}</p>
            <p className="text-xs text-text-muted mt-1">Visual Difference</p>
          </div>
        </div>
      </section>

      {/* Severity Comparison */}
      <section className="heritage-card p-6">
        <h3 className="text-sm font-semibold tracking-tight text-text mb-6">
          <span className="heritage-ornament">Severity Analysis</span>
        </h3>
        
        <div className="space-y-6">
          {/* Earlier Survey */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">Earlier Survey</label>
              <span className="text-sm font-semibold text-text-muted">{predicted_class_t1}</span>
            </div>
            <SeverityBar score={severity_t1} label={severity_label_t1} />
          </div>

          {/* Later Survey */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">Later Survey</label>
              <span className="text-sm font-semibold text-text-muted">{predicted_class_t2}</span>
            </div>
            <SeverityBar score={severity_t2} label={severity_label_t2} />
          </div>

          {/* Delta */}
          <div className="rounded-lg bg-bg p-4 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">Change in Severity</label>
              <span className={`text-lg font-bold ${severity_delta > 0 ? 'text-red-600' : severity_delta < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {severity_delta > 0 ? '+' : ''}{severity_delta.toFixed(3)}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {severity_delta > 0.1 ? 'Damage worsening' : severity_delta < -0.1 ? 'Damage improving' : 'Stable condition'}
            </p>
          </div>
        </div>
      </section>

      {/* Recommendation */}
      {recommendation && (
        <section className="heritage-card p-6 border-l-4 border-[#A63A2A]">
          <div className="flex gap-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-[#A63A2A] mt-0.5" />
            <div>
              <h3 className="font-semibold text-text mb-1">Recommendation</h3>
              <p className="text-sm text-text-muted leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
