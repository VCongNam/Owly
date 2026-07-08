import { Stack, Title, Text, Card, Group, Badge, Center, ThemeIcon, SimpleGrid, Loader, Pagination } from '@mantine/core';
import { Archive, GraduationCap, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useClasses } from '../hooks/useClasses';
import classes from './ArchivedClassesPage.module.css';

export function ArchivedClassesPage() {
  // Lọc trực tiếp từ API bằng cách truyền tham số status và limit
  const { 
    classes: archivedClasses, 
    loading, 
    pagination, 
    setPage, 
    updateClass 
  } = useClasses({
    status: 'Archived',
    limit: 9
  });

  const handleRestore = async (cls) => {
    await updateClass(cls.id, { status: 'OnGoing' });
  };

  if (loading) {
    return (
      <Center py={80}>
        <Loader color="copper" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Group gap={10}>
          <Archive size={22} weight="duotone" color="var(--accent-color)" />
          <Title order={2} className={classes.pageTitle}>Kho lớp cũ</Title>
        </Group>
        <Text size="sm" c="dimmed" mt={4}>{pagination.totalItems} lớp đã lưu trữ</Text>
      </div>

      {archivedClasses.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {archivedClasses.map((cls) => (
              <Card key={cls.id} withBorder radius="md" p="lg" className={classes.card}>
                <Group gap={12} align="flex-start" wrap="nowrap">
                  <ThemeIcon size={42} radius="md" variant="light" color="gray" style={{ flexShrink: 0 }}>
                    <GraduationCap size={22} weight="duotone" />
                  </ThemeIcon>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={700} lineClamp={1}>{cls.name}</Text>
                    {cls.subject && (
                      <Text size="xs" c="dimmed">{cls.subject.name}</Text>
                    )}
                  </div>
                </Group>

                <Group mt="md" justify="space-between">
                  {cls.startDate && (
                    <Badge size="xs" variant="outline" color="gray">
                      Khai giảng: {new Date(cls.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Badge>
                  )}
                  <Group 
                    gap={4} 
                    style={{ cursor: 'pointer', color: 'var(--accent-color)', fontSize: 12 }}
                    onClick={() => handleRestore(cls)}
                  >
                    <ArrowCounterClockwise size={14} />
                    <Text size="xs" c="copper">Khôi phục</Text>
                  </Group>
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <Group justify="center" mt="xl">
              <Pagination
                total={pagination.totalPages}
                value={pagination.currentPage}
                onChange={setPage}
                color="copper"
              />
            </Group>
          )}
        </>
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
