import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Badge,
  ThemeIcon,
  Box,
  Skeleton,
  Button,
} from '@mantine/core';
import {
  ArrowRight,
  CalendarCheck,
  ClipboardText,
  Clock,
  GraduationCap,
  Receipt,
  Users,
  SealCheck,
  BellSimple,
} from '@phosphor-icons/react';
import { useAuth } from '../../auth';
import { studentService } from '../../students/services/studentService';
import { tuitionService } from '../../classes/services/tuition';
import { classService } from '../../classes/services/classService';
import { assignmentService } from '../../classes/services/assignments';
import { scheduleService } from '../../schedule/services/scheduleService';
import classes from './DashboardPage.module.css';

const formatShortDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

const STUDENT_CLASS_STATUS_MAP = {
  Scheduled: { label: 'Sắp khai giảng', color: 'blue' },
  OnGoing: { label: 'Đang học', color: 'teal' },
  Completed: { label: 'Đã hoàn thành', color: 'green' },
  Archived: { label: 'Đã lưu trữ', color: 'gray' },
};

const STUDENT_SESSION_STATUS_MAP = {
  Scheduled: { label: 'Sắp học', color: 'blue' },
  Completed: { label: 'Đã học xong', color: 'green' },
  Cancelled: { label: 'Đã hủy', color: 'red' },
};

const STUDENT_INVOICE_STATUS_MAP = {
  Unpaid: { label: 'Chưa thanh toán', color: 'red' },
  Pending: { label: 'Đang chờ duyệt', color: 'orange' },
  Paid: { label: 'Đã thanh toán', color: 'teal' },
  Approved: { label: 'Đã duyệt', color: 'teal' },
};

const getStudentClassStatus = (status) => STUDENT_CLASS_STATUS_MAP[status] || { label: status || 'Không rõ', color: 'gray' };

const getStudentSessionStatus = (session) => {
  if (!session) return { label: 'Không rõ', color: 'gray' };
  if (session.status === 'Cancelled') return STUDENT_SESSION_STATUS_MAP.Cancelled;
  if (session.status === 'Completed') return STUDENT_SESSION_STATUS_MAP.Completed;

  const dateValue = session.startTime || session.date || session.scheduledAt;
  const isPast = dateValue ? new Date(dateValue).getTime() < Date.now() : false;
  if (isPast && !session.hasAttendance) {
    return { label: 'Chưa điểm danh', color: 'orange' };
  }

  return STUDENT_SESSION_STATUS_MAP.Scheduled;
};

const getStudentInvoiceStatus = (status) => STUDENT_INVOICE_STATUS_MAP[status] || { label: status || 'Chờ xử lý', color: 'gray' };

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

function TeacherDashboard({ user }) {
  const [classLoading, setClassLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [tuitionLoading, setTuitionLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(true);

  const [myClasses, setMyClasses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let alive = true;

    const loadDashboard = async () => {
      if (!alive) return;
      setDashboardError('');
      setClassLoading(true);
      setStudentLoading(true);
      setScheduleLoading(true);
      setTuitionLoading(true);
      setAssignmentLoading(true);

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      try {
        const [classesRes, studentsRes, scheduleRes, tuitionRes, assignmentsRes] = await Promise.allSettled([
          classService.getClasses(),
          studentService.getStudents({ limit: 1 }),
          scheduleService.getPersonalSchedule({ startDate: startOfDay, endDate: endOfDay }),
          tuitionService.getTeacherPendingInvoices(),
          assignmentService.getTeacherUpcomingAssignments({ limit: 5 }),
        ]);

        if (!alive) return;

        // Extract Classes
        if (classesRes.status === 'fulfilled') {
          const val = classesRes.value;
          const classList = Array.isArray(val?.items)
            ? val.items
            : Array.isArray(val?.data?.items)
              ? val.data.items
              : Array.isArray(val)
                ? val
                : [];
          setMyClasses(classList);
        }
        setClassLoading(false);

        // Extract Students Count
        if (studentsRes.status === 'fulfilled') {
          const val = studentsRes.value;
          const count = val?.pagination?.totalItems ?? val?.data?.pagination?.totalItems ?? 0;
          setTotalStudents(count);
        }
        setStudentLoading(false);

        // Extract Today's Sessions
        if (scheduleRes.status === 'fulfilled') {
          const val = scheduleRes.value;
          const sessionList = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
          setTodaySessions(sessionList);
        }
        setScheduleLoading(false);

        // Extract Pending Tuition Invoices
        if (tuitionRes.status === 'fulfilled') {
          const val = tuitionRes.value;
          const invoicesList = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
          setPendingInvoices(invoicesList);
        }
        setTuitionLoading(false);

        // Extract Upcoming Assignments
        if (assignmentsRes.status === 'fulfilled') {
          const val = assignmentsRes.value;
          const assignmentsList = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
          setUpcomingAssignments(assignmentsList);
        }
        setAssignmentLoading(false);

        if (
          classesRes.status === 'rejected' &&
          studentsRes.status === 'rejected' &&
          scheduleRes.status === 'rejected' &&
          tuitionRes.status === 'rejected' &&
          assignmentsRes.status === 'rejected'
        ) {
          setDashboardError('Không thể tải dữ liệu tổng quan lúc này. Vui lòng thử lại sau.');
        }
      } catch {
        if (alive) {
          setDashboardError('Không thể tải dữ liệu tổng quan lúc này. Vui lòng thử lại sau.');
        }
      }
    };

    loadDashboard();
    return () => {
      alive = false;
    };
  }, [user]);

  const summary = useMemo(() => {
    const classCount = myClasses.length;
    const pendingTuitionCount = pendingInvoices.length;
    const todaySessionCount = todaySessions.length;

    return [
      {
        label: 'Lớp đang dạy',
        value: classLoading ? '...' : String(classCount || '0'),
        icon: GraduationCap,
        color: 'copper',
        hint: classCount ? 'Các lớp bạn đang giảng dạy' : 'Chưa có lớp học nào',
        to: '/classes',
      },
      {
        label: 'Tổng học viên',
        value: studentLoading ? '...' : String(totalStudents || '0'),
        icon: Users,
        color: 'prussian',
        hint: totalStudents ? 'Học viên trong các lớp của bạn' : 'Chưa có học viên nào',
        to: '/students',
      },
      {
        label: 'Buổi dạy hôm nay',
        value: scheduleLoading ? '...' : String(todaySessionCount || '0'),
        icon: CalendarCheck,
        color: 'teal',
        hint: todaySessions[0]?.title ? `Gần nhất: ${todaySessions[0].title}` : 'Không có lịch dạy hôm nay',
        to: '/schedule',
      },
      {
        label: 'Chờ duyệt học phí',
        value: tuitionLoading ? '...' : String(pendingTuitionCount || '0'),
        icon: Receipt,
        color: 'yellow',
        hint: pendingTuitionCount ? `${pendingTuitionCount} hóa đơn cần phê duyệt` : 'Không có yêu cầu chờ duyệt',
        to: '/classes',
      },
    ];
  }, [classLoading, studentLoading, scheduleLoading, tuitionLoading, myClasses, totalStudents, todaySessions, pendingInvoices]);

  const quickLinks = [
    { label: 'Quản lý lớp học', to: '/classes', icon: GraduationCap },
    { label: 'Xem lịch dạy', to: '/schedule', icon: CalendarCheck },
    { label: 'Danh sách học viên', to: '/students', icon: Users },
  ];

  const getTeacherSessionStatus = (session) => {
    if (!session) return { label: 'Không rõ', color: 'gray' };
    if (session.status === 'Cancelled') return { label: 'Đã hủy', color: 'red' };
    if (session.status === 'Completed') return { label: 'Hoàn thành', color: 'teal' };

    const dateValue = session.startTime || session.date || session.scheduledAt;
    const isPast = dateValue ? new Date(dateValue).getTime() < Date.now() : false;
    if (isPast) {
      return { label: 'Chờ điểm danh', color: 'orange' };
    }
    return { label: 'Lên lịch', color: 'blue' };
  };

  return (
    <Stack gap="xl">
      <div className={classes.studentHeroCard}>
        <div className={classes.heroCopy}>
          <Badge variant="light" color="copper" w="fit-content">
            Giáo viên
          </Badge>
          <Text size="sm" c="dimmed" mt="sm">{getGreeting()}</Text>
          <Title order={2} className={classes.pageTitle}>{user?.fullName || 'Giáo viên'}</Title>
          <Text c="dimmed" size="sm" maw={580}>
            Đây là bảng điều khiển của bạn. Từ đây có thể quản lý các lớp học đang dạy, lịch dạy hôm nay, bài tập sắp tới và học phí chờ phê duyệt.
          </Text>
          {dashboardError && (
            <Text size="sm" c="red" mt="sm">{dashboardError}</Text>
          )}
        </div>

        <Card withBorder radius="md" className={classes.heroSideCard} p="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">Lối tắt nhanh</Text>
            <ThemeIcon size={34} radius="md" variant="light" color="copper">
              <SealCheck size={18} weight="duotone" />
            </ThemeIcon>
          </Group>
          <Stack gap={8}>
            {quickLinks.map((link) => (
              <Button
                key={link.label}
                component={Link}
                to={link.to}
                variant="light"
                color="copper"
                justify="space-between"
                rightSection={<ArrowRight size={14} />}
                leftSection={<link.icon size={16} weight="duotone" />}
                fullWidth
              >
                {link.label}
              </Button>
            ))}
          </Stack>
        </Card>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {summary.map((stat) => (
          <Card
            key={stat.label}
            component={stat.to ? Link : 'div'}
            {...(stat.to ? { to: stat.to } : {})}
            withBorder
            radius="md"
            className={classes.statCard}
            p="lg"
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={500}>{stat.label}</Text>
                <Title order={2} className={classes.statValue}>{stat.value}</Title>
                <Text size="xs" c="dimmed">{stat.hint}</Text>
              </Stack>
              <ThemeIcon size={44} radius="md" variant="light" color={stat.color}>
                <stat.icon size={22} weight="duotone" />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <Clock size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Lịch dạy hôm nay</Text>
              </Group>
              <Text component={Link} to="/schedule" size="xs" c="copper" className={classes.viewAllLink}>
                Mở lịch <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </Text>
            </Group>

            {scheduleLoading ? (
              <Stack gap="sm">
                <Skeleton height={64} radius="md" />
                <Skeleton height={64} radius="md" />
                <Skeleton height={64} radius="md" />
              </Stack>
            ) : todaySessions.length > 0 ? (
              <Stack gap={8}>
                {todaySessions.map((item) => {
                  const status = getTeacherSessionStatus(item);
                  return (
                    <Card key={item.id} withBorder radius="sm" p="sm" className={classes.listItem}>
                      <Group justify="space-between" align="center">
                        <div>
                          <Text size="sm" fw={600}>{item.title || 'Buổi học'}</Text>
                          <Text size="xs" c="dimmed">{item.className || item.class?.name || 'Lịch dạy'}</Text>
                        </div>
                        <Stack gap={2} align="flex-end">
                          <Badge size="xs" variant="light" color={status.color}>
                            {status.label}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {formatShortDate(item.date || item.startTime || item.scheduledAt)}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              <Box py="md">
                <Text size="sm" fw={600}>Không có lịch dạy hôm nay</Text>
                <Text size="sm" c="dimmed">
                  Hôm nay bạn không có lịch dạy nào được xếp lịch.
                </Text>
              </Box>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <Receipt size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Học phí chờ duyệt</Text>
              </Group>
              <Text component={Link} to="/classes" size="xs" c="copper" className={classes.viewAllLink}>
                Xem tất cả lớp <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </Text>
            </Group>

            {tuitionLoading ? (
              <Stack gap="sm">
                <Skeleton height={56} radius="md" />
                <Skeleton height={56} radius="md" />
                <Skeleton height={56} radius="md" />
              </Stack>
            ) : pendingInvoices.length > 0 ? (
              <Stack gap={8}>
                {pendingInvoices.map((invoice) => (
                  <Card key={invoice.id} withBorder radius="sm" p="sm" className={classes.listItem}>
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={600}>
                          {invoice.student?.fullName || 'Học sinh ẩn danh'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {invoice.title || invoice.billingMonth || 'Hóa đơn học phí'} ({invoice.class?.name || 'Lớp học'})
                        </Text>
                      </div>
                      <Stack gap={2} align="flex-end">
                        <Badge size="xs" variant="light" color="orange">
                          Chờ duyệt
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {invoice.amount ? `${Number(invoice.amount).toLocaleString('vi-VN')} đ` : 'Chờ kiểm tra'}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box py="md">
                <Text size="sm" fw={600}>Chưa có yêu cầu duyệt học phí</Text>
                <Text size="sm" c="dimmed">
                  Khi học sinh nộp minh chứng chuyển khoản học phí, các yêu cầu chờ duyệt sẽ xuất hiện tại đây.
                </Text>
              </Box>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Grid gutter="md">
        <Grid.Col span={12}>
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <ClipboardText size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Bài tập sắp tới (Toàn bộ các lớp)</Text>
              </Group>
            </Group>

            {assignmentLoading ? (
              <Stack gap="sm">
                <Skeleton height={56} radius="md" />
                <Skeleton height={56} radius="md" />
              </Stack>
            ) : upcomingAssignments.length > 0 ? (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {upcomingAssignments.map((item) => {
                  const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <Card key={item.id} withBorder radius="sm" p="sm" className={classes.listItem}>
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" fw={600}>{item.title}</Text>
                          <Text size="xs" c="dimmed">{item.class?.name || 'Lớp học'}</Text>
                        </div>
                        <Badge size="xs" variant="light" color={daysLeft === 0 ? 'red' : daysLeft <= 2 ? 'orange' : 'gray'}>
                          {daysLeft === 0 ? 'Hôm nay hết hạn' : daysLeft < 0 ? 'Đã hết hạn' : `Còn ${daysLeft} ngày`}
                        </Badge>
                      </Group>
                    </Card>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Box py="md">
                <Text size="sm" fw={600}>Không có bài tập sắp tới</Text>
                <Text size="sm" c="dimmed">
                  Hiện không có bài tập nào sắp hết hạn nộp.
                </Text>
              </Box>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Group gap={8}>
            <GraduationCap size={18} weight="duotone" color="var(--accent-color)" />
            <Text fw={600} size="sm">Lớp học đang dạy</Text>
          </Group>
          <Text component={Link} to="/classes" size="xs" c="copper" className={classes.viewAllLink}>
            Xem tất cả <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
          </Text>
        </Group>

        {classLoading ? (
          <Stack gap="sm">
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
          </Stack>
        ) : myClasses.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {myClasses.map((cls) => (
              <Card key={cls.id} component={Link} to={`/classes/${cls.id}`} withBorder radius="md" p="md" className={classes.listItem}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap={8} mb={4}>
                      <Text fw={600}>{cls.name}</Text>
                      <Badge size="xs" variant="light" color="copper">
                        {cls.classCode}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {cls.subject?.name || 'Chưa cấu hình môn'} · {cls.teacher?.fullName || 'Bạn giảng dạy'}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {cls.schedules?.length > 0
                        ? cls.schedules.map((sch) => `Thứ ${sch.dayOfWeek} ${sch.startTime}-${sch.endTime}`).join(' · ')
                        : 'Chưa có lịch cố định'}
                    </Text>
                  </div>
                  <Stack gap={2} align="flex-end">
                    <Badge
                      size="xs"
                      variant="light"
                      color={cls.status === 'OnGoing' ? 'teal' : cls.status === 'Scheduled' ? 'blue' : 'gray'}
                    >
                      {cls.status === 'OnGoing' ? 'Đang dạy' : cls.status === 'Scheduled' ? 'Sắp mở' : 'Đã kết thúc'}
                    </Badge>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Box py="md">
            <Text size="sm" fw={600}>Chưa có lớp học nào</Text>
            <Text size="sm" c="dimmed">
              Bạn chưa tạo lớp học nào trong hệ thống. Nhấp vào Lối tắt nhanh để tạo mới.
            </Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}

function StudentDashboard({ user }) {
  const [classLoading, setClassLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [myClasses, setMyClasses] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let alive = true;

    const loadDashboard = async () => {
      setDashboardError('');
      setClassLoading(true);
      setScheduleLoading(true);
      setInvoiceLoading(true);

      try {
        const [classesRes, scheduleRes, invoiceRes] = await Promise.allSettled([
          studentService.getMyClasses(),
          studentService.getMySchedule({
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          tuitionService.getStudentInvoices(),
        ]);

        if (!alive) return;

        const classesData = classesRes.status === 'fulfilled' ? classesRes.value : null;
        const scheduleData = scheduleRes.status === 'fulfilled' ? scheduleRes.value : null;
        const invoiceData = invoiceRes.status === 'fulfilled' ? invoiceRes.value : null;

        const classList = Array.isArray(classesData?.items)
          ? classesData.items
          : Array.isArray(classesData?.data?.items)
            ? classesData.data.items
            : Array.isArray(classesData)
              ? classesData
              : [];
        const scheduleList = Array.isArray(scheduleData?.items)
          ? scheduleData.items
          : Array.isArray(scheduleData?.data?.items)
            ? scheduleData.data.items
            : Array.isArray(scheduleData)
              ? scheduleData
              : [];
        const invoiceList = Array.isArray(invoiceData?.items)
          ? invoiceData.items
          : Array.isArray(invoiceData?.data?.items)
            ? invoiceData.data.items
            : Array.isArray(invoiceData)
              ? invoiceData
              : [];

        if (classesRes.status === 'rejected' && scheduleRes.status === 'rejected' && invoiceRes.status === 'rejected') {
          setDashboardError('Không thể tải dữ liệu tổng quan lúc này. Vui lòng thử lại sau.');
        }

        setMyClasses(classList.slice(0, 4));
        setScheduleItems(scheduleList.slice(0, 4));
        setInvoices(invoiceList.slice(0, 4));
      } catch {
        if (alive) {
          setDashboardError('Không thể tải dữ liệu tổng quan lúc này. Vui lòng thử lại sau.');
        }
      } finally {
        if (alive) {
          setClassLoading(false);
          setScheduleLoading(false);
          setInvoiceLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      alive = false;
    };
  }, [user]);

  const summary = useMemo(() => {
    const classCount = myClasses.length;
    const upcomingSessions = scheduleItems.length;
    const unpaidInvoices = invoices.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      return status && status !== 'paid' && status !== 'approved';
    }).length;
    const nextDueInvoice = invoices[0];

    return [
      {
        label: 'Lớp đang học',
        value: String(classCount || '0'),
        icon: GraduationCap,
        color: 'copper',
        hint: classCount ? 'Các lớp bạn đã ghi danh' : 'Chưa có dữ liệu lớp',
        to: '/classes',
      },
      {
        label: 'Buổi sắp tới',
        value: String(upcomingSessions || '0'),
        icon: CalendarCheck,
        color: 'teal',
        hint: scheduleItems[0]?.title ? `Gần nhất: ${scheduleItems[0].title}` : 'Chưa có lịch gần đây',
        to: '/schedule',
      },
      {
        label: 'Hóa đơn chờ xử lý',
        value: String(unpaidInvoices || '0'),
        icon: Receipt,
        color: 'yellow',
        hint: nextDueInvoice?.billingMonth ? `Kỳ ${nextDueInvoice.billingMonth}` : 'Không có hóa đơn mới',
      },
      {
        label: 'Việc cần làm',
        value: String(Math.max(0, upcomingSessions + unpaidInvoices)),
        icon: BellSimple,
        color: 'prussian',
        hint: 'Tổng lịch học và học phí cần theo dõi',
        to: '/schedule',
      },
    ];
  }, [invoices, myClasses, scheduleItems]);

  const quickLinks = [
    { label: 'Xem lớp của tôi', to: '/classes', icon: GraduationCap },
    { label: 'Mở lịch học', to: '/schedule', icon: CalendarCheck },
    { label: 'Xem hồ sơ', to: '/profile', icon: ClipboardText },
  ];

  const upcomingFocus = scheduleItems.map((item) => ({
    id: item.sessionId || item.id || `${item.date}-${item.title}`,
    title: item.title || 'Buổi học',
    subtitle: item.className || item.class?.name || 'Lịch học',
    dateLabel: formatShortDate(item.date || item.startTime || item.scheduledAt),
    status: getStudentSessionStatus(item),
  }));

  return (
    <Stack gap="xl">
      <div className={classes.studentHeroCard}>
        <div className={classes.heroCopy}>
          <Badge variant="light" color="copper" w="fit-content">
            Học sinh
          </Badge>
          <Text size="sm" c="dimmed" mt="sm">{getGreeting()}</Text>
          <Title order={2} className={classes.pageTitle}>{user?.fullName || 'Học sinh'}</Title>
          <Text c="dimmed" size="sm" maw={580}>
            Đây là bảng điều khiển của bạn. Từ đây có thể xem lớp đang học, lịch học, bài tập và học phí cần xử lý.
          </Text>
          {dashboardError && (
            <Text size="sm" c="red" mt="sm">{dashboardError}</Text>
          )}
        </div>

        <Card withBorder radius="md" className={classes.heroSideCard} p="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">Lối tắt nhanh</Text>
            <ThemeIcon size={34} radius="md" variant="light" color="copper">
              <SealCheck size={18} weight="duotone" />
            </ThemeIcon>
          </Group>
          <Stack gap={8}>
            {quickLinks.map((link) => (
              <Button
                key={link.label}
                component={Link}
                to={link.to}
                variant="light"
                color="copper"
                justify="space-between"
                rightSection={<ArrowRight size={14} />}
                leftSection={<link.icon size={16} weight="duotone" />}
                fullWidth
              >
                {link.label}
              </Button>
            ))}
          </Stack>
        </Card>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {summary.map((stat) => (
          <Card
            key={stat.label}
            component={stat.to ? Link : 'div'}
            {...(stat.to ? { to: stat.to } : {})}
            withBorder
            radius="md"
            className={classes.statCard}
            p="lg"
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={500}>{stat.label}</Text>
                <Title order={2} className={classes.statValue}>{stat.value}</Title>
                <Text size="xs" c="dimmed">{stat.hint}</Text>
              </Stack>
              <ThemeIcon size={44} radius="md" variant="light" color={stat.color}>
                <stat.icon size={22} weight="duotone" />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <Clock size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Lịch học sắp tới</Text>
              </Group>
              <Text component={Link} to="/schedule" size="xs" c="copper" className={classes.viewAllLink}>
                Mở lịch <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </Text>
            </Group>

            {scheduleLoading ? (
              <Stack gap="sm">
                <Skeleton height={64} radius="md" />
                <Skeleton height={64} radius="md" />
                <Skeleton height={64} radius="md" />
              </Stack>
            ) : upcomingFocus.length > 0 ? (
              <Stack gap={8}>
                {upcomingFocus.map((item) => (
                  <Card key={item.id} withBorder radius="sm" p="sm" className={classes.listItem}>
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={600}>{item.title}</Text>
                        <Text size="xs" c="dimmed">{item.subtitle}</Text>
                      </div>
                      <Stack gap={2} align="flex-end">
                        <Badge size="xs" variant="light" color={item.status.color}>
                          {item.status.label}
                        </Badge>
                        <Text size="xs" c="dimmed">{item.dateLabel}</Text>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box py="md">
                <Text size="sm" fw={600}>Chưa có lịch học gần đây</Text>
                <Text size="sm" c="dimmed">
                  Khi giáo viên xếp lịch hoặc tạo buổi học mới, bạn sẽ thấy tại đây.
                </Text>
              </Box>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <Receipt size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Học phí gần nhất</Text>
              </Group>
              <Text component={Link} to="/profile" size="xs" c="copper" className={classes.viewAllLink}>
                Xem hồ sơ <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </Text>
            </Group>

            {invoiceLoading ? (
              <Stack gap="sm">
                <Skeleton height={56} radius="md" />
                <Skeleton height={56} radius="md" />
                <Skeleton height={56} radius="md" />
              </Stack>
            ) : invoices.length > 0 ? (
              <Stack gap={8}>
                {invoices.map((invoice) => (
                  <Card key={invoice.id} withBorder radius="sm" p="sm" className={classes.listItem}>
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={600}>
                          {invoice.title || invoice.billingMonth || 'Hóa đơn học phí'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {invoice.class?.name || invoice.className || 'Học phí lớp học'}
                        </Text>
                      </div>
                      <Stack gap={2} align="flex-end">
                        <Badge
                          size="xs"
                          variant="light"
                          color={getStudentInvoiceStatus(invoice.status).color}
                        >
                          {getStudentInvoiceStatus(invoice.status).label}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {invoice.amount ? `${Number(invoice.amount).toLocaleString('vi-VN')} đ` : 'Chưa có số tiền'}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box py="md">
                <Text size="sm" fw={600}>Chưa có hóa đơn nào</Text>
                <Text size="sm" c="dimmed">
                  Khi giáo viên phát hành hóa đơn mới, nó sẽ hiển thị ở đây để bạn theo dõi và thanh toán.
                </Text>
              </Box>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Group gap={8}>
            <GraduationCap size={18} weight="duotone" color="var(--accent-color)" />
            <Text fw={600} size="sm">Lớp học của tôi</Text>
          </Group>
          <Text component={Link} to="/classes" size="xs" c="copper" className={classes.viewAllLink}>
            Xem tất cả <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
          </Text>
        </Group>

        {classLoading ? (
          <Stack gap="sm">
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
          </Stack>
        ) : myClasses.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {myClasses.map((cls) => (
              <Card key={cls.id} withBorder radius="md" p="md" className={classes.listItem}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap={8} mb={4}>
                      <Text fw={600}>{cls.name}</Text>
                      <Badge size="xs" variant="light" color="copper">
                        {cls.classCode}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {cls.subject?.name || 'Chưa có môn học'} · {cls.teacher?.fullName || 'Chưa có giáo viên'}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {cls.schedules?.length > 0
                        ? cls.schedules.map((sch) => `Thứ ${sch.dayOfWeek} ${sch.startTime}-${sch.endTime}`).join(' · ')
                        : 'Chưa có lịch cố định'}
                    </Text>
                  </div>
                  <Stack gap={2} align="flex-end">
                    <Badge
                      size="xs"
                      variant="light"
                      color={getStudentClassStatus(cls.status).color}
                    >
                      {getStudentClassStatus(cls.status).label}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {cls.counts?.sessions || 0} buổi
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Box py="md">
            <Text size="sm" fw={600}>Chưa có lớp học nào</Text>
            <Text size="sm" c="dimmed">
              Nếu bạn đã được ghi danh, lớp học sẽ xuất hiện ở đây.
            </Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  return isStudent ? <StudentDashboard user={user} /> : <TeacherDashboard user={user} />;
}

export default DashboardPage;
