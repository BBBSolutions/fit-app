import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
    const { unreadCount, hasUnread } = useChat();
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
                tabBarActiveTintColor: '#3182CE',
                tabBarInactiveTintColor: '#A0AEC0',
                tabBarShowLabel: true,
                headerShown: false,
                unmountOnBlur: Platform.OS === 'web',
                tabBarStyle: {
                    height: Platform.OS === 'web' ? 65 : 60 + insets.bottom,
                    paddingBottom: Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 8),
                    paddingTop: 8,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: Platform.OS === 'web' ? 1 : 0,
                    borderTopColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
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
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#38A169',
                        color: '#FFF',
                        fontSize: 10,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                    },
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
