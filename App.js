import { ChatProvider } from './src/context/ChatContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// This invokes setNotificationHandler synchronously before any components mount
import './src/services/notifications';

export default function App() {
  return (
    <SafeAreaProvider>
      <ChatProvider>
        <AppNavigator />
      </ChatProvider>
    </SafeAreaProvider>
  );
}
