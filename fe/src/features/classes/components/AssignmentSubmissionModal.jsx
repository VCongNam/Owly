import { useState, useEffect, useRef } from 'react';
import {
  Modal, Stack, Text, Button, FileInput, Group, Center, Loader,
  Alert, Divider, Badge, Card
} from '@mantine/core';
import { UploadSimple, FilePdf, CheckCircle, Paperclip, Download } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { assignmentService } from '../services/assignments';
import { uploadService } from '../../../services/uploadService';

export function AssignmentSubmissionModal({ onClose, assignment }) {
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isOverdue = assignment?.dueDate ? new Date(assignment.dueDate) < new Date() : false;

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const assignmentId = assignment?.id;

  const handleRefresh = async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      const res = await assignmentService.getMySubmission(assignmentId);
      if (isMountedRef.current) {
        setSubmission(res || null);
      }
    } catch (error) {
      console.error('Lỗi tải bài nộp:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!assignmentId) return;
    let active = true;

    const loadInitialSubmission = async () => {
      try {
        const result = await assignmentService.getMySubmission(assignmentId);
        if (active) {
          setSubmission(result || null);
        }
      } catch (error) {
        console.error('Lỗi tải bài nộp:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialSubmission();
    return () => {
      active = false;
    };
  }, [assignmentId]);

  const handleUploadAndSubmit = async () => {
    if (!file) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn tệp bài làm trước khi nộp',
        color: 'red'
      });
      return;
    }

    if (isOverdue) {
      notifications.show({
        title: 'Hết hạn',
        message: 'Bài tập này đã quá hạn, không thể nộp mới',
        color: 'red'
      });
      return;
    }

    try {
      setSubmitting(true);
      const uploadRes = await uploadService.uploadFiles([file], 'assignments');
      const fileUrl = uploadRes?.attachmentUrls?.[0];

      if (!fileUrl) {
        throw new Error('Không lấy được đường dẫn tệp sau khi tải lên');
      }

      await assignmentService.submitAssignment(assignmentId, { content: fileUrl });

      notifications.show({
        title: 'Thành công',
        message: 'Nộp bài tập về nhà thành công',
        color: 'green'
      });
      if (isMountedRef.current) {
        setFile(null);
      }
      await handleRefresh();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Lỗi',
        message: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi nộp bài',
        color: 'red'
      });
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const getStatusText = () => {
    if (!submission) {
      return isOverdue
        ? { label: 'Quá hạn nộp bài', color: 'gray' }
        : { label: 'Chưa nộp bài', color: 'red' };
    }
    if (submission.feedback) {
      return { label: `Đã chấm: ${submission.feedback.grade} điểm`, color: 'teal' };
    }
    return { label: 'Đã nộp bài (Chờ chấm điểm)', color: 'orange' };
  };

  const statusInfo = getStatusText();

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <div>
          <Text fw={700} size="md">Nộp bài làm: {assignment?.title}</Text>
          <Text size="xs" c={isOverdue ? 'red' : 'dimmed'}>
            Hạn nộp: {new Date(assignment?.dueDate).toLocaleString('vi-VN')}
          </Text>
        </div>
      }
      centered
      size="md"
    >
      {loading ? (
        <Center py="xl">
          <Loader color="copper" size="sm" />
        </Center>
      ) : (
        <Stack gap="md" pt="xs">
          <Group justify="space-between">
            <Text size="sm" fw={600}>Trạng thái nộp bài:</Text>
            <Badge variant="light" color={statusInfo.color} size="md">
              {statusInfo.label}
            </Badge>
          </Group>

          <Divider />

          {submission?.feedback && (
            <Alert color="teal" variant="light" title="Kết quả đánh giá" icon={<CheckCircle size={18} />}>
              <Stack gap="xs">
                <Text size="sm" fw={600} c="teal">
                  Điểm số: {submission.feedback.grade} / {assignment.maxPoints}
                </Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  Nhận xét: {submission.feedback.remarks}
                </Text>
                
                {submission.feedback.attachmentUrl && (
                  <Card withBorder p="xs" mt="xs" bg="var(--card-bg)" radius="md">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <Paperclip size={18} color="teal" />
                        <Text size="xs" fw={600} truncate c="teal">Tệp bài đã chữa từ giáo viên</Text>
                      </Group>
                      <Button
                        variant="subtle"
                        color="teal"
                        size="xs"
                        leftSection={<Download size={12} />}
                        component="a"
                        href={submission.feedback.attachmentUrl}
                        target="_blank"
                      >
                        Tải về
                      </Button>
                    </Group>
                  </Card>
                )}
              </Stack>
            </Alert>
          )}

          {submission && (
            <Card withBorder p="sm" bg="var(--card-bg)" radius="md">
              <Text size="xs" c="dimmed" mb={4}>Tệp bài làm đã nộp:</Text>
              <Group gap="xs" wrap="nowrap">
                <FilePdf size={24} color="var(--accent-color)" />
                <Text
                  size="sm"
                  fw={600}
                  style={{ flex: 1 }}
                  truncate
                  component="a"
                  href={submission.content}
                  target="_blank"
                  rel="noreferrer"
                  c="blue"
                  td="underline"
                >
                  Xem tệp bài làm của bạn
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                Nộp lúc: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
              </Text>
            </Card>
          )}

          {!submission?.feedback && (
            <Stack gap="sm">
              {isOverdue && !submission && (
                <Alert color="gray" variant="light" title="Đã hết hạn nộp bài">
                  Bài tập này đã quá hạn nên học sinh không thể nộp mới.
                </Alert>
              )}
              {isOverdue && submission && (
                <Alert color="orange" variant="light" title="Đã hết hạn nộp bài">
                  Bài tập này đã quá hạn nên không thể thay đổi hoặc nộp lại bài làm.
                </Alert>
              )}
              <FileInput
                label={submission ? 'Nộp lại bài làm (Thay thế tệp cũ)' : 'Tải lên tệp bài làm'}
                placeholder="Chọn tệp PDF, Word hoặc hình ảnh..."
                leftSection={<UploadSimple size={16} />}
                value={file}
                onChange={setFile}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                disabled={submitting || isOverdue}
              />
              <Button
                color="copper"
                onClick={handleUploadAndSubmit}
                loading={submitting}
                disabled={!file || isOverdue}
              >
                {submission ? 'Nộp lại bài' : 'Gửi bài làm'}
              </Button>
            </Stack>
          )}
        </Stack>
      )}
    </Modal>
  );
}
