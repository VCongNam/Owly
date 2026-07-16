import { useEffect } from 'react';
import { Modal, Button, TextInput, Group, Stack, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

// Helper quy đổi Date sang HH:mm múi giờ VN
const getTimeString = (dateInput) => {
  if (!dateInput) return '08:00';
  const d = new Date(dateInput);
  
  // Format thành giờ địa phương của VN (UTC+7)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(d);
};

export function SessionFormModal({ opened, onClose, onSubmit, initialValues = null }) {
  const isEdit = !!initialValues;

  const form = useForm({
    initialValues: {
      title: '',
      date: null,
      time: '08:00',
      status: 'Scheduled',
    },
    validate: {
      title: (value) => (!value ? 'Tiêu đề buổi học không được để trống' : null),
      date: (value) => (!value ? 'Ngày học không được để trống' : null),
      time: (value) => (!value ? 'Giờ học không được để trống' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        const sessionDate = new Date(initialValues.date);
        form.setValues({
          title: initialValues.title || 'Buổi học',
          date: sessionDate,
          time: getTimeString(sessionDate),
          status: initialValues.status || 'Scheduled',
        });
      } else {
        form.reset();
        form.setValues({
          title: 'Buổi học bù',
          date: new Date(),
          time: '08:00',
          status: 'Scheduled',
        });
      }
    }
  }, [opened, initialValues]);

  const handleSubmit = (values) => {
    const date = values.date;
    const time = values.time; // HH:mm
    
    // Ghép ngày và giờ theo múi giờ Việt Nam (+07:00)
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    const combinedISOString = `${y}-${m}-${d}T${time}:00+07:00`;
    
    const payload = {
      title: values.title,
      date: new Date(combinedISOString).toISOString(),
    };

    if (isEdit) {
      payload.status = values.status;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa Buổi học' : 'Tạo Buổi học lẻ/bù'}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Tiêu đề buổi học"
            placeholder="Ví dụ: Chuyên đề Đại số, Buổi học bù thứ 7"
            required
            {...form.getInputProps('title')}
          />

          <Group grow gap="md">
            <DateInput
              label="Ngày học"
              placeholder="Chọn ngày học"
              valueFormat="DD/MM/YYYY"
              required
              {...form.getInputProps('date')}
            />

            <TextInput
              label="Giờ học"
              type="time"
              required
              {...form.getInputProps('time')}
            />
          </Group>

          {isEdit && (
            <Select
              label="Trạng thái buổi học"
              placeholder="Chọn trạng thái"
              data={[
                { value: 'Scheduled', label: 'Lên lịch (Scheduled)' },
                { value: 'Completed', label: 'Đã học xong (Completed)' },
                { value: 'Cancelled', label: 'Hủy học (Cancelled)' },
              ]}
              {...form.getInputProps('status')}
            />
          )}

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose}>Hủy</Button>
            <Button type="submit" color="copper">
              {isEdit ? 'Lưu thay đổi' : 'Tạo buổi học'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export default SessionFormModal;
