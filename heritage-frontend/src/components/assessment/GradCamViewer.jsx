export function GradCamViewer({ originalSrc, gradcamBase64 }) {
  return (
    <div>
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
              src={`data:image/jpeg;base64,${gradcamBase64}`}
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
      <div className="mt-3 flex items-center gap-2 text-xs italic text-text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#D4A04A]">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 16v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="8" r="0.75" fill="currentColor" />
        </svg>
        Red regions indicate areas most influential to the prediction.
      </div>
    </div>
  );
}
