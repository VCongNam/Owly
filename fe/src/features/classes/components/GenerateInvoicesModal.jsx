import { useState } from 'react';
import { Modal, NumberInput, Button, Group, Text, Stack, Alert } from '@mantine/core';
import { MonthPickerInput, DateInput } from '@mantine/dates';
import { PaperPlaneTilt, Info } from '@phosphor-icons/react';
import dayjs from 'dayjs';

export function GenerateInvoicesModal({ opened, onClose, defaultAmount, initialMonthDate, onGenerate, loading }) {
  const [selectedMonth, setSelectedMonth] = useState(() => initialMonthDate ?? new Date());
  const [dueDate, setDueDate] = useState(() => {
    return dayjs(initialMonthDate ?? new Date()).endOf('month').toDate();
  });
  const [amountPerSession, setAmountPerSession] = useState(() => defaultAmount ?? 0);

  const handleMonthChange = (date) => {
    if (date) {
      setSelectedMonth(date);
      setDueDate(dayjs(date).endOf('month').toDate());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMonth || !dueDate) return;

    const billingMonth = dayjs(selectedMonth).format('YYYY-MM');
    const currentMonthStr = dayjs().format('YYYY-MM');

    if (billingMonth > currentMonthStr) {
      return;
    }

    const success = await onGenerate({
      billingMonth,
      dueDate: dayjs(dueDate).endOf('day').toDate(),
      amountPerSession,
    });

    if (success) {
      onClose();
    }
  };

  const monthLabel = selectedMonth ? dayjs(selectedMonth).format('MM/YYYY') : '';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <PaperPlaneTilt size={22} weight="duotone" color="var(--accent-color)" />
          <Text fw={600} size="lg">Phát hành Hóa đơn Tháng {monthLabel}</Text>
        </Group>
      }
      centered
      radius="md"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <Alert color="blue" icon={<Info size={20} />}>
            Hệ thống sẽ tự động tính toán tổng số buổi học trong tháng chọn (không bao gồm buổi hủy) và nhân với đơn giá trên mỗi buổi học để phát hành hóa đơn cho toàn bộ học viên đang hoạt động trong lớp.
          </Alert>

          <Group grow stackFrom="xs">
            <MonthPickerInput
              label="Chọn tháng thu học phí"
              placeholder="Chọn tháng/năm"
              value={selectedMonth}
              onChange={handleMonthChange}
              maxDate={new Date()}
              valueFormat="MM/YYYY"
              locale="vi"
              required
              size="md"
            />
            <DateInput
              label="Hạn thanh toán"
              placeholder="Chọn hạn thanh toán"
              value={dueDate}
              onChange={setDueDate}
              valueFormat="DD/MM/YYYY"
              locale="vi"
              required
              size="md"
            />
          </Group>

          <NumberInput
            label="Đơn giá trên mỗi buổi học áp dụng (VNĐ)"
            placeholder="Ví dụ: 200,000"
            value={amountPerSession}
            onChange={(val) => setAmountPerSession(val || 0)}
            min={0}
            step={10000}
            thousandSeparator=","
            suffix=" VNĐ"
            required
            size="md"
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="submit"
              color="copper"
              loading={loading}
              leftSection={<PaperPlaneTilt size={18} weight="bold" />}
            >
              Phát hành Hóa đơn
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
