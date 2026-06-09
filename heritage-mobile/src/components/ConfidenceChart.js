import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { CLASS_CONFIG, SPACING, THEME } from '../constants';

const screenWidth = Dimensions.get('window').width - 64;

export function ConfidenceChart({ probabilities }) {
  if (!probabilities || probabilities.length === 0) return null;

  const labels = probabilities.map((p) => {
    if (p.class_name === 'Undamaged') return 'Undamaged';
    if (p.class_name === 'Partial Damage') return 'Partial';
    return 'Damaged';
  });

  const values = probabilities.map((p) => parseFloat((p.probability * 100).toFixed(1)));

  const barColors = probabilities.map(
    (p) => (CLASS_CONFIG[p.class_name]?.color || THEME.danger),
  );

  return (
    <View>
      <Text style={{ marginBottom: SPACING.element, fontSize: 13, fontWeight: '600', color: THEME.textMuted }}>
        Class Probabilities
      </Text>
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: values,
              colors: barColors.map((c) => (opacity = 1) => c),
            },
          ],
        }}
        width={screenWidth}
        height={180}
        yAxisSuffix="%"
        yAxisInterval={1}
        fromZero
        showValuesOnTopOfBars
        withCustomBarColorFromData
        flatColor
        chartConfig={{
          backgroundColor: THEME.surface,
          backgroundGradientFrom: THEME.surface,
          backgroundGradientTo: THEME.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(166, 58, 42, ${opacity})`,
          labelColor: () => THEME.stone,
          barPercentage: 0.6,
          propsForLabels: { fontSize: 11 },
          propsForBackgroundLines: { stroke: THEME.borderLight },
        }}
      />
    </View>
  );
}
