import { useEffect, useState } from 'react';
import { Table, Button, Group, Badge, Text, ActionIcon } from '@mantine/core';
import { Pencil, Trash } from '@phosphor-icons/react';
import { useAssignment } from '../../hooks/useAssignment';
import AssignmentFormModal from './AssignmentFormModal';

export default function AssignmentList({ classId, categoryId }) {
  const { assignments, fetchAssignments, createAssignment } = useAssignment(classId);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    fetchAssignments(1);
  }, [fetchAssignments]);

  const handleCreate = async (data) => {
    await createAssignment(data);
  };

  const rows = assignments.map((assignment) => (
    <Table.Tr key={assignment.id}>
      <Table.Td>
        <Text fw={500}>{assignment.title}</Text>
        {assignment.attachmentUrls?.map((url, idx) => (
          <Badge key={idx} variant="light" color="blue" mr="xs" mt="xs" component="a" href={url} target="_blank">
            Đính kèm {idx + 1}
          </Badge>
        ))}
      </Table.Td>
      <Table.Td>{new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</Table.Td>
      <Table.Td>{assignment.maxPoints}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue"><Pencil size={16} /></ActionIcon>
          <ActionIcon variant="subtle" color="red"><Trash size={16} /></ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>Danh sách bài tập</Text>
        <Button onClick={() => setOpened(true)}>Tạo bài tập mới</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tiêu đề</Table.Th>
            <Table.Th>Hạn nộp</Table.Th>
            <Table.Th>Điểm tối đa</Table.Th>
            <Table.Th>Thao tác</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? rows : (
            <Table.Tr>
              <Table.Td colSpan={4} ta="center">Chưa có bài tập nào</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <AssignmentFormModal 
        opened={opened} 
        onClose={() => setOpened(false)} 
        classId={classId} 
        categoryId={categoryId}
        onSubmit={handleCreate}
        onUploadEditor={() => {}} // Placeholder for the actual implementation in parent or hook
        onUploadFiles={() => {}} // Placeholder
      />
    </div>
  );
}
