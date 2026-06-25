import { Group, Button, Container, Burger, Drawer, Stack, Text, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    close();
    navigate('/signin');
  };

  const navLinks = [
    { label: 'Tính năng', path: '#features', publicOnly: true },
    { label: 'Bảng giá', path: '#pricing', publicOnly: true },
    { label: 'Hỗ trợ', path: '#support' },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (link.publicOnly && user) return false;
    return true;
  });

  const isActive = (path) => location.pathname === path || location.hash === path;

  const renderLinks = (isMobile = false) => {
    return visibleLinks.map((link) => (
      <Link
        key={link.label}
        to={link.path}
        onClick={close}
        style={{
          textDecoration: 'none',
          color: isActive(link.path) ? 'var(--accent-color)' : 'var(--text-color)',
          fontWeight: isActive(link.path) ? 600 : 500,
          fontSize: '0.95rem',
          transition: 'color 0.2s ease',
          padding: isMobile ? '0.75rem 1rem' : '0.5rem 0.75rem',
          borderRadius: '6px',
        }}
      >
        {link.label}
      </Link>
    ));
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Container size="lg" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Logo placeholder - User will provide logo later */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#ffffff',
            }}
          >
            O
          </div>
          <Text size="lg" fw={700} style={{ color: 'var(--text-color)' }}>
            Owly
          </Text>
        </Link>

        {/* Desktop Navigation */}
        <Group gap="md" visibleFrom="sm">
          {renderLinks()}
        </Group>

        {/* Action Button */}
        <Group gap="md" visibleFrom="sm">
          <ActionIcon
            onClick={toggleColorScheme}
            variant="default"
            size="lg"
            aria-label="Toggle color scheme"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
              backgroundColor: 'transparent',
            }}
          >
            {colorScheme === 'dark' ? '☀️' : '🌙'}
          </ActionIcon>

          {user ? (
            <Group gap="sm">
              <Text size="sm" fw={500} style={{ color: 'var(--text-color)' }}>
                {user.fullName || user.email}
              </Text>
              <Button variant="outline" color="copper" onClick={handleLogout} className="cta-button">
                Đăng xuất
              </Button>
            </Group>
          ) : (
            <Group gap="sm">
              <Button variant="subtle" color="copper" onClick={() => navigate('/signin')} className="cta-button">
                Đăng nhập
              </Button>
              <Button color="copper" onClick={() => navigate('/signup')} className="cta-button">
                Đăng ký
              </Button>
            </Group>
          )}
        </Group>

        {/* Burger Button for Mobile */}
        <Group gap="xs" hiddenFrom="sm">
          <ActionIcon
            onClick={toggleColorScheme}
            variant="default"
            size="md"
            aria-label="Toggle color scheme"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
              backgroundColor: 'transparent',
            }}
          >
            {colorScheme === 'dark' ? '☀️' : '🌙'}
          </ActionIcon>
          <Burger opened={opened} onClick={toggle} size="sm" color="var(--text-color)" />
        </Group>
      </Container>

      {/* Mobile Menu Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        size="75%"
        padding="md"
        hiddenFrom="sm"
        title="Owly Menu"
        styles={{
          header: {
            borderBottom: '1px solid var(--border-color)',
          },
          body: {
            backgroundColor: 'var(--bg-color)',
            minHeight: 'calc(100% - 60px)',
          },
        }}
      >
        <Stack gap="sm" mt="md">
          {renderLinks(true)}
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
            {user ? (
              <Stack gap="sm">
                <Text size="sm" fw={500} style={{ color: 'var(--text-color)' }}>
                  {user.fullName || user.email}
                </Text>
                <Button fullWidth variant="outline" color="copper" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm">
                <Button fullWidth variant="subtle" color="copper" onClick={() => { close(); navigate('/signin'); }}>
                  Đăng nhập
                </Button>
                <Button fullWidth color="copper" onClick={() => { close(); navigate('/signup'); }}>
                  Đăng ký
                </Button>
              </Stack>
            )}
          </div>
        </Stack>
      </Drawer>
    </header>
  );
}

export default Navbar;
