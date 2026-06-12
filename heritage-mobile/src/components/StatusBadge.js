import { Text, View } from 'react-native';
import { THEME } from '../constants';

const colors = {
  ok: THEME.success,
  degraded: THEME.warning,
  error: THEME.danger,
  loading: THEME.textMuted,
};

export function StatusBadge({ status, label }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: THEME.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors[status] || colors.loading,
      }} />
      <Text style={{ fontSize: 13, color: THEME.stone }}>{label}</Text>
    </View>
  );
}
