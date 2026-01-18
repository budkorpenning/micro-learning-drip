import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilies, gradient, typography } from '@/constants/theme';

type GradientTextProps = TextProps & {
  children: string;
  colors?: readonly [string, string, ...string[]];
  size?: 'displayLarge' | 'displayMedium' | 'displaySmall' | 'h1' | 'h2' | 'h3' | 'body';
  style?: TextStyle;
};

export function GradientText({
  children,
  colors = gradient.colors,
  size = 'h1',
  style,
  ...props
}: GradientTextProps) {
  const typographyStyle = typography[size] ?? typography.h1;

  const fontFamily =
    size.startsWith('display') || size.startsWith('h')
      ? fontFamilies.headingBold
      : fontFamilies.body;

  return (
    <MaskedView
      maskElement={
        <Text
          style={[
            {
              fontSize: typographyStyle.fontSize,
              lineHeight: typographyStyle.lineHeight,
              fontFamily,
            },
            style,
          ]}
          {...props}
        >
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={gradient.start}
        end={gradient.end}
      >
        <Text
          style={[
            {
              fontSize: typographyStyle.fontSize,
              lineHeight: typographyStyle.lineHeight,
              fontFamily,
              opacity: 0,
            },
            style,
          ]}
        >
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
