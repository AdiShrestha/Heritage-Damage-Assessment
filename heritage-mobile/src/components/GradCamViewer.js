import { Image, Text, View } from 'react-native';
import { SPACING, THEME } from '../constants';

export function GradCamViewer({ originalUri, gradcamBase64 }) {
  const heatmapSource = gradcamBase64
    ? { uri: `data:image/jpeg;base64,${gradcamBase64}` }
    : null;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: SPACING.tight }}>
        <View style={{ flex: 1 }}>
          <Text style={{ marginBottom: SPACING.tight / 2, fontSize: 13, fontWeight: '600', color: THEME.textMuted }}>
            Original Image
          </Text>
          <Image
            source={{ uri: originalUri }}
            style={{ height: 180, borderRadius: 8, backgroundColor: THEME.bg }}
            resizeMode="cover"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ marginBottom: SPACING.tight / 2, fontSize: 13, fontWeight: '600', color: THEME.textMuted }}>
            Damage Heatmap
          </Text>
          {heatmapSource ? (
            <Image
              source={heatmapSource}
              style={{ height: 180, borderRadius: 8, backgroundColor: THEME.bg }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              height: 180,
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: THEME.border,
              backgroundColor: THEME.bg,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 12, color: THEME.textMuted }}>Heatmap unavailable</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={{ marginTop: SPACING.tight, fontSize: 11, fontStyle: 'italic', color: THEME.textMuted }}>
        Red regions indicate areas most influential to the prediction.
      </Text>
    </View>
  );
}
