import { useState } from 'react';
import { Modal, Button, TextInput, NumberInput, Group, Tabs, FileInput } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import mammoth from 'mammoth';

export default function AssignmentFormModal({ opened, onClose, classId, categoryId, onSubmit, onUploadEditor, onUploadFiles }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState(10);
  const [activeTab, setActiveTab] = useState('editor');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: '<p>Nhập nội dung bài tập ở đây...</p>',
  });

  const handleWordUpload = async (file) => {
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      editor.commands.setContent(result.value);
    } catch (err) {
      console.error("Mammoth error", err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let attachmentUrls = [];
      
      if (activeTab === 'editor') {
        // Upload editor content as a file to R2
        const html = editor.getHTML();
        const editorUrl = await onUploadEditor(html);
        attachmentUrls.push(editorUrl);
      } else {
        // Upload physical files to R2
        if (files.length > 0) {
          attachmentUrls = await onUploadFiles(files);
        }
      }

      await onSubmit({
        classId,
        gradeCategoryId: categoryId,
        title,
        dueDate: new Date(dueDate).toISOString(),
        maxPoints,
        attachmentUrls
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Tạo Bài Tập Mới" size="xl">
      <TextInput label="Tiêu đề bài tập" required value={title} onChange={(e) => setTitle(e.target.value)} mb="sm" />
      <Group grow mb="md">
        <TextInput type="datetime-local" label="Hạn nộp" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <NumberInput label="Điểm tối đa" required min={0} value={maxPoints} onChange={setMaxPoints} />
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="editor">Soạn thảo trực tiếp</Tabs.Tab>
          <Tabs.Tab value="upload">Tải file lên</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="editor" pt="sm">
          <FileInput 
            label="Nhập từ file Word (.docx) (Tùy chọn)" 
            accept=".docx" 
            placeholder="Kéo thả file Word vào đây" 
            onChange={handleWordUpload} 
            mb="sm"
          />
          <RichTextEditor editor={editor} style={{ minHeight: 300 }}>
            <RichTextEditor.Toolbar sticky stickyOffset={60}>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Strikethrough />
                <RichTextEditor.ClearFormatting />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
                <RichTextEditor.H4 />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Blockquote />
                <RichTextEditor.Hr />
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>
            <RichTextEditor.Content />
          </RichTextEditor>
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="sm">
          <FileInput 
            label="Chọn file (PDF, Word, Ảnh)" 
            multiple 
            placeholder="Tải lên bài tập của bạn" 
            value={files} 
            onChange={setFiles} 
          />
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Hủy</Button>
        <Button onClick={handleSubmit} loading={loading}>Lưu bài tập</Button>
      </Group>
    </Modal>
  );
}
