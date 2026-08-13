import { useState, useEffect, useCallback, useRef } from 'react';
import { profileService } from '../services/profileService';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../auth/hooks/useAuth';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [resolved, setResolved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const authSetSession = useAuthStore(state => state.setSession);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loading = !resolved || refreshing;

  const fetchProfile = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const res = await profileService.getProfile();
      const profileData = Array.isArray(res) ? res[0] : (res?.data || res);
      if (requestId === requestIdRef.current) {
        setProfile(profileData);
        setResolved(true);

        // Update global user store if needed without subscribing to changes
        const authUser = useAuthStore.getState().user;
        const authToken = useAuthStore.getState().token;

        if (profileData && authToken) {
          authSetSession({ ...authUser, ...profileData }, authToken);
        }
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        notifications.show({
          title: 'Lỗi tải hồ sơ',
          message: error.response?.data?.message || 'Có lỗi xảy ra',
          color: 'red'
        });
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolved(true);
      }
    }
  }, [authSetSession]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    const loadProfile = async () => {
      try {
        const res = await profileService.getProfile();
        const profileData = Array.isArray(res) ? res[0] : (res?.data || res);
        if (requestId === requestIdRef.current) {
          setProfile(profileData);
          setResolved(true);

          const authUser = useAuthStore.getState().user;
          const authToken = useAuthStore.getState().token;

          if (profileData && authToken) {
            authSetSession({ ...authUser, ...profileData }, authToken);
          }
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          notifications.show({
            title: 'Lỗi tải hồ sơ',
            message: error.response?.data?.message || 'Có lỗi xảy ra',
            color: 'red'
          });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setResolved(true);
        }
      }
    };

    loadProfile();

    return () => {
      requestIdRef.current += 1;
    };
  }, [authSetSession]);

  const updateProfile = async (data) => {
    try {
      const res = await profileService.updateProfile(data);
      const updatedProfile = Array.isArray(res) ? res[0] : (res?.data || res);
      if (isMountedRef.current) {
        setProfile(updatedProfile);

        const authUser = useAuthStore.getState().user;
        const authToken = useAuthStore.getState().token;

        authSetSession({ ...authUser, ...updatedProfile }, authToken);

        notifications.show({
          title: 'Thành công',
          message: 'Cập nhật hồ sơ thành công',
          color: 'green'
        });
      }
      return true;
    } catch (error) {
      if (isMountedRef.current) {
        notifications.show({
          title: 'Lỗi cập nhật',
          message: error.response?.data?.message || 'Có lỗi xảy ra',
          color: 'red'
        });
      }
      return false;
    }
  };

  const uploadAvatar = async (file) => {
    try {
      setUploading(true);
      const res = await profileService.uploadAvatar(file);
      const data = Array.isArray(res) ? res[0] : (res?.data || res);
      
      if (isMountedRef.current) {
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
      }
      return true;
    } catch (error) {
      if (isMountedRef.current) {
        notifications.show({
          title: 'Lỗi tải ảnh',
          message: error.response?.data?.message || 'Không thể upload ảnh',
          color: 'red'
        });
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
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
