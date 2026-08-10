import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Stack, Group, Title, Text, Button, Table, ActionIcon,
  Tooltip, Center, ThemeIcon, Loader, Modal, TextInput,
  Textarea, FileInput, ScrollArea, Pagination, Card
} from '@mantine/core';
import {
  Plus, Trash, Download, FilePdf, FileDoc, FileZip, FileImage, File, FolderOpen
} from '@phosphor-icons/react';
import { useAuth } from '../../auth';
import { useMaterials } from '../hooks/useMaterials';
import { ConfirmModal } from '../../../shared';
import classes from './ClassMaterialsTab.module.css';

// Helper để định dạng kích thước file
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '—';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper hiển thị icon tương ứng với định dạng file
const getFileIcon = (mimeType, fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const color = 'copper';
  
  if (mimeType?.includes('pdf') || ext === 'pdf') {
    return <FilePdf size={24} weight="duotone" color="var(--mantine-color-red-6)" />;
  }
  if (mimeType?.includes('word') || ['doc', 'docx'].includes(ext)) {
    return <FileDoc size={24} weight="duotone" color="var(--mantine-color-blue-6)" />;
  }
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || ['zip', 'rar', '7z'].includes(ext)) {
    return <FileZip size={24} weight="duotone" color="var(--mantine-color-grape-6)" />;
  }
  if (mimeType?.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    return <FileImage size={24} weight="duotone" color="var(--mantine-color-teal-6)" />;
  }
  return <File size={24} weight="duotone" color="var(--mantine-color-gray-6)" />;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export function ClassMaterialsTab() {
  const { classId } = useParams();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const {
    materials,
    loading,
    uploading,
    pagination,
    fetchMaterials,
    uploadMaterial,
    deleteMaterial
  } = useMaterials(classId);

  // States của Modal Upload
  const [modalOpened, setModalOpened] = useState(false);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [fileError, setFileError] = useState('');

  // States của Modal Xác nhận Xóa
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenModal = () => {
    setFiles([]);
    setTitle('');
    setDescription('');
    setTitleError('');
    setFileError('');
    setModalOpened(true);
  };

  const handleOpenDeleteConfirm = (item) => {
    setMaterialToDelete(item);
    setDeleteConfirmOpened(true);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    setDeleting(true);
    const success = await deleteMaterial(materialToDelete.id);
    if (success) {
      setDeleteConfirmOpened(false);
      setMaterialToDelete(null);
    }
    setDeleting(false);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;

    // Chỉ yêu cầu nhập tiêu đề thủ công nếu chọn đúng 1 file và để trống
    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);

    if (filesArray.length === 1 && !title.trim()) {
      // Nếu có 1 file và không điền title, mặc định lấy tên file làm title (không bắt lỗi nữa)
      setTitleError('');
    } else {
      setTitleError('');
    }

    if (filesArray.length === 0) {
      setFileError('Vui lòng chọn ít nhất một file tài liệu');
      hasError = true;
    } else {
      setFileError('');
    }

    if (hasError) return;

    const success = await uploadMaterial({ 
      files: filesArray, 
      title: title.trim() || undefined, 
      description 
    });
    
    if (success) {
      setModalOpened(false);
    }
  };

  const rows = materials.map((item) => (
    <Table.Tr key={item.id} className={classes.tableRow}>
      <Table.Td style={{ width: 60 }}>
        <Center>
          {getFileIcon(item.fileType, item.fileName)}
        </Center>
      </Table.Td>
      <Table.Td style={{ minWidth: 200 }}>
        <Text size="sm" fw={600} c="copper" style={{ cursor: 'pointer' }} onClick={() => window.open(item.fileUrl, '_blank')}>
          {item.title}
        </Text>
        <Text size="xs" c="dimmed">{item.fileName}</Text>
      </Table.Td>
      <Table.Td style={{ minWidth: 200 }}>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {item.description || 'Không có mô tả'}
        </Text>
      </Table.Td>
      <Table.Td style={{ width: 120 }}>
        <Text size="xs">{formatBytes(item.fileSize)}</Text>
      </Table.Td>
      <Table.Td style={{ width: 160 }}>
        <Text size="xs" c="dimmed">{formatDate(item.uploadedAt)}</Text>
      </Table.Td>
      <Table.Td style={{ width: 100 }}>
        <Group gap={8} justify="flex-end">
          <Tooltip label="Tải xuống tài liệu" withArrow>
            <ActionIcon
              variant="subtle"
              color="copper"
              size="sm"
              onClick={() => window.open(item.fileUrl, '_blank')}
            >
              <Download size={16} />
            </ActionIcon>
          </Tooltip>
          {isTeacher && (
            <Tooltip label="Xóa tài liệu" withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => handleOpenDeleteConfirm(item)}
              >
                <Trash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg" className={classes.root}>
      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <div>
          <Title order={3} style={{ fontSize: '20px', fontWeight: 700 }}>Học liệu lớp học</Title>
          <Text size="sm" c="dimmed">
            {pagination.totalItems > 0 ? `Lớp học có ${pagination.totalItems} tài liệu` : 'Lớp học chưa có tài liệu nào'}
          </Text>
        </div>
        {isTeacher && (
          <Button
            leftSection={<Plus size={16} weight="bold" />}
            color="copper"
            onClick={handleOpenModal}
          >
            Thêm tài liệu
          </Button>
        )}
      </Group>

      {/* Content */}
      {loading ? (
        <Center py={60}>
          <Loader color="copper" size="md" />
        </Center>
      ) : materials.length > 0 ? (
        <Stack gap="sm">
          <div className={classes.tableWrapper}>
            <Table highlightOnHover verticalSpacing="md" className={classes.table}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                  <Table.Th>Tài liệu</Table.Th>
                  <Table.Th>Mô tả</Table.Th>
                  <Table.Th style={{ width: 120 }}>Dung lượng</Table.Th>
                  <Table.Th style={{ width: 160 }}>Ngày đăng</Table.Th>
                  <Table.Th style={{ width: 100 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </div>

          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <Group justify="center" mt="xs">
              <Pagination
                total={pagination.totalPages}
                value={pagination.currentPage}
                onChange={fetchMaterials}
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
              <FolderOpen size={32} weight="duotone" />
            </ThemeIcon>
            <Text c="dimmed" size="sm">Chưa có tài liệu học tập nào được tải lên.</Text>
            {isTeacher && (
              <Button
                leftSection={<Plus size={16} />}
                variant="light"
                color="copper"
                onClick={handleOpenModal}
              >
                Tải lên tài liệu đầu tiên
              </Button>
            )}
          </Stack>
        </Center>
      )}

      {/* Modal Upload */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Tải lên tài liệu mới"
        size="md"
        centered
      >
        <form onSubmit={handleUploadSubmit}>
          <Stack gap="sm">
            <FileInput
              label="Chọn tài liệu"
              placeholder="Bấm để chọn một hoặc nhiều file..."
              required
              multiple
              value={files}
              onChange={setFiles}
              error={fileError}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar"
            />

            {files && files.length <= 1 && (
              <TextInput
                label="Tiêu đề tài liệu"
                placeholder={files.length === 1 ? files[0].name.replace(/\.[^/.]+$/, "") : "Nhập tiêu đề hiển thị cho học sinh..."}
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                error={titleError}
                description="Nếu để trống, hệ thống sẽ tự động lấy tên file làm tiêu đề."
              />
            )}

            {files && files.length > 1 && (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                * Bạn đang chọn tải lên {files.length} file. Hệ thống sẽ tự động sử dụng tên từng file gốc làm tiêu đề học liệu tương ứng.
              </Text>
            )}

            <Textarea
              label="Mô tả tài liệu"
              placeholder="Nhập mô tả chi tiết hoặc hướng dẫn học tập (áp dụng cho toàn bộ file tải lên)..."
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              maxRows={4}
              minRows={2}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpened(false)} disabled={uploading}>
                Hủy
              </Button>
              <Button type="submit" color="copper" loading={uploading}>
                Tải lên
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Xác nhận Xóa */}
      <ConfirmModal
        opened={deleteConfirmOpened}
        onClose={() => {
          if (!deleting) {
            setDeleteConfirmOpened(false);
            setMaterialToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa tài liệu học tập"
        message={materialToDelete ? `Bạn có chắc chắn muốn xóa tài liệu "${materialToDelete.title}" không? Hành động này sẽ xóa file vĩnh viễn và không thể hoàn tác.` : ''}
        confirmLabel="Xóa tài liệu"
        cancelLabel="Hủy"
        color="red"
        loading={deleting}
      />
    </Stack>
  );
}

export default ClassMaterialsTab;
