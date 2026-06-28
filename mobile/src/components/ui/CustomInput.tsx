import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function CustomInput({ 
  label, 
  error, 
  containerClassName = '', 
  ...props 
}: CustomInputProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {!!label && (
        <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-base text-gray-900 focus:border-blue-500`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {!!error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
