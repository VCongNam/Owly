import { useState } from 'react';
import {
  Stack, Title, Text, Group, Button, TextInput,
  Table, Badge, Avatar, ActionIcon, Tooltip, Center, ThemeIcon
} from '@mantine/core';
import { Plus, MagnifyingGlass, Users, Phone, PencilSimple, Trash } from '@phosphor-icons/react';
import classes from './StudentListPage.module.css';

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: 's1', fullName: 'Nguyễn Thị Lan', studentCode: 'HS001', email: 'lan.nguyen@student.owly.vn', parentPhone: '0912345678', classes: ['Toán 12A1', 'Lý 11B'] },
  { id: 's2', fullName: 'Trần Văn Minh', studentCode: 'HS002', email: 'minh.tran@student.owly.vn', parentPhone: '0987654321', classes: ['Toán 12A1'] },
  { id: 's3', fullName: 'Lê Thị Hoa', studentCode: 'HS003', email: 'hoa.le@student.owly.vn', parentPhone: '0901234567', classes: ['Hóa 10C'] },
  { id: 's4', fullName: 'Phạm Văn An', studentCode: 'HS004', email: 'an.pham@student.owly.vn', parentPhone: '0934567890', classes: ['Toán 12A1', 'Hóa 10C'] },
];
// ────────────────────────────────────────────────────────────────────────────

export function StudentListPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_STUDENTS.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map((student) => (
    <Table.Tr key={student.id} className={classes.tableRow}>
      <Table.Td>
        <Group gap={10} wrap="nowrap">
          <Avatar name={student.fullName} size={36} radius="xl" color="copper" />
          <div>
            <Text size="sm" fw={600}>{student.fullName}</Text>
            <Text size="xs" c="dimmed">{student.studentCode}</Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">{student.email}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Phone size={13} color="var(--accent-color)" />
          <Text size="sm">{student.parentPhone}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="wrap">
          {student.classes.map((cls) => (
            <Badge key={cls} size="xs" variant="light" color="copper">{cls}</Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Tooltip label="Chỉnh sửa" withArrow>
            <ActionIcon variant="subtle" color="gray" size="sm">
              <PencilSimple size={15} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Xóa" withArrow>
            <ActionIcon variant="subtle" color="red" size="sm">
              <Trash size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      {/* ── Header ──────────────────────────────── */}
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={2} className={classes.pageTitle}>Học viên</Title>
          <Text size="sm" c="dimmed">{MOCK_STUDENTS.length} học viên trong workspace</Text>
        </div>
        <Button leftSection={<Plus size={16} weight="bold" />} color="copper">
          Thêm học viên
        </Button>
      </Group>

      {/* ── Search ──────────────────────────────── */}
      <TextInput
        placeholder="Tìm học viên theo tên, mã số..."
        leftSection={<MagnifyingGlass size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 360 }}
      />

      {/* ── Table ───────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className={classes.tableWrapper}>
          <Table highlightOnHover verticalSpacing="md" className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Học viên</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>SĐT Phụ huynh</Table.Th>
                <Table.Th>Lớp học</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>
      ) : (
        <Center py={80}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <Users size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed">
              {search ? `Không tìm thấy học viên với "${search}"` : 'Chưa có học viên nào.'}
            </Text>
            {!search && (
              <Button leftSection={<Plus size={16} />} variant="light" color="copper">
                Thêm học viên đầu tiên
              </Button>
            )}
          </Stack>
        </Center>
      )}
    </Stack>
  );
}

export default StudentListPage;
