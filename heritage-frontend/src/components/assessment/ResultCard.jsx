import { DamageLabel } from './DamageLabel';
import { ConfidenceChart } from './ConfidenceChart';
import { GradCamViewer } from './GradCamViewer';
import { toMs } from '../../utils/format';

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function ResultCard({ result, originalSrc }) {
  return (
    <div className="scan-card p-5 sm:p-6">
      <div className="flex flex-col gap-2 border-b border-[#e2d0c0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b6b57]">Result Panel</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#251c19]">Assessment Result</h2>
        </div>
        <p className="text-sm text-[#796a62]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C99749]" />
            {toMs(result.inference_time_ms)} · {result.model_used}
          </span>
        </p>
      </div>

      <div className="mt-5">
        <DamageLabel label={result.predicted_class} confidence={result.confidence} size="lg" />
      </div>

      <div className="pagoda-divider my-5">
        <div className="pagoda-divider-dot" />
      </div>

      <ConfidenceChart probabilities={result.class_probabilities} />

      <div className="pagoda-divider my-5">
        <div className="pagoda-divider-dot" />
      </div>

      <GradCamViewer originalSrc={originalSrc} gradcamBase64={result.gradcam_image_base64} modelUsed={result.model_used} />

      <div className="mt-5 flex flex-col gap-2 border-t border-[#e2d0c0] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-mono text-[#796a62]">Request ID: {result.request_id}</p>
        <p className="text-xs text-[#796a62]">{formatTimestamp(result.timestamp)}</p>
      </div>
    </div>
  );
}
