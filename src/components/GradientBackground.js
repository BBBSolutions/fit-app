import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/theme';

/**
 * GradientBackground - Reusable gradient background component
 * 
 * @param {Array} colors - Array of gradient colors (default: trainerGradient)
 * @param {Array} locations - Optional gradient stop locations
 * @param {Object} start - Start coordinates {x, y} (default: {x: 0, y: 0})
 * @param {Object} end - End coordinates {x, y} (default: {x: 1, y: 1})
 * @param {String} variant - Preset variant: 'trainer', 'accent', 'success', 'warning', 'primary'
 * @param {Object} style - Additional styles
 * @param {ReactNode} children - Child components
 */
const GradientBackground = ({
    colors: customColors,
    locations,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 },
    variant = 'trainer',
    style,
    children,
    ...props
}) => {
    // Select gradient based on variant
    const getGradientColors = () => {
        if (customColors) return customColors;

        switch (variant) {
            case 'trainer':
                return colors.trainerGradient;
            case 'primary':
                return colors.primaryGradient;
            case 'accent':
                return colors.accentGradient;
            case 'success':
                return colors.successGradient;
            case 'warning':
                return colors.warningGradient;
            default:
                return colors.trainerGradient;
        }
    };

    return (
        <LinearGradient
            colors={getGradientColors()}
            locations={locations}
            start={start}
            end={end}
            style={[styles.gradient, style]}
            {...props}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
});

export default GradientBackground;
