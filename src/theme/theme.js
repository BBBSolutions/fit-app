// Modern theme configuration for the fitness app
// Emphasizing premium design with gradients and vibrant colors

export const colors = {
    // Primary Gradients
    primaryGradient: ['#667eea', '#764ba2'], // Purple to Deep Purple
    trainerGradient: ['#4299E1', '#3182CE'], // Blue to Dark Blue
    accentGradient: ['#FF6B6B', '#FF8E53'], // Coral to Orange
    successGradient: ['#06D6A0', '#00B4D8'], // Teal to Blue
    warningGradient: ['#FFD166', '#F77F00'], // Yellow to Orange

    // Solid Colors
    primary: '#667eea',
    primaryDark: '#5B47E5',
    primaryLight: '#9F7AEA',

    trainer: {
        primary: '#3182CE',
        secondary: '#FF6B6B',
        accent: '#06D6A0',
        background: '#F8F9FF',
        cardBg: '#FFFFFF',
    },

    member: {
        primary: '#3182CE',
        secondary: '#48BB78',
        accent: '#F6AD55',
        background: '#F5F7FA',
        cardBg: '#FFFFFF',
    },

    // Semantic Colors
    success: '#06D6A0',
    warning: '#FFD166',
    error: '#EF476F',
    info: '#00B4D8',

    // Neutrals
    white: '#FFFFFF',
    black: '#000000',
    gray: {
        50: '#F7FAFC',
        100: '#EDF2F7',
        200: '#E2E8F0',
        300: '#CBD5E0',
        400: '#A0AEC0',
        500: '#718096',
        600: '#4A5568',
        700: '#2D3748',
        800: '#1A202C',
        900: '#171923',
    },

    // Text Colors
    text: {
        primary: '#1A202C',
        secondary: '#4A5568',
        tertiary: '#718096',
        disabled: '#A0AEC0',
        inverse: '#FFFFFF',
    },

    // Background Colors
    background: {
        primary: '#FFFFFF',
        secondary: '#F7FAFC',
        tertiary: '#EDF2F7',
        overlay: 'rgba(0, 0, 0, 0.5)',
        overlayLight: 'rgba(0, 0, 0, 0.3)',
    },

    // UI Elements
    input: {
        background: '#F7FAFC',
        border: '#E2E8F0',
        text: '#2D3748',
        placeholder: '#A0AEC0',
    },
    border: '#E2E8F0',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    colored: (color) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    }),
};

export const typography = {
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 28,
        huge: 32,
        massive: 40,
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const animations = {
    duration: {
        fast: 150,
        normal: 250,
        slow: 350,
    },
    spring: {
        tension: 40,
        friction: 7,
    },
};

// Helper function to create glassmorphic effect
export const glassmorphism = (opacity = 0.7, blur = 10) => ({
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
});

// Helper function to create gradient text (requires additional library or workaround)
export const gradientText = {
    backgroundGradient: colors.primaryGradient,
    backgroundClip: 'text',
    color: 'transparent',
};

export default {
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
    animations,
    glassmorphism,
    gradientText,
};
