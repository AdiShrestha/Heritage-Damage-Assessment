
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

  if (modelName === 'vit_b16') {
    return 'Vision Transformer B/16 · 86M params · Highest accuracy.';
  }

  if (modelName === 'yolo_damage') {
    return 'YOLOv8 Classifier · Optimized for temple structures.';
  }

  if (modelName === 'moe') {
    return 'Mixture of Experts · Dynamically weights models based on confidence.';
  }

  return 'Unknown model';
}

export function ModelSelector({ value, onChange, models, disabled = false }) {
  const modelNames = models && models.length > 0 ? models.map(m => m.name) : ['mock'];
  const loadedLookup = new Map((models || []).map((model) => [model.name, model.loaded]));

  return (
    <div>
      <label htmlFor="model-select" className="mb-2 block text-sm font-semibold text-[#251c19]">
        Model
      </label>
      <select
        id="model-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || (models && models.length === 0)}
        className="w-full rounded-lg border border-[#d8c5b6] bg-[#fffaf3] px-4 py-3 text-sm text-[#251c19] outline-none transition duration-200 ease-in-out focus:border-[#a4432d] focus:bg-white focus:ring-2 focus:ring-[#a4432d]/15 disabled:cursor-not-allowed disabled:bg-stone-50"
      >
        {modelNames.map((modelName) => {
          const loaded = loadedLookup.get(modelName);
          return (
            <option key={modelName} value={modelName}>
              {loaded === false ? `● ${modelName} (not ready)` : `● ${modelName}`}
            </option>
          );
        })}
      </select>

      <p className="mt-2 text-xs leading-5 text-[#796a62]">{getDescription(value)}</p>
    </div>
  );
}
