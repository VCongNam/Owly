import { useState, useEffect } from 'react';
import { Avatar, Tooltip, Badge, useMantineColorScheme } from '@mantine/core';
import {
  SquaresFour,
  GraduationCap,
  Users,
  CalendarCheck,
  Archive,
  UserCircle,
  SignOut,
  CaretLeft,
  CaretRight,
  Sun,
  Moon,
  ChatTeardropText,
} from '@phosphor-icons/react';
import { SidebarNavItem } from './SidebarNavItem';
import { useAuth } from '../../features/auth';
import classes from './Sidebar.module.css';

const STORAGE_KEY = 'owly_sidebar_collapsed';

const TEACHER_NAV_SECTIONS = [
  {
    label: null,
    items: [
      { icon: SquaresFour, label: 'Tổng quan', to: '/', exact: true },
    ],
  },
  {
    label: 'LỚP HỌC',
    items: [
      { icon: GraduationCap, label: 'Lớp của tôi', to: '/classes' },
      { icon: Users, label: 'Học viên', to: '/students' },
      { icon: CalendarCheck, label: 'Lịch & Điểm danh', to: '/schedule' },
    ],
  },
  {
    label: 'NỘI DUNG',
    items: [
      { icon: Archive, label: 'Kho lớp cũ', to: '/classes/archived' },
    ],
  },
  {
    label: 'TÀI KHOẢN',
    items: [
      { icon: UserCircle, label: 'Hồ sơ cá nhân', to: '/profile' },
      { icon: ChatTeardropText, label: 'Phản hồi hệ thống', action: 'feedback' },
    ],
  },
];

const STUDENT_NAV_SECTIONS = [
  {
    label: null,
    items: [
      { icon: SquaresFour, label: 'Tổng quan', to: '/', exact: true },
    ],
  },
  {
    label: 'LỚP HỌC',
    items: [
      { icon: GraduationCap, label: 'Lớp học của tôi', to: '/classes' },
      { icon: CalendarCheck, label: 'Lịch học', to: '/schedule' },
    ],
  },
  {
    label: 'TÀI KHOẢN',
    items: [
      { icon: UserCircle, label: 'Hồ sơ cá nhân', to: '/profile' },
      { icon: ChatTeardropText, label: 'Phản hồi hệ thống', action: 'feedback' },
    ],
  },
];

export function Sidebar({ onOpenFeedback }) {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const avatarName = user?.fullName || user?.email || 'GV';
  const isStudent = user?.role === 'student';
  const userCode = isStudent ? user?.studentCode : (user?.teacherCode || '');
  const packageType = user?.packageType || 'Free';

  const navSections = isStudent ? STUDENT_NAV_SECTIONS : TEACHER_NAV_SECTIONS;

  return (
    <nav className={classes.sidebar} data-collapsed={collapsed}>
      {/* ── Profile mini & Collapse Button ────── */}
      {collapsed ? (
        <Tooltip label={avatarName} position="right" withArrow offset={8}>
          <div className={classes.profile} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
            <Avatar src={user?.account?.avatarUrl} name={avatarName} size={32} radius="xl" color="copper" />
            <button
              className={classes.collapseBtn}
              onClick={() => setCollapsed((v) => !v)}
              title="Mở rộng sidebar"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </Tooltip>
      ) : (
        <div className={classes.profile}>
          <Avatar src={user?.account?.avatarUrl} name={avatarName} size={32} radius="xl" color="copper" />
          <div className={classes.profileText}>
            <div className={classes.profileName}>{user?.fullName || user?.email}</div>
            <div className={classes.profileSub}>
              {userCode && `${userCode}`}
              {!isStudent && ` · `}
              {!isStudent && (
                <Badge
                  size="xs"
                  variant="light"
                  color={packageType === 'Premium' ? 'yellow' : 'gray'}
                  style={{ verticalAlign: 'middle' }}
                >
                  {packageType}
                </Badge>
              )}
            </div>
          </div>
          <button
            className={classes.collapseBtn}
            onClick={() => setCollapsed((v) => !v)}
            title="Thu gọn sidebar"
            style={{ marginLeft: '8px' }}
          >
            <CaretLeft size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* ── Navigation ───────────────────────── */}
      <div className={classes.navScroll}>
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className={classes.sectionLabel}>{section.label}</div>
            )}
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                to={item.to}
                exact={item.exact}
                collapsed={collapsed}
                onClick={item.action === 'feedback' ? onOpenFeedback : item.onClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Bottom actions ────────────────────── */}
      <div className={classes.bottomSection}>
        {/* Theme toggle */}
        {collapsed ? (
          <Tooltip label={isDark ? 'Chế độ sáng' : 'Chế độ tối'} position="right" withArrow offset={8}>
            <button
              className={classes.themeToggleBtn}
              onClick={toggleColorScheme}
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun size={18} weight="duotone" />
                : <Moon size={18} weight="duotone" />
              }
            </button>
          </Tooltip>
        ) : (
          <button
            className={classes.themeToggleRow}
            onClick={toggleColorScheme}
            aria-label="Toggle theme"
          >
            <span className={classes.navIcon}>
              {isDark
                ? <Sun size={18} weight="duotone" />
                : <Moon size={18} weight="duotone" />
              }
            </span>
            <span className={classes.navLabel}>
              {isDark ? 'Chế độ sáng' : 'Chế độ tối'}
            </span>
          </button>
        )}

        <SidebarNavItem
          icon={SignOut}
          label="Đăng xuất"
          collapsed={collapsed}
          onClick={logout}
        />
      </div>
    </nav>
  );
}

export default Sidebar;
