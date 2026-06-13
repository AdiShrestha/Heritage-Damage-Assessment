export function GradCamViewer({ originalSrc, gradcamBase64 }) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] uppercase text-[#9b6b57]">Original</p>
          <img
            src={originalSrc}
            alt="Original heritage structure"
            className="h-[240px] w-full rounded-lg object-cover ring-1 ring-[#d8c5b6]"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] uppercase text-[#9b6b57]">Damage Heatmap</p>
          {gradcamBase64 ? (
            <img
              src={`data:image/jpeg;base64,${gradcamBase64}`}
              alt="Grad-CAM damage heatmap"
              className="h-[240px] w-full rounded-lg object-cover ring-1 ring-[#d8c5b6]"
            />
          ) : (
            <div className="flex h-[240px] w-full items-center justify-center rounded-lg border border-dashed border-[#d8c5b6] bg-[#fffaf3] text-sm text-[#796a62]">
              <span className="heritage-ornament">Heatmap unavailable</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs italic text-[#796a62]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#C99749]">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 16v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="8" r="0.75" fill="currentColor" />
        </svg>
        Red regions indicate areas most influential to the prediction.
      </div>
    </div>
  );
}
