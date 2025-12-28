/**
 * Seido Karate Club - Layout Configuration
 * 
 * Breakpoints, grid configurations, and layout-specific settings.
 */

export const layout = {
    // Responsive breakpoints
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // Grid configurations
    grid: {
        columns: {
            1: '1',
            2: '2',
            3: '3',
            4: '4',
            6: '6',
            12: '12',
        },
        gap: {
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
        },
    },

    // Z-index layers
    zIndex: {
        base: '0',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        modalBackdrop: '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
    },

    // Sidebar dimensions
    sidebar: {
        width: {
            collapsed: '4rem',
            expanded: '16rem',
        },
    },

    // Header/Navigation
    header: {
        height: '4rem',
    },
} as const;
