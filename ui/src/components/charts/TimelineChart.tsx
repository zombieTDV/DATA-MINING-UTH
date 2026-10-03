import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Spacing, Typography } from '@/theme';
import type { TimelineDataPoint } from '@/types/entities';

interface TimelineChartProps {
  data: TimelineDataPoint[];
  color?: string;
  height?: number;
}

/**
 * Lightweight bar chart for timeline data.
 * Uses flexbox-based bars to avoid external charting libs.
 */
export function TimelineChart({ data, color, height = 120 }: TimelineChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const barColor = color || colors.accent;

  const max = Math.max(...data.map((d) => d.count));
  const min = Math.min(...data.map((d) => d.count));

  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((point, idx) => {
          const heightPercent = max > 0 ? (point.count / max) * 100 : 0;
          const isMax = point.count === max;
          return (
            <View
              key={idx}
              style={styles.barWrapper}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: `${heightPercent}%`,
                    backgroundColor: isMax ? barColor : barColor + '60',
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: barColor }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Max: {max}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Min: {min}
          </Text>
        </View>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>
          Avg: {Math.round(data.reduce((acc, d) => acc + d.count, 0) / data.length)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
