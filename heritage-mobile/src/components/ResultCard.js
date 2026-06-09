import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DamageLabel } from './DamageLabel';
import { ConfidenceChart } from './ConfidenceChart';
import { GradCamViewer } from './GradCamViewer';
import { toMs } from '../utils/format';
import { SPACING, THEME } from '../constants';

function formatTimestamp(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Divider() {
  return <View style={{ marginVertical: SPACING.element, borderTopWidth: 1, borderTopColor: THEME.borderLight }} />;
}

export function ResultCard({ result, originalUri }) {
  return (
    <View style={{
      borderRadius: 12,
      borderWidth: 1,
      borderColor: THEME.border,
      backgroundColor: THEME.surface,
      padding: SPACING.card,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: SPACING.element,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderLight,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.tight }}>
          <Ionicons name="checkmark-circle" size={20} color={THEME.gold} />
          <Text style={{ fontSize: 17, fontWeight: '600', color: THEME.text }}>Assessment Result</Text>
        </View>
        <Text style={{ fontSize: 12, color: THEME.textMuted }}>
          {toMs(result.inference_time_ms)} · {result.model_used}
        </Text>
      </View>

      <View style={{ marginTop: SPACING.element }}>
        <DamageLabel label={result.predicted_class} confidence={result.confidence} size="md" />
      </View>

      <Divider />
      <ConfidenceChart probabilities={result.class_probabilities} />
      <Divider />
      <GradCamViewer originalUri={originalUri} gradcamBase64={result.gradcam_image_base64} />

      <View style={{
        marginTop: SPACING.element,
        paddingTop: SPACING.element,
        borderTopWidth: 1,
        borderTopColor: THEME.borderLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 10, fontFamily: 'monospace', color: THEME.textMuted }}>
          ID: {result.request_id}
        </Text>
        <Text style={{ fontSize: 10, color: THEME.textMuted }}>
          {formatTimestamp(result.timestamp)}
        </Text>
      </View>
    </View>
  );
}
