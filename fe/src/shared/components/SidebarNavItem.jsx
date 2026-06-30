import { NavLink, useLocation } from 'react-router-dom';
import { Tooltip, UnstyledButton } from '@mantine/core';
import classes from './Sidebar.module.css';

/**
 * SidebarNavItem
 * @param {React.ElementType} icon - Phosphor icon component
 * @param {string} label - Text label
 * @param {string} to - React Router path
 * @param {boolean} collapsed - Whether sidebar is collapsed (icon-only mode)
 * @param {boolean} exact - Match route exactly
 * @param {() => void} onClick - Optional click handler (e.g. logout)
 */
export function SidebarNavItem({ icon: Icon, label, to, collapsed, exact = false, onClick }) {
  const location = useLocation();

  const isActive = exact
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/');

  const inner = (
    <UnstyledButton
      component={to ? NavLink : 'button'}
      to={to}
      onClick={onClick}
      data-active={isActive || undefined}
      className={classes.navItem}
    >
      <span className={classes.navIcon}>
        <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
      </span>
      {!collapsed && <span className={classes.navLabel}>{label}</span>}
    </UnstyledButton>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow offset={8}>
        {inner}
      </Tooltip>
    );
  }

  return inner;
}

export default SidebarNavItem;
