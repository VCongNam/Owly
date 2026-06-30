import { useState } from 'react';
import { SimpleGrid, Button, Group, Title, Text, TextInput, Stack, Center, ThemeIcon } from '@mantine/core';
import { Plus, MagnifyingGlass, GraduationCap } from '@phosphor-icons/react';
import { ClassCard } from './ClassCard';
import classes from './ClassListPage.module.css';

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_CLASSES = [
  { id: '1', name: 'Toán 12A1', subject: 'Toán học', studentCount: 24, startDate: '2025-09-01' },
  { id: '2', name: 'Lý 11B', subject: 'Vật lý', studentCount: 20, startDate: '2025-09-01' },
  { id: '3', name: 'Hóa 10C', subject: 'Hóa học', studentCount: 18, startDate: '2025-09-15' },
  { id: '4', name: 'Toán 10A', subject: 'Toán học', studentCount: 22, startDate: '2025-10-01' },
];
// ────────────────────────────────────────────────────────────────────────────

export function ClassListPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CLASSES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack gap="lg">
      {/* ── Header ──────────────────────────────── */}
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={2} className={classes.pageTitle}>Lớp của tôi</Title>
          <Text size="sm" c="dimmed">{MOCK_CLASSES.length} lớp đang hoạt động</Text>
        </div>
        <Button leftSection={<Plus size={16} weight="bold" />} color="copper">
          Tạo lớp mới
        </Button>
      </Group>

      {/* ── Search ──────────────────────────────── */}
      <TextInput
        placeholder="Tìm lớp học, môn học..."
        leftSection={<MagnifyingGlass size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 360 }}
      />

      {/* ── Class Grid ──────────────────────────── */}
      {filtered.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filtered.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onEdit={(c) => console.log('Edit:', c)}
              onArchive={(c) => console.log('Archive:', c)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Center py={80}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <GraduationCap size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed" ta="center">
              {search ? `Không tìm thấy lớp nào với "${search}"` : 'Chưa có lớp học nào. Hãy tạo lớp đầu tiên!'}
            </Text>
            {!search && (
              <Button leftSection={<Plus size={16} />} variant="light" color="copper">
                Tạo lớp mới
              </Button>
            )}
          </Stack>
        </Center>
      )}
    </Stack>
  );
}

export default ClassListPage;
