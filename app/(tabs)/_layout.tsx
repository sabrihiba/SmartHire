import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';


export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Offres',
          tabBarLabel: 'Offres',
          tabBarIcon: ({ color }) => <Feather name="briefcase" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Candidatures',
          tabBarLabel: 'Candidatures',
          tabBarIcon: ({ color }) => <Feather name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide settings from tab bar if not needed mainly, or add it
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
