import { useState, useCallback, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { postService } from '../services/posts';

const EMPTY_PAGINATION = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10
};

export function usePosts(classId) {
  const [posts, setPosts] = useState([]);
  const [resolvedClassId, setResolvedClassId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingClassId, setCreatingClassId] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [resolvedUpcomingClassId, setResolvedUpcomingClassId] = useState(null);
  const [refreshingUpcoming, setRefreshingUpcoming] = useState(false);

  const postsRequestIdRef = useRef(0);
  const upcomingRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const currentClassIdRef = useRef(classId);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    currentClassIdRef.current = classId;
  }, [classId]);

  const loading = Boolean(classId) && (resolvedClassId !== classId || refreshing);
  const loadingUpcoming = Boolean(classId) && (resolvedUpcomingClassId !== classId || refreshingUpcoming);
  const creating = Boolean(classId) && creatingClassId === classId;

  const fetchPosts = useCallback(async (page = 1) => {
    if (!classId) return;
    const requestId = ++postsRequestIdRef.current;
    setRefreshing(true);
    try {
      const response = await postService.getClassPosts(classId, { page, limit: 10 });
      if (requestId === postsRequestIdRef.current) {
        setPosts(response.items || []);
        setPagination(response.pagination || {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          limit: 10
        });
        setResolvedClassId(classId);
      }
    } catch (error) {
      if (requestId === postsRequestIdRef.current) {
        if (resolvedClassId !== classId) {
          setPosts([]);
          setPagination(EMPTY_PAGINATION);
        }
        console.error('Lỗi khi tải bài đăng:', error);
      }
    } finally {
      if (requestId === postsRequestIdRef.current) {
        setRefreshing(false);
        setResolvedClassId(classId);
      }
    }
  }, [classId, resolvedClassId]);

  const createPost = useCallback(async ({ content, files }) => {
    const mutationClassId = classId;
    if (!mutationClassId || !content.trim()) return false;
    setCreatingClassId(mutationClassId);
    try {
      const formData = new FormData();
      formData.append('content', content);

      const filesArray = Array.isArray(files) ? files : (files ? [files] : []);
      filesArray.forEach((file) => {
        formData.append('files', file);
      });

      await postService.createPost(mutationClassId, formData);
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        notifications.show({
          title: 'Thành công',
          message: 'Đăng thông báo mới thành công',
          color: 'green'
        });
        await fetchPosts(1);
      }
      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi tạo bài đăng:', error);
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setCreatingClassId(current =>
          current === mutationClassId ? null : current
        );
      }
    }
  }, [classId, fetchPosts]);

  const deletePost = useCallback(async (postId) => {
    if (!postId) return false;
    const mutationClassId = currentClassIdRef.current;
    try {
      await postService.deletePost(postId);
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
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
      }
      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi xóa bài viết:', error);
      }
      return false;
    }
  }, []);

  const toggleComments = useCallback(async (postId) => {
    if (!postId) return false;
    const mutationClassId = currentClassIdRef.current;
    try {
      const result = await postService.toggleComments(postId);
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
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
      }
      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi cấu hình bình luận:', error);
      }
      return false;
    }
  }, []);

  const getPostDetails = useCallback(async (postId) => {
    if (!postId) return null;
    const mutationClassId = currentClassIdRef.current;
    try {
      const details = await postService.getPostDetails(postId);
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        // Cập nhật views local trong danh sách bài đăng
        setPosts((prev) => prev.map(p => {
          if (p.id === postId) {
            return { ...p, views: p.views + 1 };
          }
          return p;
        }));
      }
      return details;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi lấy chi tiết bài viết:', error);
      }
      return null;
    }
  }, []);

  const createComment = useCallback(async (postId, content) => {
    if (!postId || !content.trim()) return null;
    const mutationClassId = currentClassIdRef.current;
    try {
      const comment = await postService.createComment(postId, { content });

      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
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
      }

      return comment;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi thêm bình luận:', error);
      }
      return null;
    }
  }, []);

  const deleteComment = useCallback(async (postId, commentId) => {
    if (!commentId) return false;
    const mutationClassId = currentClassIdRef.current;
    try {
      await postService.deleteComment(commentId);
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
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
      }

      return true;
    } catch (error) {
      if (isMountedRef.current && currentClassIdRef.current === mutationClassId) {
        console.error('Lỗi khi xóa bình luận:', error);
      }
      return false;
    }
  }, []);

  const fetchUpcomingAssignments = useCallback(async () => {
    if (!classId) return;
    const requestId = ++upcomingRequestIdRef.current;
    setRefreshingUpcoming(true);
    try {
      const response = await postService.getUpcomingAssignments(classId);
      if (requestId === upcomingRequestIdRef.current) {
        setUpcomingAssignments(response || []);
        setResolvedUpcomingClassId(classId);
      }
    } catch (error) {
      if (requestId === upcomingRequestIdRef.current) {
        if (resolvedUpcomingClassId !== classId) {
          setUpcomingAssignments([]);
        }
        console.error('Lỗi khi tải bài tập sắp đến hạn:', error);
      }
    } finally {
      if (requestId === upcomingRequestIdRef.current) {
        setRefreshingUpcoming(false);
        setResolvedUpcomingClassId(classId);
      }
    }
  }, [classId, resolvedUpcomingClassId]);

  // Effect tải bài viết ban đầu
  useEffect(() => {
    if (!classId) return;
    const requestId = ++postsRequestIdRef.current;

    const loadInitialPosts = async () => {
      try {
        const response = await postService.getClassPosts(classId, { page: 1, limit: 10 });
        if (requestId === postsRequestIdRef.current) {
          setPosts(response.items || []);
          setPagination(response.pagination || {
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 10
          });
        }
      } catch (error) {
        if (requestId === postsRequestIdRef.current) {
          setPosts([]);
          setPagination(EMPTY_PAGINATION);
          console.error('Lỗi khi tải bài đăng:', error);
        }
      } finally {
        if (requestId === postsRequestIdRef.current) {
          setResolvedClassId(classId);
        }
      }
    };

    loadInitialPosts();

    return () => {
      postsRequestIdRef.current += 1;
    };
  }, [classId]);

  // Effect tải bài tập sắp đến hạn ban đầu
  useEffect(() => {
    if (!classId) return;
    const requestId = ++upcomingRequestIdRef.current;

    const loadInitialUpcoming = async () => {
      try {
        const response = await postService.getUpcomingAssignments(classId);
        if (requestId === upcomingRequestIdRef.current) {
          setUpcomingAssignments(response || []);
        }
      } catch (error) {
        if (requestId === upcomingRequestIdRef.current) {
          setUpcomingAssignments([]);
          console.error('Lỗi khi tải bài tập sắp đến hạn:', error);
        }
      } finally {
        if (requestId === upcomingRequestIdRef.current) {
          setResolvedUpcomingClassId(classId);
        }
      }
    };

    loadInitialUpcoming();

    return () => {
      upcomingRequestIdRef.current += 1;
    };
  }, [classId]);

  const visiblePosts = resolvedClassId === classId ? posts : [];
  const visiblePagination = resolvedClassId === classId ? pagination : EMPTY_PAGINATION;
  const visibleUpcomingAssignments = resolvedUpcomingClassId === classId ? upcomingAssignments : [];

  return {
    posts: visiblePosts,
    loading,
    creating,
    pagination: visiblePagination,
    upcomingAssignments: visibleUpcomingAssignments,
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
