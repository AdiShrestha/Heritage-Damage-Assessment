import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DamageLabel } from './DamageLabel';
import { SeverityBar } from './SeverityBar';
import { HeritageCard } from './HeritageCard';
import { SPACING, THEME } from '../constants';

const CLASS_ICON = {
  Undamaged: { name: 'shield-checkmark', color: THEME.success },
  'Partial Damage': { name: 'warning', color: THEME.warning },
  Damaged: { name: 'shield', color: THEME.danger },
};

const CRITICALITY_STYLE = {
  LOW: { bg: '#EAF4EE', text: THEME.success, border: '#B9DBC6' },
  MODERATE: { bg: '#FCF3DE', text: THEME.warning, border: '#E7D1A0' },
  HIGH: { bg: '#FDEEE8', text: '#C54F3A', border: '#F2C3B7' },
  CRITICAL: { bg: '#FDF0EC', text: THEME.danger, border: '#F2B0A0' },
};

function SummaryStats({ summary, total }) {
  const dist = summary?.class_distribution ?? {};
  const highest = summary?.highest_priority_file;

  return (
    <HeritageCard>
      <Text style={{ fontSize: 15, fontWeight: '600', color: THEME.text, marginBottom: SPACING.element }}>
        Batch Summary
      </Text>

      <View style={{ flexDirection: 'row', gap: SPACING.element, flexWrap: 'wrap' }}>
        {/* Total */}
        <View
          style={{
            flex: 1,
            minWidth: 72,
            backgroundColor: THEME.bg,
            borderRadius: 10,
            padding: SPACING.element,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: THEME.text }}>{total}</Text>
          <Text style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>Images</Text>
        </View>

        {Object.entries(dist).map(([cls, count]) => {
          const icon = CLASS_ICON[cls] ?? { name: 'help-circle', color: THEME.stone };
          return (
            <View
              key={cls}
              style={{
                flex: 1,
                minWidth: 72,
                backgroundColor: THEME.bg,
                borderRadius: 10,
                padding: SPACING.element,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={icon.name} size={14} color={icon.color} />
                <Text style={{ fontSize: 22, fontWeight: '700', color: THEME.text }}>{count}</Text>
              </View>
              <Text style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2, textAlign: 'center' }}>
                {cls}
              </Text>
            </View>
          );
        })}
      </View>

      {highest ? (
        <View
          style={{
            marginTop: SPACING.element,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#F2B0A0',
            backgroundColor: '#FDF0EC',
            padding: SPACING.element,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '600', color: THEME.danger, letterSpacing: 0.5 }}>
            HIGHEST PRIORITY
          </Text>
          <Text
            style={{ marginTop: 2, fontSize: 13, fontWeight: '600', color: THEME.danger }}
            numberOfLines={1}
          >
            {highest}
          </Text>
        </View>
      ) : null}
    </HeritageCard>
  );
}

function BatchItemCard({ item, index }) {
  const critStyle = CRITICALITY_STYLE[item.criticality] ?? {
    bg: THEME.bg,
    text: THEME.textMuted,
    border: THEME.border,
  };

  return (
    <HeritageCard>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.tight, marginBottom: SPACING.element }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: THEME.bg,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.textMuted }}>{index + 1}</Text>
        </View>
        <Text
          style={{ flex: 1, fontSize: 13, fontWeight: '600', color: THEME.text }}
          numberOfLines={1}
        >
          {item.filename ?? 'Image'}
        </Text>
        {item.criticality ? (
          <View
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: critStyle.border,
              backgroundColor: critStyle.bg,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: critStyle.text }}>
              {item.criticality}
            </Text>
          </View>
        ) : null}
      </View>

      <DamageLabel label={item.predicted_class} confidence={item.confidence} size="sm" />

      {item.severity_score != null ? (
        <View style={{ marginTop: SPACING.element }}>
          <SeverityBar score={item.severity_score} label={item.severity_label} compact />
        </View>
      ) : null}

      {item.gradcam_image_base64 ? (
        <View style={{ marginTop: SPACING.element }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: THEME.textMuted, marginBottom: 4 }}>
            Grad-CAM
          </Text>
          <Image
            source={{ uri: `data:image/png;base64,${item.gradcam_image_base64}` }}
            style={{ width: '100%', height: 120, borderRadius: 8 }}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.tight }}>
        <Text style={{ fontSize: 10, color: THEME.textMuted }}>
          {item.inference_time_ms != null ? `${item.inference_time_ms.toFixed(0)} ms` : ''}
        </Text>
        {item.requires_human_review ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              backgroundColor: '#FCF3DE',
              borderRadius: 999,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Ionicons name="warning" size={10} color={THEME.warning} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: THEME.warning }}>Review</Text>
          </View>
        ) : null}
      </View>
    </HeritageCard>
  );
}

export function BatchResults({ results }) {
  const items = results?.results ?? [];
  const summary = results?.summary;

  if (items.length === 0) {
    return (
      <HeritageCard>
        <Text style={{ textAlign: 'center', color: THEME.textMuted }}>No results returned.</Text>
      </HeritageCard>
    );
  }

  return (
    <View style={{ gap: SPACING.element }}>
      <SummaryStats summary={summary} total={items.length} />
      <Text
        style={{ fontSize: 12, fontWeight: '600', color: THEME.textMuted, letterSpacing: 0.5, marginTop: SPACING.tight }}
      >
        RESULTS — SORTED BY SEVERITY
      </Text>
      {items.map((item, i) => (
        <BatchItemCard key={item.filename ?? i} item={item} index={i} />
      ))}
    </View>
  );
}
