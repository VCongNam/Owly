import { Stack, Title, Text, Card, Group, Badge, Center, ThemeIcon, SimpleGrid } from '@mantine/core';
import { Archive, GraduationCap, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import classes from './ArchivedClassesPage.module.css';

const MOCK_ARCHIVED = [
  { id: 'a1', name: 'Toán 11A - Kỳ 1/2024', subject: 'Toán học', studentCount: 22, archivedAt: '2024-12-31' },
  { id: 'a2', name: 'Lý 10B - Năm 2023', subject: 'Vật lý', studentCount: 19, archivedAt: '2024-01-15' },
];

export function ArchivedClassesPage() {
  return (
    <Stack gap="lg">
      <div>
        <Group gap={10}>
          <Archive size={22} weight="duotone" color="var(--accent-color)" />
          <Title order={2} className={classes.pageTitle}>Kho lớp cũ</Title>
        </Group>
        <Text size="sm" c="dimmed" mt={4}>{MOCK_ARCHIVED.length} lớp đã lưu trữ</Text>
      </div>

      {MOCK_ARCHIVED.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {MOCK_ARCHIVED.map((cls) => (
            <Card key={cls.id} withBorder radius="md" p="lg" className={classes.card}>
              <Group gap={12} align="flex-start" wrap="nowrap">
                <ThemeIcon size={42} radius="md" variant="light" color="gray" style={{ flexShrink: 0 }}>
                  <GraduationCap size={22} weight="duotone" />
                </ThemeIcon>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} lineClamp={1}>{cls.name}</Text>
                  <Text size="xs" c="dimmed">{cls.subject}</Text>
                </div>
              </Group>

              <Group mt="md" justify="space-between">
                <Badge size="xs" variant="outline" color="gray">
                  Đã lưu trữ {new Date(cls.archivedAt).toLocaleDateString('vi-VN')}
                </Badge>
                <Group gap={4} style={{ cursor: 'pointer', color: 'var(--accent-color)', fontSize: 12 }}>
                  <ArrowCounterClockwise size={14} />
                  <Text size="xs" c="copper">Khôi phục</Text>
                </Group>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Center py={80}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <Archive size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed">Chưa có lớp nào được lưu trữ.</Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}

export default ArchivedClassesPage;
