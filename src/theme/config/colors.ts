/**
 * Seido Karate Club - Color Theme Configuration
 * 
 * This file contains all color definitions for the application.
 * To change the theme, simply update the HSL values below.
 * 
 * All colors use HSL format for better manipulation and consistency.
 */

export const colors = {
  light: {
    // Core Colors - Clean white background with deep blacks
    background: '0 0% 100%',
    foreground: '0 0% 10%',

    card: '0 0% 100%',
    cardForeground: '0 0% 10%',

    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',

    // Black - Primary brand color
    primary: '0 0% 10%',
    primaryForeground: '0 0% 100%',

    // Subtle grays for secondary elements
    secondary: '0 0% 96%',
    secondaryForeground: '0 0% 10%',

    muted: '0 0% 96%',
    mutedForeground: '0 0% 45%',

    // Gold - Accent color from logo
    accent: '45 100% 50%',
    accentForeground: '0 0% 10%',

    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',

    border: '0 0% 90%',
    input: '0 0% 96%',
    ring: '45 100% 50%',

    // Sidebar colors
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '240 5.3% 26.1%',
    sidebarPrimary: '240 5.9% 10%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '240 4.8% 95.9%',
    sidebarAccentForeground: '240 5.9% 10%',
    sidebarBorder: '220 13% 91%',
    sidebarRing: '217.2 91.2% 59.8%',
  },

  dark: {
    background: '0 0% 5%',
    foreground: '0 0% 95%',

    card: '0 0% 8%',
    cardForeground: '0 0% 95%',

    popover: '0 0% 8%',
    popoverForeground: '0 0% 95%',

    primary: '0 0% 15%',
    primaryForeground: '0 0% 100%',

    secondary: '0 0% 12%',
    secondaryForeground: '0 0% 95%',

    muted: '0 0% 12%',
    mutedForeground: '0 0% 60%',

    accent: '45 100% 50%',
    accentForeground: '0 0% 10%',

    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',

    border: '0 0% 20%',
    input: '0 0% 12%',
    ring: '45 100% 50%',

    sidebarBackground: '240 5.9% 10%',
    sidebarForeground: '240 4.8% 95.9%',
    sidebarPrimary: '224.3 76.3% 48%',
    sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '240 3.7% 15.9%',
    sidebarAccentForeground: '240 4.8% 95.9%',
    sidebarBorder: '240 3.7% 15.9%',
    sidebarRing: '217.2 91.2% 59.8%',
  },
} as const;

/**
 * Status colors for grading results
 * These are used for badges and status indicators
 */
export const statusColors = {
  pending: {
    light: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    },
    dark: {
      bg: 'dark:bg-yellow-900/30',
      text: 'dark:text-yellow-200',
      border: 'dark:border-yellow-800',
    },
  },
  pass: {
    light: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    dark: {
      bg: 'dark:bg-green-900/30',
      text: 'dark:text-green-200',
      border: 'dark:border-green-800',
    },
  },
  fail: {
    light: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    dark: {
      bg: 'dark:bg-red-900/30',
      text: 'dark:text-red-200',
      border: 'dark:border-red-800',
    },
  },
} as const;
