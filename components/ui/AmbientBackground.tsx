import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type AmbientBackgroundProps = {
  style?: ViewStyle;
  intensity?: 'subtle' | 'medium' | 'strong';
  animated?: boolean;
};

export function AmbientBackground({
  style,
  intensity = 'medium',
  animated = true,
}: AmbientBackgroundProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Only animate on iOS - Android gets static orbs
  const shouldAnimate = animated && Platform.OS === 'ios';

  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(180);

  useEffect(() => {
    if (shouldAnimate) {
      rotation1.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
      rotation2.value = withRepeat(
        withTiming(540, { duration: 25000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [shouldAnimate, rotation1, rotation2]);

  const animatedStyle1 = useAnimatedStyle(() => {
    if (!shouldAnimate) return {};
    return {
      transform: [
        { translateX: Math.sin(rotation1.value * (Math.PI / 180)) * 20 },
        { translateY: Math.cos(rotation1.value * (Math.PI / 180)) * 20 },
      ],
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    if (!shouldAnimate) return {};
    return {
      transform: [
        { translateX: Math.cos(rotation2.value * (Math.PI / 180)) * 30 },
        { translateY: Math.sin(rotation2.value * (Math.PI / 180)) * 30 },
      ],
    };
  });

  const opacityMap = {
    subtle: 0.15,
    medium: 0.25,
    strong: 0.4,
  };

  const opacity = opacityMap[intensity];

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Background base */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background },
        ]}
      />

      {/* Cyan orb - top right */}
      <Animated.View style={[styles.orb, styles.orbTopRight, animatedStyle1]}>
        <LinearGradient
          colors={['#06b6d4', '#0891b2']}
          style={[styles.orbGradient, { opacity }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Teal/Emerald orb - bottom left */}
      <Animated.View style={[styles.orb, styles.orbBottomLeft, animatedStyle2]}>
        <LinearGradient
          colors={['#14b8a6', '#10b981']}
          style={[styles.orbGradient, { opacity }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Blur overlay */}
      <BlurView
        intensity={60}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  orbTopRight: {
    top: -100,
    right: -100,
  },
  orbBottomLeft: {
    bottom: -50,
    left: -100,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
});
