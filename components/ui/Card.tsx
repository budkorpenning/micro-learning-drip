import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { borderRadius, Colors, shadows } from '@/constants/theme';

type CardProps = ViewProps & {
  glow?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
};

export function Card({
  children,
  glow = false,
  gradient = false,
  style,
  ...props
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const glowStyle = glow
    ? {
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
      }
    : {};

  if (gradient) {
    return (
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(250, 250, 249, 0.9)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: colors.cardBorder,
          },
          glowStyle,
          style,
        ]}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
        glowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: 20,
    ...shadows.sm,
  },
});
