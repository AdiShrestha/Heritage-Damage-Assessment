import { View, Text } from 'react-native';
import { THEME } from '../constants';

const SEVERITY_COLORS = [
  { threshold: 0.2, track: '#B9DBC6', fill: '#1E6B3C' },  // MINIMAL — green
  { threshold: 0.4, track: '#E0F0D0', fill: '#4A9B3C' },  // LOW — light green
  { threshold: 0.6, track: '#E7D1A0', fill: '#B8860B' },  // MODERATE — amber
  { threshold: 0.8, track: '#F2C3B7', fill: '#C54F3A' },  // HIGH — orange-red
  { threshold: 1.1, track: '#F2B0A0', fill: '#A63A2A' },  // CRITICAL — brick red
];

function getColors(score) {
  for (const c of SEVERITY_COLORS) {
    if (score <= c.threshold) return c;
  }
  return SEVERITY_COLORS[SEVERITY_COLORS.length - 1];
}

/**
 * Horizontal severity progress bar for React Native.
 * @param {number} score  0.0–1.0
 * @param {string} label  MINIMAL | LOW | MODERATE | HIGH | CRITICAL
 * @param {boolean} compact  if true, smaller text
 */
export function SeverityBar({ score = 0, label = '', compact = false }) {
  const pct = Math.min(Math.max(score, 0), 1);
  const { track, fill } = getColors(pct);

  return (
    <View>
      <View
        style={{
          height: compact ? 6 : 8,
          borderRadius: 999,
          backgroundColor: track,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${(pct * 100).toFixed(1)}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: fill,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: compact ? 10 : 11, color: THEME.textMuted }}>
          {label || ''}
        </Text>
        <Text style={{ fontSize: compact ? 10 : 11, color: THEME.textMuted }}>
          {(pct * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}
