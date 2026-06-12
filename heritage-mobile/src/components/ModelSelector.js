import { Text, View } from 'react-native';
import { MODELS, SPACING, THEME } from '../constants';

const modelDescriptions = {
  mock: 'Placeholder model. Returns simulated results instantly.',
  resnet50: 'ResNet-50 · 25M params · Fast inference · Strong baseline.',
  efficientnet_b4: 'EfficientNet-B4 · 19M params · Best accuracy/speed tradeoff.',
  vit_b16: 'Vision Transformer B/16 · 86M params · Highest accuracy.',
};

const modelNames = {
  mock: 'Mock',
  resnet50: 'ResNet-50',
  efficientnet_b4: 'EfficientNet-B4',
  vit_b16: 'ViT-B/16',
};

function SegmentedControl({ value, onChange, disabled, options }) {
  return (
    <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <View key={opt.value} style={{ flex: 1 }}>
            <Text
              onPress={disabled ? undefined : () => onChange(opt.value)}
              style={{
                textAlign: 'center',
                paddingVertical: 10,
                paddingHorizontal: 4,
                fontSize: 12,
                fontWeight: selected ? '600' : '400',
                color: selected ? THEME.surface : THEME.stone,
                backgroundColor: selected ? THEME.primary : 'transparent',
                overflow: 'hidden',
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ModelSelector({ value, onChange, models, disabled = false }) {
  const loadedLookup = new Map(models.map((m) => [m.name, m.loaded]));

  const options = MODELS.map((name) => ({
    value: name,
    label: modelNames[name] || name,
    loaded: loadedLookup.get(name),
  }));

  return (
    <View>
      <Text style={{ marginBottom: SPACING.tight, fontSize: 13, fontWeight: '600', color: THEME.text }}>Model</Text>
      <SegmentedControl value={value} onChange={onChange} disabled={disabled} options={options} />
      <Text style={{ marginTop: SPACING.tight, fontSize: 12, lineHeight: 18, color: THEME.textMuted }}>
        {modelDescriptions[value] || ''}
      </Text>
    </View>
  );
}
