import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, borderRadius, spacing } from '../theme/theme';

/**
 * GradientCard - Modern card with glassmorphism and gradient border
 * 
 * @param {ReactNode} children - Card content
 * @param {Object} style - Additional styles for card container
 * @param {Object} contentStyle - Styles for content wrapper
 * @param {Boolean} glassmorphic - Enable glassmorphism effect (default: false)
 * @param {Boolean} gradientBorder - Enable gradient border (default: true)
 * @param {Array} borderColors - Custom gradient colors for border
 * @param {Number} borderWidth - Border width (default: 2)
 * @param {Function} onPress - Optional press handler (makes card touchable)
 * @param {String} variant - Preset style: 'default', 'elevated', 'flat'
 */
const GradientCard = ({
    children,
    style,
    contentStyle,
    glassmorphic = false,
    gradientBorder = true,
    borderColors = colors.trainerGradient,
    borderWidth = 2,
    onPress,
    variant = 'default',
    ...props
}) => {
    const CardContainer = onPress ? TouchableOpacity : View;

    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated':
                return { ...shadows.lg };
            case 'flat':
                return { elevation: 0, shadowOpacity: 0 };
            default:
                return { ...shadows.md };
        }
    };

    // If gradient border is enabled, use LinearGradient wrapper
    if (gradientBorder) {
        return (
            <CardContainer
                style={[styles.cardWrapper, style]}
                onPress={onPress}
                activeOpacity={onPress ? 0.7 : 1}
                {...props}
            >
                <LinearGradient
                    colors={borderColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradientBorder, getVariantStyles()]}
                >
                    <View
                        style={[
                            styles.cardContent,
                            glassmorphic && styles.glassmorphic,
                            { margin: borderWidth },
                            contentStyle,
                        ]}
                    >
                        {children}
                    </View>
                </LinearGradient>
            </CardContainer>
        );
    }

    // Regular card without gradient border
    return (
        <CardContainer
            style={[
                styles.card,
                glassmorphic && styles.glassmorphic,
                getVariantStyles(),
                style,
            ]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            {...props}
        >
            {children}
        </CardContainer>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        borderRadius: borderRadius.lg,
    },
    gradientBorder: {
        borderRadius: borderRadius.lg,
        padding: 0,
        width: '100%',
    },
    cardContent: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg - 2,
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    glassmorphic: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
});

export default GradientCard;
