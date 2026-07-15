import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Drawer, ActionIcon, Burger } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import { FeedbackDrawer } from '../../features/feedback/components/FeedbackDrawer';
import classes from './DashboardLayout.module.css';

export function DashboardLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className={classes.shell}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar onOpenFeedback={() => setFeedbackOpen(true)} />
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          opened={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          withCloseButton={false}
          padding={0}
          size="auto"
          styles={{
            body: { padding: 0, height: '100%' },
            content: { borderRadius: 0 },
          }}
        >
          <Sidebar onOpenFeedback={() => {
            setFeedbackOpen(true);
            setDrawerOpen(false); // Đóng sidebar mobile khi mở feedback
          }} />
        </Drawer>
      )}

      {/* Main Content */}
      <div className={classes.main}>
        {/* Mobile TopBar */}
        {isMobile && (
          <div className={classes.mobileTopbar}>
            <Burger
              opened={drawerOpen}
              onClick={() => setDrawerOpen((o) => !o)}
              size="sm"
            />
            <span className={classes.mobileLogoText}>🦉 Owly</span>
          </div>
        )}

        <div className={classes.content}>
          <Outlet />
        </div>
      </div>

      <FeedbackDrawer opened={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

export default DashboardLayout;
