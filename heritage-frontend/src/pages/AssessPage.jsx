import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronRight,
  Landmark,
  MapPin,
  ScanLine,
  ShieldCheck,
  ShieldX,
  Sparkles,
  X,
  FileText,
} from "lucide-react";
import { usePrediction } from "../hooks/usePrediction";
import { useModels } from "../hooks/useModels";
import { ImageDropzone } from "../components/upload/ImageDropzone";
import { ModelSelector } from "../components/assessment/ModelSelector";
import { ResultCard } from "../components/assessment/ResultCard";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ReportViewer } from "../components/assessment/ReportViewer";
import { formatFileSize } from "../utils/image";

function MiniTempleIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M40 6l5 7h-10l5-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M23 20h34l8 7H15l8-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M27 29h26v16H27V29Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18 48h44l9 8H9l9-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M22 57h36v14H22V57Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M35 71V60h10v11M31 36h18M33 63h14"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function StupaLineArt() {
  return (
    <svg
      viewBox="0 0 600 420"
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* Radiating prayer-flag / spire lines */}
      <g
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
        strokeLinecap="round"
      >
        <path d="M300 30L60 230" />
        <path d="M300 30L120 250" />
        <path d="M300 30L180 268" />
        <path d="M300 30L240 282" />
        <path d="M300 30L540 230" />
        <path d="M300 30L480 250" />
        <path d="M300 30L420 268" />
        <path d="M300 30L360 282" />
      </g>
      {/* Beaded prayer flag dots */}
      <g fill="currentColor" opacity="0.6">
        {[0.18, 0.32, 0.46, 0.6, 0.74, 0.88].map((t, i) => {
          const x1 = 300,
            y1 = 30,
            x2 = 70,
            y2 = 226;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          return <circle key={`l${i}`} cx={x} cy={y} r="2.5" />;
        })}
        {[0.18, 0.32, 0.46, 0.6, 0.74, 0.88].map((t, i) => {
          const x1 = 300,
            y1 = 30,
            x2 = 530,
            y2 = 226;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          return <circle key={`r${i}`} cx={x} cy={y} r="2.5" />;
        })}
      </g>

      {/* Spire / finial */}
      <path
        d="M300 28 L294 70 L306 70 Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M288 72h24v10h-24z" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M282 86h36"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Harmika (square tower with eyes) */}
      <path d="M250 92h100v58h-100z" stroke="currentColor" strokeWidth="2.4" />
      <path d="M250 150l8 8h84l8-8" stroke="currentColor" strokeWidth="2" />
      {/* Buddha eyes */}
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M268 112c5-7 12-7 17 0" />
        <path d="M315 112c5-7 12-7 17 0" />
        <circle cx="277" cy="113" r="2" fill="currentColor" stroke="none" />
        <circle cx="324" cy="113" r="2" fill="currentColor" stroke="none" />
        <path d="M295 118l3 6h-6z" />
      </g>
      <path
        d="M262 130h76M262 140h76"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.5"
      />

      {/* Dome (anda) */}
      <path
        d="M150 270c0-72 67-128 150-128s150 56 150 128"
        stroke="currentColor"
        strokeWidth="2.6"
      />
      {/* Dome shading hatch lines */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.35">
        <path d="M175 265c5-55 60-105 125-115" />
        <path d="M195 268c8-48 55-92 110-103" />
        <path d="M215 270c10-40 50-78 95-90" />
        <path d="M235 272c12-32 45-64 80-76" />
        <path d="M255 274c14-24 40-50 65-62" />
      </g>
      <g stroke="currentColor" strokeWidth="1" opacity="0.3">
        <path d="M425 265c-5-55-60-105-125-115" />
        <path d="M405 268c-8-48-55-92-110-103" />
        <path d="M385 270c-10-40-50-78-95-90" />
        <path d="M365 272c-12-32-45-64-80-76" />
        <path d="M345 274c-14-24-40-50-65-62" />
      </g>

      {/* Base plinth tiers */}
      <path
        d="M125 270h350"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M105 290h390v14H105z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M85 318h430v16H85z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M65 348h470v18H65z" stroke="currentColor" strokeWidth="2.2" />

      {/* Steps / niches detail */}
      <g stroke="currentColor" strokeWidth="1.4" opacity="0.5">
        <path d="M125 297h350" />
        <path d="M105 325h390" />
        <path d="M85 356h430" />
        {[140, 200, 260, 340, 400, 460].map((x) => (
          <path key={x} d={`M${x} 290v14`} />
        ))}
      </g>

      {/* Small flanking shrines */}
      <g stroke="currentColor" strokeWidth="2" opacity="0.7">
        <path d="M30 330l25-22 25 22z" />
        <path d="M35 330h40v36H35z" />
        <path d="M520 330l25-22 25 22z" />
        <path d="M525 330h40v36H525z" />
      </g>

      {/* Ground line */}
      <path
        d="M40 366h520"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function RiskCurve({ score }) {
  const value = Math.round(score);

  return (
    <div className="scan-card min-h-[248px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f6757]">
            Assessment Signal
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[#251c19]">
            Heritage Risk Index
          </h2>
        </div>
        <span className="rounded-full border border-[#dbc1a9] bg-[#fff7ed] px-3 py-1 text-xs font-semibold text-[#7f321f]">
          Live
        </span>
      </div>

      <div className="relative mt-5 h-36 overflow-hidden rounded-lg border border-[#e6d5c5] bg-[#fffaf3]">
        <svg
          viewBox="0 0 560 150"
          className="h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[25, 55, 85, 115].map((y) => (
            <path
              key={y}
              d={`M30 ${y}H530`}
              stroke="#d9c6b6"
              strokeDasharray="6 8"
              strokeWidth="1.5"
            />
          ))}
          <path
            d="M30 104 C64 114 76 36 111 48 C146 60 147 118 183 111 C211 106 209 48 241 58 C272 67 279 100 309 82 C336 65 341 24 371 39 C402 55 395 111 428 108 C459 105 467 46 498 61 C516 70 520 91 530 79"
            stroke="#402722"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M371 39V116"
            stroke="#a4432d"
            strokeDasharray="7 7"
            strokeWidth="2"
            opacity="0.75"
          />
          <circle cx="371" cy="39" r="6" fill="#a4432d" />
        </svg>
        <div className="absolute left-[60%] top-3 -translate-x-1/2 rounded-lg bg-[#a4432d] px-3 py-2 text-sm font-semibold text-white shadow-lg">
          {value}% confidence
        </div>
      </div>
    </div>
  );
}

function HeritageIconTile({ icon: Icon, label, value, tone = "brick" }) {
  const toneClass =
    tone === "green"
      ? "text-[#256143] bg-[#e9f3ec]"
      : tone === "gold"
        ? "text-[#8b5b14] bg-[#fff2d5]"
        : "text-[#8f321f] bg-[#fae7df]";

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-[#e3d4c6] bg-white/75 p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#b87152] hover:bg-white">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[#8a7870]">{label}</p>
        <p className="truncate text-sm font-semibold text-[#251c19]">{value}</p>
      </div>
    </div>
  );
}

export default function AssessPage() {
  const { models } = useModels();
  const {
    status,
    result,
    error,
    selectedFile,
    previewURL,
    selectedModel,
    isReportMode,
    siteId,
    siteName,
    surveyor,
    notes,
    setFile,
    setModel,
    setIsReportMode,
    setSiteId,
    setSiteName,
    setSurveyor,
    setNotes,
    run,
    reset,
  } = usePrediction();
  
  const [previewLabel, setPreviewLabel] = useState(null);

  function handleFile(file) {
    setPreviewLabel({ name: file.name, size: file.size });
    setFile(file);
  }

  function handleReset() {
    setPreviewLabel(null);
    reset();
  }

  const showEmptyState = (status === "idle" || status === "error") && !result;
  const confidenceScore = result
    ? result.confidence * 100
    : selectedFile
      ? 62
      : 38;

  return (
    <div className="space-y-5">
      <section className="dashboard-shell overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_260px] xl:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
            <div className="window-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#a4432d] text-white shadow-sm">
                  <MiniTempleIcon className="h-8 w-8" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6b57]">
                    Kathmandu Valley
                  </p>
                  <h1 className="font-display text-2xl font-semibold text-[#251c19]">
                    Damage Assessment
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#796a62]">
                AI-assisted inspection for temples, stupas, courtyards, and
                carved facade details.
              </p>
            </div>

            <div className="space-y-3">
              <HeritageIconTile
                icon={Landmark}
                label="Site Type"
                value="Temple / Monument"
              />
              <HeritageIconTile
                icon={MapPin}
                label="Region Context"
                value="Heritage Core"
                tone="gold"
              />
              <HeritageIconTile
                icon={ShieldCheck}
                label="Model State"
                value={status === "loading" ? "Scanning" : "Ready"}
                tone="green"
              />
            </div>

            <section className="window-card p-4">
              <h2 className="text-sm font-semibold text-[#251c19]">
                <span className="heritage-ornament">Model</span>
              </h2>
              <div className="mt-4">
                <ModelSelector
                  value={selectedModel}
                  onChange={setModel}
                  models={models}
                  disabled={status === "loading"}
                />
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="scan-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 border-b border-[#e2d0c0] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b6b57]">
                    Image Intake
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#251c19]">
                    Upload Heritage Photograph
                  </h2>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#e2d0c0] bg-white px-3 py-1.5 text-xs font-medium text-[#6f5d54]">
                    <Camera className="h-3.5 w-3.5" />
                    JPEG / PNG / WebP
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <ImageDropzone
                  onFile={handleFile}
                  disabled={status === "loading"}
                />
              </div>

              {selectedFile ? (
                <div className="mt-4 rounded-lg border border-[#decbbb] bg-[#fffaf3] p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewURL}
                      alt="Selected heritage preview"
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-[#d8c5b6]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#251c19]">
                        {previewLabel?.name}
                      </p>
                      <p className="mt-1 text-xs text-[#8a7870]">
                        {formatFileSize(previewLabel?.size || 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dac4b2] text-[#7c6256] transition duration-200 hover:border-[#a4432d] hover:bg-white hover:text-[#a4432d]"
                      aria-label="Remove selected image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Report Options Card */}
            <section className="heritage-card p-5 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-text">
                <span className="heritage-ornament">Assessment Options</span>
              </h2>
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="isReportMode"
                  type="checkbox"
                  checked={isReportMode}
                  onChange={(e) => setIsReportMode(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-custom-light text-[#A63A2A] focus:ring-[#A63A2A]/20"
                  disabled={status === 'loading'}
                />
                <label htmlFor="isReportMode" className="text-xs font-semibold text-text flex items-center gap-1.5 cursor-pointer">
                  <FileText className="h-3.5 w-3.5 text-[#A63A2A]" />
                  Generate Structured Report
                </label>
              </div>

              {isReportMode && (
                <div className="mt-3 space-y-3 border-t border-stone-custom-light pt-3 text-xs fade-in">
                  <div>
                    <label htmlFor="siteId" className="block font-medium text-text-muted mb-1">Site ID</label>
                    <input
                      id="siteId"
                      type="text"
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      placeholder="e.g. patan_durbar_01"
                      className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>
                  <div>
                    <label htmlFor="siteName" className="block font-medium text-text-muted mb-1">Site Name</label>
                    <input
                      id="siteName"
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="e.g. Patan Durbar Square"
                      className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>
                  <div>
                    <label htmlFor="surveyor" className="block font-medium text-text-muted mb-1">Surveyor Name</label>
                    <input
                      id="surveyor"
                      type="text"
                      value={surveyor}
                      onChange={(e) => setSurveyor(e.target.value)}
                      placeholder="e.g. Ar. Rajesh Shrestha"
                      className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block font-medium text-text-muted mb-1">Field Notes</label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe cracks, weathering, or stability concerns..."
                      rows="3"
                      className="w-full rounded-lg border border-stone-custom-light bg-bg px-3 py-2 text-xs text-text placeholder-text-muted focus:border-primary focus:outline-none"
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Trigger Card */}
            <section className="heritage-card p-5">
              <button
                type="button"
                onClick={run}
                disabled={!selectedFile || status === 'loading'}
                className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#A63A2A] to-[#C54F3A] px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-in-out hover:from-[#8B2A1A] hover:to-[#A63A2A] disabled:cursor-not-allowed disabled:from-stone-custom-light disabled:to-stone-custom-light disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    {isReportMode ? 'Generating Report...' : 'Analysing...'}
                  </span>
                ) : (
                  isReportMode ? 'Generate Survey Report' : 'Run Assessment'
                )}
              </button>

              {status === "error" && error ? (
                <div className="mt-4">
                  <ErrorAlert
                    title="Assessment Failed"
                    message={error.message}
                    onRetry={run}
                  />
                </div>
              ) : null}
            </section>
          </section>

          <aside className="heritage-showcase relative overflow-hidden rounded-[28px] bg-[#211d1c] p-5 text-[#fff8ee] shadow-xl lg:min-h-[560px]">
            <div className="newari-topbar" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d7ad6f]">
                Preserve More
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">
                Assess with context
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#dbcfc5]">
                Damage signals are paired with visual evidence for faster
                restoration triage.
              </p>
            </div>

            <div className="absolute inset-x-1 top-0 bottom-0 mx-auto flex h-full w-[90%] items-center justify-center text-white/90 opacity-90">
              <div className="w-full">
                <StupaLineArt />
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 z-10 rounded-lg border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <Activity className="mx-auto h-5 w-5 text-[#d7ad6f]" />
                  <p className="mt-2 text-lg font-semibold">
                    {status === "loading" ? "..." : "3"}
                  </p>
                  <p className="text-[11px] text-[#d8c9be]">Classes</p>
                </div>
                <div>
                  <Sparkles className="mx-auto h-5 w-5 text-[#d7ad6f]" />
                  <p className="mt-2 text-lg font-semibold">CAM</p>
                  <p className="text-[11px] text-[#d8c9be]">Explain</p>
                </div>
                <div>
                  <AlertTriangle className="mx-auto h-5 w-5 text-[#d7ad6f]" />
                  <p className="mt-2 text-lg font-semibold">Risk</p>
                  <p className="text-[11px] text-[#d8c9be]">Triage</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section>
        {status === "loading" ? (
          <div className="scan-card flex min-h-[320px] items-center justify-center p-8">
            <div className="text-center">
              <LoadingSpinner size="lg" label="Running inference..." />
            </div>
          </div>
        ) : showEmptyState ? (
          <div className="scan-card grid min-h-[300px] gap-5 p-6 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[26px] border border-[#dfc9b8] bg-[#fffaf3] text-[#a4432d] shadow-inner">
              <ShieldX className="h-14 w-14" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b6b57]">
                Result Panel
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#251c19]">
                No Assessment Yet
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#796a62]">
                The prediction, confidence distribution, and Grad-CAM evidence
                will appear here after analysis.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Undamaged", "Partial Damage", "Damaged"].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e1ccbb] bg-white px-3 py-1.5 text-xs font-medium text-[#6f5d54]"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-[#a4432d]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : result ? (
          isReportMode ? (
            <ReportViewer report={result} />
          ) : (
            <ResultCard result={result} originalSrc={previewURL} />
          )
        ) : null}
      </section>
    </div>
  );
}
