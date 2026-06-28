import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false,
  className = ''
}: CustomButtonProps) {
  let bgClass = 'bg-blue-600';
  let textClass = 'text-white';
  
  if (variant === 'secondary') {
    bgClass = 'bg-gray-200';
    textClass = 'text-gray-900';
  } else if (variant === 'outline') {
    bgClass = 'bg-transparent border border-blue-600';
    textClass = 'text-blue-600';
  } else if (variant === 'danger') {
    bgClass = 'bg-red-500';
    textClass = 'text-white';
  }

  if (disabled) {
    bgClass = 'bg-gray-400';
    textClass = 'text-gray-200';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`py-3 px-4 rounded-xl flex-row justify-center items-center ${bgClass} ${className}`}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563eb' : '#ffffff'} className="mr-2" />
      ) : null}
      <Text className={`font-semibold text-center text-lg ${textClass}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
