import { useState, useEffect } from 'react';
import {
  Stack, Title, Text, Group, TextInput,
  Table, Badge, Avatar, Center, ThemeIcon, Loader, Pagination, Select
} from '@mantine/core';
import { MagnifyingGlass, Users, Phone } from '@phosphor-icons/react';
import { studentService } from '../services/studentService';
import apiClient from '../../../services/apiClient';
import classes from './StudentListPage.module.css';

export function StudentListPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState(null);
  const [classesList, setClassesList] = useState([]);
  
  // Phân trang
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Tải danh sách lớp để đưa vào bộ lọc Select
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await apiClient.get('/api/classes', { params: { limit: 100 } });
        const items = res.items || res.data?.items || res || [];
        setClassesList(items);
      } catch (error) {
        console.error('Lỗi tải danh sách lớp học để lọc:', error);
      }
    };
    fetchClasses();
  }, []);

  // Tải danh sách học sinh dựa trên search, classId và phân trang (có debounce)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await studentService.getStudents({
          page,
          limit: 10,
          search: search || undefined,
          classId: classId || undefined
        });
        
        // Response format từ backend: { success: true, data: { items: [...], pagination: {...} } }
        // axios response interceptor đã giải nén data thành { items, pagination }
        const items = res?.items || [];
        const pagination = res?.pagination || { totalItems: 0, totalPages: 1 };
        
        setStudents(items);
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
      } catch (error) {
        console.error('Lỗi tải danh sách học sinh:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceHandler = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(debounceHandler);
  }, [search, classId, page]);

  // Trở lại trang 1 khi thay đổi điều kiện tìm kiếm/lọc
  useEffect(() => {
    setPage(1);
  }, [search, classId]);

  const rows = students.map((student) => (
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
        {/* Email cá nhân (tài khoản email phụ huynh/học sinh tự nhập sau khi login) */}
        <Text size="sm" c="dimmed">{student.account?.email || 'Chưa cập nhật'}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Phone size={13} color="var(--accent-color)" />
          <Text size="sm">{student.parentPhone || 'Chưa cập nhật'}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="wrap">
          {student.enrollments && student.enrollments.map((enr) => (
            <Badge key={enr.class.id} size="xs" variant="light" color="copper">
              {enr.class.name}
            </Badge>
          ))}
          {(!student.enrollments || student.enrollments.length === 0) && (
            <Text size="xs" c="dimmed" fs="italic">Chưa tham gia lớp nào</Text>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      {/* ── Header ──────────────────────────────── */}
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={2} className={classes.pageTitle}>Danh bạ Học viên</Title>
          <Text size="sm" c="dimmed">Hiển thị {totalItems} học viên trong các lớp của bạn</Text>
        </div>
      </Group>

      {/* ── Search & Filter ─────────────────────── */}
      <Group gap="md" wrap="wrap">
        <TextInput
          placeholder="Tìm học viên theo họ tên, sđt phụ huynh..."
          leftSection={<MagnifyingGlass size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 260, maxWidth: 360 }}
        />
        <Select
          placeholder="Lọc theo lớp học"
          data={classesList.map(c => ({ value: c.id, label: c.name }))}
          value={classId}
          onChange={setClassId}
          clearable
          style={{ width: 220 }}
        />
      </Group>

      {/* ── Table / Loader ──────────────────────── */}
      {loading ? (
        <Center py={80}>
          <Loader color="copper" size="md" />
        </Center>
      ) : students.length > 0 ? (
        <Stack gap="md" align="center">
          <div className={classes.tableWrapper} style={{ width: '100%' }}>
            <Table highlightOnHover verticalSpacing="md" className={classes.table}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Học viên</Table.Th>
                  <Table.Th>Email liên hệ</Table.Th>
                  <Table.Th>SĐT Phụ huynh</Table.Th>
                  <Table.Th>Lớp đang học</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              color="copper"
              mt="md"
            />
          )}
        </Stack>
      ) : (
        <Center py={80}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <Users size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed">
              {search || classId 
                ? 'Không tìm thấy học viên phù hợp bộ lọc.' 
                : 'Chưa có học viên nào thuộc quyền quản lý của bạn.'}
            </Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}

export default StudentListPage;
