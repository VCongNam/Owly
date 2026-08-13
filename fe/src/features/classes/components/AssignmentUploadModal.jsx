import { useEffect, useState } from 'react';
import {
  Modal, Button, TextInput, NumberInput, Group, Stack, Text,
  ActionIcon, Divider, Select
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Dropzone } from '@mantine/dropzone';
import { UploadSimple, FilePdf, FileDoc, FileZip, X, FloppyDisk, Plus } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { useAssignments } from '../hooks/useAssignments';
import { gradeCategoryService } from '../services/gradeCategories';

export function AssignmentUploadModal({ classId, opened, onClose }) {
  const { createAssignment, submitting } = useAssignments(classId);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [maxPoints, setMaxPoints] = useState(10);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [gradeCategories, setGradeCategories] = useState([]);
  const [gradeCategoryId, setGradeCategoryId] = useState(null);
  const [catModalOpened, setCatModalOpened] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryWeight, setNewCategoryWeight] = useState(10);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!classId || !opened) return;
    gradeCategoryService.getGradeCategories(classId)
      .then(res => {
        const cats = Array.isArray(res) ? res : (res?.data || []);
        setGradeCategories(cats);
      })
      .catch(err => console.error('Lỗi lấy danh mục đầu điểm:', err));
  }, [classId, opened]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const weightVal = Number(newCategoryWeight) ? Number(newCategoryWeight) / 100 : 0;
      const res = await gradeCategoryService.createGradeCategory(classId, {
        name: newCategoryName.trim(),
        weight: weightVal
      });
      const newCat = res?.id ? res : res?.data;
      if (newCat && newCat.id) {
        setGradeCategories(prev => [...prev, newCat]);
        setGradeCategoryId(newCat.id);
        setNewCategoryName('');
        setNewCategoryWeight(10);
        setCatModalOpened(false);
        notifications.show({ title: 'Thành công', message: 'Đã tạo danh mục điểm mới.', color: 'teal' });
      } else {
        throw new Error('Dữ liệu phản hồi không đúng cấu trúc.');
      }
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Lỗi', message: 'Không thể tạo danh mục điểm.', color: 'red' });
    } finally {
      setCreatingCategory(false);
    }
  };

  const getFileIcon = (file) => {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={16} color="var(--mantine-color-red-6)" />;
    if (['doc', 'docx'].includes(ext)) return <FileDoc size={16} color="var(--mantine-color-blue-6)" />;
    if (['zip', 'rar'].includes(ext)) return <FileZip size={16} color="var(--mantine-color-grape-6)" />;
    return <FilePdf size={16} color="var(--mantine-color-gray-6)" />;
  };

  const removeFile = (idx) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tiêu đề bài tập.', color: 'orange' });
      return;
    }
    
    const dateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (!dueDate || isNaN(dateObj.getTime())) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng chọn hạn nộp bài hợp lệ.', color: 'orange' });
      return;
    }
    if (attachedFiles.length === 0) {
      notifications.show({ title: 'Thiếu file', message: 'Vui lòng đính kèm ít nhất 1 file bài tập.', color: 'orange' });
      return;
    }

    try {
      const ok = await createAssignment({
        title: title.trim(),
        gradeCategoryId: gradeCategoryId || null,
        dueDate: dateObj.toISOString(),
        maxPoints,
        mode: 'upload',
        htmlContent: null,
        files: attachedFiles
      });

      if (ok) {
        setTitle('');
        setDueDate(null);
        setMaxPoints(10);
        setAttachedFiles([]);
        setGradeCategoryId(null);
        onClose();
      }
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Lỗi', message: err.message || 'Đã có lỗi xảy ra', color: 'red' });
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="Tải bài tập lên" size="lg" centered>
        <Stack gap="md">
          <TextInput
            label="Tiêu đề bài tập"
            placeholder="Nhập tiêu đề..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-autofocus
          />

          <Group grow>
            <DateTimePicker
              label="Hạn nộp bài"
              placeholder="Chọn ngày và giờ"
              value={dueDate}
              onChange={setDueDate}
              minDate={new Date()}
              valueFormat="DD/MM/YYYY HH:mm"
              clearable
              required
            />
            <NumberInput
              label="Điểm tối đa"
              placeholder="Ví dụ: 10, 100..."
              value={maxPoints}
              onChange={setMaxPoints}
              min={0}
              required
            />
          </Group>

          <div>
            <Text size="sm" fw={500} mb={4}>Danh mục đầu điểm</Text>
            <Group gap={4} wrap="nowrap">
              <Select
                placeholder="Chọn danh mục..."
                data={gradeCategories.map(cat => ({ value: cat.id, label: cat.name }))}
                value={gradeCategoryId}
                onChange={setGradeCategoryId}
                clearable
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="light"
                color="copper"
                size="lg"
                onClick={() => setCatModalOpened(true)}
                title="Tạo danh mục mới"
                style={{ height: 36, width: 36 }}
              >
                <Plus size={18} weight="bold" />
              </ActionIcon>
            </Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb={4}>Tệp đính kèm <Text span c="red">*</Text></Text>
            <Dropzone
              onDrop={(newFiles) => {
                setAttachedFiles(prev => {
                  const names = new Set(prev.map(f => f.name));
                  return [...prev, ...newFiles.filter(f => !names.has(f.name))];
                });
              }}
              accept={[
                'application/pdf', 'image/png', 'image/jpeg', 
                'application/zip', 'application/x-rar-compressed', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                'application/msword'
              ]}
              p="md"
            >
              <Group justify="center" gap="md" style={{ minHeight: 80, pointerEvents: 'none' }}>
                <UploadSimple size={28} color="var(--mantine-color-copper-6)" />
                <div>
                  <Text size="sm" fw={500}>Kéo thả file vào đây hoặc nhấp để chọn</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    Hỗ trợ: Word, PDF, Ảnh, ZIP, RAR
                  </Text>
                </div>
              </Group>
            </Dropzone>
          </div>

          {attachedFiles.length > 0 && (
            <Stack gap={8}>
              {attachedFiles.map((file, idx) => (
                <Group key={idx} gap={8} justify="space-between" wrap="nowrap"
                  style={{ border: '1px solid #e9ecef', padding: '8px 12px', borderRadius: 6, background: '#f8f9fa' }}
                >
                  <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                    {getFileIcon(file)}
                    <Text size="sm" lineClamp={1} style={{ flex: 1 }} title={file.name}>{file.name}</Text>
                    <Text size="xs" c="dimmed">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                  </Group>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={() => removeFile(idx)}>
                    <X size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}

          <Divider mt="sm" />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Hủy</Button>
            <Button
              color="copper"
              leftSection={<FloppyDisk size={16} weight="bold" />}
              loading={submitting}
              onClick={handleSave}
            >
              Tải lên bài tập
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={catModalOpened}
        onClose={() => setCatModalOpened(false)}
        title="Tạo danh mục đầu điểm mới"
        centered
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Tên danh mục"
            placeholder="Ví dụ: Kiểm tra 15p, Giữa kỳ..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            data-autofocus
          />
          <NumberInput
            label="Trọng số điểm (%)"
            placeholder="Ví dụ: 10, 20, 50..."
            value={newCategoryWeight}
            onChange={setNewCategoryWeight}
            min={0}
            max={100}
            suffix="%"
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" onClick={() => setCatModalOpened(false)}>
              Hủy
            </Button>
            <Button color="copper" loading={creatingCategory} onClick={handleCreateCategory}>
              Tạo danh mục
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}