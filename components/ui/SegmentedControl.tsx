import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { borderRadius, Colors, fontFamilies, gradient, shadows } from '@/constants/theme';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  style?: ViewStyle;
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
  style,
}: SegmentedControlProps<T>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const selectedIndex = options.findIndex((o) => o.value === selected);
  const translateX = useSharedValue(0);
  const segmentWidth = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth.value > 0) {
      translateX.value = withSpring(selectedIndex * segmentWidth.value, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [selectedIndex, segmentWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth.value - 6,
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceElevated2 }, style]}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width / options.length;
        segmentWidth.value = width;
        translateX.value = selectedIndex * width;
      }}
    >
      {/* Animated gradient indicator */}
      <AnimatedLinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={[
          styles.indicator,
          animatedIndicatorStyle,
          shadows.sm,
        ]}
      />

      {/* Segments */}
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => onSelect(option.value)}
          >
            <ThemedText
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextActive,
              ]}
              lightColor={isSelected ? '#ffffff' : colors.textSecondary}
              darkColor={isSelected ? '#ffffff' : colors.textSecondary}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 3,
    bottom: 4,
    borderRadius: borderRadius.md,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  segmentTextActive: {
    fontFamily: fontFamilies.bodySemiBold,
  },
});
