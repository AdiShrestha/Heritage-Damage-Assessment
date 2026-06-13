import { Printer, ShieldAlert, AlertTriangle, CheckCircle, Clock, Users, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toMs } from '../../utils/format';
import { SeverityBar } from './SeverityBar';

const CRITICALITY_STYLES = {
  LOW: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CheckCircle,
    color: '#10B981',
  },
  MODERATE: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    color: '#F59E0B',
  },
  HIGH: {
    bg: 'bg-orange-50 border-orange-200 text-orange-800',
    icon: ShieldAlert,
    color: '#F97316',
  },
  CRITICAL: {
    bg: 'bg-red-50 border-red-200 text-red-800 animate-pulse',
    icon: ShieldAlert,
    color: '#EF4444',
  },
  UNKNOWN: {
    bg: 'bg-stone-50 border-stone-200 text-stone-800',
    icon: AlertTriangle,
    color: '#78716C',
  },
};

function formatReportDate(isoString) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString));
}

export function ReportViewer({ report }) {
  if (!report) return null;

  const {
    report_id,
    generated_at,
    request_id,
    site = {},
    assessment = {},
    quality = {},
    experts = [],
    trend = null,
    recommendations = [],
    visualization = {},
  } = report;

  const crit = assessment.criticality || 'UNKNOWN';
  const critStyle = CRITICALITY_STYLES[crit] || CRITICALITY_STYLES.UNKNOWN;
  const CritIcon = critStyle.icon;

  const handlePrint = () => {
    window.print();
  };

  // Prepare trend data for Recharts
  const chartData = trend?.history
    ? [...trend.history]
        .reverse() // Sort chronologically (oldest to newest) for chart
        .map((h) => ({
          date: new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          severity: parseFloat((h.severity_score || 0).toFixed(3)),
          class: h.predicted_class,
        }))
    : [];

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-custom-light bg-white p-4 shadow-sm print:hidden">
        <div>
          <h3 className="font-semibold text-text">Assessment Report Generated</h3>
          <p className="text-xs text-text-muted">Print or save this document for conservation planning.</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-[#A63A2A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#8B2A1A]"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </button>
      </div>

      {/* Main Report Document Sheet */}
      <article className="border border-stone-custom-light bg-white p-8 shadow-card rounded-2xl print:border-none print:p-0 print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-[#A63A2A] pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#A63A2A] mb-1">
                <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <rect x="8" y="24" width="48" height="36" rx="2" fill="currentColor" opacity="0.85" />
                  <rect x="14" y="14" width="36" height="12" rx="2" fill="currentColor" opacity="0.7" />
                  <rect x="20" y="6" width="24" height="10" rx="2" fill="currentColor" opacity="0.55" />
                </svg>
                <span className="font-display text-xl font-bold tracking-tight uppercase">Heritage Damage Assessment</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-text">Structural Survey Report</h1>
            </div>
            <div className="text-left sm:text-right text-xs font-mono text-text-muted space-y-0.5">
              <p>REPORT ID: {report_id}</p>
              <p>REQUEST ID: {request_id}</p>
              <p>DATE: {formatReportDate(generated_at)}</p>
            </div>
          </div>
        </div>

        {/* Site Metadata Block */}
        <section className="mt-6 grid gap-4 rounded-xl bg-bg p-5 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Heritage Site Info</h4>
            <div className="space-y-1.5 text-sm">
              <p><span className="font-medium text-text-muted">Site ID:</span> <span className="font-semibold text-text">{site.site_id || 'N/A'}</span></p>
              <p><span className="font-medium text-text-muted">Site Name:</span> <span className="font-semibold text-text">{site.site_name || 'Unnamed Heritage Location'}</span></p>
              <p><span className="font-medium text-text-muted">Surveyor:</span> <span className="text-text">{site.surveyor || 'Not Specified'}</span></p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Field Notes</h4>
            <p className="text-sm italic text-text leading-relaxed">
              {site.notes || 'No notes compiled during this assessment.'}
            </p>
          </div>
        </section>

        {/* Damage Assessment and Severity */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Assessment Overview */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-stone-custom-light pb-2">
              Damage Classification
            </h3>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 rounded-full border px-4 py-2 font-semibold text-sm ${critStyle.bg}`}>
                <CritIcon className="h-5 w-5" />
                <span>Criticality: {crit}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Model Classification</p>
              <p className="font-display text-2xl font-bold text-text">
                {assessment.damage_class} <span className="text-base font-normal text-text-muted">({assessment.confidence_pct}% confidence)</span>
              </p>
            </div>

            {assessment.severity_score !== undefined && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Severity Index</p>
                <SeverityBar score={assessment.severity_score} label={assessment.severity_label} />
                <p className="text-xs text-text-muted italic">
                  Continuous score between 0.0 (Undamaged) and 1.0 (Critical collapse risk).
                </p>
              </div>
            )}
          </section>

          {/* Model Quality Indicators */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-stone-custom-light pb-2">
              Model Diagnostics
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-stone-custom-light p-3">
                <p className="text-xs text-text-muted uppercase font-semibold">Ensemble Model</p>
                <p className="mt-1 font-bold text-text">{quality.model_used}</p>
              </div>
              <div className="rounded-lg border border-stone-custom-light p-3">
                <p className="text-xs text-text-muted uppercase font-semibold">Inference Latency</p>
                <p className="mt-1 font-bold text-text">{toMs(quality.inference_time_ms)}</p>
              </div>
              <div className="rounded-lg border border-stone-custom-light p-3">
                <p className="text-xs text-text-muted uppercase font-semibold">Routing Gate</p>
                <p className="mt-1 font-bold text-text">{quality.used_gate_routing ? 'Active' : 'Bypassed'}</p>
              </div>
              <div className="rounded-lg border border-stone-custom-light p-3">
                <p className="text-xs text-text-muted uppercase font-semibold">Disagreement Score</p>
                <p className="mt-1 font-bold text-text">
                  {quality.disagreement_score != null ? quality.disagreement_score.toFixed(3) : 'N/A'}
                </p>
              </div>
            </div>

            {quality.requires_human_review && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <ShieldAlert className="h-6 w-6 text-[#A63A2A] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#A63A2A] text-sm">Conservation Survey Flagged</h4>
                  <p className="text-xs text-[#8B2A1A] mt-0.5 leading-relaxed">
                    This prediction triggers the human-review flag due to low confidence or high ensemble disagreement. Schedule an expert physical inspection.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Heatmap Visualization */}
        {visualization.gradcam_available && visualization.gradcam_image_base64 && (
          <section className="mt-8">
            <h3 className="text-base font-semibold text-text border-b border-stone-custom-light pb-2 mb-4">
              Visual Focus Analysis (Composite)
            </h3>
            <div className="overflow-hidden rounded-xl border border-stone-custom-light shadow-sm">
              <img
                src={`data:image/png;base64,${visualization.gradcam_image_base64}`}
                alt="Damage heatmap composite"
                className="w-full max-h-[380px] object-contain bg-black/5"
              />
            </div>
            <p className="mt-2 text-xs italic text-text-muted">
              Annotated diagnostic output: Left represents the cropped survey input. Right showcases expert attention activation heatmaps overlaid with detected red bounding boxes.
            </p>
          </section>
        )}

        <div className="pagoda-divider my-8 print:my-6">
          <div className="pagoda-divider-dot" />
        </div>

        {/* Recommendations and Historical Trend */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recommendations list */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-stone-custom-light pb-2">
              Preservation Actions
            </h3>
            <ul className="space-y-2.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A04A]" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Temporal Trend Chart */}
          <section className="space-y-4 print:break-inside-avoid">
            <h3 className="text-base font-semibold text-text border-b border-stone-custom-light pb-2">
              Deterioration Trend
            </h3>
            {trend ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Clock className="h-4 w-4" />
                  <span>{trend.previous_assessments} surveys recorded.</span>
                  <div className="flex items-center gap-1 font-semibold ml-auto">
                    {trend.severity_delta > 0.05 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-[#A63A2A]" />
                        <span className="text-[#A63A2A]">Deteriorating ({trend.severity_delta > 0 ? '+' : ''}{trend.severity_delta.toFixed(3)})</span>
                      </>
                    ) : trend.severity_delta < -0.05 ? (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-600">Improving ({trend.severity_delta.toFixed(3)})</span>
                      </>
                    ) : (
                      <span className="text-text-muted">Stable Condition</span>
                    )}
                  </div>
                </div>

                {chartData.length >= 2 ? (
                  <div className="h-[180px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DCD6" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7A726C' }} />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#7A726C' }} />
                        <Tooltip
                          contentStyle={{ background: '#1C1816', color: '#F5F0EB', borderRadius: '8px', border: 'none' }}
                          labelClassName="font-semibold text-xs"
                          itemStyle={{ fontSize: '11px', color: '#E8C47A' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="severity"
                          stroke="#A63A2A"
                          strokeWidth={2.5}
                          dot={{ r: 4, stroke: '#A63A2A', strokeWidth: 2, fill: '#FFFFFF' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[150px] items-center justify-center rounded-lg bg-bg border border-dashed border-stone-custom-light text-xs text-text-muted">
                    Insufficient data points for graphical plotting.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded-lg bg-bg border border-dashed border-stone-custom-light p-4 text-center text-xs text-text-muted">
                No prior history matching Site ID "{site.site_id || ''}" to calculate degradation curves.
              </div>
            )}
          </section>
        </div>

        {/* Expert Predictions Breakdown Table */}
        <section className="mt-8">
          <h3 className="text-base font-semibold text-text border-b border-stone-custom-light pb-2 mb-4">
            Gate Router & Expert Opinions
          </h3>
          <div className="overflow-x-auto rounded-xl border border-stone-custom-light shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-bg text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-stone-custom-light">
                  <th className="px-4 py-2.5">Expert Model</th>
                  <th className="px-4 py-2.5">Predicted Class</th>
                  <th className="px-4 py-2.5 text-right">Confidence</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-[#A63A2A]">Gate Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-custom-light">
                {experts.map((exp, i) => (
                  <tr key={i} className="hover:bg-bg/40">
                    <td className="px-4 py-3 font-medium text-text">{exp.model}</td>
                    <td className="px-4 py-3 text-text">{exp.prediction}</td>
                    <td className="px-4 py-3 text-right text-text-muted">{exp.confidence_pct}%</td>
                    <td className="px-4 py-3 text-right font-bold text-[#A63A2A]">{exp.gate_weight_pct}%</td>
                  </tr>
                ))}
                {experts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-muted text-xs">
                      Ensemble routing information unavailable for this model.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Printable Footer */}
        <div className="hidden print:block mt-12 pt-6 border-t border-stone-300 text-center text-2xs text-stone-500 font-mono">
          End of Survey report for site: {site.site_name || 'N/A'} (Site ID: {site.site_id || 'N/A'}). Automated AI prediction validated by Mixture of Experts ensemble.
        </div>
      </article>
    </div>
  );
}
