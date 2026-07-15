import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Stack, Group, Title, Text, Button, Table, Avatar, ActionIcon,
  Tooltip, Center, ThemeIcon, Loader, Modal, SegmentedControl,
  TextInput, Card, Alert, Divider
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Plus, Trash, MagnifyingGlass, UserPlus, Users, Phone, CalendarBlank, Warning } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { studentService } from '../../students/services/studentService';
import classes from './ClassMembersTab.module.css';

export function ClassMembersTab() {
  const { classId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [modalOpened, setModalOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('existing'); // existing | new
  
  // Search existing student states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Form tạo học sinh mới
  const createForm = useForm({
    initialValues: {
      fullName: '',
      dateOfBirth: null,
      parentPhone: ''
    },
    validate: {
      fullName: (val) => (val.trim().length >= 2 ? null : 'Họ tên phải có ít nhất 2 ký tự'),
      dateOfBirth: (val) => (val ? null : 'Vui lòng chọn ngày sinh'),
      parentPhone: (val) => (/^(0[3|5|7|8|9])+([0-9]{8})$/.test(val) ? null : 'Số điện thoại không đúng định dạng')
    }
  });

  // Tải danh sách thành viên lớp học
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await studentService.getClassMembers(classId);
      // Backend returns { success: true, data: { items: [...], pagination: {...} } }
      // Unpacked by apiClient interceptor to { items: [...], pagination: {...} }
      setMembers(res?.items || []);
    } catch (error) {
      console.error('Lỗi tải thành viên lớp học:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchMembers();
    }
  }, [classId]);

  // Tìm kiếm học sinh trên danh bạ hệ thống
  useEffect(() => {
    const searchStudents = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const res = await studentService.searchDirectory(searchQuery);
        // Res is clean array of students
        setSearchResults(res || []);
      } catch (error) {
        console.error('Lỗi tìm kiếm danh bạ:', error);
      } finally {
        setSearching(false);
      }
    };

    const handler = setTimeout(() => {
      searchStudents();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Thêm học sinh có sẵn vào lớp
  const handleEnrollExisting = async (studentId) => {
    try {
      await studentService.enrollExisting(classId, studentId);
      notifications.show({
        title: 'Thành công',
        message: 'Ghi danh học viên vào lớp thành công',
        color: 'green'
      });
      setModalOpened(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchMembers();
    } catch (error) {
      // Notification is auto-triggered in apiClient interceptor, but we can handle specific cases
      console.error(error);
    }
  };

  // Tạo mới và thêm vào lớp
  const handleCreateAndEnroll = async (values) => {
    try {
      const payload = {
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth.toISOString(),
        parentPhone: values.parentPhone
      };
      await studentService.createAndEnrollNew(classId, payload);
      notifications.show({
        title: 'Thành công',
        message: 'Tạo tài khoản học viên và ghi danh thành công',
        color: 'green'
      });
      createForm.reset();
      setModalOpened(false);
      fetchMembers();
    } catch (error) {
      console.error(error);
    }
  };

  // Hủy ghi danh khỏi lớp (Unenroll)
  const handleUnenroll = async (studentId, studentName) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy học (hủy liên kết lớp) cho học viên ${studentName} khỏi lớp học này?`)) {
      try {
        await studentService.unenrollStudent(classId, studentId);
        notifications.show({
          title: 'Thành công',
          message: 'Đã hủy liên kết học viên khỏi lớp học',
          color: 'green'
        });
        fetchMembers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const rows = members.map((student) => (
    <Table.Tr key={student.id} className={classes.tableRow}>
      <Table.Td>
        <Group gap={10} wrap="nowrap">
          <Avatar 
            name={student.fullName} 
            size={36} 
            radius="xl" 
            color="copper" 
            src={student.account?.avatarUrl}
          >
            {student.fullName?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <Text size="sm" fw={600}>{student.fullName}</Text>
            <Text size="xs" c="dimmed">
              Ngày sinh: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa rõ'}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">{student.account?.email || 'Chưa cập nhật'}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Phone size={13} color="var(--accent-color)" />
          <Text size="sm">{student.parentPhone}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Tooltip label="Hủy học (Xóa khỏi lớp)" withArrow>
            <ActionIcon 
              variant="subtle" 
              color="red" 
              size="sm"
              onClick={() => handleUnenroll(student.id, student.fullName)}
            >
              <Trash size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      {/* ── Page Header ─────────────────────────── */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <div>
          <Title order={3} style={{ fontSize: '20px', fontWeight: 700 }}>Danh sách Học viên</Title>
          <Text size="sm" c="dimmed">{members.length} học viên tham gia lớp này</Text>
        </div>
        <Button 
          leftSection={<Plus size={16} weight="bold" />} 
          color="copper"
          onClick={() => setModalOpened(true)}
        >
          Thêm học viên
        </Button>
      </Group>

      {/* ── Members Table ───────────────────────── */}
      {loading ? (
        <Center py={60}>
          <Loader color="copper" size="md" />
        </Center>
      ) : members.length > 0 ? (
        <div className={classes.tableWrapper}>
          <Table highlightOnHover verticalSpacing="md" className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Học viên</Table.Th>
                <Table.Th>Email liên hệ</Table.Th>
                <Table.Th>SĐT Phụ huynh</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>
      ) : (
        <Center py={60}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <Users size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed">Chưa có học viên nào trong lớp này.</Text>
            <Button 
              leftSection={<Plus size={16} />} 
              variant="light" 
              color="copper"
              onClick={() => setModalOpened(true)}
            >
              Thêm học viên đầu tiên
            </Button>
          </Stack>
        </Center>
      )}

      {/* ── Modal Thêm học viên ─────────────────── */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSearchQuery('');
          setSearchResults([]);
          createForm.reset();
        }}
        title="Thêm học viên vào lớp"
        size="md"
        centered
      >
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            value={activeTab}
            onChange={setActiveTab}
            data={[
              { label: 'Chọn học sinh đã có', value: 'existing' },
              { label: 'Tạo học sinh mới', value: 'new' }
            ]}
            color="copper"
            mb="xs"
          />

          {/* TAB 1: THÊM HỌC SINH ĐÃ CÓ */}
          {activeTab === 'existing' && (
            <Stack gap="md">
              <TextInput
                placeholder="Tìm học sinh theo tên hoặc SĐT phụ huynh..."
                leftSection={<MagnifyingGlass size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
              />

              {searching && (
                <Center py="sm">
                  <Loader size="xs" color="copper" />
                </Center>
              )}

              {searchResults.length > 0 ? (
                <Stack gap="xs" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {searchResults.map((student) => {
                    const isAlreadyMember = members.some(m => m.id === student.id);
                    return (
                      <Card key={student.id} withBorder p="xs" className={classes.studentSearchCard}>
                        <Group justify="space-between" align="center">
                          <Group gap={8} wrap="nowrap">
                            <Avatar name={student.fullName} size={30} radius="xl" color="copper" />
                            <div>
                              <Text size="sm" fw={600}>{student.fullName}</Text>
                              <Text size="xs" c="dimmed">SĐT PH: {student.parentPhone}</Text>
                            </div>
                          </Group>
                          {isAlreadyMember ? (
                            <Badge color="gray" variant="light" size="xs">Đã trong lớp</Badge>
                          ) : (
                            <Button 
                              size="xs" 
                              variant="light" 
                              color="copper" 
                              leftSection={<UserPlus size={12} />}
                              onClick={() => handleEnrollExisting(student.id)}
                            >
                              Thêm
                            </Button>
                          )}
                        </Group>
                      </Card>
                    );
                  })}
                </Stack>
              ) : searchQuery.trim().length >= 2 && !searching ? (
                <Text size="xs" c="dimmed" ta="center" py="xs">Không tìm thấy học sinh phù hợp.</Text>
              ) : (
                <Text size="xs" c="dimmed" ta="center" py="xs">Nhập từ khóa tìm kiếm học viên có sẵn trên toàn hệ thống...</Text>
              )}
            </Stack>
          )}

          {/* TAB 2: TẠO HỌC SINH MỚI */}
          {activeTab === 'new' && (
            <form onSubmit={createForm.onSubmit(handleCreateAndEnroll)}>
              <Stack gap="sm">
                <TextInput
                  label="Họ và tên học viên"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  {...createForm.getInputProps('fullName')}
                />

                <DateInput
                  label="Ngày sinh"
                  placeholder="Chọn ngày sinh..."
                  valueFormat="DD/MM/YYYY"
                  required
                  {...createForm.getInputProps('dateOfBirth')}
                />

                <TextInput
                  label="Số điện thoại phụ huynh"
                  placeholder="Ví dụ: 0912345678"
                  required
                  {...createForm.getInputProps('parentPhone')}
                />

                <Alert icon={<Warning size={16} />} color="orange" variant="light" mt="xs">
                  <Text size="xs" style={{ lineHeight: 1.5 }}>
                    Mỗi học sinh sẽ tự động được cấp tài khoản đăng nhập bằng **Mã học viên (Tên đăng nhập)** dạng `HSxxx` và **mật khẩu mặc định** `Owly@123456`. Học sinh tự cập nhật thông tin cá nhân lần đầu đăng nhập.
                  </Text>
                </Alert>

                <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={() => setModalOpened(false)}>Hủy</Button>
                  <Button type="submit" color="copper">Tạo & Thêm</Button>
                </Group>
              </Stack>
            </form>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}

export default ClassMembersTab;
