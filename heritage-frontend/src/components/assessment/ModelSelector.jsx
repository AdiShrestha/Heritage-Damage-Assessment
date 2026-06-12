import { MODELS } from '../../constants';

function getDescription(modelName) {
  if (modelName === 'mock') {
    return 'Placeholder model. Returns simulated results instantly.';
  }

  if (modelName === 'resnet50') {
    return 'ResNet-50 · 25M params · Fast inference · Strong baseline.';
  }

  if (modelName === 'efficientnet_b4') {
    return 'EfficientNet-B4 · 19M params · Best accuracy/speed tradeoff.';
  }

  return 'Vision Transformer B/16 · 86M params · Highest accuracy.';
}

export function ModelSelector({ value, onChange, models, disabled = false }) {
  const loadedLookup = new Map(models.map((model) => [model.name, model.loaded]));

  return (
    <div>
      <label htmlFor="model-select" className="mb-2 block text-sm font-semibold text-text">
        Model
      </label>
      <select
        id="model-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-stone-custom-light bg-white px-4 py-3 text-sm text-text outline-none transition-colors duration-150 ease-in-out focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-stone-50"
      >
        {MODELS.map((modelName) => {
          const loaded = loadedLookup.get(modelName);
          return (
            <option key={modelName} value={modelName}>
              {loaded === false ? `● ${modelName} (not ready)` : `● ${modelName}`}
            </option>
          );
        })}
      </select>

      <p className="mt-2 text-xs leading-5 text-text-muted">{getDescription(value)}</p>
    </div>
  );
}
