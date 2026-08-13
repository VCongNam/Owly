import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal, Table, Button, Group, Stack, Text, TextInput, NumberInput,
  ActionIcon, Badge, Tooltip, ScrollArea, Paper, Divider, Alert
} from '@mantine/core';
import { Plus, Pencil, Trash, Check, X, WarningCircle, ListChecks } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { gradeCategoryService } from '../services/gradeCategories';
import { ConfirmModal } from '../../../shared';

export function GradeCategoriesModal({ classId, onClose, onCategoriesUpdated }) {
  const [categories, setCategories] = useState([]);

  // Form states (Add/Edit)
  const [editingId, setEditingId] = useState(null); // null = mode tạo mới
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete states
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await gradeCategoryService.getGradeCategories(classId);
      const cats = Array.isArray(res) ? res : (res?.data || []);
      if (isMountedRef.current) {
        setCategories(cats);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh mục đầu điểm:', err);
      if (isMountedRef.current) {
        notifications.show({ title: 'Lỗi', message: 'Không thể tải danh sách danh mục đầu điểm.', color: 'red' });
      }
    }
  }, [classId]);

  useEffect(() => {
    let active = true;

    const loadInitialCategories = async () => {
      try {
        const result = await gradeCategoryService.getGradeCategories(classId);
        if (active) {
          setCategories(Array.isArray(result) ? result : result?.data || []);
        }
      } catch {
        if (active) {
          notifications.show({ title: 'Lỗi', message: 'Không thể tải danh sách danh mục đầu điểm.', color: 'red' });
        }
      }
    };

    loadInitialCategories();

    return () => {
      active = false;
    };
  }, [classId]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setWeight(10);
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setWeight(Math.round((cat.weight || 0) * 100));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tên danh mục điểm.', color: 'orange' });
      return;
    }

    setSubmitting(true);
    const weightVal = Number(weight) ? Number(weight) / 100 : 0;

    try {
      if (editingId) {
        // Update
        const res = await gradeCategoryService.updateGradeCategory(classId, editingId, {
          name: name.trim(),
          weight: weightVal
        });
        const updatedCat = res?.id ? res : res?.data;
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...updatedCat } : c));
        notifications.show({ title: 'Thành công', message: 'Đã cập nhật danh mục điểm.', color: 'teal' });
      } else {
        // Create
        const res = await gradeCategoryService.createGradeCategory(classId, {
          name: name.trim(),
          weight: weightVal
        });
        const newCat = res?.id ? res : res?.data;
        setCategories(prev => [...prev, newCat]);
        notifications.show({ title: 'Thành công', message: 'Đã tạo danh mục điểm mới.', color: 'teal' });
      }
      resetForm();
      fetchCategories();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Lỗi', message: err?.response?.data?.message || 'Lỗi khi lưu danh mục.', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (cat) => {
    if (categories.length <= 1) {
      notifications.show({
        title: 'Không thể xóa',
        message: 'Lớp học phải giữ ít nhất 1 danh mục đầu điểm.',
        color: 'orange'
      });
      return;
    }
    setCategoryToDelete(cat);
    setDeleteConfirmOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await gradeCategoryService.deleteGradeCategory(classId, categoryToDelete.id);
      notifications.show({
        title: 'Đã xóa',
        message: 'Đã xóa danh mục điểm. Các bài tập liên quan được tự động chuyển về "Bài tập chung".',
        color: 'teal'
      });
      setDeleteConfirmOpened(false);
      setCategoryToDelete(null);
      fetchCategories();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      console.error(err);
      notifications.show({
        title: 'Thất bại',
        message: err?.response?.data?.message || 'Không thể xóa danh mục điểm.',
        color: 'red'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Calculate total weight %
  const totalWeightPercent = categories.reduce((sum, cat) => sum + Math.round((cat.weight || 0) * 100), 0);
  const isPerfectWeight = totalWeightPercent === 100;

  return (
    <>
      <Modal
        opened={true}
        onClose={onClose}
        title={
          <Group gap="md">
            <ListChecks size={20} color="var(--mantine-color-copper-6)" />
            <Text fw={700} size="lg">Cấu hình Danh mục Đầu điểm</Text>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          {/* Header Status Badge */}
          <Alert
            icon={<WarningCircle size={18} />}
            color={isPerfectWeight ? 'teal' : 'orange'}
            variant="light"
            p="md"
          >
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>
                {isPerfectWeight
                  ? 'Tổng trọng số điểm vừa tròn 100%. Quy tắc tính điểm đang ở trạng thái chuẩn.'
                  : `Tổng trọng số hiện tại là ${totalWeightPercent}%. Khuyến nghị điều chỉnh về 100% để tính điểm chuẩn xác.`}
              </Text>
              <Badge color={isPerfectWeight ? 'teal' : 'orange'} size="md">
                Tổng: {totalWeightPercent}%
              </Badge>
            </Group>
          </Alert>

          {/* Table list */}
          <Paper withBorder radius="sm">
            <ScrollArea mah={280}>
              <Table highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tên danh mục</Table.Th>
                    <Table.Th style={{ width: 110 }} ta="center">Trọng số (%)</Table.Th>
                    <Table.Th style={{ width: 100 }} ta="center">Số bài tập</Table.Th>
                    <Table.Th style={{ width: 90 }} ta="right">Thao tác</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {categories.map((cat) => (
                    <Table.Tr key={cat.id} bg={editingId === cat.id ? 'var(--mantine-color-copper-0)' : undefined}>
                      <Table.Td>
                        <Text size="md" fw={600}>{cat.name}</Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Badge variant="light" color="copper" size="sm">
                          {Math.round((cat.weight || 0) * 100)}%
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text size="xs" c="dimmed" fw={500}>
                          {cat._count?.assignments || 0} bài
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="Chỉnh sửa" withArrow>
                            <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => handleStartEdit(cat)}>
                              <Pencil size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Xóa danh mục" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="md"
                              disabled={categories.length <= 1}
                              onClick={() => handleOpenDeleteConfirm(cat)}
                            >
                              <Trash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>

          <Divider label={editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'} labelPosition="left" />

          {/* Form Add/Edit */}
          <Paper p="md" withBorder radius="sm">
            <Stack gap="xs">
              <Group grow align="flex-start">
                <TextInput
                  label="Tên danh mục"
                  placeholder="Ví dụ: Kiểm tra 15p, Giữa kỳ..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="md"
                  required
                />
                <NumberInput
                  label="Trọng số (%)"
                  placeholder="Ví dụ: 10, 20, 50..."
                  value={weight}
                  onChange={setWeight}
                  min={0}
                  max={100}
                  suffix="%"
                  size="md"
                  required
                />
              </Group>

              <Group justify="flex-end" gap="xs">
                {editingId && (
                  <Button variant="default" size="xs" onClick={resetForm} leftSection={<X size={14} />}>
                    Hủy sửa
                  </Button>
                )}
                <Button
                  color="copper"
                  size="xs"
                  loading={submitting}
                  onClick={handleSave}
                  leftSection={editingId ? <Check size={14} /> : <Plus size={14} />}
                >
                  {editingId ? 'Cập nhật' : 'Thêm danh mục'}
                </Button>
              </Group>
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>Đóng</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        opened={deleteConfirmOpened}
        onClose={() => {
          if (!deleting) {
            setDeleteConfirmOpened(false);
            setCategoryToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa danh mục đầu điểm"
        message={
          categoryToDelete
            ? `Bạn có chắc muốn xóa danh mục "${categoryToDelete.name}"? Tất cả ${categoryToDelete._count?.assignments || 0} bài tập thuộc danh mục này sẽ tự động chuyển về danh mục "Bài tập chung".`
            : ''
        }
        confirmLabel="Xóa danh mục"
        cancelLabel="Hủy"
        color="red"
        loading={deleting}
      />
    </>
  );
}

export default GradeCategoriesModal;
