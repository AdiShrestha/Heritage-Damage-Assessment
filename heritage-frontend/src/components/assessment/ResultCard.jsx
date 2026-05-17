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
    <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
      <div className="flex flex-col gap-2 border-b border-stone-custom-light pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-text">Assessment Result</h2>
        <p className="text-sm text-text-muted">
          Inference · {toMs(result.inference_time_ms)} · {result.model_used}
        </p>
      </div>

      <div className="mt-5">
        <DamageLabel label={result.predicted_class} confidence={result.confidence} size="lg" />
      </div>

      <div className="my-5 border-t border-stone-custom-light" />

      <ConfidenceChart probabilities={result.class_probabilities} />

      <div className="my-5 border-t border-stone-custom-light" />

      <GradCamViewer originalSrc={originalSrc} gradcamBase64={result.gradcam_image_base64} />

      <div className="mt-5 flex flex-col gap-2 border-t border-stone-custom-light pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-mono text-text-muted">Request ID: {result.request_id}</p>
        <p className="text-xs text-text-muted">{formatTimestamp(result.timestamp)}</p>
      </div>
    </div>
  );
}
