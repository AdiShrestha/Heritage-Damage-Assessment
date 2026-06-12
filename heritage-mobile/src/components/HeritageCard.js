import { View } from 'react-native';
import { SPACING, THEME } from '../constants';

export function HeritageCard({ children, style, noBorder }) {
  return (
    <View style={[{
      borderRadius: 12,
      borderWidth: noBorder ? 0 : 1,
      borderColor: THEME.border,
      backgroundColor: THEME.surface,
      padding: SPACING.card,
    }, style]}>
      {children}
    </View>
  );
}
