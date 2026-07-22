import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Text, NumberInput, Tooltip, ActionIcon, Select, Modal, TextInput,
  Stack, Divider, Group, Loader, Center, Paper, Badge
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { DateTimePicker } from '@mantine/dates';
import {
  ArrowLeft, FloppyDisk, FilePdf, FileDoc, FileZip, FileText, FileCode, X,
  CodeSimple, UploadSimple, Plus, Desktop
} from '@phosphor-icons/react';
import { Dropzone } from '@mantine/dropzone';
import { Link, RichTextEditor, getTaskListExtension } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TipTapTaskList from '@tiptap/extension-task-list';
import { common, createLowlight } from 'lowlight';
import mammoth from 'mammoth';
import { notifications } from '@mantine/notifications';
import { useAssignments } from '../hooks/useAssignments';
import { gradeCategoryService } from '../services/gradeCategories';
import classes from './AssignmentCreatePage.module.css';

const lowlight = createLowlight(common);
const content = '<p></p>';

export function AssignmentCreatePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { createAssignment, submitting } = useAssignments(classId);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [maxPoints, setMaxPoints] = useState(10);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [importedContentFile, setImportedContentFile] = useState(null);
  const [isSourceCodeModeActive, onSourceCodeTextSwitch] = useState(false);

  const [gradeCategories, setGradeCategories] = useState([]);
  const [gradeCategoryId, setGradeCategoryId] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryWeight, setNewCategoryWeight] = useState(10);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!classId) return;
    gradeCategoryService.getGradeCategories(classId)
      .then(res => {
        const cats = Array.isArray(res) ? res : (res?.data || []);
        setGradeCategories(cats);
      })
      .catch(err => console.error('Lỗi lấy danh mục đầu điểm:', err));
  }, [classId]);

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
        setModalOpened(false);
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false }),
      Link,
      Superscript,
      Subscript,
      Highlight,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: 'Bắt đầu soạn nội dung bài tập tại đây...' }),
      getTaskListExtension(TipTapTaskList),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'task-list-item' } }),
    ],
    content,
    shouldRerenderOnTransaction: true,
  });

  const handleContentImport = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name?.split('.').pop()?.toLowerCase();
    try {
      if (['docx', 'doc'].includes(ext)) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        editor?.commands.setContent(result.value);
      } else if (['txt', 'md', 'html', 'htm'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          let text = e.target?.result || '';
          if (ext === 'txt') {
            text = text.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
          } else if (ext === 'md') {
            text = text
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/^\- (.*$)/gim, '<li>$1</li>')
              .replace(/\n$/gim, '<br />');
          }
          editor?.commands.setContent(text);
        };
        reader.readAsText(file);
      } else {
        notifications.show({ title: 'Định dạng không hỗ trợ', message: 'Chỉ chấp nhận file Word (.docx), TXT, Markdown (.md), HTML.', color: 'orange' });
        return;
      }
      setImportedContentFile(file);
      notifications.show({
        title: 'Đã nhập nội dung',
        message: `"${file.name}" đã được nạp thành công vào trình soạn thảo.`,
        color: 'teal'
      });
    } catch {
      notifications.show({ title: 'Lỗi', message: 'Không thể đọc nội dung file.', color: 'red' });
    }
  }, [editor]);

  const handleSave = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tiêu đề bài tập.', color: 'orange' });
      return;
    }
    const dateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (isNaN(dateObj.getTime())) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng chọn hạn nộp bài hợp lệ.', color: 'orange' });
      return;
    }

    const htmlContent = editor?.getHTML();
    const hasEditorContent = htmlContent && htmlContent !== '<p></p>';

    const ok = await createAssignment({
      title: title.trim(),
      gradeCategoryId: gradeCategoryId || null,
      dueDate: dateObj.toISOString(),
      maxPoints,
      mode: hasEditorContent ? 'editor' : (attachedFiles.length > 0 ? 'upload' : 'editor'),
      htmlContent: hasEditorContent ? htmlContent : null,
      files: attachedFiles
    });

    if (ok) navigate(`/classes/${classId}/assignments`);
  };

  const removeFile = (idx) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  const getFileIcon = (file) => {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={16} color="var(--mantine-color-red-6)" />;
    if (['doc', 'docx'].includes(ext)) return <FileDoc size={16} color="var(--mantine-color-blue-6)" />;
    if (['zip', 'rar'].includes(ext)) return <FileZip size={16} color="var(--mantine-color-grape-6)" />;
    if (['txt', 'md'].includes(ext)) return <FileText size={16} color="var(--mantine-color-teal-6)" />;
    if (['html', 'htm'].includes(ext)) return <FileCode size={16} color="var(--mantine-color-orange-6)" />;
    return <FilePdf size={16} color="var(--mantine-color-gray-6)" />;
  };

  // Screen size boundary fallback (< 1024px)
  if (isDesktop === false) {
    return (
      <Center h="100vh" p="md" bg="var(--bg-color)">
        <Paper p="xl" radius="md" withBorder style={{ maxWidth: 460, textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Desktop size={48} color="var(--accent-color)" />
            <Text fw={700} size="lg">Yêu cầu màn hình máy tính</Text>
            <Text size="sm" c="dimmed">
              Trình soạn thảo bài tập nâng cao yêu cầu màn hình máy tính (từ 1024px trở lên) để đảm bảo không gian soạn thảo văn bản và thao tác cài đặt tốt nhất.
            </Text>
            <Button color="copper" variant="light" onClick={() => navigate(`/classes/${classId}/assignments`)}>
              Quay lại danh sách bài tập
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!editor) {
    return <Center h="100vh"><Loader color="copper" /></Center>;
  }

  const SourceCodeIcon = () => <CodeSimple size={16} weight="bold" />;

  return (
    <div className={classes.pageWrapper}>
      {/* Modal Tạo Danh mục điểm */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
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
            <Button variant="subtle" color="gray" onClick={() => setModalOpened(false)}>
              Hủy
            </Button>
            <Button color="copper" loading={creatingCategory} onClick={handleCreateCategory}>
              Tạo danh mục
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── TOP HEADER (TITLE ONLY) ───────────────────────────── */}
      <div className={classes.topBar}>
        <Tooltip label="Quay lại danh sách bài tập" withArrow position="bottom">
          <ActionIcon variant="subtle" color="gray" size="lg"
            onClick={() => navigate(`/classes/${classId}/assignments`)}
          >
            <ArrowLeft size={20} weight="bold" />
          </ActionIcon>
        </Tooltip>

        <input
          className={classes.topBarTitle}
          placeholder="Tiêu đề bài tập..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        
        <Badge color="blue" variant="light" size="sm" radius="sm">
          Tính năng thử nghiệm
        </Badge>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className={classes.mainContent}>
        {/* Document Body (Canvas) */}
        <div className={classes.documentBody}>
          <RichTextEditor editor={editor} onSourceCodeTextSwitch={onSourceCodeTextSwitch} className={classes.editorRoot}>
            <RichTextEditor.Toolbar sticky stickyOffset={0}>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Undo />
                <RichTextEditor.Redo />
              </RichTextEditor.ControlsGroup>

              {!isSourceCodeModeActive && (
                <>
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.Superscript />
                    <RichTextEditor.Subscript />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.ColorPicker
                      colors={['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
                    />
                    <RichTextEditor.Highlight />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.AlignLeft />
                    <RichTextEditor.AlignCenter />
                    <RichTextEditor.AlignRight />
                    <RichTextEditor.AlignJustify />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                    <RichTextEditor.TaskList />
                    <RichTextEditor.TaskListLift />
                    <RichTextEditor.TaskListSink />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Blockquote />
                    <RichTextEditor.CodeBlock />
                    <RichTextEditor.ClearFormatting />
                  </RichTextEditor.ControlsGroup>
                </>
              )}

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.SourceCode icon={SourceCodeIcon} />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            {editor && (
              <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Link />
                  <RichTextEditor.Highlight />
                </RichTextEditor.ControlsGroup>
              </BubbleMenu>
            )}

            {editor && (
              <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.BulletList />
                  <RichTextEditor.TaskList />
                </RichTextEditor.ControlsGroup>
              </FloatingMenu>
            )}

            <RichTextEditor.Content />
          </RichTextEditor>
        </div>

        {/* ── RIGHT SIDEBAR (SETTINGS & ATTACHMENTS) ────────────── */}
        <aside className={classes.sidebar}>
          {/* Primary Action Button */}
          <Button
            color="copper"
            size="md"
            fullWidth
            leftSection={<FloppyDisk size={18} weight="bold" />}
            loading={submitting}
            onClick={handleSave}
          >
            Lưu bài tập
          </Button>

          <Divider />

          {/* Section: Cấu hình bài tập */}
          <Stack gap="xs">
            <Text className={classes.sectionTitle}>Cấu hình bài tập</Text>

            <div>
              <Text size="xs" c="dimmed" mb={4}>Hạn nộp bài</Text>
              <DateTimePicker
                placeholder="Chọn thời gian..."
                value={dueDate}
                onChange={setDueDate}
                size="sm"
                clearable
                minDate={new Date()}
                valueFormat="DD/MM/YYYY HH:mm"
              />
            </div>

            <div>
              <Text size="xs" c="dimmed" mb={4}>Điểm tối đa</Text>
              <NumberInput
                placeholder="Ví dụ: 10"
                value={maxPoints}
                onChange={setMaxPoints}
                min={0}
                size="sm"
              />
            </div>

            <div>
              <Text size="xs" c="dimmed" mb={4}>Danh mục đầu điểm</Text>
              <Tooltip
                label="Có thể để trống để tự xếp vào 'Bài tập chung' hoặc ấn nút + để tạo mới"
                withArrow
                multiline
                w={220}
              >
                <Group gap={4} wrap="nowrap">
                  <Select
                    placeholder="Chọn danh mục..."
                    data={gradeCategories.map(cat => ({ value: cat.id, label: cat.name }))}
                    value={gradeCategoryId}
                    onChange={setGradeCategoryId}
                    clearable
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    variant="light"
                    color="copper"
                    size="md"
                    onClick={() => setModalOpened(true)}
                    title="Tạo danh mục mới"
                  >
                    <Plus size={16} weight="bold" />
                  </ActionIcon>
                </Group>
              </Tooltip>
            </div>
          </Stack>

          <Divider />

          {/* Section: Nhập nội dung từ File */}
          <Stack gap="xs">
            <Text className={classes.sectionTitle}>Nhập đề bài từ tệp</Text>
            <Text size="xs" c="dimmed">Hỗ trợ Word (.docx), Text (.txt), Markdown (.md), HTML</Text>
            <Dropzone
              onDrop={(files) => handleContentImport(files[0])}
              accept={[
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain',
                'text/markdown',
                'text/html'
              ]}
              maxFiles={1}
              multiple={false}
              p="xs"
              styles={{ inner: { pointerEvents: 'all' } }}
            >
              <Group justify="center" gap="xs" style={{ minHeight: 50, pointerEvents: 'none' }}>
                <FileDoc size={20} color="var(--mantine-color-blue-6)" />
                <Text size="xs" c="dimmed" inline>Kéo thả tệp nội dung vào đây</Text>
              </Group>
            </Dropzone>
            {importedContentFile && (
              <Text size="xs" c="teal">✓ Đã nạp: {importedContentFile.name}</Text>
            )}
          </Stack>

          <Divider />

          {/* Section: File đính kèm bổ sung */}
          <Stack gap="xs">
            <Text className={classes.sectionTitle}> Tệp đính kèm bổ sung</Text>
            <Dropzone
              onDrop={(newFiles) => {
                setAttachedFiles(prev => {
                  const names = new Set(prev.map(f => f.name));
                  return [...prev, ...newFiles.filter(f => !names.has(f.name))];
                });
              }}
              accept={['application/pdf', 'image/png', 'image/jpeg', 'application/zip', 'application/x-rar-compressed']}
              p="xs"
              styles={{ inner: { pointerEvents: 'all' } }}
            >
              <Group justify="center" gap="xs" style={{ minHeight: 50, pointerEvents: 'none' }}>
                <UploadSimple size={20} color="var(--mantine-color-copper-6)" />
                <Text size="xs" c="dimmed" inline>Kéo thả PDF, Ảnh, ZIP vào đây...</Text>
              </Group>
            </Dropzone>

            {attachedFiles.length > 0 && (
              <Stack gap={6}>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className={classes.attachedFileItem}>
                    <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                      {getFileIcon(file)}
                      <Text size="xs" lineClamp={1} style={{ flex: 1 }} title={file.name}>{file.name}</Text>
                    </Group>
                    <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeFile(idx)}>
                      <X size={12} />
                    </ActionIcon>
                  </div>
                ))}
              </Stack>
            )}
          </Stack>
        </aside>
      </div>
    </div>
  );
}

export default AssignmentCreatePage;
