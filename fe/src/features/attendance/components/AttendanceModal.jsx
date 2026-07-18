import { useState, useEffect } from 'react';
import { Modal, Table, Radio, TextInput, Button, Group, Avatar, Text, Stack, Center, Loader, Alert } from '@mantine/core';
import { Warning } from '@phosphor-icons/react';
import { useGetAttendances, useUpsertAttendances } from '../hooks/useAttendance';

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Có mặt', color: 'green' },
  { value: 'Absent',  label: 'Vắng',   color: 'red' },
  { value: 'Late',    label: 'Muộn',   color: 'yellow' },
  { value: 'Excused', label: 'Có phép', color: 'blue' },
];

const AttendanceModal = ({ isOpen, onClose, sessionId }) => {
  const { data: attendancesRes, isLoading, isError, refetch } = useGetAttendances(isOpen ? sessionId : null);
  const { mutate: upsertAttendances, isPending } = useUpsertAttendances(sessionId);

  const [localAttendances, setLocalAttendances] = useState([]);

  // Fetch khi modal mở
  useEffect(() => {
    if (isOpen && sessionId) {
      refetch();
    }
  }, [isOpen, sessionId]);

  // apiClient interceptor đã unwrap data rồi, nên response là mảng trực tiếp
  useEffect(() => {
    const list = Array.isArray(attendancesRes) ? attendancesRes : attendancesRes?.data;
    if (list) {
      setLocalAttendances(
        list.map(att => ({
          ...att,
          status: att.status || 'Present',
          notes: att.notes || ''
        }))
      );
    }
  }, [attendancesRes]);

  // Reset khi đóng
  useEffect(() => {
    if (!isOpen) setLocalAttendances([]);
  }, [isOpen]);

  const handleStatusChange = (studentId, status) => {
    setLocalAttendances(prev =>
      prev.map(att => att.studentId === studentId ? { ...att, status } : att)
    );
  };

  const handleNotesChange = (studentId, notes) => {
    setLocalAttendances(prev =>
      prev.map(att => att.studentId === studentId ? { ...att, notes } : att)
    );
  };

  const handleSave = () => {
    const payload = localAttendances.map(att => ({
      studentId: att.studentId,
      status: att.status,
      notes: att.notes
    }));
    upsertAttendances(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text fw={600} size="lg">Điểm danh buổi học</Text>}
      size="xl"
      centered
      scrollAreaComponent={Modal.NativeScrollArea}
    >
      {isLoading ? (
        <Center py={60}><Loader color="copper" /></Center>
      ) : isError ? (
        <Alert icon={<Warning size={16} />} color="red" title="Lỗi">
          Đã có lỗi xảy ra khi tải danh sách điểm danh.
        </Alert>
      ) : localAttendances.length === 0 ? (
        <Center py={60}>
          <Stack align="center" gap="xs">
            <Text c="dimmed">Lớp học này chưa có học sinh nào.</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <Table verticalSpacing="sm" highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Học sinh</Table.Th>
                {STATUS_OPTIONS.map(s => (
                  <Table.Th key={s.value} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{s.label}</Table.Th>
                ))}
                <Table.Th>Ghi chú</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {localAttendances.map(student => (
                <Table.Tr key={student.studentId}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        src={student.avatarUrl}
                        size={36}
                        radius="xl"
                        color="copper"
                      >
                        {student.fullName?.charAt(0)}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500}>{student.fullName}</Text>
                        <Text size="xs" c="dimmed">{student.studentCode}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  {STATUS_OPTIONS.map(s => (
                    <Table.Td key={s.value} style={{ textAlign: 'center' }}>
                      <Radio
                        checked={student.status === s.value}
                        onChange={() => handleStatusChange(student.studentId, s.value)}
                        color={s.color}
                        size="sm"
                      />
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <TextInput
                      value={student.notes}
                      onChange={e => handleNotesChange(student.studentId, e.target.value)}
                      placeholder="Nhập ghi chú..."
                      size="xs"
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={onClose}>Hủy</Button>
            <Button
              color="copper"
              onClick={handleSave}
              loading={isPending}
              disabled={localAttendances.length === 0}
            >
              Lưu điểm danh
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};

export default AttendanceModal;


