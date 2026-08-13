import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Stack, Group, Title, Text, Button, Table, Avatar, ActionIcon,
  Tooltip, Center, ThemeIcon, Loader, Modal, SegmentedControl,
  TextInput, Card, Alert, Divider, Badge, Box, RingProgress, SimpleGrid,
  ScrollArea, Pagination, Select
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Plus, Trash, MagnifyingGlass, UserPlus, Users, Phone, CalendarBlank, Warning, Copy, Check, ChartBar, UploadSimple } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { studentService } from '../../students/services/studentService';
import { ConfirmModal } from '../../../shared';
import classes from './ClassMembersTab.module.css';
import { useAuth } from '../../auth';
import { ImportStudentsModal } from './ImportStudentsModal';

// ── Helper: Badge màu theo trạng thái điểm danh ─────────────────────────────
const STATUS_CONFIG = {
  Present: { label: 'Có mặt', color: 'teal' },
  Absent: { label: 'Vắng mặt', color: 'red' },
  Late: { label: 'Đi muộn', color: 'orange' },
  Excused: { label: 'Có phép', color: 'blue' },
};

const AttendanceBadge = ({ status }) => {
  if (!status) return <Badge color="gray" variant="light" size="sm">Chưa điểm danh</Badge>;
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'gray' };
  return <Badge color={cfg.color} variant="light" size="sm">{cfg.label}</Badge>;
};

// ── Helper: Format ngày ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// ── Stat Card nhỏ trong Modal ────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <Card withBorder p="xs" radius="md" style={{ textAlign: 'center', borderColor: `var(--mantine-color-${color}-3)` }}>
    <Text size="xl" fw={800} c={color}>{value}</Text>
    <Text size="xs" c="dimmed" mt={2}>{label}</Text>
  </Card>
);

// ── Modal Attendance Log ─────────────────────────────────────────────────────
function AttendanceLogModal({ onClose, student, classId }) {
  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);

  // States cho Bộ lọc & Phân trang
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Số bản ghi mỗi trang

  useEffect(() => {
    let active = true;
    studentService.getStudentAttendanceLog(classId, student.id)
      .then(data => {
        if (active) setLogData(data);
      })
      .catch(() => {
        if (active) {
          notifications.show({ title: 'Lỗi', message: 'Không thể tải nhật ký điểm danh', color: 'red' });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [classId, student.id]);

  const stats = logData?.stats;
  const sessionLogs = logData?.sessions || [];

  // Tính phần trăm vòng tròn
  const ringValue = stats?.attendanceRate ?? 0;
  const ringColor = ringValue >= 80 ? 'teal' : ringValue >= 60 ? 'orange' : 'red';

  // ── XỬ LÝ LỌC DỮ LIỆU (Client-side Filtering) ─────────────────────────────
  const filteredSessions = sessionLogs.filter(s => {
    // 1. Lọc theo trạng thái điểm danh
    if (statusFilter !== 'all') {
      if (statusFilter === 'unrecorded') {
        if (s.attendanceStatus !== null) return false;
      } else {
        if (s.attendanceStatus !== statusFilter) return false;
      }
    }

    // 2. Lọc theo trạng thái buổi học
    if (sessionFilter !== 'all') {
      if (s.sessionStatus !== sessionFilter) return false;
    }

    // 3. Lọc theo tìm kiếm từ khóa (Tiêu đề buổi học hoặc Ngày học)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = s.title && s.title.toLowerCase().includes(q);
      const dateStr = formatDate(s.date).toLowerCase();
      const dateMatch = dateStr.includes(q);
      if (!titleMatch && !dateMatch) return false;
    }

    return true;
  });

  // ── XỬ LÝ PHÂN TRANG (Client-side Pagination) ──────────────────────────────
  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Tránh việc trang hiện tại vượt quá số trang thực tế sau khi lọc
  const activePage = currentPage > totalPages ? Math.max(1, totalPages) : currentPage;

  const startIndex = (activePage - 1) * pageSize;
  const pagedSessions = filteredSessions.slice(startIndex, startIndex + pageSize);

  const rows = pagedSessions.map((s, idx) => (
    <Table.Tr key={s.sessionId}>
      <Table.Td style={{ width: 45 }}>
        <Text size="xs" c="dimmed">{startIndex + idx + 1}</Text>
      </Table.Td>
      <Table.Td style={{ width: 140 }}>
        <Text size="sm" fw={500}>{formatDate(s.date)}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c={s.title ? undefined : 'dimmed'}>
          {s.title || `Buổi học (Chưa cập nhật tiêu đề)`}
        </Text>
        <Group gap={4} mt={2}>
          {(() => {
            if (s.sessionStatus === 'Cancelled') {
              return <Badge size="xs" variant="light" color="red">Đã hủy</Badge>;
            }
            if (s.sessionStatus === 'Completed') {
              return <Badge size="xs" variant="light" color="teal">Hoàn thành</Badge>;
            }
            const sessionTime = new Date(s.date).getTime();
            const now = new Date().getTime();
            if (sessionTime < now) {
              return <Badge size="xs" variant="light" color="orange">Chờ điểm danh</Badge>;
            }
            return <Badge size="xs" variant="light" color="blue">Lên lịch</Badge>;
          })()}
        </Group>
      </Table.Td>
      <Table.Td style={{ width: 130 }}>
        <AttendanceBadge status={s.attendanceStatus} />
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed" lineClamp={2}>{s.notes || '—'}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <Group gap={8}>
          <ThemeIcon size={28} radius="sm" color="copper" variant="light">
            <ChartBar size={16} weight="duotone" />
          </ThemeIcon>
          <Box>
            <Text fw={700} size="sm">Nhật ký chuyên cần</Text>
            {student && (
              <Text size="xs" c="dimmed">{student.fullName} · {student.studentCode}</Text>
            )}
          </Box>
        </Group>
      }
      size="xl"
      centered
      styles={{
        body: { padding: '16px 20px 20px' },
        header: { borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }
      }}
    >
      {loading ? (
        <Center py={60}>
          <Stack align="center" gap="sm">
            <Loader color="copper" size="md" />
            <Text size="sm" c="dimmed">Đang tải nhật ký điểm danh...</Text>
          </Stack>
        </Center>
      ) : logData ? (
        <Stack gap="md">
          {/* ── Thống kê tổng quan ─────────────────── */}
          <Group align="flex-start" gap="lg" wrap="nowrap">
            {/* Vòng tròn tỉ lệ */}
            <Stack align="center" gap={4} style={{ minWidth: 110 }}>
              <RingProgress
                size={110}
                thickness={10}
                roundCaps
                sections={stats?.attendanceRate != null
                  ? [{ value: stats.attendanceRate, color: ringColor }]
                  : [{ value: 0, color: 'gray' }]
                }
                label={
                  <Text ta="center" fw={800} size="lg" c={ringColor}>
                    {stats?.attendanceRate != null ? `${stats.attendanceRate}%` : 'N/A'}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">Tỉ lệ chuyên cần</Text>
            </Stack>

            {/* Stat cards */}
            <SimpleGrid cols={2} style={{ flex: 1 }} spacing="xs">
              <StatCard label="Tổng buổi học" value={stats?.totalSessions ?? 0} color="gray" />
              <StatCard label="Đã điểm danh" value={stats?.totalTracked ?? 0} color="copper" />
              <StatCard label="Có mặt" value={stats?.present ?? 0} color="teal" />
              <StatCard label="Vắng mặt" value={stats?.absent ?? 0} color="red" />
              <StatCard label="Đi muộn" value={stats?.late ?? 0} color="orange" />
              <StatCard label="Có phép" value={stats?.excused ?? 0} color="blue" />
            </SimpleGrid>
          </Group>

          <Divider label="Chi tiết từng buổi học" labelPosition="left" />

          {/* ── THANH CÔNG CỤ BỘ LỌC (FILTERS TOOLBAR) ────────────────────────── */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs" mb="xs">
            <TextInput
              placeholder="Tìm theo tiêu đề, ngày (Th 2...)..."
              leftSection={<MagnifyingGlass size={14} />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.currentTarget.value);
                setCurrentPage(1);
              }}
              size="xs"
            />

            <Select
              placeholder="Lọc trạng thái điểm danh"
              data={[
                { value: 'all', label: 'Tất cả điểm danh' },
                { value: 'Present', label: 'Có mặt' },
                { value: 'Absent', label: 'Vắng mặt' },
                { value: 'Late', label: 'Đi muộn' },
                { value: 'Excused', label: 'Có phép' },
                { value: 'unrecorded', label: 'Chưa điểm danh' }
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || 'all');
                setCurrentPage(1);
              }}
              size="xs"
            />

            <Select
              placeholder="Lọc trạng thái buổi học"
              data={[
                { value: 'all', label: 'Tất cả trạng thái buổi' },
                { value: 'Scheduled', label: 'Lên lịch (Sắp tới)' },
                { value: 'Completed', label: 'Đã hoàn thành' },
                { value: 'Cancelled', label: 'Đã hủy' }
              ]}
              value={sessionFilter}
              onChange={(val) => {
                setSessionFilter(val || 'all');
                setCurrentPage(1);
              }}
              size="xs"
            />
          </SimpleGrid>

          {/* ── Bảng lịch sử buổi học ──────────────── */}
          {filteredSessions.length === 0 ? (
            <Center py={40}>
              <Stack align="center" gap="xs">
                <ThemeIcon size={40} radius="xl" variant="light" color="gray">
                  <CalendarBlank size={20} weight="duotone" />
                </ThemeIcon>
                <Text c="dimmed" size="xs">Không tìm thấy buổi học nào khớp bộ lọc.</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="sm">
              <ScrollArea style={{ maxHeight: 290 }} offsetScrollbars>
                <Table highlightOnHover verticalSpacing="xs" fz="sm">
                  <Table.Thead style={{ position: 'sticky', top: 0, background: 'var(--mantine-color-body)', zIndex: 10 }}>
                    <Table.Tr>
                      <Table.Th style={{ width: 45 }}>#</Table.Th>
                      <Table.Th style={{ width: 140 }}>Ngày học</Table.Th>
                      <Table.Th>Buổi học</Table.Th>
                      <Table.Th style={{ width: 130 }}>Điểm danh</Table.Th>
                      <Table.Th>Ghi chú</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rows}</Table.Tbody>
                </Table>
              </ScrollArea>

              {/* Phân trang (Pagination) */}
              {totalPages > 1 && (
                <Group justify="center" mt="xs">
                  <Pagination
                    total={totalPages}
                    value={activePage}
                    onChange={setCurrentPage}
                    color="copper"
                    size="sm"
                    withEdges
                  />
                </Group>
              )}
            </Stack>
          )}
        </Stack>
      ) : (
        <Center py={60}>
          <Text c="dimmed">Không có dữ liệu.</Text>
        </Center>
      )}
    </Modal>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function ClassMembersTab() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const { classId } = useParams();
  const [members, setMembers] = useState([]);
  const [resolvedClassId, setResolvedClassId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loading = Boolean(classId) && (resolvedClassId !== classId || refreshing);

  // Modal states
  const [modalOpened, setModalOpened] = useState(false);
  const [importExcelOpened, setImportExcelOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('existing'); // existing | new
  const [createdStudent, setCreatedStudent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [unenrollConfirmOpened, setUnenrollConfirmOpened] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);

  // UC-35: Attendance Log Modal state
  const [attendanceLogStudent, setAttendanceLogStudent] = useState(null);

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
  const fetchMembers = useCallback(async () => {
    if (!classId) return;
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const res = await studentService.getClassMembers(classId);
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setMembers(res?.items || []);
      }
    } catch (error) {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        if (resolvedClassId !== classId) {
          setMembers([]);
        }
        console.error('Lỗi tải thành viên lớp học:', error);
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolvedClassId(classId);
      }
    }
  }, [classId, resolvedClassId]);

  useEffect(() => {
    if (!classId) return;
    const requestId = ++requestIdRef.current;

    const loadInitialMembers = async () => {
      try {
        const res = await studentService.getClassMembers(classId);
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setMembers(res?.items || []);
        }
      } catch (error) {
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setMembers([]);
          console.error('Lỗi tải thành viên lớp học:', error);
        }
      } finally {
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setResolvedClassId(classId);
        }
      }
    };

    loadInitialMembers();

    return () => {
      requestIdRef.current += 1;
    };
  }, [classId]);

  const visibleMembers = resolvedClassId === classId ? members : [];

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
      console.error(error);
    }
  };

  // Tạo mới và thêm vào lớp
  const handleCreateAndEnroll = async (values) => {
    try {
      const payload = {
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
        parentPhone: values.parentPhone
      };
      const result = await studentService.createAndEnrollNew(classId, payload);
      setCreatedStudent(result);
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

  // Sao chép thông tin tài khoản học viên
  const handleCopyInfo = () => {
    if (!createdStudent) return;
    const infoText = `THÔNG TIN TÀI KHOẢN HỌC VIÊN OWLY:
- Họ và tên: ${createdStudent.fullName}
- Tên đăng nhập (Mã HS): ${createdStudent.studentCode}
- Mật khẩu mặc định: Owly@123456
- Số điện thoại phụ huynh: ${createdStudent.parentPhone}

HƯỚNG DẪN ĐĂNG NHẬP:
1. Truy cập vào trang web hệ thống Owly.
2. Tại màn hình Đăng nhập, chọn vai trò "Học sinh".
3. Nhập Tên đăng nhập và Mật khẩu ở trên để đăng nhập.
4. Trong lần đăng nhập đầu tiên, vui lòng vào phần hồ sơ cá nhân để cập nhật Email cá nhân thật, số điện thoại cá nhân và đổi mật khẩu mới để bảo mật tài khoản.`;

    navigator.clipboard.writeText(infoText);
    setCopied(true);
    notifications.show({
      title: 'Đã sao chép',
      message: 'Đã sao chép thông tin tài khoản học viên vào bộ nhớ tạm',
      color: 'teal'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Xác nhận và thực hiện hủy liên kết học viên
  const handleConfirmUnenroll = async () => {
    if (!studentToUnenroll) return;
    try {
      setUnenrolling(true);
      await studentService.unenrollStudent(classId, studentToUnenroll.id);
      notifications.show({
        title: 'Thành công',
        message: 'Đã hủy liên kết học viên khỏi lớp học',
        color: 'green'
      });
      fetchMembers();
      setUnenrollConfirmOpened(false);
      setStudentToUnenroll(null);
    } catch (error) {
      console.error(error);
    } finally {
      setUnenrolling(false);
    }
  };

  const rows = visibleMembers.map((student) => (
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
            {!isStudent && student.dateOfBirth && (
              <Text size="xs" c="dimmed">
                Ngày sinh: {new Date(student.dateOfBirth).toLocaleDateString('vi-VN')}
              </Text>
            )}
          </div>
        </Group>
      </Table.Td>
      {!isStudent && (
        <Table.Td>
          <Text size="sm" c="dimmed">{student.account?.email || 'Chưa cập nhật'}</Text>
        </Table.Td>
      )}
      {!isStudent && (
        <Table.Td>
          <Group gap={4}>
            <Phone size={13} color="var(--accent-color)" />
            <Text size="sm">{student.parentPhone}</Text>
          </Group>
        </Table.Td>
      )}
      {!isStudent && (
        <Table.Td>
          <Group gap={4} justify="flex-end">
            <Tooltip label="Xem nhật ký điểm danh" withArrow>
              <ActionIcon
                variant="subtle"
                color="copper"
                size="sm"
                onClick={() => setAttendanceLogStudent(student)}
              >
                <CalendarBlank size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Hủy học (Xóa khỏi lớp)" withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  setStudentToUnenroll(student);
                  setUnenrollConfirmOpened(true);
                }}
              >
                <Trash size={15} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      {/* ── Page Header ─────────────────────────── */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <div>
          <Title order={3} style={{ fontSize: '20px', fontWeight: 700 }}>Danh sách Học viên</Title>
          <Text size="sm" c="dimmed">{visibleMembers.length} học viên tham gia lớp này</Text>
        </div>
        {!isStudent && (
          <Group gap="xs">
            <Button
              leftSection={<UploadSimple size={16} />}
              variant="light"
              color="copper"
              onClick={() => setImportExcelOpened(true)}
            >
              Nhập từ Excel
            </Button>
            <Button
              leftSection={<Plus size={16} weight="bold" />}
              color="copper"
              onClick={() => setModalOpened(true)}
            >
              Thêm học viên
            </Button>
          </Group>
        )}
      </Group>

      {/* ── Members Table ───────────────────────── */}
      {loading ? (
        <Center py={60}>
          <Loader color="copper" size="md" />
        </Center>
      ) : visibleMembers.length > 0 ? (
        <div className={classes.tableWrapper}>
          <Table highlightOnHover verticalSpacing="md" className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Học viên</Table.Th>
                {!isStudent && <Table.Th>Email liên hệ</Table.Th>}
                {!isStudent && <Table.Th>SĐT Phụ huynh</Table.Th>}
                {!isStudent && <Table.Th />}
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

      {/* ── UC-35: Modal Nhật ký Điểm danh ─────── */}
      {attendanceLogStudent !== null && classId && (
        <AttendanceLogModal
          key={`${attendanceLogStudent.id}-${classId}`}
          onClose={() => setAttendanceLogStudent(null)}
          student={attendanceLogStudent}
          classId={classId}
        />
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
                    const isAlreadyMember = visibleMembers.some(m => m.id === student.id);
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

      {/* ── Modal Hiển thị Thông tin Tài khoản vừa tạo ── */}
      <Modal
        opened={createdStudent !== null}
        onClose={() => setCreatedStudent(null)}
        title="Thông tin tài khoản học viên mới"
        size="md"
        centered
        styles={{
          header: {
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
          },
          title: {
            fontWeight: 700,
            color: 'var(--accent-color)'
          }
        }}
      >
        {createdStudent && (
          <Stack gap="md" pt="sm">
            <Alert color="teal" variant="light">
              <Text size="sm" fw={500} ta="center">Tài khoản học viên đã được tạo thành công!</Text>
            </Alert>

            <Card withBorder p="md" bg="var(--card-bg)" radius="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500} c="dimmed">Họ và tên:</Text>
                  <Text size="sm" fw={700}>{createdStudent.fullName}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm" fw={500} c="dimmed">Tên đăng nhập (Mã học sinh):</Text>
                  <Badge color="copper" variant="filled" size="md">{createdStudent.studentCode}</Badge>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm" fw={500} c="dimmed">Mật khẩu mặc định:</Text>
                  <Text size="sm" fw={700} style={{ fontFamily: 'monospace' }}>Owly@123456</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm" fw={500} c="dimmed">SĐT Phụ huynh:</Text>
                  <Text size="sm" fw={600}>{createdStudent.parentPhone}</Text>
                </Group>
              </Stack>
            </Card>

            <Box>
              <Text size="sm" fw={600} mb={6}>Hướng dẫn đăng nhập cho học viên / phụ huynh:</Text>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                1. Sử dụng Mã học sinh làm Tên đăng nhập.<br />
                2. Đăng nhập bằng mật khẩu mặc định <strong>Owly@123456</strong>.<br />
                3. Trong lần đăng nhập đầu tiên, học sinh/phụ huynh cần cập nhật Email thật của họ và đổi mật khẩu mới để bảo mật tài khoản.
              </Text>
            </Box>

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                color="copper"
                leftSection={copied ? <Check size={16} /> : <Copy size={16} />}
                onClick={handleCopyInfo}
              >
                {copied ? 'Đã sao chép' : 'Sao chép thông tin'}
              </Button>
              <Button color="copper" onClick={() => setCreatedStudent(null)}>Đóng</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* ── Modal Xác nhận Hủy ghi danh (Unenroll Confirm) ── */}
      <ConfirmModal
        opened={unenrollConfirmOpened}
        onClose={() => {
          setUnenrollConfirmOpened(false);
          setStudentToUnenroll(null);
        }}
        onConfirm={handleConfirmUnenroll}
        title="Hủy liên kết lớp học"
        message={`Bạn có chắc chắn muốn hủy học (hủy liên kết lớp) cho học viên ${studentToUnenroll?.fullName} khỏi lớp học này không?`}
        confirmLabel="Hủy liên kết"
        cancelLabel="Hủy bỏ"
        color="red"
        loading={unenrolling}
      />
      
      {importExcelOpened && classId && (
        <ImportStudentsModal
          key={classId}
          opened={importExcelOpened}
          onClose={() => setImportExcelOpened(false)}
          classId={classId}
          onSuccess={fetchMembers}
        />
      )}
    </Stack>
  );
}

export default ClassMembersTab;
