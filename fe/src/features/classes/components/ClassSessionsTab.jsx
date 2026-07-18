import { useEffect, useState, useCallback } from 'react';
import { Group, Button, Table, Badge, ActionIcon, Menu, Text, Card, Center, Loader, Box, Stack, Pagination } from '@mantine/core';
import { Calendar, Plus, DotsThreeVertical, NotePencil, Prohibit, CheckSquare, Chats } from '@phosphor-icons/react';
import { useSchedule } from '../../schedule/hooks/useSchedule';
import { ScheduleSetupModal } from '../../schedule/components/ScheduleSetupModal';
import { SessionFormModal } from '../../schedule/components/SessionFormModal';
import { notifications } from '@mantine/notifications';
import { ConfirmModal } from '../../../shared';
import AttendanceModal from '../../attendance/components/AttendanceModal';
import SessionFeedbackModal from '../../schedule/components/SessionFeedbackModal';


// Helper quy đổi JS Date sang định dạng Thứ và Ngày Giờ Tiếng Việt
const formatSessionDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = days[date.getDay()];

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const time = formatter.format(date);

  return `${dayName}, ${d}/${m}/${y} - ${time}`;
};

export function ClassSessionsTab({ classDetail }) {
  const classId = classDetail.id;
  const { sessions, loading, pagination, fetchClassSessions, setupRecurring, createSession, updateSession } = useSchedule();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [recurringOpened, setRecurringOpened] = useState(false);
  const [sessionFormOpened, setSessionFormOpened] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [confirmOpened, setConfirmOpened] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [attendanceOpened, setAttendanceOpened] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState(null);
  
  // States cho Nhận xét buổi học
  const [feedbackOpened, setFeedbackOpened] = useState(false);
  const [feedbackSessionId, setFeedbackSessionId] = useState(null);
  const [feedbackSessionTitle, setFeedbackSessionTitle] = useState('');

  const loadData = useCallback((page = 1) => {
    fetchClassSessions(classId, page);
  }, [fetchClassSessions, classId]);

  useEffect(() => {
    loadData(currentPage);
  }, [loadData, currentPage]);

  const handleSaveRecurring = async (payload) => {
    const success = await setupRecurring(classId, payload);
    if (success) {
      setRecurringOpened(false);
      setCurrentPage(1);
      loadData(1);
    }
  };

  const handleSessionSubmit = async (payload) => {
    let success = false;
    if (selectedSession) {
      success = await updateSession(classId, selectedSession.id, payload);
    } else {
      success = await createSession(classId, payload);
    }

    if (success) {
      setSessionFormOpened(false);
      setSelectedSession(null);
      loadData(currentPage);
    }
  };

  const handleCancelSession = (session) => {
    setSessionToCancel(session);
    setConfirmOpened(true);
  };

  const handleConfirmCancel = async () => {
    if (!sessionToCancel) return;
    const success = await updateSession(classId, sessionToCancel.id, {
      status: 'Cancelled'
    });
    if (success) {
      setConfirmOpened(false);
      setSessionToCancel(null);
      loadData(currentPage);
    }
  };


  const handlePlaceholderAction = (actionName) => {
    notifications.show({
      title: 'Thông báo',
      message: `Tính năng ${actionName} đang được phát triển ở Phân hệ tiếp theo.`,
      color: 'blue'
    });
  };

  const getStatusBadge = (session) => {
    if (session.status === 'Cancelled') {
      return <Badge variant="light" color="red">Đã hủy</Badge>;
    }
    if (session.status === 'Completed') {
      return <Badge variant="light" color="teal">Hoàn thành</Badge>;
    }
    
    // Scheduled: Kiểm tra xem đã qua chưa
    const sessionTime = new Date(session.date).getTime();
    const now = new Date().getTime();
    if (sessionTime < now) {
      return <Badge variant="light" color="orange">Chờ điểm danh</Badge>;
    }
    
    return <Badge variant="light" color="blue">Lên lịch</Badge>;
  };

  return (
    <Box>
      {/* ── Header Actions ────────────────────── */}
      <Group justify="space-between" mb="lg">
        <div>
          <Text fw={600} size="lg">Quản lý các Buổi học</Text>
          <Text size="xs" c="dimmed">Xem danh sách buổi học, cấu hình lịch lặp lại hàng tuần hoặc tạo lịch học bù</Text>
        </div>
        <Group gap="xs">
          <Button
            size="sm"
            variant="light"
            color="copper"
            leftSection={<Calendar size={16} />}
            onClick={() => setRecurringOpened(true)}
          >
            Lịch học định kỳ
          </Button>
          <Button
            size="sm"
            color="copper"
            leftSection={<Plus size={16} />}
            onClick={() => {
              setSelectedSession(null);
              setSessionFormOpened(true);
            }}
          >
            Tạo buổi lẻ/bù
          </Button>
        </Group>
      </Group>

      {/* ── Table / Cards List ────────────────── */}
      {loading ? (
        <Center py={50}>
          <Loader color="copper" />
        </Center>
      ) : sessions.length === 0 ? (
        <Card withBorder py={40} style={{ borderStyle: 'dashed' }}>
          <Stack align="center" gap="xs">
            <Calendar size={48} weight="duotone" color="var(--accent-color)" />
            <Text fw={600}>Chưa có buổi học nào</Text>
            <Text size="sm" c="dimmed" ta="center">
              Nhấp "Lịch học định kỳ" để thiết lập lịch tuần tự động sinh hoặc "Tạo buổi lẻ/bù" để thêm buổi học mới.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Card withBorder p={0} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead style={{ backgroundColor: 'var(--card-bg)' }}>
                <Table.Tr>
                  <Table.Th style={{ paddingLeft: 16 }}>STT</Table.Th>
                  <Table.Th>Buổi học</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                  <Table.Th>Trạng thái</Table.Th>
                  <Table.Th style={{ width: 120 }}>Điểm danh</Table.Th>
                  <Table.Th style={{ width: 120 }}>Nhận xét</Table.Th>
                  <Table.Th style={{ textAlign: 'right', paddingRight: 16 }}>Hành động</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sessions.map((session, idx) => (
                  <Table.Tr key={session.id} style={{ opacity: session.status === 'Cancelled' ? 0.6 : 1 }}>
                    <Table.Td style={{ paddingLeft: 16 }}>{idx + 1}</Table.Td>
                    <Table.Td>
                      <Text fw={500} size="sm" style={{ textDecoration: session.status === 'Cancelled' ? 'line-through' : 'none' }}>
                        {session.title || `Buổi học ${idx + 1}`}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formatSessionDateTime(session.date)}
                      </Text>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(session)}</Table.Td>
                    <Table.Td>
                      {session.status !== 'Cancelled' ? (
                        (() => {
                          const sessionTime = new Date(session.date).getTime();
                          const now = new Date().getTime();
                          const isPendingAttendance = session.status === 'Scheduled' && sessionTime < now && !session.hasAttendance;
                          return (
                            <Button
                              size="xs"
                              variant={session.hasAttendance ? "light" : (isPendingAttendance ? "filled" : "outline")}
                              color={session.hasAttendance ? "green" : (isPendingAttendance ? "orange" : "gray")}
                              leftSection={<CheckSquare size={12} />}
                              onClick={() => {
                                setAttendanceSessionId(session.id);
                                setAttendanceOpened(true);
                              }}
                            >
                              {session.hasAttendance ? 'Đã điểm danh' : 'Điểm danh'}
                            </Button>
                          );
                        })()
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {session.status !== 'Cancelled' ? (
                        <Button
                          size="xs"
                          variant={session.hasFeedback ? "light" : "outline"}
                          color={session.hasFeedback ? "green" : "gray"}
                          leftSection={<Chats size={12} />}
                          onClick={() => {
                            setFeedbackSessionId(session.id);
                            setFeedbackSessionTitle(session.title || `Buổi học ${idx + 1}`);
                            setFeedbackOpened(true);
                          }}
                        >
                          {session.hasFeedback ? 'Đã nhận xét' : 'Nhận xét'}
                        </Button>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <Menu shadow="md" width={160} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <DotsThreeVertical size={16} weight="bold" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<NotePencil size={14} />}
                            onClick={() => {
                              setSelectedSession(session);
                              setSessionFormOpened(true);
                            }}
                          >
                            Chỉnh sửa
                          </Menu.Item>
                          {session.status !== 'Cancelled' && (
                            <Menu.Item
                              color="red"
                              leftSection={<Prohibit size={14} />}
                              onClick={() => handleCancelSession(session)}
                            >
                              Hủy buổi học
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <Group justify="center" py="md" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Pagination
                total={pagination.totalPages}
                value={pagination.currentPage}
                onChange={setCurrentPage}
                color="copper"
              />
            </Group>
          )}
        </Card>
      )}

      {/* ── Modals ────────────────────────────── */}
      <ScheduleSetupModal
        opened={recurringOpened}
        onClose={() => setRecurringOpened(false)}
        onSave={handleSaveRecurring}
        classDetail={classDetail}
      />

      <SessionFormModal
        opened={sessionFormOpened}
        onClose={() => {
          setSessionFormOpened(false);
          setSelectedSession(null);
        }}
        onSubmit={handleSessionSubmit}
        initialValues={selectedSession}
      />

      <ConfirmModal
        opened={confirmOpened}
        onClose={() => {
          setConfirmOpened(false);
          setSessionToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Hủy buổi học"
        message={`Bạn có chắc chắn muốn hủy buổi học "${sessionToCancel?.title || 'Buổi học'}" không?`}
        confirmLabel="Hủy buổi học"
        color="red"
        loading={loading}
      />

      <AttendanceModal
        isOpen={attendanceOpened}
        onClose={() => {
          setAttendanceOpened(false);
          setAttendanceSessionId(null);
          loadData(currentPage);
        }}
        sessionId={attendanceSessionId}
      />

      <SessionFeedbackModal
        opened={feedbackOpened}
        onClose={() => {
          setFeedbackOpened(false);
          setFeedbackSessionId(null);
          setFeedbackSessionTitle('');
        }}
        sessionId={feedbackSessionId}
        sessionTitle={feedbackSessionTitle}
        onSaveSuccess={() => loadData(currentPage)}
      />
    </Box>
  );
}

export default ClassSessionsTab;
