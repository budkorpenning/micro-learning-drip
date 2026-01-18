import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { fontFamilies, typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'displayLarge'
    | 'displayMedium'
    | 'displaySmall';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colorName = type === 'link' ? 'primary' : 'text';
  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorName);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'displayLarge' ? styles.displayLarge : undefined,
        type === 'displayMedium' ? styles.displayMedium : undefined,
        type === 'displaySmall' ? styles.displaySmall : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

function stripFontWeight(style: TextStyle): TextStyle {
  const { fontWeight, ...rest } = style;
  return rest;
}

const styles = StyleSheet.create({
  default: {
    ...stripFontWeight(typography.body),
    fontFamily: fontFamilies.body,
  },
  defaultSemiBold: {
    ...stripFontWeight(typography.body),
    fontFamily: fontFamilies.bodySemiBold,
  },
  title: {
    ...stripFontWeight(typography.h1),
    fontFamily: fontFamilies.headingBold,
  },
  subtitle: {
    ...stripFontWeight(typography.h4),
    fontFamily: fontFamilies.headingSemiBold,
  },
  link: {
    ...stripFontWeight(typography.body),
    fontFamily: fontFamilies.bodySemiBold,
  },
  displayLarge: {
    ...stripFontWeight(typography.displayLarge),
    fontFamily: fontFamilies.headingBold,
  },
  displayMedium: {
    ...stripFontWeight(typography.displayMedium),
    fontFamily: fontFamilies.headingSemiBold,
  },
  displaySmall: {
    ...stripFontWeight(typography.displaySmall),
    fontFamily: fontFamilies.headingSemiBold,
  },
});
