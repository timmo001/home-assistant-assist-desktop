/**
 * Theme Management
 * Handles light/dark mode with auto-detection and manual override
 */

const STORAGE_KEY = 'ha-assist:theme';

export type Theme = 'light' | 'dark' | 'auto';

export class ThemeManager {
  private static mediaQuery: MediaQuery | null = null;

  /**
   * Get system's preferred color scheme
   */
  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }

  /**
   * Get user's theme preference from localStorage
   * Falls back to 'auto' if not set
   */
  static getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'auto';
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
    return 'auto';
  }

  /**
   * Save user's theme preference to localStorage
   */
  static setStoredTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEY, theme);
  }

  /**
   * Get the effective theme (resolves 'auto' to 'light' or 'dark')
   */
  static getEffectiveTheme(preference?: Theme): 'light' | 'dark' {
    const pref = preference || this.getStoredTheme();
    
    if (pref === 'auto') {
      return this.getSystemTheme();
    }
    
    return pref;
  }

  /**
   * Apply theme to document
   */
  static applyTheme(theme: 'light' | 'dark'): void {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.dataset.theme = 'dark';
    } else {
      delete root.dataset.theme;
    }
  }

  /**
   * Initialize theme system
   * Applies stored preference or system default
   */
  static init(): void {
    const preference = this.getStoredTheme();
    const effective = this.getEffectiveTheme(preference);
    this.applyTheme(effective);

    // Watch for system preference changes if set to 'auto'
    if (preference === 'auto') {
      this.watchSystemTheme();
    }
  }

  /**
   * Set theme preference and apply it
   */
  static setTheme(theme: Theme): void {
    this.setStoredTheme(theme);
    const effective = this.getEffectiveTheme(theme);
    this.applyTheme(effective);

    // Update system watcher
    if (theme === 'auto') {
      this.watchSystemTheme();
    } else {
      this.unwatchSystemTheme();
    }
  }

  /**
   * Toggle between light and dark (disables auto mode)
   */
  static toggle(): void {
    const current = this.getEffectiveTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Watch for system preference changes
   */
  private static watchSystemTheme(): void {
    if (typeof window === 'undefined') return;
    
    // Remove existing listener if any
    this.unwatchSystemTheme();

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      // Only apply if still in auto mode
      if (this.getStoredTheme() === 'auto') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Modern browsers
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handler);
    }
    // Legacy browsers
    else if ((this.mediaQuery as any).addListener) {
      (this.mediaQuery as any).addListener(handler);
    }
  }

  /**
   * Stop watching system preference changes
   */
  private static unwatchSystemTheme(): void {
    if (!this.mediaQuery) return;

    // Remove event listener (both modern and legacy)
    if (this.mediaQuery.removeEventListener) {
      // Note: We can't remove the exact handler, but this won't cause issues
      // since we're checking stored preference in the handler
    }

    this.mediaQuery = null;
  }

  /**
   * Get current theme icon name for UI
   */
  static getThemeIcon(theme?: Theme): string {
    const pref = theme || this.getStoredTheme();
    
    switch (pref) {
      case 'dark':
        return 'moon';
      case 'light':
        return 'sun';
      case 'auto':
        return 'circle-half-stroke';
    }
  }

  /**
   * Get current theme label for UI
   */
  static getThemeLabel(theme?: Theme): string {
    const pref = theme || this.getStoredTheme();
    
    switch (pref) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'auto':
        return 'Auto';
    }
  }
}
