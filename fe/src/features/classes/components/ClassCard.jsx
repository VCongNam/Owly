import { Badge, Card, Group, Text, ThemeIcon, ActionIcon, Menu } from '@mantine/core';
import { GraduationCap, Users, DotsThreeVertical, PencilSimple, Archive, ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import classes from './ClassCard.module.css';

const SUBJECT_COLORS = {
  'Toán học': 'blue',
  'Vật lý': 'violet',
  'Hóa học': 'teal',
  'Sinh học': 'green',
  'Ngữ văn': 'orange',
  'Lịch sử': 'yellow',
  'Địa lý': 'cyan',
};

export function ClassCard({ cls, onEdit, onArchive }) {
  const subjectColor = SUBJECT_COLORS[cls.subject] || 'copper';

  return (
    <Card withBorder radius="md" p={0} className={classes.card}>
      {/* Color accent bar */}
      <div className={classes.accentBar} data-color={subjectColor} />

      <div className={classes.body}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon size={42} radius="md" variant="light" color={subjectColor} style={{ flexShrink: 0 }}>
              <GraduationCap size={22} weight="duotone" />
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={700} size="md" className={classes.className} lineClamp={1}>
                {cls.name}
              </Text>
              <Text size="xs" c="dimmed">{cls.subject}</Text>
            </div>
          </Group>

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
                Lưu trữ lớp
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Stats row */}
        <Group gap={16} mt="md">
          <Group gap={4}>
            <Users size={14} color="var(--accent-color)" />
            <Text size="xs" c="dimmed">{cls.studentCount ?? 0} học viên</Text>
          </Group>
          {cls.startDate && (
            <Text size="xs" c="dimmed">
              Từ {new Date(cls.startDate).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}
            </Text>
          )}
          {cls.subject && (
            <Badge size="xs" variant="light" color={subjectColor} ml="auto">
              {cls.subject}
            </Badge>
          )}
        </Group>
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
