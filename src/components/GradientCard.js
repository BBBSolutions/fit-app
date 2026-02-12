import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    fullHeight = false,
    useGradient = false,
    gradientColors = colors.primaryGradient,
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

    const renderContent = () => {
        const commonStyles = [
            styles.cardContent,
            fullHeight && { flex: 1 }, // Apply flex: 1 if fullHeight
            { margin: borderWidth },
            contentStyle,
        ];

        if (useGradient) {
            return (
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={commonStyles}
                >
                    {children}
                </LinearGradient>
            );
        }

        const content = (
            <View
                style={[
                    ...commonStyles,
                    // Web-only glassmorphism if BlurView isn't used or allowed there easily
                    (glassmorphic && Platform.OS === 'web') && styles.glassmorphicWeb,
                    !glassmorphic && { backgroundColor: colors.white }, // Solid background if not glass
                ]}
            >
                {children}
            </View>
        );

        if (glassmorphic && Platform.OS !== 'web') {
            return (
                <BlurView
                    intensity={80}
                    tint="light"
                    style={[
                        styles.blurContainer,
                        fullHeight && { flex: 1 }, // Apply flex: 1 if fullHeight
                        { margin: borderWidth, borderRadius: borderRadius.lg - 2 }
                    ]}
                >
                    {children}
                </BlurView>
            );
        }

        return content;
    };


    // If gradient border is enabled, use LinearGradient wrapper
    if (gradientBorder) {
        return (
            <CardContainer
                style={[styles.cardWrapper, fullHeight && { flex: 1 }, style]}
                onPress={onPress}
                activeOpacity={onPress ? 0.7 : 1}
                {...props}
            >
                <LinearGradient
                    colors={borderColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.gradientBorder,
                        fullHeight && { flex: 1 }, // Apply flex: 1 if fullHeight
                        getVariantStyles()
                    ]}
                >
                    {renderContent()}
                </LinearGradient>
            </CardContainer>
        );
    }

    // Regular card without gradient border
    return (
        <CardContainer
            style={[
                styles.card,
                glassmorphic && Platform.OS === 'web' && styles.glassmorphicWeb,
                getVariantStyles(),
                style,
            ]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            {...props}
        >
            {glassmorphic && Platform.OS !== 'web' ? (
                <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                    <View style={{ padding: spacing.lg }}>{children}</View>
                </BlurView>
            ) : (
                renderContent()
            )}
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
        borderRadius: borderRadius.lg - 2,
        padding: spacing.lg,
        overflow: 'hidden',
    },
    blurContainer: {
        borderRadius: borderRadius.lg - 2,
        padding: spacing.lg,
        overflow: 'hidden',
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        overflow: 'hidden',
    },
    glassmorphicWeb: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
});

export default GradientCard;
