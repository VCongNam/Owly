import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../auth/hooks/useAuth';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const authSetSession = useAuthStore(state => state.setSession);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await profileService.getProfile();
      const profileData = Array.isArray(res) ? res[0] : (res?.data || res);
      setProfile(profileData);
      
      // Update global user store if needed without subscribing to changes
      const authUser = useAuthStore.getState().user;
      const authToken = useAuthStore.getState().token;
      
      if (profileData && authToken) {
        authSetSession({ ...authUser, ...profileData }, authToken);
      }
    } catch (error) {
      notifications.show({
        title: 'Lỗi tải hồ sơ',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [authSetSession]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data) => {
    try {
      const res = await profileService.updateProfile(data);
      const updatedProfile = Array.isArray(res) ? res[0] : (res?.data || res);
      setProfile(updatedProfile);
      
      const authUser = useAuthStore.getState().user;
      const authToken = useAuthStore.getState().token;
      
      authSetSession({ ...authUser, ...updatedProfile }, authToken);

      notifications.show({
        title: 'Thành công',
        message: 'Cập nhật hồ sơ thành công',
        color: 'green'
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi cập nhật',
        message: error.response?.data?.message || 'Có lỗi xảy ra',
        color: 'red'
      });
      return false;
    }
  };

  const uploadAvatar = async (file) => {
    try {
      setUploading(true);
      const res = await profileService.uploadAvatar(file);
      const data = Array.isArray(res) ? res[0] : (res?.data || res);
      
      setProfile(prev => ({ ...prev, account: { ...prev?.account, avatarUrl: data.avatarUrl } }));
      
      const authUser = useAuthStore.getState().user;
      const authToken = useAuthStore.getState().token;
      
      authSetSession({
        ...authUser,
        account: { ...authUser?.account, avatarUrl: data.avatarUrl }
      }, authToken);

      notifications.show({
        title: 'Thành công',
        message: 'Cập nhật ảnh đại diện thành công',
        color: 'green'
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Lỗi tải ảnh',
        message: error.response?.data?.message || 'Không thể upload ảnh',
        color: 'red'
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    profile,
    loading,
    uploading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
}
