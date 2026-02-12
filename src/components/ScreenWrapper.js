import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    StatusBar,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import GradientBackground from './GradientBackground';

/**
 * ScreenWrapper - A consistent wrapper for all screens.
 * Handles Safe Area, Status Bar, Keyboard Avoiding, and Backgrounds.
 * 
 * @param {ReactNode} children - Screen content
 * @param {Boolean} useGradient - Use global gradient background? (default: false)
 * @param {String} backgroundColor - Custom background color (default: colors.background.primary)
 * @param {String} statusBarColor - Status bar color (default: 'dark-content')
 * @param {Boolean} keyboardAvoiding - Enable KeyboardAvoidingView? (default: true)
 * @param {Object} style - Additional styles for the container
 */
const ScreenWrapper = ({
    children,
    useGradient = false, // If true, uses GradientBackground
    backgroundColor = colors.background.primary,
    statusBarColor = 'dark-content',
    keyboardAvoiding = true,
    style,
    ...props
}) => {

    // Choose the core container
    const Container = useGradient ? GradientBackground : View;
    const containerStyle = useGradient ? {} : { backgroundColor };

    const WrapperContent = (
        <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={statusBarColor} backgroundColor="transparent" translucent={true} />
            {children}
        </SafeAreaView>
    );

    return (
        <Container style={[styles.container, containerStyle]} {...props}>
            {keyboardAvoiding ? (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {WrapperContent}
                </KeyboardAvoidingView>
            ) : (
                WrapperContent
            )}
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
});

export default ScreenWrapper;
