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
 */
const ScreenWrapper = ({
    children,
    useGradient = false,
    backgroundColor = colors.background.primary,
    statusBarColor = 'dark-content',
    keyboardAvoiding = true,
    safeAreaEdges = ['top', 'left', 'right', 'bottom'],
    style,
    ...props
}) => {
    const Container = useGradient ? GradientBackground : View;
    const containerStyle = useGradient ? {} : { backgroundColor };

    const wrapperContent = (
        <SafeAreaView style={[styles.safeArea, style]} edges={safeAreaEdges}>
            <StatusBar barStyle={statusBarColor} backgroundColor="transparent" translucent={Platform.OS === 'android'} />
            {children}
        </SafeAreaView>
    );

    return (
        <Container style={[styles.container, containerStyle]} {...props}>
            {keyboardAvoiding ? (
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {wrapperContent}
                </KeyboardAvoidingView>
            ) : (
                wrapperContent
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
