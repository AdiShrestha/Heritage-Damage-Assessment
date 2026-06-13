import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import {
  LayoutDashboard, Search, AlertCircle, Trash2, Calendar, User, Eye, X,
  Clock, ShieldAlert, BarChart3, Database, RefreshCcw, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toMs } from '../utils/format';

function StatCard({ title, value, subtitle, icon: Icon, colorClass = 'text-[#A63A2A]' }) {
  return (
    <div className="heritage-card p-5 flex items-start justify-between bg-white">
      <div>
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        <p className="font-display text-3xl font-bold text-text mt-1">{value}</p>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-lg bg-stone-50 border border-stone-custom-light ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    loading,
    stats,
    flagged,
    cacheStats,
    searchSiteId,
    setSearchSiteId,
    searchHistory,
    searchTrend,
    searchLoading,
    searchSite,
    clearCache,
    refresh,
  } = useDashboard();

  const [activeModelToClear, setActiveModelToClear] = useState('all');
  const [inspectedPrediction, setInspectedPrediction] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    searchSite(searchSiteId);
  };

  // Prepare trend data for Recharts
  const chartData = searchTrend?.trend
    ? [...searchTrend.trend]
        .reverse()
        .map((h) => ({
          date: new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          severity: parseFloat((h.severity_score || 0).toFixed(3)),
          class: h.predicted_class,
        }))
    : [];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <LayoutDashboard className="h-6 w-6 text-[#A63A2A]" />
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
              Conservation Dashboard
            </h1>
          </div>
          <p className="ml-[52px] text-sm text-text-muted">
            Global monitoring, review queue, temporal trends, and cache metrics.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex-shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 rounded-lg border border-stone-custom-light bg-white px-3 py-2 text-xs font-semibold text-text transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingSpinner label="Loading analytics..." />
        </div>
      ) : (
        <>
          {/* Stats Summary Section */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Assessments"
              value={stats?.total_records ?? 0}
              subtitle="Logged in prediction database"
              icon={BarChart3}
            />
            <StatCard
              title="Review Required"
              value={stats?.flagged_records ?? 0}
              subtitle={`${((stats?.flagged_records / (stats?.total_records || 1)) * 100).toFixed(0)}% of total queue`}
              icon={AlertCircle}
              colorClass="text-amber-600"
            />
            <StatCard
              title="Cached Results"
              value={cacheStats?.live_entries ?? 0}
              subtitle={`TTL: ${cacheStats?.ttl_seconds ?? 0}s | Limit: ${cacheStats?.max_entries ?? 0}`}
              icon={Database}
              colorClass="text-blue-600"
            />
            <StatCard
              title="Critical Structures"
              value={
                Object.entries(stats?.criticality_distribution ?? {}).find(
                  ([k]) => k.toUpperCase() === 'CRITICAL'
                )?.[1] || 0
              }
              subtitle="Requires emergency response"
              icon={ShieldAlert}
              colorClass="text-red-600"
            />
          </section>

          {/* Site Trend Explorer */}
          <section className="grid gap-6 md:grid-cols-3">
            {/* Search Site Column */}
            <div className="heritage-card p-5 space-y-4 md:col-span-1">
              <h3 className="text-sm font-semibold tracking-tight text-text">
                <span className="heritage-ornament">Site Explorer</span>
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Enter a Site ID to inspect history logs and calculate deterioration graphs over time.
              </p>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-custom" />
                  <input
                    type="text"
                    placeholder="e.g. patan_durbar_01"
                    value={searchSiteId}
                    onChange={(e) => setSearchSiteId(e.target.value)}
                    className="w-full rounded-lg border border-stone-custom-light bg-bg pl-9 pr-4 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading || !searchSiteId.trim()}
                  className="rounded-lg bg-[#A63A2A] px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#8B2A1A] disabled:opacity-50"
                >
                  {searchLoading ? '...' : 'Find'}
                </button>
              </form>

              {searchLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <LoadingSpinner size="sm" label="Gathering history..." />
                </div>
              ) : searchHistory.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-stone-custom-light pb-1">
                    Previous Surveys ({searchHistory.length})
                  </h4>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 text-xs">
                    {searchHistory.map((row, idx) => (
                      <div
                        key={idx}
                        onClick={() => setInspectedPrediction(row)}
                        className="group flex flex-col p-2.5 rounded-lg border border-stone-custom-light hover:border-primary bg-bg/20 cursor-pointer transition"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-text">{row.predicted_class}</span>
                          <span className="text-text-muted text-2xs font-mono">
                            {row.severity_score != null ? `Sev: ${row.severity_score.toFixed(2)}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-2xs text-text-muted mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(row.timestamp).toLocaleDateString()}
                          </span>
                          {row.requires_human_review && (
                            <span className="rounded bg-amber-50 px-1 border border-amber-200 text-amber-700 text-3xs font-semibold">
                              ⚠ Flagged
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchSiteId && !searchLoading ? (
                <p className="text-xs text-text-muted text-center py-6">No historical records found for "{searchSiteId}".</p>
              ) : null}
            </div>

            {/* Severity Trend Visualization Column */}
            <div className="heritage-card p-5 md:col-span-2 flex flex-col">
              <h3 className="text-sm font-semibold tracking-tight text-text mb-4">
                <span className="heritage-ornament">Degradation Analysis</span>
              </h3>
              
              {chartData.length >= 2 ? (
                <div className="flex-1 min-h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A63A2A" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#A63A2A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DCD6" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7A726C' }} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#7A726C' }} />
                      <Tooltip
                        contentStyle={{ background: '#1C1816', color: '#F5F0EB', borderRadius: '8px', border: 'none' }}
                        labelClassName="font-semibold text-xs"
                        itemStyle={{ fontSize: '11px', color: '#E8C47A' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="severity"
                        stroke="#A63A2A"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSeverity)"
                        dot={{ r: 4, stroke: '#A63A2A', strokeWidth: 2, fill: '#FFFFFF' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-custom-light bg-bg/50 p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-stone-custom/30 mb-2" />
                  <p className="text-sm font-semibold text-text">Deterioration Curve Graph</p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
                    Visual curve graphs representing structural deterioration over historical surveys are generated when a queried Site ID possesses at least 2 historical records.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {/* Flagged Review Queue */}
            <div className="heritage-card p-5 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-custom-light pb-2">
                <h3 className="text-sm font-semibold tracking-tight text-text">
                  <span className="heritage-ornament">Review Queue</span>
                </h3>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 border border-amber-200 text-amber-700 font-semibold text-2xs">
                  {flagged.length} items flagged
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                {flagged.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-stone-custom-light bg-white shadow-sm hover:border-primary hover:shadow transition gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text">{item.predicted_class}</span>
                        <span className="rounded bg-red-50 border border-red-100 px-1.5 py-0.2 text-[#A63A2A] text-3xs font-semibold uppercase">
                          {item.criticality}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-text-muted font-mono">
                        {item.site_id && <span>Site: {item.site_id}</span>}
                        <span>Conf: {(item.confidence * 100).toFixed(0)}%</span>
                        {item.disagreement_score != null && <span>Disagreement: {item.disagreement_score.toFixed(3)}</span>}
                      </div>
                      <p className="text-3xs text-text-muted mt-1">
                        Recorded on {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setInspectedPrediction(item)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-custom-light bg-bg hover:border-primary hover:text-primary transition-all px-3 py-2 text-xs font-semibold text-text"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect Heatmap
                    </button>
                  </div>
                ))}

                {flagged.length === 0 && (
                  <div className="text-center text-text-muted py-12 text-xs">
                    All clear! No predictions currently require human review.
                  </div>
                )}
              </div>
            </div>

            {/* Cache Control Panel */}
            <div className="heritage-card p-5 space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-text">
                <span className="heritage-ornament">Inference Cache Admin</span>
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Inference caching speeds up redundant reviews. Invalidating the cache ensures re-loaded weights are active immediately.
              </p>

              <div className="rounded-xl border border-stone-custom-light bg-bg/50 p-4 space-y-2.5 text-xs text-text">
                <div className="flex justify-between">
                  <span className="text-text-muted">Live Cached Entries:</span>
                  <span className="font-bold">{cacheStats?.live_entries ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Expired Entries:</span>
                  <span className="font-bold">{cacheStats?.expired_entries ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">TTL configuration:</span>
                  <span className="font-semibold">{cacheStats?.ttl_seconds ?? 0}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Max capacity:</span>
                  <span className="font-semibold">{cacheStats?.max_entries ?? 0} items</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="clear-model-select" className="block text-2xs font-semibold text-text-muted uppercase">Select Scope</label>
                <select
                  id="clear-model-select"
                  value={activeModelToClear}
                  onChange={(e) => setActiveModelToClear(e.target.value)}
                  className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#A63A2A]"
                >
                  <option value="all">Entire Cache (All Models)</option>
                  <option value="moe">Mixture of Experts (moe)</option>
                  <option value="yolo_damage">YOLO Damaged Bboxes (yolo_damage)</option>
                  <option value="resnet50">ResNet-50</option>
                  <option value="efficientnet_b4">EfficientNet-B4</option>
                  <option value="vit_b16">Vision Transformer B/16</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => clearCache(activeModelToClear === 'all' ? null : activeModelToClear)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#A63A2A]/40 text-[#A63A2A] bg-red-50 hover:bg-[#A63A2A] hover:text-white transition-all px-4 py-2.5 text-xs font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                Clear Selection
              </button>
            </div>
          </section>
        </>
      )}

      {/* Flagged Item Diagnostics Modal / Inspector */}
      {inspectedPrediction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-custom-light overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-custom-light px-5 py-4 bg-bg">
              <div>
                <h3 className="font-display font-semibold text-text text-base">Inference Diagnostic Inspection</h3>
                <p className="text-3xs font-mono text-text-muted mt-0.5">REQ: {inspectedPrediction.request_id || inspectedPrediction.request_id}</p>
              </div>
              <button
                onClick={() => setInspectedPrediction(null)}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-custom transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-3xs uppercase font-semibold text-text-muted">Prediction Assessment</p>
                  <p className="font-display font-bold text-lg text-text">
                    {inspectedPrediction.predicted_class}
                  </p>
                  <div className="text-xs flex items-center gap-1 text-text-muted mt-0.5">
                    <span>Severity: <strong>{inspectedPrediction.severity_label || inspectedPrediction.severity_label || 'N/A'}</strong></span>
                    {inspectedPrediction.severity_score !== undefined && (
                      <span className="font-mono">({inspectedPrediction.severity_score.toFixed(3)})</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-left sm:text-right">
                  <p className="text-3xs uppercase font-semibold text-text-muted">Review Reason</p>
                  {inspectedPrediction.requires_human_review ? (
                    <span className="inline-flex rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[#A63A2A] text-2xs font-semibold font-sans">
                      Low Confidence / Disagreement
                    </span>
                  ) : (
                    <span className="inline-flex rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800 text-2xs font-semibold font-sans">
                      Confidence acceptable
                    </span>
                  )}
                </div>
              </div>

              {/* Heatmap preview */}
              {inspectedPrediction.gradcam_image_base64 && (
                <div>
                  <p className="text-3xs uppercase font-semibold text-text-muted mb-2">Diagnostic Damage Heatmap</p>
                  <div className="rounded-xl overflow-hidden border border-stone-custom-light bg-black/5 flex justify-center max-h-[300px]">
                    <img
                      src={`data:image/png;base64,${inspectedPrediction.gradcam_image_base64}`}
                      alt="Prediction Diagnostic heatmap"
                      className="object-contain h-full w-full"
                    />
                  </div>
                </div>
              )}

              {/* Expert Vote metrics */}
              {inspectedPrediction.expert_votes && (
                <div className="rounded-xl border border-stone-custom-light p-4 space-y-2">
                  <p className="text-3xs uppercase font-semibold text-text-muted">mixture of experts - voting distribution</p>
                  <div className="grid gap-2">
                    {Object.entries(inspectedPrediction.expert_votes).map(([cls, votes]) => (
                      <div key={cls} className="flex items-center text-xs justify-between">
                        <span className="font-medium text-text">{cls}</span>
                        <span className="font-bold font-mono text-[#A63A2A]">{votes} / 4 experts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detections */}
              {inspectedPrediction.detections && inspectedPrediction.detections.length > 0 && (
                <div className="space-y-2">
                  <p className="text-3xs uppercase font-semibold text-text-muted">yolo damage detections ({inspectedPrediction.detections.length})</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {inspectedPrediction.detections.map((det, idx) => (
                      <div key={idx} className="rounded-lg bg-bg p-2 text-2xs flex justify-between items-center border border-stone-custom-light">
                        <span className="font-semibold text-[#A63A2A]">{det.damage_type}</span>
                        <span className="text-text-muted">Conf: {(det.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone-custom-light px-5 py-4 flex justify-end bg-bg">
              <button
                onClick={() => setInspectedPrediction(null)}
                className="rounded-lg border border-stone-custom-light bg-white px-4 py-2 text-xs font-semibold text-text hover:border-primary hover:text-primary transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
