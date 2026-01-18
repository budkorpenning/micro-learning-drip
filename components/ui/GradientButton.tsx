import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { borderRadius, fontFamilies, gradient, shadows } from '@/constants/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  colors?: readonly [string, string, ...string[]];
};

export function GradientButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  size = 'md',
  style,
  textStyle,
  colors = gradient.colors,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 20 },
    md: { paddingVertical: 14, paddingHorizontal: 28 },
    lg: { paddingVertical: 18, paddingHorizontal: 36 },
  };

  const textSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <AnimatedLinearGradient
        colors={colors}
        start={gradient.start}
        end={gradient.end}
        style={[
          styles.button,
          sizeStyles[size],
          (disabled || loading) && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        <ThemedText
          style={[
            styles.text,
            { fontSize: textSizes[size] },
            textStyle,
          ]}
        >
          {loading ? '...' : title}
        </ThemedText>
      </AnimatedLinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    shadowColor: '#06b6d4',
    shadowOpacity: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontFamily: fontFamilies.bodySemiBold,
  },
});
