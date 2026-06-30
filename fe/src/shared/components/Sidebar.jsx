import { useState, useEffect } from 'react';
import { Avatar, Tooltip, Badge, useMantineColorScheme } from '@mantine/core';
import {
  SquaresFour,
  GraduationCap,
  Users,
  CalendarCheck,
  Archive,
  UserCircle,
  LockKey,
  SignOut,
  CaretLeft,
  CaretRight,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import { SidebarNavItem } from './SidebarNavItem';
import { useAuth } from '../../features/auth';
import classes from './Sidebar.module.css';

const STORAGE_KEY = 'owly_sidebar_collapsed';

const NAV_SECTIONS = [
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
      { icon: LockKey, label: 'Đổi mật khẩu', to: '/change-password' },
    ],
  },
];

export function Sidebar() {
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
  const teacherCode = user?.teacherCode || '';
  const packageType = user?.packageType || 'Free';

  return (
    <nav className={classes.sidebar} data-collapsed={collapsed}>
      {/* ── Logo ─────────────────────────────── */}
      <div className={classes.logo}>
        <div className={classes.logoInner}>
          <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>🦉</span>
          <span className={classes.logoText}>Owly</span>
        </div>
        <button
          className={classes.collapseBtn}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed
            ? <CaretRight size={16} weight="bold" />
            : <CaretLeft size={16} weight="bold" />
          }
        </button>
      </div>

      {/* ── Profile mini ─────────────────────── */}
      {collapsed ? (
        <Tooltip label={avatarName} position="right" withArrow offset={8}>
          <div className={classes.profile} style={{ justifyContent: 'center', padding: '12px 0' }}>
            <Avatar name={avatarName} size={32} radius="xl" color="copper" />
          </div>
        </Tooltip>
      ) : (
        <div className={classes.profile}>
          <Avatar name={avatarName} size={32} radius="xl" color="copper" />
          <div className={classes.profileText}>
            <div className={classes.profileName}>{user?.fullName || user?.email}</div>
            <div className={classes.profileSub}>
              {teacherCode && `${teacherCode} · `}
              <Badge
                size="xs"
                variant="light"
                color={packageType === 'Premium' ? 'yellow' : 'gray'}
                style={{ verticalAlign: 'middle' }}
              >
                {packageType}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────── */}
      <div className={classes.navScroll}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className={classes.sectionLabel}>{section.label}</div>
            )}
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                exact={item.exact}
                collapsed={collapsed}
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
