// Design System: Cyan → Teal → Emerald gradient branding
// Dark slate backgrounds with modern card-based UI

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Brand gradient colors (Cyan → Teal → Emerald)
export const gradient = {
  colors: ['#06b6d4', '#14b8a6', '#10b981'] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// Rating button gradients
export const ratingColors = {
  forgot: {
    colors: ['#f43f5e', '#dc2626'] as const, // rose → red
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  hard: {
    colors: ['#f59e0b', '#ea580c'] as const, // amber → orange
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  good: {
    colors: ['#06b6d4', '#0d9488'] as const, // cyan → teal
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  easy: {
    colors: ['#10b981', '#16a34a'] as const, // emerald → green
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Semantic colors
export const semantic = {
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444',   // red-500
  info: '#06b6d4',    // cyan-500
};

// Dark theme (primary)
export const darkTheme = {
  background: '#020617',         // slate-950
  bgSecondary: '#0f172a',        // slate-900
  surfaceElevated1: '#0f172a',   // slate-900
  surfaceElevated2: '#1e293b',   // slate-800
  surfaceElevated3: '#334155',   // slate-700
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',      // slate-400
  textTertiary: '#64748b',       // slate-500
  textMuted: '#475569',          // slate-600
  borderPrimary: 'rgba(51, 65, 85, 0.5)', // slate-700 with opacity
  borderSecondary: 'rgba(30, 41, 59, 0.5)', // slate-800 with opacity
  primary: '#06b6d4',            // cyan-500
  primaryHover: '#22d3ee',       // cyan-400
  primaryActive: '#0891b2',      // cyan-600
  secondary: '#10b981',          // emerald-500
  secondaryHover: '#34d399',     // emerald-400
  cardBackground: '#1e293b',     // slate-800
  cardBorder: 'rgba(51, 65, 85, 0.5)', // slate-700 with opacity
  cardGlow: 'rgba(6, 182, 212, 0.15)', // cyan glow
  inputBackground: '#0f172a',    // slate-900
  inputBorder: '#334155',        // slate-700
};

// Light theme
export const lightTheme = {
  background: '#fafaf9',         // stone-50
  bgSecondary: '#ffffff',
  surfaceElevated1: '#ffffff',
  surfaceElevated2: '#f5f5f4',   // stone-100
  surfaceElevated3: '#e7e5e4',   // stone-200
  textPrimary: '#1c1917',        // stone-900
  textSecondary: '#57534e',      // stone-600
  textTertiary: '#78716c',       // stone-500
  textMuted: '#a8a29e',          // stone-400
  borderPrimary: '#e7e5e4',      // stone-200
  borderSecondary: '#d6d3d1',    // stone-300
  primary: '#0891b2',            // cyan-600
  primaryHover: '#06b6d4',       // cyan-500
  primaryActive: '#0e7490',      // cyan-700
  secondary: '#059669',          // emerald-600
  secondaryHover: '#10b981',     // emerald-500
  cardBackground: '#ffffff',
  cardBorder: '#e7e5e4',         // stone-200
  cardGlow: 'rgba(6, 182, 212, 0.1)', // cyan glow (lighter)
  inputBackground: '#ffffff',
  inputBorder: '#d6d3d1',        // stone-300
};

// Legacy gradients (for backwards compatibility)
export const gradients = {
  primary: gradient,
  primaryDeep: {
    colors: ['#0891b2', '#059669'] as const, // cyan-600, emerald-600
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  primaryBright: {
    colors: ['#22d3ee', '#34d399'] as const, // cyan-400, emerald-400
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Spacing scale
export const spacing = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Legacy numeric keys for backwards compatibility
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: (color: string, opacity = 0.4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: 20,
    elevation: 8,
  }),
};

// Typography scale with display sizes
export const typography = {
  // Display sizes (new)
  displayLarge: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
  displayMedium: { fontSize: 36, lineHeight: 44, fontWeight: '600' as const },
  displaySmall: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
  // Headings
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h2: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  h3: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  h4: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  h5: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  h6: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  // Body
  bodyLarge: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  // Labels
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  code: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
};

// Font families
export const fontFamilies = {
  headingBold: 'Montserrat_700Bold',
  headingSemiBold: 'Montserrat_600SemiBold',
  headingMedium: 'Montserrat_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

// Colors export (used by useThemeColor hook)
export const Colors = {
  light: {
    text: lightTheme.textPrimary,
    textSecondary: lightTheme.textSecondary,
    textMuted: lightTheme.textMuted,
    background: lightTheme.background,
    bgSecondary: lightTheme.bgSecondary,
    surfaceElevated1: lightTheme.surfaceElevated1,
    surfaceElevated2: lightTheme.surfaceElevated2,
    surfaceElevated3: lightTheme.surfaceElevated3,
    borderPrimary: lightTheme.borderPrimary,
    borderSecondary: lightTheme.borderSecondary,
    primary: lightTheme.primary,
    primaryHover: lightTheme.primaryHover,
    primaryActive: lightTheme.primaryActive,
    secondary: lightTheme.secondary,
    secondaryHover: lightTheme.secondaryHover,
    cardBackground: lightTheme.cardBackground,
    cardBorder: lightTheme.cardBorder,
    cardGlow: lightTheme.cardGlow,
    inputBackground: lightTheme.inputBackground,
    inputBorder: lightTheme.inputBorder,
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
    tint: lightTheme.primary,
    icon: lightTheme.textSecondary,
    tabIconDefault: lightTheme.textMuted,
    tabIconSelected: lightTheme.primary,
  },
  dark: {
    text: darkTheme.textPrimary,
    textSecondary: darkTheme.textSecondary,
    textMuted: darkTheme.textMuted,
    background: darkTheme.background,
    bgSecondary: darkTheme.bgSecondary,
    surfaceElevated1: darkTheme.surfaceElevated1,
    surfaceElevated2: darkTheme.surfaceElevated2,
    surfaceElevated3: darkTheme.surfaceElevated3,
    borderPrimary: darkTheme.borderPrimary,
    borderSecondary: darkTheme.borderSecondary,
    primary: darkTheme.primary,
    primaryHover: darkTheme.primaryHover,
    primaryActive: darkTheme.primaryActive,
    secondary: darkTheme.secondary,
    secondaryHover: darkTheme.secondaryHover,
    cardBackground: darkTheme.cardBackground,
    cardBorder: darkTheme.cardBorder,
    cardGlow: darkTheme.cardGlow,
    inputBackground: darkTheme.inputBackground,
    inputBorder: darkTheme.inputBorder,
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
    tint: darkTheme.primary,
    icon: darkTheme.textSecondary,
    tabIconDefault: darkTheme.textMuted,
    tabIconSelected: darkTheme.primary,
  },
};

// Legacy color palettes (for backwards compatibility)
export const primary = {
  50: '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
  600: '#0891b2',
  700: '#0e7490',
  800: '#155e75',
  900: '#164e63',
  950: '#083344',
};

export const secondary = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
};

export const gray = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

// Main theme export
export const theme = {
  colors: {
    primary,
    secondary,
    gray,
    semantic,
  },
  light: lightTheme,
  dark: darkTheme,
  gradient,
  ratingColors,
  gradients,
  spacing,
  borderRadius,
  shadows,
  typography,
  fontWeights,
  fontFamilies,
};

export default theme;
