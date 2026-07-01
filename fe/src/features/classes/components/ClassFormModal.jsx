import { Modal, Button, TextInput, Group, Stack } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

export function ClassFormModal({ opened, onClose, onSubmit, initialValues = null }) {
  const isEdit = !!initialValues;

  const form = useForm({
    initialValues: {
      name: initialValues?.name || '',
      startDate: initialValues?.startDate ? new Date(initialValues.startDate) : null,
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Tên lớp phải có ít nhất 2 ký tự' : null),
      startDate: (value) => (!value ? 'Ngày khai giảng không được để trống' : null),
    },
  });

  const handleSubmit = (values) => {
    // Chuyển giá trị ngày thành Date object rồi mới toISOString để gửi xuống BE
    const payload = {
      ...values,
      startDate: new Date(values.startDate).toISOString()
    };
    onSubmit(payload);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? "Cập nhật lớp học" : "Tạo lớp học mới"}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Tên lớp học"
            placeholder="Ví dụ: Toán Học Lớp 10"
            required
            data-autofocus
            {...form.getInputProps('name')}
          />
          <DateInput
            label="Ngày khai giảng"
            placeholder="Chọn ngày bắt đầu"
            valueFormat="DD/MM/YYYY"
            required
            {...form.getInputProps('startDate')}
          />
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={handleClose}>Hủy</Button>
          <Button type="submit" color="copper">
            {isEdit ? "Cập nhật" : "Tạo lớp"}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
