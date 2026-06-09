import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CLASS_CONFIG } from '../constants';
import { toPercent } from '../utils/format';

const ICON_MAP = {
  'shield-checkmark': 'shield-checkmark',
  warning: 'warning',
  shield: 'shield',
};

const sizeStyles = {
  sm: { py: 6, ph: 12, fontSize: 13 },
  md: { py: 10, ph: 16, fontSize: 15 },
  lg: { py: 14, ph: 20, fontSize: 17 },
};

export function DamageLabel({ label, confidence, size = 'md' }) {
  const config = CLASS_CONFIG[label] || CLASS_CONFIG.Damaged;
  const iconName = ICON_MAP[config.icon] || 'shield';
  const s = sizeStyles[size];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: config.borderColor,
      backgroundColor: config.bgColor,
      paddingVertical: s.py,
      paddingHorizontal: s.ph,
      borderLeftWidth: 4,
      borderLeftColor: config.color,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <Ionicons name={iconName} size={20} color={config.color} />
        <Text style={{ fontSize: s.fontSize, fontWeight: '600', color: '#1C1816' }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={{ fontWeight: '600', color: config.color, fontSize: s.fontSize }}>
        {toPercent(confidence)}
      </Text>
    </View>
  );
}
