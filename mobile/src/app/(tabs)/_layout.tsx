import { Tabs } from 'expo-router';
import { Home, Calendar, Users, FileText } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <Home color={color} />
        }} 
      />
      <Tabs.Screen 
        name="classes" 
        options={{ 
          title: 'Lớp học',
          tabBarIcon: ({ color }) => <Users color={color} />
        }} 
      />
      <Tabs.Screen 
        name="schedule" 
        options={{ 
          title: 'Lịch học',
          tabBarIcon: ({ color }) => <Calendar color={color} />
        }} 
      />
      <Tabs.Screen 
        name="assignments" 
        options={{ 
          title: 'Bài tập',
          tabBarIcon: ({ color }) => <FileText color={color} />
        }} 
      />
    </Tabs>
  );
}
