import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export function LoadingScreen({ message = 'Đang tải...' }: { message?: string }) {
  return (
    <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{message}</Text>
    </View>
  );
}
