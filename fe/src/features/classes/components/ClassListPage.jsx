import { useState, useEffect } from 'react';
import { SimpleGrid, Button, Group, Title, Text, TextInput, Stack, Center, ThemeIcon, Loader, Pagination } from '@mantine/core';
import { Plus, MagnifyingGlass, GraduationCap } from '@phosphor-icons/react';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { ClassCard } from './ClassCard';
import { ClassFormModal } from './ClassFormModal';
import { useClasses } from '../hooks/useClasses';
import classesCss from './ClassListPage.module.css';
import { useAuth } from '../../auth';

export function ClassListPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  
  const { 
    classes, 
    loading, 
    pagination, 
    setPage, 
    setSearch, 
    createClass, 
    updateClass 
  } = useClasses({
    status: 'active_only',
    limit: 9
  });
  
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Gọi API search khi kết thúc gõ
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditClick = (cls) => {
    setSelectedClass(cls);
    open();
  };

  const handleCreateClick = () => {
    setSelectedClass(null);
    open();
  };

  const handleModalClose = () => {
    setSelectedClass(null);
    close();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={2} className={classesCss.pageTitle}>Lớp của tôi</Title>
          <Text size="sm" c="dimmed">{pagination.totalItems} lớp đang hoạt động</Text>
        </div>
        {!isStudent && (
          <Button leftSection={<Plus size={16} weight="bold" />} color="copper" onClick={handleCreateClick}>
            Tạo lớp mới
          </Button>
        )}
      </Group>

      <TextInput
        placeholder="Tìm lớp học..."
        leftSection={<MagnifyingGlass size={16} />}
        value={searchValue}
        onChange={(e) => setSearchValue(e.currentTarget.value)}
        style={{ maxWidth: 360 }}
      />

      {loading ? (
        <Center py={80}>
          <Loader color="copper" />
        </Center>
      ) : classes.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                onEdit={handleEditClick}
                onArchive={async (c) => {
                  const newStatus = c.status === 'Archived' ? 'OnGoing' : 'Archived';
                  await updateClass(c.id, { status: newStatus });
                }}
              />
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
              <GraduationCap size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed" ta="center">
              {searchValue ? `Không tìm thấy lớp nào với "${searchValue}"` : (isStudent ? 'Bạn chưa được ghi danh vào lớp học nào.' : 'Chưa có lớp học nào. Hãy tạo lớp đầu tiên!')}
            </Text>
            {!searchValue && !isStudent && (
              <Button leftSection={<Plus size={16} />} variant="light" color="copper" onClick={handleCreateClick}>
                Tạo lớp mới
              </Button>
            )}
          </Stack>
        </Center>
      )}

      <ClassFormModal 
        opened={opened} 
        onClose={handleModalClose} 
        initialValues={selectedClass}
        onSubmit={async (values) => {
          let success;
          if (selectedClass) {
            success = await updateClass(selectedClass.id, values);
          } else {
            success = await createClass(values);
          }
          if (success) handleModalClose();
        }}
      />
    </Stack>
  );
}

export default ClassListPage;
