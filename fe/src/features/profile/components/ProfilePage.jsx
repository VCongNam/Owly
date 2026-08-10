import { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Text, Group, Stack, Avatar, 
  Button, TextInput, Title, Badge, Divider, LoadingOverlay, 
  FileButton, ActionIcon, Tooltip, Tabs, SimpleGrid, 
  PasswordInput, Progress, Box, Select, Textarea, MultiSelect,
  Modal
} from '@mantine/core';
import { 
  Camera, Crown, User, Lock, CreditCard, Check, X,
  GraduationCap, Plus, Trash, Eye
} from '@phosphor-icons/react';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../../auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import classes from './ProfilePage.module.css';

// Helper đánh giá độ mạnh của mật khẩu
function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 33;
  if (/[0-9]/.test(password)) score += 33;
  if (/[^A-Za-z0-9]/.test(password)) score += 34;
  return score;
}

export function ProfilePage() {
  const { profile, loading, uploading, updateProfile, uploadAvatar } = useProfile();
  const { changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [passwordValue, setPasswordValue] = useState('');
  const [previewOpened, setPreviewOpened] = useState(false);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const resetRef = useRef(null);

  // States cho tab Hồ sơ giảng dạy
  const [bioValue, setBioValue] = useState('');
  const [experience, setExperience] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [awards, setAwards] = useState([]);

  // Gọi API lấy danh sách ngân hàng Việt Nam từ VietQR
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const res = await fetch('https://api.vietqr.io/v2/banks');
        const json = await res.json();
        if (json.code === '00') {
          setBanks(json.data);
        }
      } catch (err) {
        console.error('Không thể tải danh sách ngân hàng VietQR:', err);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  // Gọi API lấy danh sách tất cả các môn học từ Backend
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/subjects`);
        const json = await res.json();
        if (json.success) {
          setAllSubjects(json.data || []);
        }
      } catch (err) {
        console.error('Không thể tải danh sách môn học:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Form 1: Thông tin chung
  const generalForm = useForm({
    initialValues: {
      fullName: '',
      phone: '',
      specializationIds: [],
      // Học sinh
      dateOfBirth: null,
      parentPhone: '',
      email: '',
    },
    validate: {
      fullName: (value) => (value.trim().length > 0 ? null : 'Họ và tên không được để trống'),
    },
  });

  // Form 2: Cài đặt thanh toán ngân hàng
  const billingForm = useForm({
    initialValues: {
      bankName: '',
      bankAccountNo: '',
      bankAccountName: '',
      bankBin: '',
    },
  });

  // Form 3: Đổi mật khẩu mới
  const securityForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => (value.length >= 6 ? null : 'Mật khẩu phải có ít nhất 6 ký tự'),
      confirmPassword: (value, values) => (value === values.newPassword ? null : 'Mật khẩu xác nhận không trùng khớp'),
    },
  });

  // Load dữ liệu khi có profile
  useEffect(() => {
    if (profile) {
      generalForm.setValues({
        fullName: profile.fullName || '',
        phone: profile.phone || profile.account?.phone || '',
        specializationIds: profile.specializations?.map(s => s.id) || [],
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
        parentPhone: profile.parentPhone || '',
        email: profile.email || profile.account?.email || '',
      });
      billingForm.setValues({
        bankName: profile.bankName || '',
        bankAccountNo: profile.bankAccountNo || '',
        bankAccountName: profile.bankAccountName || '',
        bankBin: profile.bankBin || '',
      });
      setBioValue(profile.bio || '');

      const meta = profile.metadata || {};
      setExperience(meta.experience || []);
      setCertificates(meta.certificates || []);
      setAwards(meta.awards || []);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateGeneral = async (values) => {
    const isStudent = profile.role === 'student';
    if (isStudent) {
      await updateProfile({
        fullName: values.fullName,
        phone: values.phone || null,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        parentPhone: values.parentPhone,
        email: values.email || null,
      });
    } else {
      await updateProfile({
        fullName: values.fullName,
        phone: values.phone,
        specializationIds: values.specializationIds,
        bankName: billingForm.values.bankName || profile.bankName || null,
        bankAccountNo: billingForm.values.bankAccountNo || profile.bankAccountNo || null,
        bankAccountName: billingForm.values.bankAccountName || profile.bankAccountName || null,
        bankBin: billingForm.values.bankBin || profile.bankBin || null,
        bio: bioValue || null,
        metadata: {
          experience,
          certificates,
          awards
        }
      });
    }
  };

  const handleUpdateBilling = async (values) => {
    await updateProfile({
      fullName: generalForm.values.fullName || profile.fullName,
      phone: generalForm.values.phone || profile.account?.phone || null,
      specializationIds: generalForm.values.specializationIds || profile.specializations?.map(s => s.id) || [],
      bankName: values.bankName || null,
      bankAccountNo: values.bankAccountNo || null,
      bankAccountName: values.bankAccountName || null,
      bankBin: values.bankBin || null,
      bio: bioValue || null,
      metadata: {
        experience,
        certificates,
        awards
      }
    });
  };

  const handleUpdateTeaching = async () => {
    await updateProfile({
      fullName: generalForm.values.fullName || profile.fullName,
      phone: generalForm.values.phone || profile.account?.phone || null,
      specializationIds: generalForm.values.specializationIds || profile.specializations?.map(s => s.id) || [],
      bankName: billingForm.values.bankName || profile.bankName || null,
      bankAccountNo: billingForm.values.bankAccountNo || profile.bankAccountNo || null,
      bankAccountName: billingForm.values.bankAccountName || profile.bankAccountName || null,
      bankBin: billingForm.values.bankBin || profile.bankBin || null,
      bio: bioValue || null,
      metadata: {
        experience,
        certificates,
        awards
      }
    });
  };

  const handleUpdateSecurity = async (values) => {
    const res = await changePassword(values.newPassword, values.confirmPassword);
    if (res.success) {
      notifications.show({
        title: 'Thành công',
        message: 'Đổi mật khẩu thành công. Hãy ghi nhớ mật khẩu mới nhé!',
        color: 'green'
      });
      securityForm.reset();
      setPasswordValue('');
    }
  };

  const handleFileChange = async (file) => {
    if (file) {
      await uploadAvatar(file);
      resetRef.current?.();
    }
  };

  // Helper render danh sách nhập liệu động (bằng cấp, giải thưởng, kinh nghiệm)
  const renderDynamicList = (title, list, setList, placeholderPeriod, placeholderDetail) => {
    const addItem = () => {
      setList([...list, { id: Date.now(), period: '', detail: '' }]);
    };

    const removeItem = (id) => {
      setList(list.filter((item) => item.id !== id));
    };

    const updateItem = (id, field, value) => {
      setList(list.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    return (
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>{title}</Text>
          <Button 
            size="xs" 
            variant="outline" 
            color="copper" 
            leftSection={<Plus size={14} />} 
            onClick={addItem}
          >
            Thêm mới
          </Button>
        </Group>
        
        {list.length === 0 ? (
          <Text size="xs" c="dimmed" fs="italic">Chưa có thông tin.</Text>
        ) : (
          list.map((item) => (
            <Group key={item.id} gap="xs" align="flex-start" wrap="nowrap">
              <TextInput
                placeholder={placeholderPeriod}
                value={item.period}
                onChange={(e) => updateItem(item.id, 'period', e.target.value)}
                style={{ width: '150px' }}
              />
              <TextInput
                placeholder={placeholderDetail}
                value={item.detail}
                onChange={(e) => updateItem(item.id, 'detail', e.target.value)}
                style={{ flex: 1 }}
              />
              <ActionIcon color="red" variant="subtle" onClick={() => removeItem(item.id)} mt={4}>
                <Trash size={16} />
              </ActionIcon>
            </Group>
          ))
        )}
      </Stack>
    );
  };

  if (!profile && loading) {
    return (
      <Container size="lg" pos="relative" style={{ minHeight: 400 }}>
        <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      </Container>
    );
  }

  if (!profile) {
    return <Text ta="center" mt="xl">Không tìm thấy thông tin hồ sơ.</Text>;
  }

  const { account } = profile;
  const isStudent = profile?.role === 'student';
  const isPremium = account?.packageType !== 'Free';
  const strength = getPasswordStrength(passwordValue);

  return (
    <Container size="lg" py="xl">
      <LoadingOverlay visible={loading || uploading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
      <div className={classes.gridContainer}>
        {/* CỘT TRÁI: THẺ ĐỊNH DANH GIÁO VIÊN */}
        <div className={classes.leftCard}>
          <Stack align="center" gap="md">
            <div className={classes.avatarWrapper}>
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
                  <div {...props} className={classes.avatarOverlay}>
                    <Camera size={24} color="#fff" />
                  </div>
                )}
              </FileButton>
            </div>

            <Stack gap={2} align="center">
              <Title order={3} ta="center">{profile.fullName}</Title>
              <Text c="dimmed" size="sm">{account?.email || profile.email}</Text>
              {!isStudent && (
                <Badge 
                  size="md" 
                  variant="light" 
                  color={isPremium ? 'copper' : 'gray'}
                  leftSection={isPremium && <Crown size={12} weight="fill" />}
                  mt="xs"
                >
                  Gói {account?.packageType}
                </Badge>
              )}
            </Stack>

            <Divider width="100%" />

            <div className={classes.detailsList}>
              <div className={classes.detailItem}>
                <span className={classes.detailLabel}>{isStudent ? "Tên đăng nhập" : "Mã định danh"}</span>
                <span className={classes.detailValue}>{isStudent ? profile.studentCode : profile.teacherCode}</span>
              </div>
              {!isStudent && (
                <div className={classes.detailItem}>
                  <span className={classes.detailLabel}>Trạng thái gói</span>
                  <span className={classes.detailValue}>{account?.isActive ? 'Đang hoạt động' : 'Tạm khóa'}</span>
                </div>
              )}
              {isStudent && (
                <div className={classes.detailItem}>
                  <span className={classes.detailLabel}>SĐT Phụ huynh</span>
                  <span className={classes.detailValue}>{profile.parentPhone || 'N/A'}</span>
                </div>
              )}
              <div className={classes.detailItem}>
                <span className={classes.detailLabel}>Ngày tham gia</span>
                <span className={classes.detailValue}>
                  {account?.createdAt ? new Date(account.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>

            {!isStudent && (
              <Button 
                variant="outline" 
                color="copper" 
                fullWidth 
                leftSection={<Eye size={16} />}
                onClick={() => setPreviewOpened(true)}
                mt="xs"
              >
                Xem hồ sơ công khai
              </Button>
            )}
          </Stack>
        </div>

        {/* CỘT PHẢI: BẢNG TAB CẤU HÌNH CHI TIẾT */}
        <div className={classes.rightCard}>
          <Tabs value={activeTab} onChange={setActiveTab} color="copper" variant="outline">
            <Tabs.List mb="xl">
              <Tabs.Tab value="general" leftSection={<User size={16} />}>
                Thông tin chung
              </Tabs.Tab>
              {!isStudent && (
                <Tabs.Tab value="teaching" leftSection={<GraduationCap size={16} />}>
                  Hồ sơ giảng dạy
                </Tabs.Tab>
              )}
              <Tabs.Tab value="security" leftSection={<Lock size={16} />}>
                Bảo mật
              </Tabs.Tab>
              {!isStudent && (
                <Tabs.Tab value="billing" leftSection={<CreditCard size={16} />}>
                  Cấu hình thanh toán
                </Tabs.Tab>
              )}
            </Tabs.List>

            {/* TAB 1: THÔNG TIN CHUNG */}
            <Tabs.Panel value="general">
              <form onSubmit={generalForm.onSubmit(handleUpdateGeneral)}>
                <Stack gap="lg">
                  <Title order={4}>Hồ sơ cá nhân</Title>
                  
                  {isStudent ? (
                    <>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} gap="md">
                        <TextInput
                          label="Họ và tên"
                          placeholder="Nhập họ và tên..."
                          required
                          {...generalForm.getInputProps('fullName')}
                        />
                        <DateInput
                          label="Ngày sinh"
                          placeholder="Chọn ngày sinh"
                          valueFormat="DD/MM/YYYY"
                          required
                          {...generalForm.getInputProps('dateOfBirth')}
                        />
                        <TextInput
                          label="Số điện thoại cá nhân (nếu có)"
                          placeholder="Nhập số điện thoại của bạn..."
                          {...generalForm.getInputProps('phone')}
                        />
                        <TextInput
                          label="Số điện thoại phụ huynh"
                          placeholder="Nhập số điện thoại phụ huynh..."
                          required
                          {...generalForm.getInputProps('parentPhone')}
                        />
                      </SimpleGrid>
                      <TextInput
                        label="Địa chỉ email cá nhân"
                        placeholder="Nhập email của bạn (Ví dụ: nguyenvana@gmail.com)"
                        description="Nhập email cá nhân giúp bạn có thể dùng email thật để đăng nhập thay cho tên đăng nhập."
                        {...generalForm.getInputProps('email')}
                      />
                    </>
                  ) : (
                    <>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} gap="md">
                        <TextInput
                          label="Họ và tên"
                          placeholder="Nhập họ và tên..."
                          required
                          {...generalForm.getInputProps('fullName')}
                        />
                        <TextInput
                          label="Số điện thoại"
                          placeholder="Nhập số điện thoại..."
                          {...generalForm.getInputProps('phone')}
                        />
                      </SimpleGrid>
                      <MultiSelect
                        label="Môn học chuyên môn phụ trách"
                        placeholder={loadingSubjects ? "Đang tải danh sách..." : "Chọn các môn học chuyên môn..."}
                        data={allSubjects.map((sub) => ({
                          value: sub.id,
                          label: `${sub.name} (${sub.code})`
                        }))}
                        searchable
                        clearable
                        hidePickedOptions
                        disabled={loadingSubjects}
                        nothingFoundMessage="Không tìm thấy môn học"
                        {...generalForm.getInputProps('specializationIds')}
                      />
                    </>
                  )}

                  <Group justify="flex-end" mt="xl">
                    <Button type="submit" color="copper">
                      Lưu thay đổi
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            {/* TAB 2: HỒ SƠ GIẢNG DẠY (BIO, BẰNG CẤP, KINH NGHIỆM) */}
            <Tabs.Panel value="teaching">
              <Stack gap="lg">
                <Title order={4}>Hồ sơ năng lực & Thông tin giảng dạy</Title>
                
                <Textarea
                  label="Giới thiệu bản thân (Bio)"
                  placeholder="Mô tả ngắn gọn về bản thân, phương pháp giảng dạy..."
                  minRows={3}
                  maxRows={6}
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                />

                <Divider label="Thông tin bổ sung" labelPosition="center" />

                {renderDynamicList(
                  "Kinh nghiệm giảng dạy",
                  experience,
                  setExperience,
                  "Ví dụ: 2020 - 2022",
                  "Ví dụ: Giáo viên Toán tại Trường THPT A..."
                )}

                <Divider />

                {renderDynamicList(
                  "Bằng cấp & Chứng chỉ",
                  certificates,
                  setCertificates,
                  "Ví dụ: 2018",
                  "Ví dụ: Bằng Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội..."
                )}

                <Divider />

                {renderDynamicList(
                  "Giải thưởng & Thành tựu",
                  awards,
                  setAwards,
                  "Ví dụ: 2023",
                  "Ví dụ: Đạt danh hiệu Chiến sĩ thi đua cấp cơ sở..."
                )}

                <Group justify="flex-end" mt="xl">
                  <Button onClick={handleUpdateTeaching} color="copper">
                    Lưu hồ sơ giảng dạy
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>

            {/* TAB 3: BẢO MẬT (ĐỔI MẬT KHẨU MỚI HOÀN TOÀN) */}
            <Tabs.Panel value="security">
              <form onSubmit={securityForm.onSubmit(handleUpdateSecurity)}>
                <Stack gap="lg">
                  <Title order={4}>Cài đặt mật khẩu mới</Title>

                  <PasswordInput
                    label="Mật khẩu hiện tại"
                    placeholder="Nhập mật khẩu cũ của bạn..."
                    required
                    {...securityForm.getInputProps('currentPassword')}
                  />

                  <PasswordInput
                    label="Mật khẩu mới"
                    placeholder="Nhập mật khẩu mới..."
                    required
                    value={passwordValue}
                    onChange={(e) => {
                      setPasswordValue(e.target.value);
                      securityForm.setFieldValue('newPassword', e.target.value);
                    }}
                  />

                  {/* Thanh đo độ mạnh mật khẩu */}
                  {passwordValue && (
                    <Stack gap={4}>
                      <Progress 
                        value={strength} 
                        size="xs" 
                        color={strength === 100 ? 'teal' : strength > 33 ? 'yellow' : 'red'} 
                        animated 
                      />
                      <Group gap="xs" mt={4}>
                        <Group gap={4} className={classes.passwordRequirement}>
                          {passwordValue.length >= 6 ? <Check size={14} color="green" /> : <X size={14} color="red" />}
                          <Text size="xs">Tối thiểu 6 ký tự</Text>
                        </Group>
                        <Group gap={4} className={classes.passwordRequirement}>
                          {/[0-9]/.test(passwordValue) ? <Check size={14} color="green" /> : <X size={14} color="red" />}
                          <Text size="xs">Có chữ số</Text>
                        </Group>
                        <Group gap={4} className={classes.passwordRequirement}>
                          {/[^A-Za-z0-9]/.test(passwordValue) ? <Check size={14} color="green" /> : <X size={14} color="red" />}
                          <Text size="xs">Có ký tự đặc biệt</Text>
                        </Group>
                      </Group>
                    </Stack>
                  )}

                  <PasswordInput
                    label="Xác nhận mật khẩu mới"
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    {...securityForm.getInputProps('confirmPassword')}
                  />

                  <Group justify="flex-end" mt="xl">
                    <Button type="submit" color="copper">
                      Cập nhật mật khẩu
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            {/* TAB 4: CẤU HÌNH THANH TOÁN */}
            <Tabs.Panel value="billing">
              <form onSubmit={billingForm.onSubmit(handleUpdateBilling)}>
                <Stack gap="lg">
                  <Stack gap={4}>
                    <Title order={4}>Cấu hình tài khoản nhận tiền học phí</Title>
                    <Text c="dimmed" size="xs">
                      Thông tin này sẽ được sử dụng để sinh mã VietQR thanh toán tự động gửi phụ huynh học sinh.
                    </Text>
                  </Stack>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} gap="md">
                    <Select
                      label="Tên ngân hàng"
                      placeholder={loadingBanks ? "Đang tải danh sách..." : "Chọn ngân hàng..."}
                      searchable
                      clearable
                      disabled={loadingBanks}
                      nothingFoundMessage="Không tìm thấy ngân hàng"
                      data={banks.map((bank) => ({
                        value: bank.shortName,
                        label: `${bank.shortName} - ${bank.name}`
                      }))}
                      {...billingForm.getInputProps('bankName')}
                      onChange={(val) => {
                        billingForm.setFieldValue('bankName', val || '');
                        const selectedBank = banks.find(b => b.shortName === val);
                        if (selectedBank) {
                          billingForm.setFieldValue('bankBin', selectedBank.bin || '');
                        } else {
                          billingForm.setFieldValue('bankBin', '');
                        }
                      }}
                    />
                    <TextInput
                      label="Số tài khoản"
                      placeholder="Nhập số tài khoản ngân hàng..."
                      {...billingForm.getInputProps('bankAccountNo')}
                    />
                  </SimpleGrid>

                  

                  <TextInput
                    label="Tên chủ tài khoản"
                    placeholder="Ví dụ: NGUYEN VAN A"
                    {...billingForm.getInputProps('bankAccountName')}
                  />

                  <Group justify="flex-end" mt="xl">
                    <Button type="submit" color="copper">
                      Lưu cấu hình
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>

      {/* MODAL XEM TRƯỚC HỒ SƠ CÔNG KHAI */}
      <Modal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        title="Xem trước hồ sơ công khai (Dành cho học sinh)"
        size="lg"
        radius="md"
        centered
        styles={{
          header: {
            borderBottom: '1px solid var(--mantine-color-default-border)',
            paddingBottom: 'var(--mantine-spacing-md)',
          },
          body: {
            paddingTop: 'var(--mantine-spacing-xl)',
          }
        }}
      >
        <Stack gap="xl">
          {/* Khu vực thông tin cá nhân cơ bản */}
          <Group gap="lg">
            <Avatar src={account?.avatarUrl} size={80} radius={80} color="copper">
              {profile.fullName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Stack gap={4} style={{ flex: 1 }}>
              <Title order={3}>{profile.fullName}</Title>
              <Text c="dimmed" size="xs">Mã giáo viên: {profile.teacherCode}</Text>
              
              <Group gap="xs" mt={4} wrap="wrap">
                {profile.specializations && profile.specializations.length > 0 ? (
                  profile.specializations.map((subject) => (
                    <Badge key={subject.id} variant="dot" color="copper" size="sm">
                      {subject.name}
                    </Badge>
                  ))
                ) : (
                  <Text size="xs" c="dimmed" fs="italic">Chưa có môn học chuyên môn</Text>
                )}
              </Group>
            </Stack>
          </Group>

          <Divider />

          {/* Giới thiệu bản thân */}
          <Box>
            <Text fw={600} size="sm" mb={6} c="copper">Giới thiệu bản thân</Text>
            {bioValue ? (
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {bioValue}
              </Text>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">Chưa có thông tin giới thiệu bản thân.</Text>
            )}
          </Box>

          <Divider />

          {/* Kinh nghiệm */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="copper">Kinh nghiệm giảng dạy</Text>
            {experience.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic">Chưa có thông tin kinh nghiệm.</Text>
            ) : (
              <Stack gap="xs">
                {experience.map((item) => (
                  <Group key={item.id} align="flex-start" wrap="nowrap">
                    <Badge variant="light" color="gray" size="sm" style={{ width: '120px', flexShrink: 0 }}>
                      {item.period}
                    </Badge>
                    <Text size="sm" style={{ flex: 1 }}>{item.detail}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Bằng cấp */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="copper">Bằng cấp & Chứng chỉ</Text>
            {certificates.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic">Chưa có thông tin bằng cấp.</Text>
            ) : (
              <Stack gap="xs">
                {certificates.map((item) => (
                  <Group key={item.id} align="flex-start" wrap="nowrap">
                    <Badge variant="light" color="gray" size="sm" style={{ width: '120px', flexShrink: 0 }}>
                      {item.period}
                    </Badge>
                    <Text size="sm" style={{ flex: 1 }}>{item.detail}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Giải thưởng */}
          <Box>
            <Text fw={600} size="sm" mb="sm" c="copper">Giải thưởng & Thành tựu</Text>
            {awards.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic">Chưa có thông tin giải thưởng.</Text>
            ) : (
              <Stack gap="xs">
                {awards.map((item) => (
                  <Group key={item.id} align="flex-start" wrap="nowrap">
                    <Badge variant="light" color="gray" size="sm" style={{ width: '120px', flexShrink: 0 }}>
                      {item.period}
                    </Badge>
                    <Text size="sm" style={{ flex: 1 }}>{item.detail}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Modal>
    </Container>
  );
}

export default ProfilePage;
