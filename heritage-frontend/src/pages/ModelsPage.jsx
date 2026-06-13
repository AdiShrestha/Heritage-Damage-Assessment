import { useModels } from "../hooks/useModels";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { StatusBadge } from "../components/common/StatusBadge";
import { BrainCircuit, Cpu, Image as ImageIcon, Landmark } from "lucide-react";

const details = {
  mock: {
    description: "Placeholder model. Returns simulated results instantly.",
    parameters: "0",
    inputSize: "224×224",
  },
  resnet50: {
    description: "ResNet-50 · 25M params · Fast inference · Strong baseline.",
    parameters: "25M",
    inputSize: "224×224",
  },
  efficientnet_b4: {
    description: "EfficientNet-B4 · 19M params · Best accuracy/speed tradeoff.",
    parameters: "19M",
    inputSize: "224×224",
  },
  vit_b16: {
    description: "Vision Transformer B/16 · 86M params · Highest accuracy.",
    parameters: "86M",
    inputSize: "384×384",
  },
};

function SkeletonCard() {
  return (
    <div className="scan-card p-5">
      <div className="h-6 w-2/3 animate-pulse rounded bg-stone-200" />
      <div className="mt-4 h-5 w-32 animate-pulse rounded bg-stone-200" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-stone-200" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-stone-200" />
      <div className="mt-5 h-4 w-24 animate-pulse rounded bg-stone-200" />
      <div className="mt-3 h-4 w-28 animate-pulse rounded bg-stone-200" />
    </div>
  );
}

export default function ModelsPage() {
  const { models, loading, error, refetch } = useModels();

  return (
    <div className="dashboard-shell p-4 sm:p-6">
      <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
        <div className="window-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#a4432d] text-white">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b6b57]">
                Inference Registry
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#251c19]">
                Available Models
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#796a62]">
            Compare the registered backbones used for fast heritage damage
            screening and explainability.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="scan-card p-3 text-center">
            <Cpu className="mx-auto h-5 w-5 text-[#a4432d]" />
            <p className="mt-2 text-lg font-semibold text-[#251c19]">
              {models.length || 4}
            </p>
            <p className="text-[11px] text-[#796a62]">Models</p>
          </div>
          <div className="scan-card p-3 text-center">
            <ImageIcon className="mx-auto h-5 w-5 text-[#8b5b14]" />
            <p className="mt-2 text-lg font-semibold text-[#251c19]">224+</p>
            <p className="text-[11px] text-[#796a62]">Input</p>
          </div>
          <div className="scan-card p-3 text-center">
            <Landmark className="mx-auto h-5 w-5 text-[#256143]" />
            <p className="mt-2 text-lg font-semibold text-[#251c19]">CAM</p>
            <p className="text-[11px] text-[#796a62]">Evidence</p>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorAlert
          title="Unable to load models"
          message={error}
          onRetry={refetch}
        />
      ) : loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {models.map((model) => {
            const meta = details[model.name] || details.mock;
            const status = model.loaded ? "ok" : "error";

            return (
              <article
                key={model.name}
                className="scan-card p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-[#251c19]">
                      {model.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#796a62]">
                      {meta.description}
                    </p>
                  </div>
                  <StatusBadge
                    status={status}
                    label={model.loaded ? "Loaded" : "Not ready"}
                  />
                </div>

                <div className="pagoda-divider my-5">
                  <div className="pagoda-divider-dot" />
                </div>

                <div className="space-y-3 text-sm text-[#796a62]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Version</span>
                    <span className="font-medium text-[#251c19]">
                      {model.version}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Parameters</span>
                    <span className="font-medium text-[#251c19]">
                      {meta.parameters}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Input size</span>
                    <span className="font-medium text-[#251c19]">
                      {meta.inputSize}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
