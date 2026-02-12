import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TrainerDashboardScreen from '../screens/Trainer/TrainerDashboardScreen';
import TrainerClientListScreen from '../screens/Trainer/TrainerClientListScreen';
import TrainerScheduleScreen from '../screens/Trainer/TrainerScheduleScreen';
import TrainerChatScreen from '../screens/Trainer/TrainerChatScreen';
import TrainerDetails from '../screens/Trainer/TrainerDetails';

import { colors, typography, spacing } from '../theme/theme';

import { setupNotifications } from '../services/notifications';
import { useChat } from '../context/ChatContext';

const Tab = createBottomTabNavigator();

const TrainerBottomTabs = () => {
    const { unreadCount } = useChat();
    const insets = useSafeAreaInsets();

    React.useEffect(() => {
        setupNotifications();
    }, []);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Clients') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Schedule') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Messages') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return (
                        <Ionicons
                            name={iconName}
                            size={size}
                            color={color}
                        />
                    );
                },
                tabBarActiveTintColor: colors.trainer.primary,
                tabBarInactiveTintColor: colors.gray[400],
                tabBarShowLabel: true,
                headerShown: false,
                tabBarStyle: {
                    minHeight: 60 + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 8),
                    paddingTop: 8,
                    backgroundColor: colors.white,
                    borderTopWidth: Platform.OS === 'web' ? 1 : 0,
                    borderTopColor: colors.gray[200],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 12,
                },
                tabBarLabelStyle: {
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    marginTop: -2,
                },
                tabBarItemStyle: {
                    paddingVertical: spacing.xs,
                },
                tabBarIconStyle: {
                    marginBottom: -4,
                },
                tabBarBackground: () => (
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                ),
            })}
        >
            <Tab.Screen
                name="Home"
                component={TrainerDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Clients"
                component={TrainerClientListScreen}
                options={{
                    tabBarLabel: 'Clients',
                }}
            />
            <Tab.Screen
                name="Schedule"
                component={TrainerScheduleScreen}
                options={{
                    tabBarLabel: 'Schedule',
                }}
            />
            <Tab.Screen
                name="Messages"
                component={TrainerChatScreen}
                options={{
                    tabBarLabel: 'Messages',
                    tabBarBadge: unreadCount > 0 ? unreadCount : null,
                    tabBarBadgeStyle: { backgroundColor: colors.trainer.primary, color: 'white' }
                }}
            />
            <Tab.Screen
                name="Profile"
                component={TrainerDetails}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

export default TrainerBottomTabs;
