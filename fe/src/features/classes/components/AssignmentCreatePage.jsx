import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Text, NumberInput, Tooltip, ActionIcon,
  FileInput, Stack, Divider, Group, Loader, Center
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { ArrowLeft, FloppyDisk, FilePdf, FileDoc, FileZip, X, CodeSimple, UploadSimple } from '@phosphor-icons/react';
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
import classes from './AssignmentCreatePage.module.css';

const lowlight = createLowlight(common);

const content = '<p></p>';

export function AssignmentCreatePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { createAssignment, submitting } = useAssignments(classId);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [maxPoints, setMaxPoints] = useState(10);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [wordFile, setWordFile] = useState(null);
  const [isSourceCodeModeActive, onSourceCodeTextSwitch] = useState(false);

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

  const handleWordImport = useCallback(async (file) => {
    if (!file) return;
    setWordFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      editor?.commands.setContent(result.value);
      notifications.show({
        title: 'Đã nhập nội dung',
        message: `"${file.name}" đã được chuyển đổi thành công.`,
        color: 'teal'
      });
    } catch {
      notifications.show({ title: 'Lỗi', message: 'Không thể đọc file Word.', color: 'red' });
    }
  }, [editor]);

  const handleSave = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tiêu đề bài tập.', color: 'orange' });
      return;
    }
    if (!dueDate) {
      notifications.show({ title: 'Thiếu thông tin', message: 'Vui lòng chọn hạn nộp bài.', color: 'orange' });
      return;
    }

    const htmlContent = editor?.getHTML();
    const hasEditorContent = htmlContent && htmlContent !== '<p></p>';

    const ok = await createAssignment({
      title: title.trim(),
      gradeCategoryId: null,
      dueDate: dueDate.toISOString(),
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
    return <FilePdf size={16} color="var(--mantine-color-gray-6)" />;
  };

  if (!editor) {
    return <Center h="100vh"><Loader color="copper" /></Center>;
  }

  const SourceCodeIcon = () => <CodeSimple size={16} weight="bold" />;

  return (
    <div className={classes.pageWrapper}>
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

        <div className={classes.topBarMeta}>
          <DateTimePicker
            placeholder="Hạn nộp bài"
            value={dueDate}
            onChange={setDueDate}
            size="sm"
            clearable
            minDate={new Date()}
            valueFormat="DD/MM/YYYY HH:mm"
            style={{ width: 200 }}
          />
          <NumberInput
            placeholder="Điểm"
            value={maxPoints}
            onChange={setMaxPoints}
            min={0}
            size="sm"
            style={{ width: 100 }}
            prefix="Điểm: "
          />
          <Button
            color="copper"
            leftSection={<FloppyDisk size={16} weight="bold" />}
            loading={submitting}
            onClick={handleSave}
          >
            Lưu bài tập
          </Button>
        </div>
      </div>

      <div className={classes.mainContent}>
        <div className={classes.documentBody}>
          <RichTextEditor editor={editor} onSourceCodeTextSwitch={onSourceCodeTextSwitch} className={classes.editorRoot}>
          {/* Sticky Main Toolbar */}
          <RichTextEditor.Toolbar sticky stickyOffset={0}>
            {/* Undo / Redo */}
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

          {/* Bubble Menu when selecting text */}
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

          {/* Floating Menu on empty new line */}
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

      {/* ── RIGHT SIDEBAR ────────────────────────────────────── */}
      <aside className={classes.sidebar}>
        <Text fw={600} size="sm">Đính kèm tài liệu</Text>

        {/* Import Word */}
        <div>
          <Text size="xs" c="dimmed" mb={6}>Nhập từ file Word (.docx)</Text>
          <Dropzone
            onDrop={(files) => handleWordImport(files[0])}
            accept={['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']}
            maxFiles={1}
            multiple={false}
            p="xs"
            styles={{ inner: { pointerEvents: 'all' } }}
          >
            <Group justify="center" gap="xs" style={{ minHeight: 50, pointerEvents: 'none' }}>
              <FileDoc size={20} color="var(--mantine-color-blue-6)" />
              <Text size="xs" c="dimmed" inline>Kéo thả file Word vào đây</Text>
            </Group>
          </Dropzone>
          {wordFile && (
            <Text size="xs" c="teal" mt={4}>✓ Đã nhập: {wordFile.name}</Text>
          )}
        </div>

        <Divider />

        {/* Upload extra files */}
        <div>
          <Text size="xs" c="dimmed" mb={6}>File đính kèm bổ sung</Text>
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
              <Text size="xs" c="dimmed" inline>Kéo thả file PDF, Ảnh, ZIP...</Text>
            </Group>
          </Dropzone>
        </div>

        {attachedFiles.length > 0 && (
          <Stack gap={6}>
            {attachedFiles.map((file, idx) => (
              <Group key={idx} gap={6} justify="space-between" wrap="nowrap"
                style={{ border: '1px solid #e9ecef', padding: '6px 8px', borderRadius: 6, background: '#f8f9fa' }}
              >
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                  {getFileIcon(file)}
                  <Text size="xs" lineClamp={1} style={{ flex: 1 }} title={file.name}>{file.name}</Text>
                </Group>
                <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeFile(idx)}>
                  <X size={12} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        )}

        <Divider />

        <Text size="xs" c="dimmed" lh={1.5}>
          <b>Các định dạng cho phép:</b>
          <br/>• File nội dung: Word (.docx)
          <br/>• File đính kèm: PDF, PNG, JPG, JPEG, ZIP, RAR.
        </Text>
      </aside>
      </div>
    </div>
  );
}

export default AssignmentCreatePage;
