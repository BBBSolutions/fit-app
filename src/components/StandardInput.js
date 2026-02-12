import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme/theme';

/**
 * StandardInput - A consistent text input component
 * 
 * @param {String} label - Optional label above the input
 * @param {String} error - Error message to display
 * @param {ReactNode} leftIcon - Icon to display on the left
 * @param {ReactNode} rightIcon - Icon to display on the right (clickable)
 * @param {Function} onRightIconPress - Handler for right icon press
 * @param {Object} containerStyle - Style for the outer container
 * @param {Object} style - Style for the input itself
 */
const StandardInput = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[
                styles.inputWrapper,
                isFocused && styles.focusedWrapper,
                error && styles.errorWrapper,
                style
            ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.gray[400]}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />

                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIcon}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
        width: '100%',
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray[50],
        borderWidth: 1,
        borderColor: colors.gray[200],
        borderRadius: borderRadius.md,
        height: 56, // Accessible height
        paddingHorizontal: spacing.md,
    },
    focusedWrapper: {
        borderColor: colors.primary,
        backgroundColor: colors.white,
    },
    errorWrapper: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        height: '100%',
        color: colors.text.primary,
        fontSize: typography.fontSize.base,
    },
    leftIcon: {
        marginRight: spacing.sm,
    },
    rightIcon: {
        marginLeft: spacing.sm,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.fontSize.xs,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
});

export default StandardInput;
