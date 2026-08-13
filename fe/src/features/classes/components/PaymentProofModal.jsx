import { useState } from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  Badge,
  Button,
  Image,
  Textarea,
  Divider,
  Paper,
  SimpleGrid,
  Box,
} from '@mantine/core';
import { Check, X, QrCode, Receipt, CalendarBlank, User } from '@phosphor-icons/react';
import dayjs from 'dayjs';

export function PaymentProofModal({ opened, onClose, invoice, teacherBank, onReview, loading }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!invoice) return null;

  const latestTransaction = invoice.transactions?.[0];

  // Sinh URL VietQR động nếu giáo viên đã cài đặt thông tin ngân hàng
  const hasBankInfo = teacherBank?.bankBin && teacherBank?.bankAccountNo;
  const formattedMonth = invoice.billingMonth ? `${invoice.billingMonth.split('-')[1]}/${invoice.billingMonth.split('-')[0]}` : '';
  const qrDescription = encodeURIComponent(`${invoice.student?.studentCode || 'OWLY'} HP ${formattedMonth}`);
  const vietQrUrl = hasBankInfo
    ? `https://img.vietqr.io/image/${teacherBank.bankBin}-${teacherBank.bankAccountNo}-compact2.png?amount=${invoice.amount}&addInfo=${qrDescription}&accountName=${encodeURIComponent(teacherBank.bankAccountName || '')}`
    : null;

  const handleApprove = async () => {
    if (!latestTransaction) return;
    const success = await onReview(latestTransaction.id, 'Approved');
    if (success) {
      onClose();
    }
  };

  const handleRejectSubmit = async () => {
    if (!latestTransaction) return;
    const success = await onReview(latestTransaction.id, 'Rejected', rejectionReason);
    if (success) {
      setRejecting(false);
      setRejectionReason('');
      onClose();
    }
  };

  const STATUS_MAP = {
    Paid: { label: 'Đã thanh toán', color: 'teal' },
    Pending: { label: 'Chờ đối soát', color: 'orange' },
    Unpaid: { label: 'Chưa thanh toán', color: 'red' },
  };

  const statusConfig = STATUS_MAP[invoice.status] || { label: invoice.status, color: 'gray' };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setRejecting(false);
        setRejectionReason('');
        onClose();
      }}
      title={
        <Group gap={8}>
          <Receipt size={22} weight="duotone" color="var(--accent-color)" />
          <Text fw={600} size="lg">Chi tiết Hóa đơn & Minh chứng Thanh toán</Text>
        </Group>
      }
      centered
      radius="md"
      size="lg"
    >
      <Stack gap="md">
        {/* Thẻ thông tin Hóa đơn */}
        <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
          <Group justify="space-between" mb="xs">
            <Text fw={700} size="md" c="copper">{invoice.title || 'Hóa đơn học phí'}</Text>
            <Badge color={statusConfig.color} variant="light" size="lg">
              {statusConfig.label}
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="sm">
            <Group gap={6}>
              <User size={16} color="var(--accent-color)" />
              <Text size="sm" fw={500}>Học viên:</Text>
              <Text size="sm">{invoice.student?.fullName} ({invoice.student?.studentCode})</Text>
            </Group>
            <Group gap={6}>
              <CalendarBlank size={16} color="var(--accent-color)" />
              <Text size="sm" fw={500}>Hạn nộp:</Text>
              <Text size="sm">{invoice.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY') : '---'}</Text>
            </Group>
            <Group gap={6}>
              <Receipt size={16} color="var(--accent-color)" />
              <Text size="sm" fw={500}>Số buổi học:</Text>
              <Text size="sm">{invoice.sessionCount || 0} buổi</Text>
            </Group>
            <Group gap={6}>
              <Text size="sm" fw={500}>Số tiền cần nộp:</Text>
              <Text size="md" fw={700} c="copper">
                {Number(invoice.amount).toLocaleString('vi-VN')} VNĐ
              </Text>
            </Group>
          </SimpleGrid>
        </Paper>

        {/* Nội dung Mã VietQR và Ảnh Minh chứng */}
        <SimpleGrid cols={{ base: 1, sm: vietQrUrl ? 2 : 1 }} spacing="md">
          {vietQrUrl && (
            <Paper p="md" radius="md" withBorder align="center" style={{ backgroundColor: 'var(--card-bg)' }}>
              <Group gap={6} justify="center" mb="xs">
                <QrCode size={20} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Mã VietQR Thanh toán</Text>
              </Group>
              <Box style={{ maxWidth: 220, margin: '0 auto' }}>
                <Image src={vietQrUrl} alt="VietQR Payment" radius="sm" />
              </Box>
              <Text size="xs" c="dimmed" mt="xs">
                {teacherBank.bankName} - {teacherBank.bankAccountNo}
              </Text>
              <Text size="xs" fw={500} c="copper">
                {teacherBank.bankAccountName}
              </Text>
            </Paper>
          )}

          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
            <Text fw={600} size="sm" mb="xs">
              Ảnh Minh chứng từ Học viên:
            </Text>
            {latestTransaction?.proofUrl ? (
              <Box align="center">
                <Image
                  src={latestTransaction.proofUrl}
                  alt="Minh chứng thanh toán"
                  radius="md"
                  maxHeight={260}
                  fit="contain"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Thời gian gửi: {dayjs(latestTransaction.createdAt).format('HH:mm - DD/MM/YYYY')}
                </Text>
              </Box>
            ) : (
              <Box py={40} align="center">
                <Text size="sm" c="dimmed">Chưa có minh chứng thanh toán nào được tải lên</Text>
              </Box>
            )}
          </Paper>
        </SimpleGrid>

        {/* Nếu bị từ chối trước đó */}
        {latestTransaction?.transactionStatus === 'Rejected' && latestTransaction.rejectionReason && (
          <Paper p="sm" radius="md" withBorder bg="red.0">
            <Text size="xs" fw={600} c="red.8">Lý do từ chối trước đó:</Text>
            <Text size="sm" c="red.9">{latestTransaction.rejectionReason}</Text>
          </Paper>
        )}

        {/* Khung Từ chối (Nếu đang bấm Từ chối) */}
        {rejecting && (
          <Stack gap="xs">
            <Divider label="Xác nhận từ chối giao dịch" labelPosition="center" color="red" />
            <Textarea
              label="Lý do từ chối (Gửi tới học viên)"
              placeholder="Ví dụ: Tên tài khoản không khớp / Ảnh mờ không rõ mã giao dịch"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
            />
            <Group justify="flex-end">
              <Button size="xs" variant="default" onClick={() => setRejecting(false)}>
                Hủy
              </Button>
              <Button size="xs" color="red" onClick={handleRejectSubmit} loading={loading}>
                Xác nhận Từ chối
              </Button>
            </Group>
          </Stack>
        )}

        {/* Nút hành động dành cho Giáo viên khi có giao dịch Pending */}
        {invoice.status === 'Pending' && latestTransaction && !rejecting && (
          <Group justify="flex-end" mt="sm">
            <Button
              color="red"
              variant="light"
              onClick={() => setRejecting(true)}
              leftSection={<X size={18} />}
              disabled={loading}
            >
              Từ chối giao dịch
            </Button>
            <Button
              color="teal"
              onClick={handleApprove}
              leftSection={<Check size={18} />}
              loading={loading}
            >
              Duyệt - Đã nhận đủ tiền
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
