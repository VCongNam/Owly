import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuthStore } from '@/shared/store/authStore';

export default function DashboardScreen() {
  const user = useAuthStore(state => state.user);

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.name || 'Người dùng'}!
        </Text>
        <Text className="text-gray-500">
          Chào mừng bạn đến với Owly
        </Text>
      </View>

      <View className="bg-white p-6 rounded-2xl shadow-sm mb-4">
        <Text className="text-lg font-bold text-blue-600 mb-2">Thống kê học tập</Text>
        <Text className="text-gray-600">Tính năng này đang được phát triển...</Text>
      </View>
    </ScrollView>
  );
}
