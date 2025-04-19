import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeProvider } from '../context/ThemeContext';
import { useTheme } from 'react-native-paper';

function TabLayout() {
  const theme = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onBackground,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 24,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Triage Assistant",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TabLayout />
    </ThemeProvider>
  );
}
