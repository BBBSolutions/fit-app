import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, borderRadius, spacing, typography } from '../theme/theme';

/**
 * AnimatedButton - Pressable button with scale animation
 * 
 * @param {String} title - Button text
 * @param {Function} onPress - Press handler
 * @param {String} variant - 'primary', 'secondary', 'outline', 'ghost', 'gradient'
 * @param {String} size - 'small', 'medium', 'large'
 * @param {Boolean} loading - Show loading indicator
 * @param {Boolean} disabled - Disable button
 * @param {Object} style - Additional button styles
 * @param {Object} textStyle - Additional text styles
 * @param {ReactNode} icon - Optional icon component
 * @param {String} iconPosition - 'left' or 'right'
 */
const AnimatedButton = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
    iconPosition = 'left',
    gradientColors = colors.trainerGradient,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 100,
            friction: 3,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 3,
        }).start();
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    minHeight: 36,
                };
            case 'large':
                return {
                    paddingVertical: spacing.lg,
                    paddingHorizontal: spacing.xxl,
                    minHeight: 56,
                };
            default: // medium
                return {
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.xl,
                    minHeight: 48,
                };
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'small':
                return typography.fontSize.sm;
            case 'large':
                return typography.fontSize.lg;
            default:
                return typography.fontSize.base;
        }
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    button: {
                        backgroundColor: colors.gray[100],
                    },
                    text: {
                        color: colors.text.primary,
                    },
                };
            case 'outline':
                return {
                    button: {
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderColor: colors.trainer.primary,
                    },
                    text: {
                        color: colors.trainer.primary,
                    },
                };
            case 'ghost':
                return {
                    button: {
                        backgroundColor: 'transparent',
                    },
                    text: {
                        color: colors.trainer.primary,
                    },
                };
            case 'gradient':
                return {
                    button: {},
                    text: {
                        color: colors.white,
                    },
                };
            default: // primary
                return {
                    button: {
                        backgroundColor: colors.trainer.primary,
                    },
                    text: {
                        color: colors.white,
                    },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const ButtonContent = () => (
        <>
            {loading ? (
                <ActivityIndicator color={variantStyles.text.color} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    <Text
                        style={[
                            styles.buttonText,
                            variantStyles.text,
                            { fontSize: getTextSize() },
                            icon && { marginLeft: iconPosition === 'left' ? spacing.sm : 0 },
                            icon && { marginRight: iconPosition === 'right' ? spacing.sm : 0 },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </>
    );

    if (variant === 'gradient') {
        return (
            <Animated.View
                style={[
                    { transform: [{ scale: scaleAnim }] },
                    style,
                ]}
            >
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || loading}
                    activeOpacity={0.9}
                    {...props}
                >
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                            styles.button,
                            sizeStyles,
                            shadows.md,
                            disabled && styles.disabled,
                        ]}
                    >
                        <ButtonContent />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    variantStyles.button,
                    sizeStyles,
                    variant === 'primary' && shadows.md,
                    disabled && styles.disabled,
                    style,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.8}
                {...props}
            >
                <ButtonContent />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
    },
    buttonText: {
        fontWeight: typography.fontWeight.semibold,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default AnimatedButton;
