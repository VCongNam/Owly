import { Grid, Card, Text, Title, Group, Stack, Badge, ThemeIcon, SimpleGrid } from '@mantine/core';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CurrencyCircleDollar,
  ArrowRight,
  ClipboardText,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import classes from './DashboardPage.module.css';

// ── Mock data (kết nối API sau) ─────────────────────────────────────────────
const STATS = [
  {
    label: 'Lớp đang dạy',
    value: '4',
    icon: GraduationCap,
    color: 'copper',
    to: '/classes',
  },
  {
    label: 'Tổng học viên',
    value: '87',
    icon: Users,
    color: 'prussian',
    to: '/students',
  },
  {
    label: 'Buổi học hôm nay',
    value: '2',
    icon: CalendarCheck,
    color: 'teal',
    to: '/schedule',
  },
  {
    label: 'Chờ duyệt học phí',
    value: '3',
    icon: CurrencyCircleDollar,
    color: 'yellow',
    to: '/classes',
  },
];

const RECENT_CLASSES = [
  { id: '1', name: 'Toán 12A1', subject: 'Toán học', students: 24, status: 'active' },
  { id: '2', name: 'Lý 11B', subject: 'Vật lý', students: 20, status: 'active' },
  { id: '3', name: 'Hóa 10C', subject: 'Hóa học', students: 18, status: 'active' },
];

const UPCOMING_DEADLINES = [
  { id: '1', name: 'BT Đạo hàm số 3', class: 'Toán 12A1', daysLeft: 2 },
  { id: '2', name: 'Bài tự luận lý thuyết', class: 'Lý 11B', daysLeft: 0 },
  { id: '3', name: 'BT Phương trình hóa học', class: 'Hóa 10C', daysLeft: 5 },
];
// ────────────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  return (
    <Stack gap="xl">
      {/* ── Header ──────────────────────────────── */}
      <div>
        <Text size="sm" c="dimmed">{greeting} 👋</Text>
        <Title order={2} className={classes.pageTitle}>
          {user?.fullName || 'Giáo viên'}
        </Title>
      </div>

      {/* ── Stat Cards ─────────────────────────── */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {STATS.map((stat) => (
          <Card
            key={stat.label}
            component={Link}
            to={stat.to}
            withBorder
            radius="md"
            className={classes.statCard}
            p="lg"
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={500}>{stat.label}</Text>
                <Title order={2} className={classes.statValue}>{stat.value}</Title>
              </Stack>
              <ThemeIcon
                size={44}
                radius="md"
                variant="light"
                color={stat.color}
              >
                <stat.icon size={22} weight="duotone" />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* ── Two-column panels ──────────────────── */}
      <Grid gutter="md">
        {/* Lớp gần đây */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <GraduationCap size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Lớp gần đây</Text>
              </Group>
              <Text
                component={Link}
                to="/classes"
                size="xs"
                c="copper"
                className={classes.viewAllLink}
              >
                Xem tất cả <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </Text>
            </Group>

            <Stack gap={8}>
              {RECENT_CLASSES.map((cls) => (
                <Card
                  key={cls.id}
                  component={Link}
                  to={`/classes/${cls.id}`}
                  withBorder
                  radius="sm"
                  p="sm"
                  className={classes.listItem}
                >
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={600}>{cls.name}</Text>
                      <Text size="xs" c="dimmed">{cls.subject}</Text>
                    </div>
                    <Badge size="xs" variant="light" color="copper" leftSection={
                      <Users size={10} />
                    }>
                      {cls.students}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Bài tập sắp hết hạn */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Group gap={8}>
                <ClipboardText size={18} weight="duotone" color="var(--accent-color)" />
                <Text fw={600} size="sm">Bài tập sắp hết hạn</Text>
              </Group>
            </Group>

            <Stack gap={8}>
              {UPCOMING_DEADLINES.map((item) => (
                <Card key={item.id} withBorder radius="sm" p="sm" className={classes.listItem}>
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={600}>{item.name}</Text>
                      <Text size="xs" c="dimmed">{item.class}</Text>
                    </div>
                    <Badge
                      size="xs"
                      variant="light"
                      color={item.daysLeft === 0 ? 'red' : item.daysLeft <= 2 ? 'orange' : 'gray'}
                    >
                      {item.daysLeft === 0 ? 'Hôm nay' : `${item.daysLeft} ngày`}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default DashboardPage;
