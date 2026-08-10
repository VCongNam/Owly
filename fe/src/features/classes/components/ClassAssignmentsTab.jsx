import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack, Group, Title, Text, Button, Table, ActionIcon,
  Tooltip, Center, ThemeIcon, Loader, Badge, Pagination, ScrollArea, Menu
} from '@mantine/core';
import {
  Plus, Trash, Link as LinkIcon, ClipboardText, UploadSimple, FileText, CaretDown, ListChecks
} from '@phosphor-icons/react';
import { useAuth } from '../../auth';
import { useAssignments } from '../hooks/useAssignments';
import { ConfirmModal } from '../../../shared';
import { AssignmentUploadModal } from './AssignmentUploadModal';
import { GradeCategoriesModal } from './GradeCategoriesModal';
import { AssignmentSubmissionModal } from './AssignmentSubmissionModal';
import { AssignmentGradingPanel } from './AssignmentGradingPanel';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const isOverdue = (dueDate) => new Date(dueDate) < new Date();

export function ClassAssignmentsTab() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const {
    assignments,
    loading,
    pagination,
    fetchAssignments,
    deleteAssignment
  } = useAssignments(classId);

  // Confirm delete modal
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Upload modal
  const [uploadModalOpened, setUploadModalOpened] = useState(false);

  // Grade Categories Config modal
  const [categoriesModalOpened, setCategoriesModalOpened] = useState(false);

  // Submission modals states
  const [submissionModalOpened, setSubmissionModalOpened] = useState(false);
  const [selectedAssignmentForSubmission, setSelectedAssignmentForSubmission] = useState(null);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);

  // Experimental confirm modal state (dành riêng cho tính năng soạn thảo Rich Text)
  const [experimentalConfirmOpened, setExperimentalConfirmOpened] = useState(false);

  const handleConfirmExperimental = () => {
    setExperimentalConfirmOpened(false);
    navigate(`/classes/${classId}/assignments/create`);
  };

  const handleOpenDeleteConfirm = (item) => {
    setAssignmentToDelete(item);
    setDeleteConfirmOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    setDeleting(true);
    await deleteAssignment(assignmentToDelete.id);
    setDeleteConfirmOpened(false);
    setAssignmentToDelete(null);
    setDeleting(false);
  };

  const rows = assignments.map((item) => {
    const overdue = isOverdue(item.dueDate);
    return (
      <Table.Tr key={item.id}>
        <Table.Td style={{ minWidth: 220 }}>
          <Text size="sm" fw={600}>{item.title}</Text>
          {item.attachmentUrls?.length > 0 && (
            <Group gap={4} mt={4}>
              {item.attachmentUrls.map((url, idx) => (
                <Badge
                  key={idx}
                  component="a"
                  href={url}
                  target="_blank"
                  variant="light"
                  color="blue"
                  size="xs"
                  leftSection={<LinkIcon size={10} />}
                  style={{ cursor: 'pointer' }}
                >
                  File {idx + 1}
                </Badge>
              ))}
            </Group>
          )}
        </Table.Td>
        <Table.Td style={{ width: 180 }}>
          <Text size="xs" c={overdue ? 'red' : 'dimmed'}>{formatDate(item.dueDate)}</Text>
          {overdue && <Badge size="xs" color="red" variant="dot">Đã hết hạn</Badge>}
        </Table.Td>
        <Table.Td style={{ width: 100 }}>
          <Text size="sm" ta="center">{item.maxPoints}</Text>
        </Table.Td>
        <Table.Td style={{ minWidth: 150 }}>
          <Group gap={8} justify="flex-end" wrap="nowrap">
            {isTeacher ? (
              <>
                <Button
                  size="xs"
                  variant="light"
                  color="copper"
                  onClick={() => {
                    setSelectedAssignmentForSubmissions(item);
                  }}
                >
                  Bài nộp
                </Button>
                <Tooltip label="Xóa bài tập" withArrow>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleOpenDeleteConfirm(item)}>
                    <Trash size={16} />
                  </ActionIcon>
                </Tooltip>
              </>
            ) : (
              <Button
                size="xs"
                variant="light"
                color="copper"
                onClick={() => {
                  setSelectedAssignmentForSubmission(item);
                  setSubmissionModalOpened(true);
                }}
              >
                Nộp bài & Điểm số
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (selectedAssignmentForSubmissions) {
    return (
      <AssignmentGradingPanel
        assignment={selectedAssignmentForSubmissions}
        onBack={() => {
          setSelectedAssignmentForSubmissions(null);
          fetchAssignments(pagination.currentPage);
        }}
      />
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <div>
          <Title order={3} style={{ fontSize: '20px', fontWeight: 700 }}>Bài tập</Title>
          <Text size="sm" c="dimmed">
            {pagination.totalItems > 0
              ? `${pagination.totalItems} bài tập trong lớp`
              : 'Lớp học chưa có bài tập nào'}
          </Text>
        </div>
        {isTeacher && (
          <Group gap="xs">
            <Button
              variant="outline"
              color="copper"
              leftSection={<ListChecks size={16} weight="bold" />}
              onClick={() => setCategoriesModalOpened(true)}
            >
              Cấu hình đầu điểm
            </Button>
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Button
                  leftSection={<Plus size={16} weight="bold" />}
                  rightSection={<CaretDown size={14} weight="bold" />}
                  color="copper"
                >
                  Tạo bài tập
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item 
                  leftSection={<FileText size={16} />}
                  onClick={() => setExperimentalConfirmOpened(true)}
                >
                  Soạn thảo bài tập
                </Menu.Item>
                <Menu.Item 
                  leftSection={<UploadSimple size={16} />}
                  onClick={() => setUploadModalOpened(true)}
                >
                  Tải bài tập lên
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        )}
      </Group>

      {/* Table */}
      {loading ? (
        <Center py={60}><Loader color="copper" size="md" /></Center>
      ) : assignments.length > 0 ? (
        <Stack gap="sm">
          <ScrollArea>
            <Table highlightOnHover verticalSpacing="md" style={{ minWidth: 560 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tiêu đề</Table.Th>
                  <Table.Th style={{ width: 180 }}>Hạn nộp</Table.Th>
                  <Table.Th style={{ width: 100 }}>Điểm tối đa</Table.Th>
                  <Table.Th style={{ width: 80 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
          {pagination.totalPages > 1 && (
            <Group justify="center" mt="xs">
              <Pagination
                total={pagination.totalPages}
                value={pagination.currentPage}
                onChange={fetchAssignments}
                color="copper"
                size="sm"
                withEdges
              />
            </Group>
          )}
        </Stack>
      ) : (
        <Center py={60}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <ClipboardText size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed" size="sm">Chưa có bài tập nào được tạo.</Text>
            {isTeacher && (
              <Group mt="xs" justify="center">
                <Button
                  leftSection={<FileText size={16} weight="bold" />}
                  color="copper"
                  onClick={() => setExperimentalConfirmOpened(true)}
                >
                  Soạn thảo bài tập
                </Button>
                <Button
                  leftSection={<UploadSimple size={16} weight="bold" />}
                  variant="outline"
                  color="copper"
                  onClick={() => setUploadModalOpened(true)}
                >
                  Tải bài tập lên
                </Button>
              </Group>
            )}
          </Stack>
        </Center>
      )}

      {uploadModalOpened && (
        <AssignmentUploadModal 
          classId={classId}
          opened={uploadModalOpened} 
          onClose={() => {
            setUploadModalOpened(false);
            fetchAssignments(1); // Refresh list
          }} 
        />
      )}

      {categoriesModalOpened && (
        <GradeCategoriesModal
          classId={classId}
          opened={categoriesModalOpened}
          onClose={() => {
            setCategoriesModalOpened(false);
            fetchAssignments(1);
          }}
          onCategoriesUpdated={() => {
            fetchAssignments(1);
          }}
        />
      )}

      {/* Modal Xác nhận Xóa */}
      <ConfirmModal
        opened={deleteConfirmOpened}
        onClose={() => {
          if (!deleting) {
            setDeleteConfirmOpened(false);
            setAssignmentToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa bài tập"
        message={assignmentToDelete ? `Bạn có chắc muốn xóa bài tập "${assignmentToDelete.title}" không? Hành động này không thể hoàn tác.` : ''}
        confirmLabel="Xóa bài tập"
        cancelLabel="Hủy"
        color="red"
        loading={deleting}
      />

      {submissionModalOpened && selectedAssignmentForSubmission && (
        <AssignmentSubmissionModal
          opened={submissionModalOpened}
          onClose={() => {
            setSubmissionModalOpened(false);
            setSelectedAssignmentForSubmission(null);
          }}
          assignment={selectedAssignmentForSubmission}
        />
      )}



      {/* Modal Xác nhận Tính năng Thử nghiệm */}
      <ConfirmModal
        opened={experimentalConfirmOpened}
        onClose={() => setExperimentalConfirmOpened(false)}
        onConfirm={handleConfirmExperimental}
        title="Tính năng thử nghiệm"
        message="Đây là tính năng soạn thảo nâng cao đang trong quá trình thử nghiệm (Beta), có thể phát sinh lỗi ngoài ý muốn. Bạn có chắc chắn muốn tiếp tục không?"
        confirmLabel="Tiếp tục"
        cancelLabel="Hủy bỏ"
        color="orange"
      />
    </Stack>
  );
}

export default ClassAssignmentsTab;
