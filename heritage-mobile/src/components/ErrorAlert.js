import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, THEME } from '../constants';

export function ErrorAlert({ title, message, onRetry }) {
  return (
    <View style={{
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FECACA',
      backgroundColor: '#FEF2F2',
      padding: SPACING.card,
    }}>
      <View style={{ flexDirection: 'row', gap: SPACING.element }}>
        <Ionicons name="alert-circle" size={20} color={THEME.danger} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: THEME.primaryDark }}>{title}</Text>
          <Text style={{ marginTop: SPACING.tight / 2, fontSize: 13, lineHeight: 20, color: '#991B1B' }}>{message}</Text>
          {onRetry ? (
            <TouchableOpacity
              onPress={onRetry}
              style={{
                marginTop: SPACING.element,
                backgroundColor: THEME.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: THEME.surface, fontSize: 13, fontWeight: '500' }}>Try Again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
