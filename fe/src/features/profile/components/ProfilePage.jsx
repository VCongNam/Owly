import { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Text, Group, Stack, Avatar, 
  Button, TextInput, Title, Badge, Divider, LoadingOverlay, 
  FileButton, ActionIcon, Tooltip
} from '@mantine/core';
import { Camera, ShieldCheck, Crown } from '@phosphor-icons/react';
import { useForm } from '@mantine/form';
import { useProfile } from '../hooks/useProfile';
import classes from './ProfilePage.module.css';

export function ProfilePage() {
  const { profile, loading, uploading, updateProfile, uploadAvatar } = useProfile();
  const resetRef = useRef(null);

  const form = useForm({
    initialValues: {
      fullName: '',
      phone: '',
    },
    validate: {
      fullName: (value) => (value.trim().length > 0 ? null : 'Họ và tên không được để trống'),
    },
  });

  useEffect(() => {
    if (profile) {
      form.setValues({
        fullName: profile.fullName || '',
        phone: profile.account?.phone || '',
      });
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async (values) => {
    await updateProfile(values);
  };

  const handleFileChange = async (file) => {
    if (file) {
      await uploadAvatar(file);
      resetRef.current?.();
    }
  };

  if (!profile && loading) {
    return (
      <Container size="sm" pos="relative" style={{ minHeight: 400 }}>
        <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      </Container>
    );
  }

  if (!profile) {
    return <Text ta="center" mt="xl">Không tìm thấy thông tin hồ sơ.</Text>;
  }

  const { account } = profile;
  const isPremium = account?.packageType !== 'Free';

  return (
    <Container size="sm" py="xl">
      <Paper radius="md" p="xl" withBorder className={classes.profileCard}>
        <LoadingOverlay visible={loading || uploading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <Stack gap="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={2}>Hồ sơ cá nhân</Title>
              <Text c="dimmed" size="sm">Quản lý thông tin liên hệ và cài đặt tài khoản</Text>
            </Stack>
            <Badge 
              size="lg" 
              variant="light" 
              color={isPremium ? 'copper' : 'gray'}
              leftSection={isPremium ? <Crown size={14} weight="fill" /> : <ShieldCheck size={14} />}
            >
              Gói {account?.packageType}
            </Badge>
          </Group>

          <Divider />

          <Group align="center" gap="xl">
            <div style={{ position: 'relative' }}>
              <Avatar 
                src={account?.avatarUrl} 
                size={120} 
                radius={120} 
                color="copper"
                alt="Avatar"
              >
                {profile.fullName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <FileButton resetRef={resetRef} onChange={handleFileChange} accept="image/png,image/jpeg">
                {(props) => (
                  <Tooltip label="Thay đổi ảnh đại diện">
                    <ActionIcon 
                      {...props}
                      radius="xl" 
                      color="copper" 
                      size="lg"
                      variant="filled"
                      style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        right: 0,
                        border: '2px solid var(--mantine-color-body)'
                      }}
                    >
                      <Camera size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </FileButton>
            </div>

            <Stack gap={4}>
              <Title order={3}>{profile.fullName}</Title>
              <Text c="dimmed">{account?.email}</Text>
              <Text size="sm" fw={500} c="copper.6" mt="xs">
                Mã định danh: {profile.teacherCode}
              </Text>
            </Stack>
          </Group>

          <Divider />

          <form onSubmit={form.onSubmit(handleUpdate)}>
            <Stack gap="md">
              <Title order={4}>Cập nhật thông tin</Title>
              
              <TextInput
                label="Họ và tên"
                placeholder="Nhập họ và tên..."
                withAsterisk
                {...form.getInputProps('fullName')}
              />
              
              <TextInput
                label="Số điện thoại"
                placeholder="Nhập số điện thoại liên hệ..."
                {...form.getInputProps('phone')}
              />

              <Group justify="flex-end" mt="md">
                <Button type="submit" color="copper">
                  Lưu thay đổi
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
