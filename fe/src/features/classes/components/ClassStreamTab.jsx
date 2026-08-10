import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Grid, Card, Text, Avatar, TextInput, Button, FileInput,
  Group, Stack, ActionIcon, Tooltip, Badge, Modal, ScrollArea, Center, Loader, Box
} from '@mantine/core';
import {
  Plus, Trash, Eye, ChatTeardropText, PaperPlaneRight,
  Lock, LockOpen, Copy, Calendar, Users, BookOpen, File
} from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../auth';
import { usePosts } from '../hooks/usePosts';
import { useClassDetails } from '../hooks/useClasses';
import { ConfirmModal } from '../../../shared';
import classes from './ClassStreamTab.module.css';

// Helper format date
const formatPostDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const getDayName = (dayNum) => {
  const days = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    0: 'Chủ Nhật'
  };
  return days[dayNum] || `Thứ ${dayNum + 1}`;
};

export function ClassStreamTab() {
  const { classId } = useParams();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const { classDetail: cls } = useClassDetails(classId);
  const {
    posts,
    loading,
    creating,
    upcomingAssignments,
    loadingUpcoming,
    createPost,
    deletePost,
    toggleComments,
    getPostDetails,
    createComment,
    deleteComment
  } = usePosts(classId);

  // States
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [detailOpened, setDetailOpened] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  // Delete Post Confirm state
  const [deletePostConfirmOpened, setDeletePostConfirmOpened] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Delete Comment Confirm state
  const [deleteCommentConfirmOpened, setDeleteCommentConfirmOpened] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const handleCopyCode = () => {
    if (cls?.classCode) {
      navigator.clipboard.writeText(cls.classCode);
      notifications.show({
        title: 'Thành công',
        message: 'Đã sao chép mã lớp học vào bộ nhớ tạm',
        color: 'green'
      });
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const success = await createPost({ content, files });
    if (success) {
      setContent('');
      setFiles([]);
    }
  };

  const handleOpenPostDetails = async (post) => {
    setActivePost(post);
    setDetailOpened(true);
    setLoadingDetail(true);
    const details = await getPostDetails(post.id);
    if (details) {
      setActivePost(details);
    }
    setLoadingDetail(false);
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !activePost) return;

    const newComment = await createComment(activePost.id, commentContent);
    if (newComment) {
      setCommentContent('');
      // Update local comments list in modal
      setActivePost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
    }
  };

  const handleOpenDeletePost = (postId) => {
    setPostToDelete(postId);
    setDeletePostConfirmOpened(true);
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    const success = await deletePost(postToDelete);
    if (success) {
      setDeletePostConfirmOpened(false);
      setPostToDelete(null);
    }
  };

  const handleOpenDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setDeleteCommentConfirmOpened(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete || !activePost) return;
    const success = await deleteComment(activePost.id, commentToDelete);
    if (success) {
      setActivePost((prev) => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentToDelete)
      }));
      setDeleteCommentConfirmOpened(false);
      setCommentToDelete(null);
    }
  };

  const getAuthorName = (author) => {
    if (!author) return 'Người dùng hệ thống';
    return author.teacherProfile?.fullName || author.studentProfile?.fullName || author.email || 'Ẩn danh';
  };

  const getFileIcon = (url) => {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
    return <File size={16} weight="duotone" color="var(--accent-color)" />;
  };

  const getFileName = (url) => {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    // Remove timestamp prefix
    return lastPart.replace(/^\d+-/, '');
  };

  return (
    <div className={classes.container}>
      {/* ── SIDEBAR CỘT TRÁI ────────────────────────────────────────────── */}
      <div className={classes.sidebar}>
        {/* Card 1: Thông tin lớp học */}
        <Card className={classes.sidebarCard} padding="lg">
          <Stack gap="sm">
            <Group gap="xs">
              <BookOpen size={20} weight="duotone" color="var(--accent-color)" />
              <Text fw={700} size="md">Thông tin lớp học</Text>
            </Group>
            
            <Box>
              <Text size="xs" c="dimmed">Môn học</Text>
              <Text size="sm" fw={600}>{cls?.subject?.name || '—'}</Text>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">Giáo viên</Text>
              <Text size="sm" fw={600}>{cls?.teacher?.fullName || '—'}</Text>
            </Box>

            {cls?.classCode && (
              <Box>
                <Text size="xs" c="dimmed">Mã lớp</Text>
                <Group gap="xs" mt={2}>
                  <Badge color="copper" variant="light" size="lg" radius="sm" style={{ textTransform: 'none' }}>
                    {cls.classCode}
                  </Badge>
                  <Tooltip label="Sao chép mã lớp" withArrow>
                    <ActionIcon size="sm" variant="subtle" color="copper" onClick={handleCopyCode}>
                      <Copy size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Box>
            )}

            <Box>
              <Text size="xs" c="dimmed" mb={4}>Lịch học trong tuần</Text>
              {cls?.schedules && cls.schedules.length > 0 ? (
                <Stack gap={4}>
                  {cls.schedules.map((schedule) => (
                    <Group key={schedule.id} gap={6}>
                      <Calendar size={14} color="var(--accent-color)" />
                      <Text size="xs" fw={500}>
                        {getDayName(schedule.dayOfWeek)}: {schedule.startTime} - {schedule.endTime} {schedule.room && `(Phòng ${schedule.room})`}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text size="xs" style={{ fontStyle: 'italic' }}>Chưa cấu hình lịch</Text>
              )}
            </Box>

            <Group gap="xs" pt="xs" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Users size={16} weight="duotone" color="var(--accent-color)" />
              <Text size="xs" c="dimmed">Sĩ số: <strong style={{ color: 'var(--text-color)' }}>{cls?._count?.enrollments || 0} học sinh</strong></Text>
            </Group>
          </Stack>
        </Card>

        {/* Card 2: Bài tập sắp đến hạn */}
        <Card className={classes.sidebarCard} padding="lg">
          <Stack gap="sm">
            <Group gap="xs">
              <Calendar size={20} weight="duotone" color="var(--accent-color)" />
              <Text fw={700} size="md">Sắp đến hạn</Text>
            </Group>

            {loadingUpcoming ? (
              <Center py="sm">
                <Loader size="xs" color="copper" />
              </Center>
            ) : upcomingAssignments.length > 0 ? (
              <Stack gap="xs">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className={classes.upcomingItem}>
                    <Text size="xs" fw={600} lineClamp={1}>{assignment.title}</Text>
                    <Text size="10px" c="red">
                      Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                ))}
              </Stack>
            ) : (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                Tuyệt vời, không có bài tập nào sắp đến hạn!
              </Text>
            )}
          </Stack>
        </Card>
      </div>

      {/* ── CỘT PHẢI: POST FEED ─────────────────────────────────────────── */}
      <div className={classes.feed}>
        {/* Form viết thông báo dành cho Giáo viên */}
        {isTeacher && (
          <Card className={classes.postFormCard} padding="lg">
            <form onSubmit={handleCreatePost}>
              <Stack gap="sm">
                <TextInput
                  placeholder="Chia sẻ thông báo hoặc tài liệu chuẩn bị cho buổi học mới..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  styles={{ input: { borderRadius: '8px' } }}
                />
                
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                  <FileInput
                    placeholder="Đính kèm file..."
                    multiple
                    value={files}
                    onChange={setFiles}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar"
                    size="xs"
                    style={{ maxWidth: 220 }}
                  />

                  <Button
                    type="submit"
                    color="copper"
                    size="sm"
                    loading={creating}
                    disabled={!content.trim()}
                    leftSection={<Plus size={16} weight="bold" />}
                  >
                    Đăng tin
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {/* Danh sách thông báo */}
        {loading ? (
          <Center py={40}>
            <Loader color="copper" size="md" />
          </Center>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className={classes.postCard} padding="lg">
              <Stack gap="sm">
                {/* Header: Tác giả, Ngày đăng, Nút thao tác giáo viên */}
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Avatar src={post.author?.avatarUrl} size="md" radius="xl" color="copper">
                      {getAuthorName(post.author).charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={700}>{getAuthorName(post.author)}</Text>
                      <Text size="xs" c="dimmed">{formatPostDate(post.createdAt)}</Text>
                    </div>
                  </Group>

                  {isTeacher && (
                    <Group gap={6}>
                      <Tooltip label={post.commentsEnabled ? "Khóa bình luận" : "Cho phép bình luận"} withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="copper"
                          onClick={() => toggleComments(post.id)}
                        >
                          {post.commentsEnabled ? <LockOpen size={16} /> : <Lock size={16} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Xóa bài viết" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleOpenDeletePost(post.id)}
                        >
                          <Trash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                </Group>

                {/* Nội dung bài viết */}
                <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {post.content}
                </Text>

                {/* File đính kèm */}
                {post.attachments && post.attachments.length > 0 && (
                  <Group gap="xs" mt="xs" wrap="wrap">
                    {post.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={classes.attachmentBadge}
                      >
                        {getFileIcon(url)}
                        <Text size="xs" fw={500} lineClamp={1}>
                          {getFileName(url)}
                        </Text>
                      </a>
                    ))}
                  </Group>
                )}

                {/* Thanh tương tác: Lượt xem, Bình luận */}
                <Group justify="flex-start" gap="md" mt="sm" className={classes.interactionBar}>
                  <Group gap={4}>
                    <Eye size={16} color="var(--mantine-color-gray-6)" />
                    <Text size="xs" c="dimmed">{post.views} lượt xem</Text>
                  </Group>

                  <Button
                    variant="subtle"
                    color="copper"
                    size="xs"
                    leftSection={<ChatTeardropText size={16} />}
                    onClick={() => handleOpenPostDetails(post)}
                  >
                    {post._count?.comments || 0} bình luận
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))
        ) : (
          <Card padding="xl" style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)' }}>
            <Center py="lg">
              <Stack align="center" gap="xs">
                <ChatTeardropText size={36} color="var(--mantine-color-gray-4)" />
                <Text size="sm" c="dimmed">Chưa có bài thông báo nào trên bảng tin.</Text>
              </Stack>
            </Center>
          </Card>
        )}
      </div>

      {/* ── MODAL CHI TIẾT BÀI ĐĂNG & BÌNH LUẬN ─────────────────────────── */}
      <Modal
        opened={detailOpened}
        onClose={() => setDetailOpened(false)}
        title="Chi tiết bài viết"
        size="md"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {activePost && (
          <Stack gap="md" className={classes.modalContent}>
            {/* Header bài đăng */}
            <Group gap="sm" wrap="nowrap">
              <Avatar src={activePost.author?.avatarUrl} size="md" radius="xl" color="copper">
                {getAuthorName(activePost.author).charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text size="sm" fw={700}>{getAuthorName(activePost.author)}</Text>
                <Text size="xs" c="dimmed">{formatPostDate(activePost.createdAt)}</Text>
              </div>
            </Group>

            {/* Nội dung bài viết */}
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {activePost.content}
            </Text>

            {/* File đính kèm */}
            {activePost.attachments && activePost.attachments.length > 0 && (
              <Group gap="xs" wrap="wrap">
                {activePost.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.attachmentBadge}
                  >
                    {getFileIcon(url)}
                    <Text size="xs" fw={500} lineClamp={1}>
                      {getFileName(url)}
                    </Text>
                  </a>
                ))}
              </Group>
            )}

            {/* Views counter */}
            <Group gap={4} py={4} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <Eye size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" c="dimmed">{activePost.views} lượt xem</Text>
            </Group>

            {/* Danh sách bình luận */}
            <Text fw={700} size="sm">Bình luận ({activePost.comments?.length || 0})</Text>

            {loadingDetail ? (
              <Center py="md">
                <Loader size="sm" color="copper" />
              </Center>
            ) : activePost.comments && activePost.comments.length > 0 ? (
              <ScrollArea style={{ height: 250 }} offsetScrollbars>
                <Stack gap="xs" pr="xs">
                  {activePost.comments.map((comment) => (
                    <Group key={comment.id} align="flex-start" wrap="nowrap" gap="xs">
                      <Avatar src={comment.author?.avatarUrl} size="sm" radius="xl" color="copper">
                        {getAuthorName(comment.author).charAt(0).toUpperCase()}
                      </Avatar>
                      <div className={classes.commentBubble}>
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Text size="xs" fw={700}>{getAuthorName(comment.author)}</Text>
                          <Group gap={4} wrap="nowrap">
                            <Text size="10px" c="dimmed">{formatPostDate(comment.createdAt)}</Text>
                            {(comment.authorId === user.id || isTeacher) && (
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={() => handleOpenDeleteComment(comment.id)}
                              >
                                <Trash size={12} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>
                        <Text size="xs" mt={2} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {comment.content}
                        </Text>
                      </div>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
            ) : (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>Chưa có bình luận nào.</Text>
            )}

            {/* Form viết bình luận */}
            <div className={classes.commentInput}>
              {activePost.commentsEnabled ? (
                <form onSubmit={handleSendComment}>
                  <Group gap="xs" wrap="nowrap">
                    <TextInput
                      placeholder="Viết bình luận công khai..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      required
                      style={{ flexGrow: 1 }}
                      styles={{ input: { borderRadius: '20px' } }}
                    />
                    <ActionIcon
                      type="submit"
                      color="copper"
                      size="md"
                      radius="xl"
                      disabled={!commentContent.trim()}
                    >
                      <PaperPlaneRight size={16} />
                    </ActionIcon>
                  </Group>
                </form>
              ) : (
                <Group gap={6} justify="center" py="xs" style={{ background: 'var(--mantine-color-gray-1)', borderRadius: '8px' }}>
                  <Lock size={14} color="var(--mantine-color-gray-6)" />
                  <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                    Giáo viên đã khóa bình luận cho bài đăng này.
                  </Text>
                </Group>
              )}
            </div>
          </Stack>
        )}
      </Modal>

      {/* ── MODALS XÁC NHẬN XÓA ────────────────────────────────────────── */}
      <ConfirmModal
        opened={deletePostConfirmOpened}
        onClose={() => setDeletePostConfirmOpened(false)}
        onConfirm={handleConfirmDeletePost}
        title="Xóa bài đăng"
        message="Bạn có chắc chắn muốn xóa bài viết thông báo này không? Tất cả các bình luận đi kèm cũng sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa bài đăng"
        cancelLabel="Hủy"
        color="red"
      />

      <ConfirmModal
        opened={deleteCommentConfirmOpened}
        onClose={() => setDeleteCommentConfirmOpened(false)}
        onConfirm={handleConfirmDeleteComment}
        title="Xóa bình luận"
        message="Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác."
        confirmLabel="Xóa bình luận"
        cancelLabel="Hủy"
        color="red"
      />
    </div>
  );
}

export default ClassStreamTab;
