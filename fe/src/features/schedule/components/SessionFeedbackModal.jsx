import { useState, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, Button, Table, Textarea,
  ThemeIcon, Center, Loader, Divider, Card, Box, ScrollArea
} from '@mantine/core';
import { Chats, Check, Sparkle } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { scheduleService } from '../services/scheduleService';

export function SessionFeedbackModal({ opened, onClose, sessionId, sessionTitle, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sessionInfo, setSessionInfo] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  const [commonAcademic, setCommonAcademic] = useState('');
  const [commonAttitude, setCommonAttitude] = useState('');
  const [commonHomework, setCommonHomework] = useState('');

  useEffect(() => {
    if (!opened || !sessionId) return;

    setLoading(true);
    setFeedbacks([]);
    setCommonAcademic('');
    setCommonAttitude('');
    setCommonHomework('');

    scheduleService.getSessionFeedbacks(sessionId)
      .then(res => {
        setSessionInfo(res.session);
        setFeedbacks(res.feedbacks || []);
      })
      .catch(err => {
        notifications.show({
          title: 'Lỗi',
          message: err?.message || 'Không thể tải danh sách nhận xét học sinh',
          color: 'red'
        });
      })
      .finally(() => setLoading(false));
  }, [opened, sessionId]);

  const handleApplyCommon = () => {
    if (!commonAcademic && !commonAttitude && !commonHomework) {
      notifications.show({
        title: 'Thông báo',
        message: 'Vui lòng điền ít nhất một nội dung nhận xét chung trước khi áp dụng.',
        color: 'yellow'
      });
      return;
    }

    setFeedbacks(prev =>
      prev.map(item => ({
        ...item,
        academicComment: commonAcademic ? commonAcademic : item.academicComment,
        attitudeComment: commonAttitude ? commonAttitude : item.attitudeComment,
        homeworkComment: commonHomework ? commonHomework : item.homeworkComment
      }))
    );

    notifications.show({
      title: 'Đã áp dụng',
      message: 'Nhận xét chung đã được điền xuống danh sách học sinh bên dưới.',
      color: 'teal'
    });
  };

  const handleIndividualChange = (studentId, field, value) => {
    setFeedbacks(prev =>
      prev.map(item =>
        item.studentId === studentId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveFeedbacks = async () => {
    try {
      setSaving(true);
      const payload = feedbacks.map(item => ({
        studentId: item.studentId,
        academicComment: item.academicComment || null,
        attitudeComment: item.attitudeComment || null,
        homeworkComment: item.homeworkComment || null
      }));

      await scheduleService.upsertSessionFeedbacks(sessionId, payload);

      notifications.show({
        title: 'Thành công',
        message: 'Lưu toàn bộ nhận xét buổi học thành công',
        color: 'green'
      });

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Lỗi lưu dữ liệu',
        message: err?.message || 'Không thể lưu nhận xét buổi học',
        color: 'red'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <ThemeIcon size={28} radius="sm" color="copper" variant="light">
            <Chats size={16} weight="duotone" />
          </ThemeIcon>
          <Box>
            <Text fw={700} size="sm">Nhận xét buổi học</Text>
            {sessionInfo && (
              <Text size="xs" c="dimmed">
                {sessionInfo.className} ({sessionInfo.classCode}) · {sessionTitle}
              </Text>
            )}
          </Box>
        </Group>
      }
      size="xl"
      centered
      styles={{
        /* Modal content chiếm tối đa chiều cao viewport, bản thân nó là flex column */
        content: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 80px)'
        },
        /* Header không co giãn */
        header: {
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 12
        },
        /* Body lấp đầy phần còn lại và ẩn overflow để con tự scroll */
        body: {
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 0'
        }
      }}
    >
      {loading ? (
        <Center py={60}>
          <Stack align="center" gap="sm">
            <Loader color="copper" size="md" />
            <Text size="sm" c="dimmed">Đang tải danh sách học sinh...</Text>
          </Stack>
        </Center>
      ) : feedbacks.length === 0 ? (
        <Center py={40}>
          <Text c="dimmed">Không có học sinh nào ghi danh trong lớp học này.</Text>
        </Center>
      ) : (
        /* Wrapper chính: flex column, lấp đầy body */
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── 1. Nhận xét chung cho cả lớp (cố định, không scroll) ── */}
          <Card
            withBorder p="md" radius="md"
            bg="var(--card-bg)"
            style={{ borderColor: 'var(--border-color)', flexShrink: 0 }}
          >
            <Stack gap="xs">
              <Group gap={4}>
                <Sparkle size={14} color="var(--accent-color)" weight="fill" />
                <Text size="xs" fw={700} c="copper" style={{ letterSpacing: 0.5 }}>
                  NHẬN XÉT NHANH CHO CẢ LỚP
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mb={4}>
                Nhập nội dung vào đây và nhấn &quot;Áp dụng&quot; để tự động điền xuống cho toàn bộ học sinh bên dưới.
              </Text>

              <Group grow align="flex-start" gap="xs">
                <Textarea
                  label="Học lực / Tiếp thu"
                  placeholder="Ví dụ: Tiếp thu tốt kiến thức mới, làm bài tập đầy đủ..."
                  value={commonAcademic}
                  onChange={(e) => setCommonAcademic(e.currentTarget.value)}
                  size="xs" autosize minRows={2} maxRows={3}
                />
                <Textarea
                  label="Thái độ / Nề nếp"
                  placeholder="Ví dụ: Tập trung nghe giảng, tích cực phát biểu..."
                  value={commonAttitude}
                  onChange={(e) => setCommonAttitude(e.currentTarget.value)}
                  size="xs" autosize minRows={2} maxRows={3}
                />
                <Textarea
                  label="Bài tập về nhà cũ"
                  placeholder="Ví dụ: Hoàn thành tốt, trình bày sạch sẽ..."
                  value={commonHomework}
                  onChange={(e) => setCommonHomework(e.currentTarget.value)}
                  size="xs" autosize minRows={2} maxRows={3}
                />
              </Group>

              <Group justify="flex-end" mt={4}>
                <Button
                  size="xs" color="copper" variant="light"
                  leftSection={<Check size={14} />}
                  onClick={handleApplyCommon}
                >
                  Áp dụng cho cả lớp
                </Button>
              </Group>
            </Stack>
          </Card>

          <Divider
            label="Nhận xét riêng từng học sinh"
            labelPosition="left"
            style={{ flexShrink: 0 }}
          />

          {/* ── 2. Danh sách cuộn (flex: 1 — lấp hết phần còn lại) ── */}
          <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars>
            <div style={{ overflowX: 'auto' }}>
              <Table highlightOnHover verticalSpacing="xs" style={{ minWidth: 680 }}>
                <Table.Thead style={{
                  position: 'sticky', top: 0,
                  background: 'var(--mantine-color-body)',
                  zIndex: 10
                }}>
                  <Table.Tr>
                    <Table.Th style={{ width: 130 }}>Học viên</Table.Th>
                    <Table.Th>Học lực / Tiếp thu</Table.Th>
                    <Table.Th>Thái độ / Nề nếp</Table.Th>
                    <Table.Th>Bài tập về nhà</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {feedbacks.map((fb) => (
                    <Table.Tr key={fb.studentId}>
                      <Table.Td style={{ verticalAlign: 'top', paddingTop: 10 }}>
                        <Text size="sm" fw={600}>{fb.fullName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Textarea
                          placeholder="Nhận xét học lực..."
                          value={fb.academicComment || ''}
                          onChange={(e) => handleIndividualChange(fb.studentId, 'academicComment', e.target.value)}
                          size="xs" autosize minRows={1} maxRows={3}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Textarea
                          placeholder="Nhận xét thái độ..."
                          value={fb.attitudeComment || ''}
                          onChange={(e) => handleIndividualChange(fb.studentId, 'attitudeComment', e.target.value)}
                          size="xs" autosize minRows={1} maxRows={3}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Textarea
                          placeholder="Nhận xét bài tập..."
                          value={fb.homeworkComment || ''}
                          onChange={(e) => handleIndividualChange(fb.studentId, 'homeworkComment', e.target.value)}
                          size="xs" autosize minRows={1} maxRows={3}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </ScrollArea>

          {/* ── 3. Footer luôn cố định ở đáy ── */}
          <div style={{
            flexShrink: 0,
            borderTop: '1px solid var(--border-color)',
            paddingTop: 12,
            paddingBottom: 16
          }}>
            <Group justify="flex-end" gap="xs">
              <Button variant="default" size="sm" onClick={onClose} disabled={saving}>
                Hủy bỏ
              </Button>
              <Button color="copper" size="sm" onClick={handleSaveFeedbacks} loading={saving}>
                Lưu nhận xét
              </Button>
            </Group>
          </div>

        </div>
      )}
    </Modal>
  );
}

export default SessionFeedbackModal;
