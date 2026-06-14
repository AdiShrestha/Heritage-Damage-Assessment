export function GradCamViewer({ originalSrc, gradcamBase64, modelUsed }) {
  const isMoe = modelUsed === 'moe';

  return (
    <div>
      {isMoe ? (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-text-muted">
            Mixture of Experts Diagnostic Sheet
          </p>
          {gradcamBase64 ? (
            <div className="overflow-hidden rounded-xl border border-stone-custom-light bg-[#121218] p-2 shadow-sm">
              <img
                src={`data:image/png;base64,${gradcamBase64}`}
                alt="MoE Diagnostic sheet"
                className="w-full max-h-[380px] object-contain mx-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="flex h-[240px] w-full items-center justify-center rounded-lg border border-dashed border-stone-custom-light bg-bg text-sm text-text-muted">
              <span className="heritage-ornament">Diagnostic sheet unavailable</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-text-muted">Original</p>
            <img
              src={originalSrc}
              alt="Original heritage structure"
              className="h-[240px] w-full rounded-lg object-cover ring-1 ring-stone-custom-light"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-text-muted">Damage Heatmap</p>
            {gradcamBase64 ? (
              <img
                src={`data:image/png;base64,${gradcamBase64}`}
                alt="Grad-CAM damage heatmap"
                className="h-[240px] w-full rounded-lg object-cover ring-1 ring-stone-custom-light"
              />
            ) : (
              <div className="flex h-[240px] w-full items-center justify-center rounded-lg border border-dashed border-stone-custom-light bg-bg text-sm text-text-muted">
                <span className="heritage-ornament">Heatmap unavailable</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs italic text-text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#D4A04A]">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 16v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="8" r="0.75" fill="currentColor" />
        </svg>
        {isMoe
          ? "The MoE diagnostic shows the original survey image, attention heatmap, and relative expert weights."
          : "Red regions indicate areas most influential to the prediction."}
      </div>
    </div>
  );
}
