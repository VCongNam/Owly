import { Modal, Text, Button, Group, Stack } from '@mantine/core';
import { Warning } from '@phosphor-icons/react';

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  color = "red",
  loading = false
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="sm"
      centered
      styles={{
        header: {
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
        },
        title: {
          fontWeight: 700,
          color: color === 'red' ? 'var(--mantine-color-red-6)' : 'var(--accent-color)'
        }
      }}
    >
      <Stack gap="md" pt="sm">
        <Group align="flex-start" wrap="nowrap" gap="sm">
          {color === 'red' && (
            <Warning size={32} color="var(--mantine-color-red-6)" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <Text size="sm" style={{ lineHeight: 1.6 }}>
            {message}
          </Text>
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button color={color} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default ConfirmModal;
