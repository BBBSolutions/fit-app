import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MemberHomeDashboardScreen from '../screens/Member/MemberHomeDashboardScreen';
import WorkoutPlansScreen from '../screens/Member/WorkoutPlansScreen';
import ProgressScreen from '../screens/Member/ProgressScreen';
import MessagesScreen from '../screens/Member/MessagesScreen';
import ProfileScreen from '../screens/Member/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainBottomTabs = () => {
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
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3182CE',
                tabBarInactiveTintColor: '#A0AEC0',
                tabBarShowLabel: true,
                headerShown: false,
                tabBarStyle: {
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderTopWidth: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 10,
                    position: 'absolute',
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
            <Tab.Screen name="Messages" component={MessagesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainBottomTabs;
