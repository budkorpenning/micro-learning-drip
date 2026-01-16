import { useThemePreference } from '@/src/context/ThemeContext';

/**
 * Returns the resolved color scheme based on user preference.
 * - 'system': follows device setting
 * - 'light' / 'dark': user override
 */
export function useColorScheme(): 'light' | 'dark' {
  const { resolved } = useThemePreference();
  return resolved;
}
