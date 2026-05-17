import { InfoTooltip } from '../common/InfoTooltip';

export function GradCamViewer({ originalSrc, gradcamBase64 }) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold text-text-muted">Original Image</div>
          <img
            src={originalSrc}
            alt="Original heritage structure"
            className="h-[240px] w-full rounded-lg object-cover"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-muted">
            <span>Damage Heatmap</span>
            <InfoTooltip text="Grad-CAM highlights image regions that most influenced the prediction." />
          </div>
          {gradcamBase64 ? (
            <img
              src={`data:image/jpeg;base64,${gradcamBase64}`}
              alt="Grad-CAM damage heatmap"
              className="h-[240px] w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-[240px] w-full items-center justify-center rounded-lg border border-dashed border-stone-custom-light bg-bg text-sm text-text-muted">
              Heatmap unavailable
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm italic text-text-muted">
        Red regions indicate areas most influential to the prediction.
      </p>
    </div>
  );
}
