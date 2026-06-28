import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { CustomInput } from '@/components/ui/CustomInput';
import { api } from '@/shared/services/api';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Môn học chuyên môn
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Captcha
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Màn hình thành công sau khi đăng ký
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // Lỗi form
  const [errors, setErrors] = useState<any>({});

  const generateCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    setCaptchaError('');
  };

  useEffect(() => {
    generateCaptcha();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response: any = await api.get('/subjects');
      // BE trả về định dạng { success: true, data: [...] }
      const data = response.data || response;
      setSubjects(data);
    } catch (error) {
      console.log('Lỗi tải môn học', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!name.trim()) newErrors.name = 'Họ và tên là bắt buộc';
    
    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone)) {
      newErrors.phone = 'Số điện thoại không đúng định dạng';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    if (captchaInput !== captchaCode) {
      setCaptchaError('Mã kiểm tra không chính xác');
      return;
    }

    try {
      setLoading(true);
      const response: any = await api.post('/auth/signup', {
        fullName: name,
        email,
        phone,
        password,
        specializationIds: selectedSubjects,
      });
      
      if (response.success) {
        setRegisteredEmail(email);
      } else {
        Alert.alert('Đăng ký thất bại', response.message || 'Đăng ký không thành công');
        generateCaptcha();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể kết nối đến máy chủ';
      Alert.alert('Lỗi', message);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter(item => item !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    Alert.alert('Thông báo', `${provider} chưa được hỗ trợ trên thiết bị di động.`);
  };

  if (registeredEmail) {
    return (
      <View className="flex-1 bg-white justify-center px-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-red-50 justify-center items-center mb-6">
            <Text className="text-red-400 text-3xl">✉</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">Xác thực tài khoản của bạn</Text>
          <Text className="text-gray-500 text-center text-sm leading-6">
            Chúng tôi đã gửi một email kích hoạt tài khoản đến địa chỉ{' '}
            <Text className="font-semibold text-gray-800">{registeredEmail}</Text>. Vui lòng kiểm tra hộp thư và nhấn vào liên kết xác thực trước khi tiến hành đăng nhập.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="py-4 rounded-xl bg-[#c87a8a]"
          activeOpacity={0.8}
        >
          <Text className="font-semibold text-center text-lg text-white">Đi tới đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 py-8">
          
          <View className="items-center mb-6">
            <Text className="text-3xl font-extrabold text-gray-900 mb-2">Đăng ký Giáo viên</Text>
            <Text className="text-gray-500 text-sm text-center">Điền thông tin để khởi tạo tài khoản lớp học của bạn</Text>
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
            <Text className="mx-4 text-xs text-gray-400 font-semibold uppercase tracking-wider">HOẶC ĐĂNG KÝ BẰNG EMAIL</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          <CustomInput
            label="Họ và tên"
            placeholder="Nguyễn Văn Nam"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            error={errors.name}
          />

          <CustomInput
            label="Địa chỉ email"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <CustomInput
            label="Mật khẩu"
            placeholder="Mật khẩu tối thiểu 6 ký tự"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <CustomInput
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu của bạn"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <CustomInput
            label="Số điện thoại"
            placeholder="0987654321"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          {/* Môn học chuyên môn */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Môn học chuyên môn</Text>
            {loadingSubjects ? (
              <Text className="text-gray-400 text-sm ml-1">Đang tải môn học...</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => toggleSubject(sub.id)}
                      className={`px-3 py-2 rounded-lg border ${isSelected ? 'bg-red-50 border-[#c87a8a]' : 'bg-gray-50 border-gray-200'}`}
                      activeOpacity={0.7}
                    >
                      <Text className={`text-sm ${isSelected ? 'text-[#c87a8a] font-semibold' : 'text-gray-600'}`}>
                        {sub.name} ({sub.code})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Captcha Box */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Mã kiểm tra (Captcha)</Text>
            <View className="flex-row items-center mb-2">
              <View className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 mr-4">
                <Text className="font-mono text-xl font-bold tracking-widest text-[#c87a8a] italic line-through">
                  {captchaCode}
                </Text>
              </View>
              <TouchableOpacity onPress={generateCaptcha}>
                <Text className="text-blue-500 font-semibold text-sm">Làm mới</Text>
              </TouchableOpacity>
            </View>
            <CustomInput
              placeholder="Nhập mã kiểm tra ở trên"
              value={captchaInput}
              onChangeText={(val) => {
                setCaptchaInput(val);
                setCaptchaError('');
              }}
              error={captchaError}
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className={`py-4 rounded-xl flex-row justify-center items-center mt-2 ${loading ? 'bg-gray-400' : 'bg-[#c87a8a]'}`}
            activeOpacity={0.8}
          >
            <Text className="font-semibold text-center text-lg text-white">
              {loading ? 'Đang đăng ký...' : 'Đăng ký hoàn tất'}
            </Text>
          </TouchableOpacity>
          
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text className="font-semibold text-[#c87a8a]">Đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
