import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SeverityBar } from './SeverityBar';
import { HeritageCard } from './HeritageCard';
import { SPACING, THEME } from '../constants';

function ChangeIcon({ label }) {
  if (label === 'SIGNIFICANT_DETERIORATION' || label === 'DETERIORATING') {
    return <Ionicons name="trending-down" size={22} color={THEME.danger} />;
  }
  if (label === 'SIGNIFICANT_IMPROVEMENT' || label === 'IMPROVING') {
    return <Ionicons name="trending-up" size={22} color={THEME.success} />;
  }
  return <Ionicons name="remove" size={22} color={THEME.warning} />;
}

function getChangeColor(label) {
  if (label === 'SIGNIFICANT_DETERIORATION') return THEME.danger;
  if (label === 'DETERIORATING') return '#C54F3A';
  if (label === 'SIGNIFICANT_IMPROVEMENT') return THEME.success;
  if (label === 'IMPROVING') return '#4A9B3C';
  return THEME.warning;
}

function getDeltaColor(delta) {
  if (delta > 0.05) return THEME.danger;
  if (delta < -0.05) return THEME.success;
  return THEME.warning;
}

export function ComparisonResult({ result }) {
  const {
    change_label,
    cosine_distance,
    severity_t1,
    severity_t2,
    severity_delta,
    severity_label_t1,
    severity_label_t2,
    predicted_class_t1,
    predicted_class_t2,
    recommendation,
    site_id,
  } = result;

  return (
    <View style={{ gap: SPACING.section }}>
      {/* ── Change header ── */}
      <HeritageCard>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.element }}>
          <ChangeIcon label={change_label} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: THEME.textMuted, fontWeight: '500' }}>
              Change Detected
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: getChangeColor(change_label),
                marginTop: 4,
                letterSpacing: -0.3,
              }}
            >
              {change_label?.replace(/_/g, ' ')}
            </Text>
            {site_id ? (
              <Text style={{ marginTop: 4, fontSize: 11, color: THEME.textMuted }}>
                Site: {site_id}
              </Text>
            ) : null}
          </View>

          {/* Cosine distance badge */}
          <View
            style={{
              borderRadius: 10,
              backgroundColor: THEME.bg,
              padding: SPACING.element,
              alignItems: 'center',
              minWidth: 72,
            }}
          >
            <Text style={{ fontSize: 11, color: THEME.textMuted, fontWeight: '600' }}>
              Visual Δ
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: THEME.text, marginTop: 2 }}>
              {cosine_distance != null ? cosine_distance.toFixed(3) : '—'}
            </Text>
            <Text style={{ fontSize: 10, color: THEME.textMuted }}>cosine dist.</Text>
          </View>
        </View>
      </HeritageCard>

      {/* ── Severity comparison ── */}
      <HeritageCard>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: THEME.text,
            marginBottom: SPACING.section,
          }}
        >
          Severity Analysis
        </Text>

        <View style={{ gap: SPACING.section }}>
          {/* Earlier survey */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: THEME.text }}>
                Earlier Survey
              </Text>
              <Text style={{ fontSize: 13, color: THEME.textMuted }}>
                {predicted_class_t1}
              </Text>
            </View>
            <SeverityBar score={severity_t1 ?? 0} label={severity_label_t1} />
          </View>

          {/* Later survey */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: THEME.text }}>
                Later Survey
              </Text>
              <Text style={{ fontSize: 13, color: THEME.textMuted }}>
                {predicted_class_t2}
              </Text>
            </View>
            <SeverityBar score={severity_t2 ?? 0} label={severity_label_t2} />
          </View>

          {/* Delta block */}
          <View
            style={{
              borderRadius: 10,
              backgroundColor: THEME.bg,
              padding: SPACING.element,
              borderLeftWidth: 4,
              borderLeftColor: THEME.primary,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: THEME.text }}>
                Change in Severity
              </Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: THEME.textMuted }}>
                {severity_delta != null && severity_delta > 0.05
                  ? 'Damage worsening'
                  : severity_delta != null && severity_delta < -0.05
                  ? 'Damage improving'
                  : 'Stable condition'}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: getDeltaColor(severity_delta ?? 0),
              }}
            >
              {severity_delta != null
                ? `${severity_delta > 0 ? '+' : ''}${severity_delta.toFixed(3)}`
                : '—'}
            </Text>
          </View>
        </View>
      </HeritageCard>

      {/* ── Recommendation ── */}
      {recommendation ? (
        <HeritageCard>
          <View style={{ flexDirection: 'row', gap: SPACING.element, alignItems: 'flex-start' }}>
            <Ionicons name="alert-circle" size={18} color={THEME.primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: THEME.text, marginBottom: 4 }}>
                Recommendation
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: THEME.textMuted }}>
                {recommendation}
              </Text>
            </View>
          </View>
        </HeritageCard>
      ) : null}
    </View>
  );
}
