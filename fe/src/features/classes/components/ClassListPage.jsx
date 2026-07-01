import { useState } from 'react';
import { SimpleGrid, Button, Group, Title, Text, TextInput, Stack, Center, ThemeIcon, Loader } from '@mantine/core';
import { Plus, MagnifyingGlass, GraduationCap } from '@phosphor-icons/react';
import { useDisclosure } from '@mantine/hooks';
import { ClassCard } from './ClassCard';
import { ClassFormModal } from './ClassFormModal';
import { useClasses } from '../hooks/useClasses';
import classesCss from './ClassListPage.module.css';

export function ClassListPage() {
  const [search, setSearch] = useState('');
  const { classes, loading, createClass } = useClasses();
  const [opened, { open, close }] = useDisclosure(false);

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = classes.filter(c => c.status === 'Active').length;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={2} className={classesCss.pageTitle}>Lớp của tôi</Title>
          <Text size="sm" c="dimmed">{activeCount} lớp đang hoạt động</Text>
        </div>
        <Button leftSection={<Plus size={16} weight="bold" />} color="copper" onClick={open}>
          Tạo lớp mới
        </Button>
      </Group>

      <TextInput
        placeholder="Tìm lớp học..."
        leftSection={<MagnifyingGlass size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 360 }}
      />

      {loading ? (
        <Center py={80}>
          <Loader color="copper" />
        </Center>
      ) : filtered.length > 0 ? (
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
              <Button leftSection={<Plus size={16} />} variant="light" color="copper" onClick={open}>
                Tạo lớp mới
              </Button>
            )}
          </Stack>
        </Center>
      )}

      <ClassFormModal 
        opened={opened} 
        onClose={close} 
        onSubmit={async (values) => {
          const success = await createClass(values);
          if (success) close();
        }}
      />
    </Stack>
  );
}

export default ClassListPage;
