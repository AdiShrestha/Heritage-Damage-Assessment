import { useModels } from '../hooks/useModels';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { StatusBadge } from '../components/common/StatusBadge';

const details = {
  mock: {
    description: 'Placeholder model. Returns simulated results instantly.',
    parameters: '0',
    inputSize: '224×224',
  },
  resnet50: {
    description: 'ResNet-50 · 25M params · Fast inference · Strong baseline.',
    parameters: '25M',
    inputSize: '224×224',
  },
  efficientnet_b4: {
    description: 'EfficientNet-B4 · 19M params · Best accuracy/speed tradeoff.',
    parameters: '19M',
    inputSize: '224×224',
  },
  vit_b16: {
    description: 'Vision Transformer B/16 · 86M params · Highest accuracy.',
    parameters: '86M',
    inputSize: '384×384',
  },
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text">Available Models</h1>
        <p className="mt-2 text-sm text-text-muted">Models currently registered in the inference server.</p>
      </div>

      {error ? (
        <ErrorAlert title="Unable to load models" message={error} onRetry={refetch} />
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
            const status = model.loaded ? 'ok' : 'error';

            return (
              <article key={model.name} className="rounded-xl border border-stone-custom-light bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-text">{model.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{meta.description}</p>
                  </div>
                  <StatusBadge status={status} label={model.loaded ? 'Loaded' : 'Not ready'} />
                </div>

                <div className="mt-5 space-y-3 text-sm text-text-muted">
                  <div className="flex items-center justify-between gap-4">
                    <span>Version</span>
                    <span className="font-medium text-text">{model.version}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Parameters</span>
                    <span className="font-medium text-text">{meta.parameters}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Input size</span>
                    <span className="font-medium text-text">{meta.inputSize}</span>
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
