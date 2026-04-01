import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MemberHomeDashboardScreen from '../screens/Member/MemberHomeDashboardScreen';
import WorkoutPlansScreen from '../screens/Member/WorkoutPlansScreen';
import ProgressScreen from '../screens/Member/ProgressScreen';
import MessagesListScreen from '../screens/Member/MessagesListScreen';
import ProfileScreen from '../screens/Member/ProfileScreen';

import { setupNotifications } from '../services/notifications';
import { useChat } from '../context/ChatContext';

const Tab = createBottomTabNavigator();

const MainBottomTabs = () => {
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
                    } else if (route.name === 'Workouts') {
                        iconName = focused ? 'barbell' : 'barbell-outline';
                    } else if (route.name === 'Progress') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    } else if (route.name === 'Messages') {
                        iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                    } else {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3182CE',
                tabBarInactiveTintColor: '#A0AEC0',
                tabBarShowLabel: true,
                headerShown: false,
                unmountOnBlur: Platform.OS === 'web',
                tabBarStyle: {
                    minHeight: 60 + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 8),
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
                },
            })}
        >
            <Tab.Screen name="Home" component={MemberHomeDashboardScreen} />
            <Tab.Screen name="Workouts" component={WorkoutPlansScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
            <Tab.Screen
                name="Messages"
                component={MessagesListScreen}
                options={{
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
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainBottomTabs;
