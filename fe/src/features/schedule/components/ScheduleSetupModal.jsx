import { useEffect } from 'react';
import { Modal, Button, TextInput, Group, Stack, Select, ActionIcon, Text, Card, Alert } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Plus, Trash, Warning } from '@phosphor-icons/react';

const DAYS_OF_WEEK = [
  { value: '2', label: 'Thứ 2' },
  { value: '3', label: 'Thứ 3' },
  { value: '4', label: 'Thứ 4' },
  { value: '5', label: 'Thứ 5' },
  { value: '6', label: 'Thứ 6' },
  { value: '7', label: 'Thứ 7' },
  { value: '8', label: 'Chủ Nhật' },
];

export function ScheduleSetupModal({ opened, onClose, onSave, classDetail }) {
  const form = useForm({
    initialValues: {
      startDate: null,
      endDate: null,
      schedules: [],
    },
    validate: {
      startDate: (value) => (!value ? 'Ngày bắt đầu sinh lịch không được để trống' : null),
      endDate: (value) => (!value ? 'Ngày kết thúc sinh lịch không được để trống' : null),
    },
  });

  useEffect(() => {
    if (opened && classDetail) {
      // Thiết lập mặc định khoảng ngày dựa trên ngày bắt đầu/kết thúc của lớp học
      const today = new Date();
      const clsStart = classDetail.startDate ? new Date(classDetail.startDate) : today;
      const clsEnd = classDetail.expectedEndDate ? new Date(classDetail.expectedEndDate) : new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

      form.setValues({
        startDate: clsStart,
        endDate: clsEnd,
        schedules: classDetail.schedules ? classDetail.schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room || '',
        })) : [],
      });
    }
  }, [opened, classDetail]);

  const handleSubmit = (values) => {
    if (values.startDate >= values.endDate) {
      form.setFieldError('startDate', 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      return;
    }

    const payload = {
      schedules: values.schedules.map(s => ({
        dayOfWeek: Number(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room || null
      })),
      generationRange: {
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString()
      }
    };
    
    onSave(payload);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Cấu hình Lịch học Định kỳ - ${classDetail?.name || ''}`}
      size="lg"
      centered
      scrollable
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert color="yellow" icon={<Warning size={18} />} title="Lưu ý quan trọng">
            Cập nhật lịch định kỳ sẽ xóa các buổi học ở trạng thái <b>Lên lịch (Scheduled)</b> trong tương lai và tạo lại lịch mới. Các buổi học đã hoàn thành, đã hủy hoặc đã có thông tin điểm danh/nhận xét sẽ <b>không bị ảnh hưởng</b>.
          </Alert>

          <Group grow gap="md">
            <DateInput
              label="Ngày bắt đầu sinh lịch"
              placeholder="Chọn ngày bắt đầu"
              valueFormat="DD/MM/YYYY"
              required
              {...form.getInputProps('startDate')}
            />
            <DateInput
              label="Ngày kết thúc sinh lịch"
              placeholder="Chọn ngày kết thúc"
              valueFormat="DD/MM/YYYY"
              required
              {...form.getInputProps('endDate')}
            />
          </Group>

          <Group justify="space-between" mt="sm">
            <Text fw={600} size="sm">Khung giờ học hàng tuần</Text>
            <Button
              size="xs"
              variant="light"
              color="copper"
              leftSection={<Plus size={14} />}
              onClick={() => form.insertListItem('schedules', { dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: '' })}
            >
              Thêm khung giờ
            </Button>
          </Group>

          {form.values.schedules.length === 0 ? (
            <Card withBorder py="lg" style={{ borderStyle: 'dashed' }}>
              <Text c="dimmed" size="sm" ta="center">Chưa có lịch tuần. Bấm "Thêm khung giờ" để cấu hình.</Text>
            </Card>
          ) : (
            <Stack gap="xs">
              {form.values.schedules.map((item, index) => (
                <Group key={index} align="flex-end" gap="xs">
                  <Select
                    label={index === 0 ? "Thứ" : null}
                    placeholder="Chọn Thứ"
                    data={DAYS_OF_WEEK}
                    style={{ flex: 2 }}
                    onChange={(val) => form.setFieldValue(`schedules.${index}.dayOfWeek`, Number(val))}
                    value={String(form.values.schedules[index].dayOfWeek)}
                  />
                  <TextInput
                    label={index === 0 ? "Giờ bắt đầu" : null}
                    type="time"
                    style={{ flex: 2 }}
                    {...form.getInputProps(`schedules.${index}.startTime`)}
                  />
                  <TextInput
                    label={index === 0 ? "Giờ kết thúc" : null}
                    type="time"
                    style={{ flex: 2 }}
                    {...form.getInputProps(`schedules.${index}.endTime`)}
                  />
                  <TextInput
                    label={index === 0 ? "Phòng học" : null}
                    placeholder="Phòng A"
                    style={{ flex: 3 }}
                    {...form.getInputProps(`schedules.${index}.room`)}
                  />
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => form.removeListItem('schedules', index)}
                    mb={4}
                  >
                    <Trash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose}>Hủy</Button>
          <Button type="submit" color="copper">Áp dụng & Sinh lịch</Button>
        </Group>
      </form>
    </Modal>
  );
}

export default ScheduleSetupModal;
