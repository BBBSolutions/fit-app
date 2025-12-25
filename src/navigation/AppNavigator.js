import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GymCodeScreen from '../screens/Shared/GymCodeScreen';
import LoginScreen from '../screens/Shared/LoginScreen';
import MemberLoginScreen from '../screens/Member/MemberLoginScreen';
import MainBottomTabs from './MainBottomTabs';
import WorkoutDetailScreen from '../screens/Member/WorkoutDetailScreen';
import DietLoggingScreen from '../screens/Member/DietLoggingScreen';
import OnboardingSurvey from '../screens/Member/OnboardingSurvey';
import TrainerLoginScreen from '../screens/Trainer/TrainerLoginScreen';
import TrainerOnboardingSurveyScreen from '../screens/Trainer/TrainerOnboardingSurveyScreen';
import TrainerDashboardScreen from '../screens/Trainer/TrainerDashboardScreen';
import TrainerClientListScreen from '../screens/Trainer/TrainerClientListScreen';
import TrainerClientDetailsScreen from '../screens/Trainer/TrainerClientDetailsScreen';
import TrainerChatScreen from '../screens/Trainer/TrainerChatScreen';
import TrainerDetails from '../screens/Trainer/TrainerDetails';
import EditWorkoutPlanScreen from '../screens/Shared/EditWorkoutPlanScreen';
import MemberCreateWorkoutScreen from '../screens/Member/MemberCreateWorkoutScreen';
import MessagesScreen from '../screens/Member/MessagesScreen';
import AdminBrandingScreen from '../screens/Admin/AdminBrandingScreen';
import AdminUserOnboardingScreen from '../screens/Admin/AdminUserOnboardingScreen';
import AdminBillingScreen from '../screens/Admin/AdminBillingScreen';
import AdminAnalyticsScreen from '../screens/Admin/AdminAnalyticsScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminSettingsScreen from '../screens/Admin/AdminSettingsScreen';
import AdminContentManagerScreen from '../screens/Admin/AdminContentManagerScreen';
import AdminLeadManagementScreen from '../screens/Admin/AdminLeadManagementScreen';
import SuperAdminGlobalSettingsScreen from '../screens/SuperAdmin/SuperAdminGlobalSettingsScreen';
import SuperAdminGymOnboardingManagerScreen from '../screens/SuperAdmin/SuperAdminGymOnboardingManagerScreen';
import SuperAdminSubscriptionTierManagerScreen from '../screens/SuperAdmin/SuperAdminSubscriptionTierManagerScreen';
import SuperAdminOpenAITokenUsageMonitorScreen from '../screens/SuperAdmin/SuperAdminOpenAITokenUsageMonitorScreen';
import SuperAdminDeploymentControlCenterScreen from '../screens/SuperAdmin/SuperAdminDeploymentControlCenterScreen';
import SuperAdminPlatformBillingScreen from '../screens/SuperAdmin/SuperAdminPlatformBillingScreen';
import SuperAdminPlatformAnalyticsScreen from '../screens/SuperAdmin/SuperAdminPlatformAnalyticsScreen';
import SuperAdminSystemLogsScreen from '../screens/SuperAdmin/SuperAdminSystemLogsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="GymCode">
                <Stack.Screen name="GymCode" component={GymCodeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="MemberLogin" component={MemberLoginScreen} />
                <Stack.Screen name="MainApp" component={MainBottomTabs} options={{ headerShown: false }} />
                <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
                <Stack.Screen name="DietLogging" component={DietLoggingScreen} />
                <Stack.Screen name="OnboardingSurvey" component={OnboardingSurvey} />
                <Stack.Screen name="TrainerLogin" component={TrainerLoginScreen} />
                <Stack.Screen name="TrainerOnboarding" component={TrainerOnboardingSurveyScreen} />
                <Stack.Screen name="TrainerDashboard" component={TrainerDashboardScreen} />
                <Stack.Screen name="TrainerClientList" component={TrainerClientListScreen} />
                <Stack.Screen name="TrainerClientDetails" component={TrainerClientDetailsScreen} />
                <Stack.Screen name="TrainerChat" component={TrainerChatScreen} />
                <Stack.Screen name="TrainerDetails" component={TrainerDetails} />
                <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditWorkoutPlan" component={EditWorkoutPlanScreen} />
                <Stack.Screen name="MemberCreateWorkout" component={MemberCreateWorkoutScreen} />
                <Stack.Screen name="WorkoutResults" component={require('../screens/Member/WorkoutResultsScreen').default} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="AdminBranding" component={AdminBrandingScreen} />
                <Stack.Screen name="AdminUserOnboarding" component={AdminUserOnboardingScreen} />
                <Stack.Screen name="AdminBilling" component={AdminBillingScreen} />
                <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="AdminContentManager" component={AdminContentManagerScreen} />
                <Stack.Screen name="AdminLeadManagement" component={AdminLeadManagementScreen} />
                <Stack.Screen name="SuperAdminGlobalSettings" component={SuperAdminGlobalSettingsScreen} />
                <Stack.Screen name="SuperAdminGymOnboarding" component={SuperAdminGymOnboardingManagerScreen} />
                <Stack.Screen name="SuperAdminSubscriptionTiers" component={SuperAdminSubscriptionTierManagerScreen} />
                <Stack.Screen name="SuperAdminAITokenMonitor" component={SuperAdminOpenAITokenUsageMonitorScreen} />
                <Stack.Screen name="SuperAdminDeployment" component={SuperAdminDeploymentControlCenterScreen} />
                <Stack.Screen name="SuperAdminBilling" component={SuperAdminPlatformBillingScreen} />
                <Stack.Screen name="SuperAdminAnalytics" component={SuperAdminPlatformAnalyticsScreen} />
                <Stack.Screen name="SuperAdminSystemLogs" component={SuperAdminSystemLogsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
