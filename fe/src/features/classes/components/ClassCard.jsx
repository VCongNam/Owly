import { Badge, Card, Group, Text, ThemeIcon, ActionIcon, Menu, Stack } from '@mantine/core';
import { GraduationCap, Users, DotsThreeVertical, PencilSimple, Archive, ArrowRight, Calendar, Bank } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import classes from './ClassCard.module.css';
import { useAuth } from '../../auth';

const STATUS_MAP = {
  Scheduled: { label: 'Lên lịch', color: 'blue' },
  OnGoing: { label: 'Đang diễn ra', color: 'green' },
  Completed: { label: 'Đã hoàn thành', color: 'teal' },
  Archived: { label: 'Đã lưu trữ', color: 'gray' },
};

export function ClassCard({ cls, onEdit, onArchive }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isArchived = cls.status === 'Archived';
  const color = isArchived ? 'gray' : 'copper';
  const statusConfig = STATUS_MAP[cls.status] || { label: cls.status, color: 'copper' };

  const getScheduleSummary = (schedules) => {
    if (!schedules || schedules.length === 0) return 'Chưa xếp lịch học';
    const dayLabels = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' };

    // Sắp xếp lịch theo thứ tự từ thứ 2 -> CN
    const sorted = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    return sorted
      .map(s => `${dayLabels[s.dayOfWeek] || `T${s.dayOfWeek}`}: ${s.startTime}-${s.endTime}`)
      .join(', ');
  };

  const getTuitionSummary = (tuitionConfig) => {
    if (!tuitionConfig) return 'Chưa có thông tin học phí';
    const amountFormatted = new Intl.NumberFormat('vi-VN').format(tuitionConfig.amount);
    const cycleLabel = tuitionConfig.billingCycle === 'Session' ? 'buổi' : 'tháng';
    return `${amountFormatted}đ/${cycleLabel}`;
  };

  return (
    <Card withBorder radius="md" p={0} className={classes.card} style={{ opacity: isArchived ? 0.7 : 1 }}>
      {/* Color accent bar */}
      <div className={classes.accentBar} data-color={color} />

      <div className={classes.body}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon size={42} radius="md" variant="light" color={color} style={{ flexShrink: 0 }}>
              <GraduationCap size={22} weight="duotone" />
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={700} size="md" className={classes.className} lineClamp={1}>
                {cls.name}
              </Text>
              <Group gap={4} mt={2}>
                <Badge size="xs" variant="light" color={statusConfig.color}>{statusConfig.label}</Badge>
                {cls.subject && (
                  <Badge size="xs" variant="dot" color="teal">{cls.subject.name}</Badge>
                )}
              </Group>
            </div>
          </Group>

          {!isStudent && (
            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                  <DotsThreeVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<PencilSimple size={14} />} onClick={() => onEdit?.(cls)}>
                  Chỉnh sửa
                </Menu.Item>
                <Menu.Item leftSection={<Archive size={14} />} color="orange" onClick={() => onArchive?.(cls)}>
                  {isArchived ? 'Khôi phục lớp' : 'Lưu trữ lớp'}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {/* Info Stack */}
        <Stack gap={6} mt="md">
          {/* Lịch học */}
          <Group gap={6} align="center" wrap="nowrap">
            <Calendar size={14} color="var(--accent-color)" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {getScheduleSummary(cls.schedules)}
            </Text>
          </Group>

          {/* Học phí */}
          <Group gap={6} align="center" wrap="nowrap">
            <Bank size={14} color="var(--accent-color)" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {getTuitionSummary(cls.tuitionConfig)}
            </Text>
          </Group>

          {/* Sĩ số học sinh & Thời gian */}
          <Group gap={16}>
            <Group gap={4}>
              <Users size={14} color="var(--accent-color)" />
              <Text size="xs" c="dimmed">{cls._count?.enrollments ?? 0} học viên</Text>
            </Group>
            {cls.startDate && (
              <Text size="xs" c="dimmed">
                {new Date(cls.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {cls.expectedEndDate ? ` - ${new Date(cls.expectedEndDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
              </Text>
            )}
          </Group>
        </Stack>
      </div>

      {/* Footer link */}
      <Link to={`/classes/${cls.id}/stream`} className={classes.footer}>
        <Text size="xs" fw={500}>Vào lớp học</Text>
        <ArrowRight size={14} />
      </Link>
    </Card>
  );
}

export default ClassCard;
