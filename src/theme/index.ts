/**
 * Seido Karate Club - Theme System
 * 
 * Central export for all theme configuration.
 * Import this file to access theme values in your components.
 */

import { colors, statusColors } from './config/colors';
import { typography } from './config/typography';
import { spacing } from './config/spacing';
import { layout } from './config/layout';

export const theme = {
    colors,
    statusColors,
    typography,
    spacing,
    layout,
} as const;

// Export individual configs for convenience
export { colors, statusColors, typography, spacing, layout };

// Type exports for TypeScript
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Layout = typeof layout;

/**
 * Helper function to get status color classes
 * 
 * @example
 * const classes = getStatusClasses('pass');
 * // Returns: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
 */
export function getStatusClasses(status: 'pending' | 'pass' | 'fail'): string {
    const statusColor = statusColors[status];
    return `${statusColor.light.bg} ${statusColor.light.text} ${statusColor.light.border} ${statusColor.dark.bg} ${statusColor.dark.text} ${statusColor.dark.border}`;
}
