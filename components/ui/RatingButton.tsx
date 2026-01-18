import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { borderRadius, fontFamilies, ratingColors, shadows } from '@/constants/theme';
import type { Grade } from '@/src/lib/scheduling';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type RatingButtonProps = {
  grade: Grade;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

const gradeConfig: Record<Grade, { colors: readonly [string, string]; shadowColor: string }> = {
  1: { colors: ratingColors.forgot.colors, shadowColor: '#f43f5e' },
  2: { colors: ratingColors.hard.colors, shadowColor: '#f59e0b' },
  3: { colors: ratingColors.good.colors, shadowColor: '#06b6d4' },
  4: { colors: ratingColors.easy.colors, shadowColor: '#10b981' },
};

export function RatingButton({
  grade,
  label,
  onPress,
  disabled = false,
  style,
}: RatingButtonProps) {
  const scale = useSharedValue(1);
  const config = gradeConfig[grade];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.wrapper, style]}
    >
      <AnimatedLinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          {
            ...shadows.md,
            shadowColor: config.shadowColor,
            shadowOpacity: 0.4,
          },
          disabled && styles.disabled,
          animatedStyle,
        ]}
      >
        <ThemedText style={styles.gradeNumber}>{grade}</ThemedText>
        <ThemedText style={styles.gradeLabel}>{label}</ThemedText>
      </AnimatedLinearGradient>
    </Pressable>
  );
}

export function RatingButtonRow({
  onGrade,
  disabled,
  labels,
}: {
  onGrade: (grade: Grade) => void;
  disabled?: boolean;
  labels: Record<Grade, string>;
}) {
  return (
    <View style={styles.row}>
      {([1, 2, 3, 4] as Grade[]).map((grade) => (
        <RatingButton
          key={grade}
          grade={grade}
          label={labels[grade]}
          onPress={() => onGrade(grade)}
          disabled={disabled}
          style={styles.rowButton}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  button: {
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  gradeNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: fontFamilies.bodyBold,
  },
  gradeLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowButton: {
    flex: 1,
  },
});
