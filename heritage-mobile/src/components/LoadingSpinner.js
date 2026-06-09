import { ActivityIndicator, Text, View } from 'react-native';
import { THEME } from '../constants';

export function LoadingSpinner({ size = 'md', label }) {
  const sizeMap = { sm: 20, md: 36, lg: 48 };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size={sizeMap[size]} color={THEME.primary} />
      {label ? (
        <Text style={{ marginTop: 8, fontSize: 13, color: THEME.textMuted }}>{label}</Text>
      ) : null}
    </View>
  );
}
