import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModels } from '../hooks/useModels';
import { HeritageCard } from '../components/HeritageCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { SPACING, THEME } from '../constants';

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
    <HeritageCard>
      {[120, 100, '90%', '80%'].map((w, i) => (
        <View
          key={i}
          style={{
            height: i === 0 ? 20 : 14,
            width: typeof w === 'number' ? w : w,
            backgroundColor: THEME.borderLight,
            borderRadius: 4,
            marginTop: i === 0 ? 0 : 10,
          }}
        />
      ))}
    </HeritageCard>
  );
}

export default function ModelsScreen() {
  const { models, loading, error, refetch } = useModels();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.bg }}
      contentContainerStyle={{ padding: SPACING.screen, paddingBottom: 32 }}
    >
      <View style={{ marginBottom: SPACING.section }}>
        <Text style={{ fontSize: 26, fontWeight: '600', color: THEME.text, letterSpacing: -0.3 }}>
          Available Models
        </Text>
        <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, color: THEME.textMuted }}>
          Models currently registered in the inference server.
        </Text>
      </View>

      {error ? (
        <ErrorAlert title="Unable to load models" message={error} onRetry={refetch} />
      ) : loading ? (
        <View style={{ gap: SPACING.element }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <View style={{ gap: SPACING.element }}>
          {models.map((model) => {
            const meta = details[model.name] || details.mock;

            return (
              <HeritageCard key={model.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: THEME.text }}>{model.name}</Text>
                    <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, lineHeight: 18, color: THEME.textMuted }}>
                      {meta.description}
                    </Text>
                  </View>
                  <StatusBadge status={model.loaded ? 'ok' : 'error'} label={model.loaded ? 'Loaded' : 'Not ready'} />
                </View>

                <View style={{
                  marginTop: SPACING.element,
                  borderTopWidth: 1,
                  borderTopColor: THEME.borderLight,
                  paddingTop: SPACING.element,
                }}>
                  {[
                    { label: 'Version', value: model.version },
                    { label: 'Parameters', value: meta.parameters },
                    { label: 'Input size', value: meta.inputSize },
                  ].map((row) => (
                    <View key={row.label} style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 6,
                    }}>
                      <Text style={{ fontSize: 13, color: THEME.textMuted }}>{row.label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: THEME.text }}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </HeritageCard>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
