import { useEffect, useState, useCallback, useMemo } from 'react';
import { Group, Button, Card, SimpleGrid, Text, Badge, Select, SegmentedControl, ActionIcon, Title, Center, Loader, Popover, Menu, Divider, Stack, Box } from '@mantine/core';
import { CaretLeft, CaretRight, Calendar, List, Plus, NotePencil, Prohibit, DotsThree, CheckSquare, Chats } from '@phosphor-icons/react';
import { useSchedule } from '../hooks/useSchedule';
import { SessionFormModal } from './SessionFormModal';
import { classService } from '../../classes/services/classService';
import { notifications } from '@mantine/notifications';
import { ConfirmModal } from '../../../shared';
import classes from './SchedulePage.module.css';

// Helper quy đổi JS Date sang định dạng Thứ và Ngày Giờ Tiếng Việt
const formatSessionTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date);
};

const formatFullDateString = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = days[date.getDay()];
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${dayName}, ngày ${d}/${m}/${y}`;
};

export function SchedulePage() {
  const { sessions, loading, fetchPersonalSchedule, updateSession, createSession } = useSchedule();
  
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' hoặc 'timeline'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [classList, setClassList] = useState([]);
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFormOpened, setSessionFormOpened] = useState(false);
  const [isEditSession, setIsEditSession] = useState(false);
  const [confirmOpened, setConfirmOpened] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);


  // Load danh sách lớp học để lọc
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classService.getClasses({ limit: 100 });
        const items = res?.data?.items || res?.items || [];
        setClassList(items);
      } catch (err) {
        console.error('Lỗi tải danh sách lớp:', err);
      }
    };
    fetchClasses();
  }, []);

  // Tính khoảng ngày rộng phủ toàn bộ tháng hiện tại (cả các ngày lề)
  const currentMonthRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Chủ Nhật, 1 = Thứ 2...
    const prevDaysOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Số ngày lùi về tháng trước

    const rangeStart = new Date(year, month, 1 - prevDaysOffset, 0, 0, 0);
    const rangeEnd = new Date(year, month + 1, 15, 23, 59, 59); // Phủ dư thêm tháng sau

    return {
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString()
    };
  }, [currentDate]);

  // Load lịch dạy khi thay đổi tháng
  const loadSchedule = useCallback(() => {
    fetchPersonalSchedule(currentMonthRange.startDate, currentMonthRange.endDate);
  }, [fetchPersonalSchedule, currentMonthRange]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Lọc danh sách buổi học theo Class ID
  const filteredSessions = useMemo(() => {
    if (selectedClassId === 'all') return sessions;
    return sessions.filter(s => s.classId === selectedClassId);
  }, [sessions, selectedClassId]);

  // Nhóm buổi học theo ngày (dùng cho Calendar Grid)
  const sessionsByDateStr = useMemo(() => {
    const map = {};
    filteredSessions.forEach(session => {
      const d = new Date(session.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      if (!map[key]) map[key] = [];
      map[key].push(session);
    });
    return map;
  }, [filteredSessions]);

  // Xây dựng danh sách các ngày để render Grid tháng (35 hoặc 42 ô)
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const cells = [];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 = Mon, 6 = Sun

    // Các ngày của tháng trước để điền đầy dòng đầu
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    for (let i = prevDaysCount - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDaysCount - i),
        isCurrentMonth: false
      });
    }

    // Các ngày của tháng hiện tại
    const currentMonthDaysCount = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentMonthDaysCount; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Các ngày của tháng sau để điền đầy dòng cuối (tổng số ô là bội số của 7)
    const remainingCells = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    // Nếu lịch quá ngắn, tạo thêm 1 dòng nữa (đủ 42 ô) để giao diện cân đối
    if (cells.length <= 35) {
      const startNext = cells[cells.length - 1].date.getDate() + 1;
      for (let i = 0; i < 7; i++) {
        cells.push({
          date: new Date(year, month + 1, startNext + i),
          isCurrentMonth: false
        });
      }
    }

    return cells;
  }, [currentDate]);

  // Điều hướng tháng
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSessionSubmit = async (payload) => {
    let success = false;
    if (isEditSession && selectedSession) {
      success = await updateSession(selectedSession.classId, selectedSession.id, payload);
    } else {
      // Khi tạo buổi học lẻ từ Lịch chung, yêu cầu chọn lớp
      if (selectedClassId === 'all') {
        notifications.show({
          title: 'Yêu cầu',
          message: 'Vui lòng chọn một lớp cụ thể từ bộ lọc phía trên trước khi tạo buổi học lẻ.',
          color: 'yellow'
        });
        return;
      }
      success = await createSession(selectedClassId, payload);
    }

    if (success) {
      setSessionFormOpened(false);
      setSelectedSession(null);
      loadSchedule();
    }
  };

  const handleCancelSession = (session) => {
    setSessionToCancel(session);
    setConfirmOpened(true);
  };

  const handleConfirmCancel = async () => {
    if (!sessionToCancel) return;
    const success = await updateSession(sessionToCancel.classId, sessionToCancel.id, {
      status: 'Cancelled'
    });
    if (success) {
      setConfirmOpened(false);
      setSessionToCancel(null);
      loadSchedule();
    }
  };


  const handlePlaceholderAction = (actionName) => {
    notifications.show({
      title: 'Thông báo',
      message: `Tính năng ${actionName} đang được phát triển ở Phân hệ tiếp theo.`,
      color: 'blue'
    });
  };

  // Group các buổi học theo ngày để hiển thị danh sách dạng Timeline (Lịch tuần)
  const timelineGroup = useMemo(() => {
    const days = [];
    Object.keys(sessionsByDateStr).sort().forEach(dateStr => {
      days.push({
        dateStr,
        date: new Date(dateStr),
        items: sessionsByDateStr[dateStr]
      });
    });
    return days;
  }, [sessionsByDateStr]);

  const monthLabel = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const getSessionStatus = (session) => {
    if (session.status === 'Cancelled') {
      return { label: 'Đã hủy', color: 'red', isPast: false };
    }
    if (session.status === 'Completed') {
      return { label: 'Hoàn thành', color: 'teal', isPast: false };
    }
    
    const sessionTime = new Date(session.date).getTime();
    const now = new Date().getTime();
    if (sessionTime < now) {
      return { label: 'Chờ điểm danh', color: 'orange', isPast: true };
    }
    
    return { label: 'Lên lịch', color: 'blue', isPast: false };
  };

  // Tùy biến màu của buổi học
  const getSessionColorClass = (session) => {
    if (session.status === 'Cancelled') return classes.sessionCancelled;
    if (session.status === 'Completed') return classes.sessionCompleted;
    
    const sessionTime = new Date(session.date).getTime();
    const now = new Date().getTime();
    if (sessionTime < now) return classes.sessionPending;
    
    return classes.sessionScheduled;
  };

  return (
    <div className={classes.root}>
      {/* ── Page Header ─────────────────────────── */}
      <Group justify="space-between" mb="lg" className={classes.header}>
        <div>
          <Title order={2} className={classes.title}>Lịch dạy của tôi</Title>
          <Text size="sm" c="dimmed">Quản lý và theo dõi toàn bộ lịch dạy, buổi học bù của các lớp học</Text>
        </div>
        
        <Group gap="sm">
          {/* Lọc theo lớp học */}
          <Select
            placeholder="Lọc theo lớp học"
            data={[
              { value: 'all', label: 'Tất cả lớp học' },
              ...classList.map(c => ({ value: c.id, label: `${c.name} (${c.classCode})` }))
            ]}
            value={selectedClassId}
            onChange={(val) => setSelectedClassId(val || 'all')}
            style={{ width: 220 }}
          />

          {/* Toggle chuyển đổi View Mode */}
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { label: <Center gap={4}><Calendar size={14} /> Lịch tháng</Center>, value: 'calendar' },
              { label: <Center gap={4}><List size={14} /> Danh sách</Center>, value: 'timeline' },
            ]}
            color="copper"
          />

          <Button
            color="copper"
            leftSection={<Plus size={16} />}
            disabled={selectedClassId === 'all'}
            onClick={() => {
              setSelectedSession(null);
              setIsEditSession(false);
              setSessionFormOpened(true);
            }}
            title={selectedClassId === 'all' ? "Hãy chọn một lớp cụ thể để tạo buổi học" : ""}
          >
            Tạo buổi học
          </Button>
        </Group>
      </Group>

      {/* ── Calendar Navigation Bar ──────────────── */}
      <Group justify="space-between" mb="md" className={classes.navBar}>
        <Group gap="xs">
          <ActionIcon onClick={handlePrevMonth} variant="light" color="gray" size="md">
            <CaretLeft size={16} />
          </ActionIcon>
          <Text fw={600} size="md" style={{ textTransform: 'capitalize', minWidth: 140 }} ta="center">
            {monthLabel}
          </Text>
          <ActionIcon onClick={handleNextMonth} variant="light" color="gray" size="md">
            <CaretRight size={16} />
          </ActionIcon>
        </Group>

        <Button size="xs" variant="outline" color="gray" onClick={handleToday}>
          Hôm nay
        </Button>
      </Group>

      {/* ── Main Content Area ────────────────────── */}
      {loading ? (
        <Center py={100}>
          <Loader color="copper" />
        </Center>
      ) : viewMode === 'calendar' ? (
        /* ── CALENDAR VIEW (MONTHLY GRID) ── */
        <div className={classes.calendarCard}>
          {/* Weekday headers */}
          <SimpleGrid cols={7} spacing="xs" className={classes.weekdayGrid} mb={8}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
              <Text key={idx} size="xs" fw={700} ta="center" c="dimmed" py="xs">
                {day}
              </Text>
            ))}
          </SimpleGrid>

          {/* Monthly dates cells */}
          <SimpleGrid cols={7} spacing="xs" className={classes.dateGrid}>
            {calendarCells.map((cell, idx) => {
              const dateStr = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
              const daySessions = sessionsByDateStr[dateStr] || [];
              const isToday = cell.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={[
                    classes.dateCell,
                    cell.isCurrentMonth ? '' : classes.otherMonthCell,
                    isToday ? classes.todayCell : ''
                  ].join(' ')}
                >
                  {/* Date number */}
                  <Group justify="space-between" align="center" px="xs" pt="xs" mb={4}>
                    <Text
                      size="sm"
                      fw={isToday ? 700 : 500}
                      className={isToday ? classes.todayNum : ''}
                    >
                      {cell.date.getDate()}
                    </Text>
                  </Group>

                  {/* Sessions badges list */}
                  <div className={classes.cellSessionsContainer}>
                    {daySessions.map(session => (
                      <Popover key={session.id} width={260} position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <div className={[classes.sessionBadge, getSessionColorClass(session)].join(' ')}>
                            <span className={classes.sessionTimeStr}>{formatSessionTime(session.date)}</span>
                            <span className={classes.sessionTitleStr}>{session.classCode}</span>
                          </div>
                        </Popover.Target>
                        <Popover.Dropdown p="xs">
                          <Stack gap={6}>
                            <Group justify="space-between">
                              {(() => {
                                const statusInfo = getSessionStatus(session);
                                return (
                                  <Badge size="xs" color={statusInfo.color}>
                                    {statusInfo.label}
                                  </Badge>
                                );
                              })()}
                              <Text size="xs" c="dimmed">{formatSessionTime(session.date)}</Text>
                            </Group>
                            <Text fw={600} size="sm">{session.title || 'Buổi học'}</Text>
                            <Text size="xs" c="dimmed" fw={500}>{session.className} ({session.classCode})</Text>
                            
                            <Divider my={4} />

                            <Group justify="space-between">
                              <Group gap="xs">
                                <ActionIcon
                                  size="sm"
                                  color="blue"
                                  variant="subtle"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setIsEditSession(true);
                                    setSessionFormOpened(true);
                                  }}
                                >
                                  <NotePencil size={14} />
                                </ActionIcon>
                                {session.status !== 'Cancelled' && (
                                  <ActionIcon
                                    size="sm"
                                    color="red"
                                    variant="subtle"
                                    onClick={() => handleCancelSession(session)}
                                  >
                                    <Prohibit size={14} />
                                  </ActionIcon>
                                )}
                              </Group>

                              {session.status !== 'Cancelled' && (
                                <Group gap={4}>
                                  {(() => {
                                    const statusInfo = getSessionStatus(session);
                                    const isPendingAttendance = statusInfo.isPast && !session.hasAttendance;
                                    return (
                                      <Button
                                        size="xs"
                                        variant={session.hasAttendance ? "light" : (isPendingAttendance ? "filled" : "outline")}
                                        color={session.hasAttendance ? "green" : (isPendingAttendance ? "orange" : "gray")}
                                        onClick={() => handlePlaceholderAction('Điểm danh')}
                                      >
                                        Điểm danh
                                      </Button>
                                    );
                                  })()}
                                </Group>
                              )}
                            </Group>
                          </Stack>
                        </Popover.Dropdown>
                      </Popover>
                    ))}
                  </div>
                </div>
              );
            })}
          </SimpleGrid>
        </div>
      ) : (
        /* ── TIMELINE LIST VIEW (WEEKLY LIST) ── */
        <Stack gap="md" className={classes.timelineContainer}>
          {timelineGroup.length === 0 ? (
            <Card withBorder py={60}>
              <Center>
                <Stack align="center" gap="xs">
                  <Calendar size={40} weight="duotone" color="var(--accent-color)" />
                  <Text fw={500}>Không có buổi học nào trong khoảng thời gian này</Text>
                </Stack>
              </Center>
            </Card>
          ) : (
            timelineGroup.map(group => (
              <Card key={group.dateStr} withBorder p="md" className={classes.timelineDayCard}>
                <Text fw={600} size="sm" c="copper" mb="xs">
                  {formatFullDateString(group.date)}
                </Text>
                
                <Stack gap="xs">
                  {group.items.map(session => (
                    <Group key={session.id} justify="space-between" className={classes.timelineSessionRow} py="xs" style={{ opacity: session.status === 'Cancelled' ? 0.6 : 1 }}>
                      <Group gap="md">
                        {/* Time block */}
                        <div className={classes.timeBlock}>
                          <Text fw={700} size="md">{formatSessionTime(session.date)}</Text>
                          <Text size="xs" c="dimmed">Giờ VN</Text>
                        </div>
                        
                        {/* Title and Class info */}
                        <div>
                          <Text fw={600} size="sm" style={{ textDecoration: session.status === 'Cancelled' ? 'line-through' : 'none' }}>
                            {session.title || 'Buổi học'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {session.className} ({session.classCode})
                          </Text>
                        </div>
                      </Group>

                      <Group gap="sm">
                        {(() => {
                          const statusInfo = getSessionStatus(session);
                          return (
                            <Badge variant="light" color={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          );
                        })()}
                        
                        {session.status !== 'Cancelled' && (
                          <Group gap="xs">
                            {(() => {
                              const statusInfo = getSessionStatus(session);
                              const isPendingAttendance = statusInfo.isPast && !session.hasAttendance;
                              return (
                                <Button
                                  size="xs"
                                  variant={session.hasAttendance ? "light" : (isPendingAttendance ? "filled" : "outline")}
                                  color={session.hasAttendance ? "green" : (isPendingAttendance ? "orange" : "gray")}
                                  leftSection={<CheckSquare size={12} />}
                                  onClick={() => handlePlaceholderAction('Điểm danh')}
                                >
                                  {session.hasAttendance ? 'Đã điểm danh' : 'Điểm danh'}
                                </Button>
                              );
                            })()}
                            <Button
                              size="xs"
                              variant={session.hasFeedback ? "light" : "outline"}
                              color={session.hasFeedback ? "green" : "gray"}
                              leftSection={<Chats size={12} />}
                              onClick={() => handlePlaceholderAction('Nhận xét')}
                            >
                              Nhận xét
                            </Button>
                          </Group>
                        )}

                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <DotsThree size={16} weight="bold" />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<NotePencil size={14} />}
                              onClick={() => {
                                setSelectedSession(session);
                                setIsEditSession(true);
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
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* ── Session Edit/Add Modal ──────────────── */}
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
    </div>
  );
}

export default SchedulePage;
