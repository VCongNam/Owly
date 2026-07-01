import { Routes, Route, Navigate, NavLink, useParams } from 'react-router-dom';
import { Group, Text, Badge, Breadcrumbs, Anchor, Loader, Center } from '@mantine/core';
import {
  MegaphoneSimple,
  CalendarBlank,
  Student,
  Folder,
  ClipboardText,
  ChartBar,
  CurrencyCircleDollar,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useClassDetails } from '../hooks/useClasses';
import classes from './ClassDetailPage.module.css';

// ── Tab configuration ────────────────────────────────────────────────────────
const TABS = [
  { key: 'stream',      label: 'Bảng tin',    icon: MegaphoneSimple },
  { key: 'sessions',    label: 'Buổi học',     icon: CalendarBlank },
  { key: 'members',     label: 'Học viên',     icon: Student },
  { key: 'materials',   label: 'Học liệu',     icon: Folder },
  { key: 'assignments', label: 'Bài tập',      icon: ClipboardText },
  { key: 'gradebook',   label: 'Sổ điểm',      icon: ChartBar },
  { key: 'tuition',     label: 'Học phí',      icon: CurrencyCircleDollar },
];

// ── Placeholder tab content ──────────────────────────────────────────────────
function PlaceholderTab({ tab }) {
  return (
    <div className={classes.placeholder}>
      <tab.icon size={48} weight="duotone" color="var(--accent-color)" />
      <Text size="lg" fw={600} mt="md">{tab.label}</Text>
      <Text size="sm" c="dimmed">Tính năng đang phát triển cho lớp học này</Text>
    </div>
  );
}

export function ClassDetailPage() {
  const { classId } = useParams();
  const { classDetail: cls, loading } = useClassDetails(classId);

  if (loading) {
    return (
      <Center py={100}>
        <Loader color="copper" />
      </Center>
    );
  }

  if (!cls) {
    return (
      <Center py={100}>
        <Text c="dimmed">Không tìm thấy lớp học</Text>
      </Center>
    );
  }

  return (
    <div className={classes.root}>
      {/* ── Breadcrumb ──────────────────────────── */}
      <Breadcrumbs mb="xs" separator="›" classNames={{ breadcrumb: classes.breadcrumb }}>
        <Anchor component={Link} to="/classes" size="sm" c="dimmed">Lớp của tôi</Anchor>
        <Text size="sm" fw={500}>{cls.name}</Text>
      </Breadcrumbs>

      {/* ── Class Header ────────────────────────── */}
      <Group gap={12} mb="lg" align="center">
        <div>
          <Group gap={10} align="center">
            <Text className={classes.className}>{cls.name}</Text>
            <Badge size="sm" variant="light" color={cls.status === 'Active' ? 'green' : 'gray'}>
              {cls.status}
            </Badge>
            <Badge size="sm" variant="dot" color="teal">0 học viên</Badge>
          </Group>
        </div>
      </Group>

      {/* ── Tab Bar ─────────────────────────────── */}
      <div className={classes.tabBar}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={`/classes/${classId}/${tab.key}`}
            className={({ isActive }) =>
              [classes.tab, isActive ? classes.tabActive : ''].join(' ')
            }
          >
            <tab.icon size={15} weight="duotone" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────── */}
      <div className={classes.tabContent}>
        <Routes>
          <Route index element={<Navigate to="stream" replace />} />
          {TABS.map((tab) => (
            <Route
              key={tab.key}
              path={tab.key}
              element={<PlaceholderTab tab={tab} />}
            />
          ))}
        </Routes>
      </div>
    </div>
  );
}

export default ClassDetailPage;
