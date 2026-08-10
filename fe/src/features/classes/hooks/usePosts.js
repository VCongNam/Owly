import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { postService } from '../services/posts';

export function usePosts(classId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const fetchPosts = useCallback(async (page = 1) => {
    if (!classId) return;
    setLoading(true);
    try {
      const response = await postService.getClassPosts(classId, { page, limit: 10 });
      setPosts(response.items || []);
      setPagination(response.pagination || {
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        limit: 10
      });
    } catch (error) {
      console.error('Lỗi khi tải bài đăng:', error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const createPost = useCallback(async ({ content, files }) => {
    if (!classId || !content.trim()) return false;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
      filesArray.forEach((file) => {
        formData.append('files', file);
      });

      await postService.createPost(classId, formData);
      notifications.show({
        title: 'Thành công',
        message: 'Đăng thông báo mới thành công',
        color: 'green'
      });
      await fetchPosts(1);
      return true;
    } catch (error) {
      console.error('Lỗi khi tạo bài đăng:', error);
      return false;
    } finally {
      setCreating(false);
    }
  }, [classId, fetchPosts]);

  const deletePost = useCallback(async (postId) => {
    if (!postId) return false;
    try {
      await postService.deletePost(postId);
      notifications.show({
        title: 'Thành công',
        message: 'Xóa bài đăng thành công',
        color: 'green'
      });
      setPosts((prev) => prev.filter(p => p.id !== postId));
      setPagination((prev) => {
        const nextTotal = Math.max(0, prev.totalItems - 1);
        return {
          ...prev,
          totalItems: nextTotal,
          totalPages: Math.ceil(nextTotal / prev.limit) || 1
        };
      });
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error);
      return false;
    }
  }, []);

  const toggleComments = useCallback(async (postId) => {
    if (!postId) return false;
    try {
      const result = await postService.toggleComments(postId);
      notifications.show({
        title: 'Thành công',
        message: result.commentsEnabled ? 'Đã cho phép bình luận' : 'Đã khóa bình luận bài viết',
        color: 'green'
      });
      
      setPosts((prev) => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentsEnabled: result.commentsEnabled };
        }
        return p;
      }));
      return true;
    } catch (error) {
      console.error('Lỗi khi cấu hình bình luận:', error);
      return false;
    }
  }, []);

  const getPostDetails = useCallback(async (postId) => {
    if (!postId) return null;
    try {
      const details = await postService.getPostDetails(postId);
      // Cập nhật views local trong danh sách bài đăng
      setPosts((prev) => prev.map(p => {
        if (p.id === postId) {
          return { ...p, views: p.views + 1 };
        }
        return p;
      }));
      return details;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết bài viết:', error);
      return null;
    }
  }, []);

  const createComment = useCallback(async (postId, content) => {
    if (!postId || !content.trim()) return null;
    try {
      const comment = await postService.createComment(postId, { content });
      
      // Cập nhật count bình luận trong list posts
      setPosts((prev) => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            _count: {
              ...p._count,
              comments: (p._count?.comments || 0) + 1
            }
          };
        }
        return p;
      }));

      return comment;
    } catch (error) {
      console.error('Lỗi khi thêm bình luận:', error);
      return null;
    }
  }, []);

  const deleteComment = useCallback(async (postId, commentId) => {
    if (!commentId) return false;
    try {
      await postService.deleteComment(commentId);
      notifications.show({
        title: 'Thành công',
        message: 'Xóa bình luận thành công',
        color: 'green'
      });

      // Giảm count bình luận trong list posts
      setPosts((prev) => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            _count: {
              ...p._count,
              comments: Math.max(0, (p._count?.comments || 0) - 1)
            }
          };
        }
        return p;
      }));

      return true;
    } catch (error) {
      console.error('Lỗi khi xóa bình luận:', error);
      return false;
    }
  }, []);

  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  const fetchUpcomingAssignments = useCallback(async () => {
    if (!classId) return;
    setLoadingUpcoming(true);
    try {
      const response = await postService.getUpcomingAssignments(classId);
      setUpcomingAssignments(response || []);
    } catch (error) {
      console.error('Lỗi khi tải bài tập sắp đến hạn:', error);
    } finally {
      setLoadingUpcoming(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchPosts(1);
    fetchUpcomingAssignments();
  }, [classId, fetchPosts, fetchUpcomingAssignments]);

  return {
    posts,
    loading,
    creating,
    pagination,
    upcomingAssignments,
    loadingUpcoming,
    fetchPosts,
    fetchUpcomingAssignments,
    createPost,
    deletePost,
    toggleComments,
    getPostDetails,
    createComment,
    deleteComment
  };
}
