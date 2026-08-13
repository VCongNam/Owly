import { useEffect, useState } from 'react';
import { Modal, Button, TextInput, Group, Stack, Select, NumberInput, ActionIcon, Text, Card, SimpleGrid, Divider } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Plus, Trash } from '@phosphor-icons/react';
import apiClient from '../../../services/apiClient';

const DAYS_OF_WEEK = [
  { value: '2', label: 'Thứ 2' },
  { value: '3', label: 'Thứ 3' },
  { value: '4', label: 'Thứ 4' },
  { value: '5', label: 'Thứ 5' },
  { value: '6', label: 'Thứ 6' },
  { value: '7', label: 'Thứ 7' },
  { value: '8', label: 'Chủ Nhật' },
];

export function ClassFormModal({ opened, onClose, onSubmit, initialValues = null }) {
  const isEdit = !!initialValues;
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (opened) {
      const fetchSubjects = async () => {
        try {
          setLoadingSubjects(true);
          const res = await apiClient.get('/api/subjects');
          setSubjects(res.data || res || []);
        } catch (error) {
          console.error('Lỗi tải danh sách môn học:', error);
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    }
  }, [opened]);

  const form = useForm({
    initialValues: {
      name: '',
      startDate: null,
      expectedEndDate: null,
      subjectId: '',
      tuitionAmount: '',
      billingCycle: 'Session',
      schedules: [],
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Tên lớp phải có ít nhất 2 ký tự' : null),
      startDate: (value) => (!value ? 'Ngày khai giảng không được để trống' : null),
    },
  });

  // Load initial values when editing
  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          name: initialValues.name || '',
          startDate: initialValues.startDate ? new Date(initialValues.startDate) : null,
          expectedEndDate: initialValues.expectedEndDate ? new Date(initialValues.expectedEndDate) : null,
          subjectId: initialValues.subjectId || '',
          tuitionAmount: initialValues.tuitionConfig ? initialValues.tuitionConfig.amount : '',
          billingCycle: initialValues.tuitionConfig ? initialValues.tuitionConfig.billingCycle : 'Session',
          schedules: initialValues.schedules ? initialValues.schedules.map(s => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room || '',
          })) : [],
        });
      } else {
        form.reset();
      }
    }
  }, [opened, initialValues]);

  const handleSubmit = (values) => {
    const payload = {
      name: values.name,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      expectedEndDate: values.expectedEndDate ? new Date(values.expectedEndDate).toISOString() : null,
      subjectId: values.subjectId || null,
      tuitionAmount: values.tuitionAmount !== '' && values.tuitionAmount !== null ? Number(values.tuitionAmount) : null,
      billingCycle: values.billingCycle,
      schedules: values.schedules.map(s => ({
        dayOfWeek: Number(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room || null
      })),
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
      size="lg"
      centered
      scrollable
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* PHẦN 1: THÔNG TIN CHUNG */}
          <Divider label="Thông tin cơ bản" labelPosition="left" />
          
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Tên lớp học"
              placeholder="Ví dụ: Toán Học Lớp 10"
              required
              data-autofocus
              {...form.getInputProps('name')}
            />

            <Select
              label="Môn học"
              placeholder={loadingSubjects ? "Đang tải môn học..." : "Chọn môn học"}
              data={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
              clearable
              disabled={loadingSubjects}
              {...form.getInputProps('subjectId')}
            />

            <DateInput
              label="Ngày khai giảng"
              placeholder="Chọn ngày bắt đầu"
              valueFormat="DD/MM/YYYY"
              required
              {...form.getInputProps('startDate')}
            />

            <DateInput
              label="Ngày bế mạc (Dự kiến)"
              placeholder="Có thể bỏ trống"
              valueFormat="DD/MM/YYYY"
              clearable
              {...form.getInputProps('expectedEndDate')}
            />
          </SimpleGrid>

          {/* PHẦN 2: HỌC PHÍ */}
          <Divider label="Cấu hình học phí" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <NumberInput
              label="Học phí (VND)"
              placeholder="Ví dụ: 200000"
              min={0}
              thousandSeparator=","
              {...form.getInputProps('tuitionAmount')}
            />

            <Select
              label="Hình thức tính học phí"
              placeholder="Chọn hình thức"
              data={[
                { value: 'Session', label: 'Tính theo buổi học' },
                { value: 'Monthly', label: 'Tính theo tháng' },
              ]}
              {...form.getInputProps('billingCycle')}
            />
          </SimpleGrid>

          {/* PHẦN 3: LỊCH HỌC LINH HOẠT */}
          <Group justify="space-between" mt="sm">
            <Text fw={500} size="sm">Lịch học trong tuần</Text>
            <Button
              size="xs"
              variant="light"
              color="copper"
              leftSection={<Plus size={14} />}
              onClick={() => form.insertListItem('schedules', { dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: '' })}
            >
              Thêm lịch
            </Button>
          </Group>

          {form.values.schedules.length === 0 ? (
            <Card withBorder py="lg" style={{ borderStyle: 'dashed' }}>
              <Text c="dimmed" size="sm" ta="center">Chưa cấu hình lịch học. Hãy thêm buổi học đầu tiên!</Text>
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
                    label={index === 0 ? "Bắt đầu" : null}
                    type="time"
                    style={{ flex: 2 }}
                    {...form.getInputProps(`schedules.${index}.startTime`)}
                  />
                  <TextInput
                    label={index === 0 ? "Kết thúc" : null}
                    type="time"
                    style={{ flex: 2 }}
                    {...form.getInputProps(`schedules.${index}.endTime`)}
                  />
                  <TextInput
                    label={index === 0 ? "Phòng học" : null}
                    placeholder="Phòng A1"
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
          <Button variant="default" onClick={handleClose}>Hủy</Button>
          <Button type="submit" color="copper">
            {isEdit ? "Cập nhật" : "Tạo lớp"}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
