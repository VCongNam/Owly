import { useState, useEffect } from 'react';
import {
  Container, Paper, Text, Group, Stack, Button,
  TextInput, Title, Badge, Divider, LoadingOverlay,
  Select, Textarea, Table, Box, ActionIcon, Tooltip
} from '@mantine/core';
import { ChatTeardropText, ArrowCounterClockwise, Bug, Lightbulb, ChatText } from '@phosphor-icons/react';
import { useForm } from '@mantine/form';
import { feedbackService } from '../services/feedbackService';
import { notifications } from '@mantine/notifications';
import classes from './FeedbackPage.module.css';

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      type: 'Bug',
      title: '',
      content: ''
    },
    validate: {
      type: (val) => (val ? null : 'Vui lòng chọn loại phản hồi'),
      title: (val) => (val.trim().length > 0 ? null : 'Tiêu đề không được để trống'),
      content: (val) => (val.trim().length >= 10 ? null : 'Nội dung phải dài ít nhất 10 ký tự')
    }
  });

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await feedbackService.getMyFeedbacks();
      if (res.data && res.data.success) {
        setFeedbacks(res.data.data || []);
      }
    } catch (err) {
      console.error('Không thể tải lịch sử phản hồi:', err);
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải lịch sử phản hồi. Vui lòng thử lại sau!',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const res = await feedbackService.createFeedback(values);
      if (res.data && res.data.success) {
        notifications.show({
          title: 'Thành công',
          message: res.data.message || 'Gửi phản hồi thành công!',
          color: 'green'
        });
        form.reset();
        fetchFeedbacks();
      }
    } catch (err) {
      console.error('Không thể gửi phản hồi:', err);
      notifications.show({
        title: 'Thất bại',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeedbackTypeBadge = (type) => {
    switch (type) {
      case 'Bug':
        return (
          <Badge variant="light" color="red" leftSection={<Bug size={12} />}>
            Báo lỗi
          </Badge>
        );
      case 'FeatureRequest':
        return (
          <Badge variant="light" color="blue" leftSection={<Lightbulb size={12} />}>
            Đề xuất tính năng
          </Badge>
        );
      default:
        return (
          <Badge variant="light" color="teal" leftSection={<ChatText size={12} />}>
            Góp ý chung
          </Badge>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <Badge variant="filled" color="green">Đã giải quyết</Badge>;
      case 'Reviewed':
        return <Badge variant="filled" color="blue">Đang xem xét</Badge>;
      default:
        return <Badge variant="filled" color="yellow">Chờ xử lý</Badge>;
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2} className={classes.gradientTitle}>Góp ý & Báo lỗi hệ thống</Title>
            <Text c="dimmed" size="sm" mt={4}>Phản hồi của bạn giúp chúng tôi phát triển Owly ngày một hoàn thiện hơn.</Text>
          </Box>
          <Tooltip label="Làm mới lịch sử">
            <ActionIcon variant="outline" color="copper" size="lg" onClick={fetchFeedbacks} loading={loading}>
              <ArrowCounterClockwise size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <div className={classes.gridContainer}>
          {/* CỘT TRÁI: FORM GỬI PHẢN HỒI */}
          <Paper withBorder p="xl" radius="md" shadow="sm" className={classes.formCard} pos="relative">
            <LoadingOverlay visible={submitting} overlayProps={{ radius: 'md', blur: 2 }} />
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <Title order={4} mb="xs">Gửi ý kiến đóng góp</Title>
                
                <Select
                  label="Loại phản hồi"
                  placeholder="Chọn loại phản hồi..."
                  data={[
                    { value: 'Bug', label: '🐛 Báo lỗi hệ thống' },
                    { value: 'FeatureRequest', label: '💡 Đề xuất tính năng mới' },
                    { value: 'GeneralFeedback', label: '💬 Góp ý chung' }
                  ]}
                  required
                  {...form.getInputProps('type')}
                />

                <TextInput
                  label="Tiêu đề"
                  placeholder="Nhập tiêu đề ngắn gọn..."
                  required
                  {...form.getInputProps('title')}
                />

                <Textarea
                  label="Nội dung chi tiết"
                  placeholder="Mô tả chi tiết lỗi bạn gặp phải hoặc tính năng bạn mong muốn được cập nhật..."
                  required
                  minRows={5}
                  maxRows={10}
                  {...form.getInputProps('content')}
                />

                <Button 
                  type="submit" 
                  color="copper" 
                  leftSection={<ChatTeardropText size={18} />}
                  mt="md"
                >
                  Gửi phản hồi
                </Button>
              </Stack>
            </form>
          </Paper>

          {/* CỘT PHẢI: LỊCH SỬ PHẢN HỒI */}
          <Paper withBorder p="xl" radius="md" shadow="sm" className={classes.historyCard} pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ radius: 'md', blur: 2 }} />
            <Stack gap="md" style={{ height: '100%' }}>
              <Title order={4}>Lịch sử phản hồi của bạn</Title>
              
              <Box className={classes.tableWrapper}>
                {feedbacks.length === 0 ? (
                  <Stack align="center" gap="xs" py="xl" style={{ opacity: 0.6 }}>
                    <Text size="50px">📬</Text>
                    <Text size="sm" c="dimmed" fs="italic">Bạn chưa gửi phản hồi nào cho hệ thống.</Text>
                  </Stack>
                ) : (
                  <Table verticalSpacing="md" horizontalSpacing="sm" highlightOnHover className={classes.table}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Ngày gửi</Table.Th>
                        <Table.Th>Phân loại</Table.Th>
                        <Table.Th>Tiêu đề</Table.Th>
                        <Table.Th>Trạng thái</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {feedbacks.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </Table.Td>
                          <Table.Td>{getFeedbackTypeBadge(item.type)}</Table.Td>
                          <Table.Td>
                            <Tooltip label={item.content} multiline width={300} withArrow events={{ hover: true, focus: true, touch: false }}>
                              <Text size="sm" fw={500} className={classes.titleText}>
                                {item.title}
                              </Text>
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>{getStatusBadge(item.status)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Box>
            </Stack>
          </Paper>
        </div>
      </Stack>
    </Container>
  );
}

export default FeedbackPage;
