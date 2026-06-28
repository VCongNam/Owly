import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { CustomInput } from '@/components/ui/CustomInput';
import { api } from '@/shared/services/api';
import { useAuthStore } from '@/shared/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  const setAuth = useAuthStore(state => state.setAuth);

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response: any = await api.post('/auth/login', { email, password });
      
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Đăng nhập thất bại', response.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể kết nối đến máy chủ';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    Alert.alert('Thông báo', `${provider} chưa được hỗ trợ trên thiết bị di động.`);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View className="px-6 py-8">
          
          <View className="items-center mb-8">
            <Text className="text-3xl font-extrabold text-gray-900 mb-2">Chào mừng quay lại</Text>
            <Text className="text-gray-500 text-sm text-center">Nhập thông tin tài khoản của bạn để tiếp tục</Text>
          </View>

          {/* Social Logins */}
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity 
              className="flex-1 flex-row justify-center items-center py-3 border border-gray-300 rounded-xl mr-2"
              onPress={() => handleOAuthLogin('Google')}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: 'https://cdn.simpleicons.org/google/000000' }} 
                style={{ width: 18, height: 18, marginRight: 8 }} 
              />
              <Text className="text-gray-700 font-medium text-base">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 flex-row justify-center items-center py-3 border border-gray-300 rounded-xl ml-2"
              onPress={() => handleOAuthLogin('Facebook')}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: 'https://cdn.simpleicons.org/facebook/1877F2' }} 
                style={{ width: 18, height: 18, marginRight: 8 }} 
              />
              <Text className="text-gray-700 font-medium text-base">Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-xs text-gray-400 font-semibold uppercase tracking-wider">HOẶC ĐĂNG NHẬP BẰNG EMAIL</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          <CustomInput
            label="Địa chỉ email"
            placeholder="Nhập email của bạn"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <CustomInput
            label="Mật khẩu"
            placeholder="Mật khẩu của bạn"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            secureTextEntry
            error={errors.password}
          />

          {/* Remember Me Checkbox */}
          <TouchableOpacity 
            className="flex-row items-center mt-2 mb-6" 
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${rememberMe ? 'bg-[#c87a8a] border-[#c87a8a]' : 'border-gray-300'}`}>
              {rememberMe && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <Text className="text-gray-700 text-sm">Duy trì đăng nhập trên thiết bị này</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`py-4 rounded-xl flex-row justify-center items-center ${loading ? 'bg-gray-400' : 'bg-[#c87a8a]'}`}
            activeOpacity={0.8}
          >
            <Text className="font-semibold text-center text-lg text-white">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
          
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text className="font-semibold text-[#c87a8a]">Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
