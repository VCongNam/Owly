import { useState, useEffect } from 'react';
import { Modal, NumberInput, Button, Group, Text, Stack } from '@mantine/core';
import { CurrencyCircleDollar, FloppyDisk } from '@phosphor-icons/react';

export function TuitionConfigModal({ opened, onClose, currentAmount, onSave, loading }) {
  const [amount, setAmount] = useState(currentAmount || 0);

  useEffect(() => {
    setAmount(currentAmount || 0);
  }, [currentAmount, opened]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSave(amount);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <CurrencyCircleDollar size={22} weight="duotone" color="var(--accent-color)" />
          <Text fw={600} size="lg">Cấu hình Đơn giá Học phí</Text>
        </Group>
      }
      centered
      radius="md"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <Text size="sm" c="dimmed">
            Thiết lập đơn giá chuẩn trên mỗi buổi học của lớp. Đơn giá này sẽ được tự động nhân với số buổi học trong tháng khi phát hành hóa đơn.
          </Text>

          <NumberInput
            label="Đơn giá trên mỗi buổi học (VNĐ)"
            placeholder="Ví dụ: 200,000"
            value={amount}
            onChange={(val) => setAmount(val || 0)}
            min={0}
            step={10000}
            thousandSeparator=","
            suffix=" VNĐ"
            required
            size="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="submit"
              color="copper"
              loading={loading}
              leftSection={<FloppyDisk size={18} weight="bold" />}
            >
              Lưu cấu hình
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
