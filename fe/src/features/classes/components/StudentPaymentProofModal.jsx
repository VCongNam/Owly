import { useState, useEffect, useRef } from 'react';
import {
  Modal, Group, Text, Stack, Badge, Button, Image,
  Paper, SimpleGrid, Box, FileInput
} from '@mantine/core';
import { QrCode, Receipt, CalendarBlank, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { tuitionService } from '../services/tuition';
import { uploadService } from '../../../services/uploadService';

export function StudentPaymentProofModal({ opened, onClose, invoice, teacherBank, onSuccess }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewUrlRef = useRef(null);

  const handleFileChange = (nextFile) => {
    // Thu hồi URL cũ nếu có
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setFile(nextFile);

    if (nextFile) {
      const url = URL.createObjectURL(nextFile);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!invoice) return null;

  const latestTransaction = invoice.transactions?.[0];

  // Sinh URL VietQR động
  const hasBankInfo = teacherBank?.bankBin && teacherBank?.bankAccountNo;
  const formattedMonth = invoice.billingMonth ? `${invoice.billingMonth.split('-')[1]}/${invoice.billingMonth.split('-')[0]}` : '';
  const qrDescription = encodeURIComponent(`${invoice.student?.studentCode || 'OWLY'} HP ${formattedMonth}`);
  const vietQrUrl = hasBankInfo
    ? `https://img.vietqr.io/image/${teacherBank.bankBin}-${teacherBank.bankAccountNo}-compact2.png?amount=${invoice.amount}&addInfo=${qrDescription}&accountName=${encodeURIComponent(teacherBank.bankAccountName || '')}`
    : null;

  const handleUploadAndSubmitProof = async () => {
    if (!file) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn ảnh chụp minh chứng giao dịch chuyển khoản',
        color: 'red'
      });
      return;
    }

    try {
      setSubmitting(true);
      // 1. Tải ảnh lên R2 qua API có sẵn
      const uploadRes = await uploadService.uploadFiles([file], 'tuition');
      const proofUrl = uploadRes?.attachmentUrls?.[0];

      // 2. Gửi minh chứng thanh toán
      await tuitionService.submitPaymentProof(invoice.id, {
        proofUrl,
        amountPaid: invoice.amount
      });

      notifications.show({
        title: 'Thành công',
        message: 'Tải minh chứng thanh toán thành công, vui lòng chờ giáo viên đối soát',
        color: 'green'
      });

      setFile(null);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Lỗi',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi minh chứng',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
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
      onClose={onClose}
      title={
        <Group gap={8}>
          <Receipt size={22} weight="duotone" color="var(--accent-color)" />
          <Text fw={600} size="lg">Thanh toán Học phí lớp học</Text>
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
        <SimpleGrid cols={{ base: 1, sm: vietQrUrl && invoice.status !== 'Paid' ? 2 : 1 }} spacing="md">
          {vietQrUrl && invoice.status !== 'Paid' && (
            <Paper p="md" radius="md" withBorder align="center" style={{ backgroundColor: 'var(--card-bg)' }}>
              <Group gap={6} justify="center" mb="xs">
                <QrCode size={20} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Mã VietQR chuyển khoản</Text>
              </Group>
              <Box style={{ maxWidth: 220, margin: '0 auto' }}>
                <Image src={vietQrUrl} alt="VietQR Payment" radius="sm" />
              </Box>
              <Text size="xs" c="dimmed" mt="xs">
                Ngân hàng: {teacherBank.bankName}
              </Text>
              <Text size="xs" c="dimmed">
                Số TK: {teacherBank.bankAccountNo}
              </Text>
              <Text size="xs" fw={500} c="copper">
                Tên TK: {teacherBank.bankAccountName}
              </Text>
            </Paper>
          )}

          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
            <Text fw={600} size="sm" mb="xs">
              {invoice.status === 'Paid' || invoice.status === 'Pending' ? 'Ảnh Minh chứng đã gửi:' : 'Tải lên minh chứng chuyển khoản:'}
            </Text>
            {invoice.status === 'Paid' || invoice.status === 'Pending' ? (
              latestTransaction?.proofUrl ? (
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
                <Text size="xs" c="dimmed">Chưa có ảnh minh chứng lưu trữ.</Text>
              )
            ) : (
              <Stack gap="sm">
                <FileInput
                  label="Chọn hình ảnh giao dịch thành công"
                  placeholder="Chọn ảnh chụp biên lai chuyển tiền..."
                  leftSection={<UploadSimple size={16} />}
                  value={file}
                  onChange={handleFileChange}
                  accept="image/*"
                  disabled={submitting}
                />
                {previewUrl && (
                  <Box align="center" mt="xs">
                    <Text size="xs" c="dimmed" mb={4}>Ảnh xem trước:</Text>
                    <Image
                      src={previewUrl}
                      alt="Xem trước minh chứng"
                      radius="md"
                      maxHeight={180}
                      fit="contain"
                    />
                  </Box>
                )}
                <Button
                  color="copper"
                  onClick={handleUploadAndSubmitProof}
                  loading={submitting}
                  disabled={!file}
                >
                  Xác nhận đã chuyển khoản
                </Button>
              </Stack>
            )}
          </Paper>
        </SimpleGrid>

        {/* Nếu bị từ chối trước đó */}
        {latestTransaction?.transactionStatus === 'Rejected' && latestTransaction.rejectionReason && (
          <Paper p="sm" radius="md" withBorder bg="red.0">
            <Group gap={6} c="red.8" mb={4}>
              <WarningCircle size={16} />
              <Text size="xs" fw={600}>Giao dịch bị từ chối đối soát trước đó:</Text>
            </Group>
            <Text size="sm" c="red.9">{latestTransaction.rejectionReason}</Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
}
