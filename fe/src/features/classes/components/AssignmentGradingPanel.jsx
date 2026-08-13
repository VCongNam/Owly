import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Stack, Group, Text, Button, ActionIcon,
  Center, ThemeIcon, Loader, Badge, ScrollArea, Grid,
  TextInput, NumberInput, Textarea, Card, Divider,
  UnstyledButton, Box, Alert
} from '@mantine/core';
import {
  ArrowLeft, MagnifyingGlass, FilePdf, Image as ImageIcon, FileDoc,
  UploadSimple, Download, X, CheckCircle, Warning,
  Info, Paperclip
} from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import { assignmentService } from '../services/assignments';
import { uploadService } from '../../../services/uploadService';

// Bộ xem trước tệp trực quan (File Preview Viewer)
function FilePreview({ fileUrl }) {
  if (!fileUrl) return null;

  const lowerUrl = fileUrl.toLowerCase();
  const isImage = lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.includes('.png?') || lowerUrl.includes('.jpg?') || lowerUrl.includes('.jpeg?');
  const isPdf = lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');
  const isWord = lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') || lowerUrl.includes('.doc?') || lowerUrl.includes('.docx?');

  if (isImage) {
    return (
      <Stack gap="xs">
        <Text size="xs" fw={700} c="dimmed">Bản xem trước hình ảnh:</Text>
        <Card withBorder p="xs" radius="md" bg="var(--card-bg)" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            src={fileUrl}
            alt="Bài làm học sinh"
            style={{ maxHeight: '420px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
          />
        </Card>
      </Stack>
    );
  }

  if (isPdf) {
    return (
      <Stack gap="xs" style={{ height: '100%', minHeight: '480px' }}>
        <Text size="xs" fw={700} c="dimmed">Bản xem trước PDF:</Text>
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title="PDF Preview"
          width="100%"
          height="450px"
          style={{ border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff' }}
        />
      </Stack>
    );
  }

  if (isWord) {
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    return (
      <Stack gap="xs">
        <Text size="xs" fw={700} c="dimmed">Bản xem trước tài liệu Word:</Text>
        <iframe
          src={googleViewerUrl}
          title="Word Preview"
          width="100%"
          height="450px"
          style={{ border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff' }}
        />
        <Alert icon={<Info size={16} />} color="blue" variant="light" py="xs">
          <Text size="xs">
            Nếu tài liệu không tải được, bạn có thể click nút tải tệp gốc bên dưới để xem trực tiếp trên máy.
          </Text>
        </Alert>
      </Stack>
    );
  }

  return (
    <Card withBorder p="md" radius="md" bg="var(--card-bg)" style={{ textAlign: 'center' }}>
      <Text size="sm" c="dimmed">Định dạng tệp tin này không hỗ trợ xem trước trực tiếp.</Text>
    </Card>
  );
}

// Component Editor chấm điểm độc lập
function GradingEditor({ selectedStudent, assignment, onRefresh, isMobile, onMobileComplete }) {
  const [grade, setGrade] = useState(() => {
    const feedback = selectedStudent.submission?.feedback;
    return feedback?.grade ?? assignment.maxPoints;
  });
  const [remarks, setRemarks] = useState(() => {
    const feedback = selectedStudent.submission?.feedback;
    return feedback?.remarks ?? 'Bài làm tốt, đạt yêu cầu.';
  });
  const [correctionFile, setCorrectionFile] = useState(null);
  const [uploadedCorrectionUrl, setUploadedCorrectionUrl] = useState(() => {
    const feedback = selectedStudent.submission?.feedback;
    return feedback?.attachmentUrl ?? '';
  });
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [uploadingCorrection, setUploadingCorrection] = useState(false);

  const handleCorrectionFileChange = async (file) => {
    if (!file) return;
    try {
      setUploadingCorrection(true);
      const uploadRes = await uploadService.uploadFiles([file], 'assignments');
      const fileUrl = uploadRes?.attachmentUrls?.[0];
      if (fileUrl) {
        setUploadedCorrectionUrl(fileUrl);
        setCorrectionFile(file);
        notifications.show({
          title: 'Đã tải lên',
          message: `Đã chuẩn bị tệp chữa bài: ${file.name}`,
          color: 'green'
        });
      }
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải tệp chữa bài lên hệ thống',
        color: 'red'
      });
    } finally {
      setUploadingCorrection(false);
    }
  };

  const handleRemoveCorrectionFile = () => {
    setCorrectionFile(null);
    setUploadedCorrectionUrl('');
  };

  const handleSaveGrade = async () => {
    if (grade === undefined || grade === null) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng nhập điểm số',
        color: 'red'
      });
      return;
    }
    if (!remarks.trim()) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng nhập nhận xét bài làm',
        color: 'red'
      });
      return;
    }

    try {
      setSubmittingGrade(true);
      const submissionId = selectedStudent.submission?.id;
      if (!submissionId) {
        notifications.show({
          title: 'Lỗi',
          message: 'Không tìm thấy ID bài nộp để chấm điểm',
          color: 'red'
        });
        return;
      }

      await assignmentService.gradeSubmission(submissionId, { 
        grade, 
        remarks,
        attachmentUrl: uploadedCorrectionUrl || null
      });
    } catch (error) {
      setSubmittingGrade(false);
      notifications.show({
        title: 'Lỗi',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi chấm điểm',
        color: 'red'
      });
      return;
    }

    setSubmittingGrade(false);
    notifications.show({
      title: 'Thành công',
      message: `Chấm điểm học viên ${selectedStudent.fullName} thành công`,
      color: 'green'
    });

    await onRefresh();
    
    if (isMobile) {
      onMobileComplete(false);
    }
  };

  if (isMobile) {
    return (
      <Stack gap="md">
        <Alert color="orange" variant="light" title="Trải nghiệm bị hạn chế trên di động" icon={<Warning size={18} />}>
          Để bảo đảm tính chính xác khi đọc tài liệu và chấm điểm, tính năng xem trước bài làm trực quan và nhập điểm số chỉ được hỗ trợ đầy đủ trên máy tính (Desktop/Laptop). Trên thiết bị di động, bạn chỉ được phép theo dõi trạng thái nộp bài và tải về tệp tin bài làm gốc để xem nhanh.
        </Alert>

        <Card withBorder p="sm" bg="var(--card-bg)" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
              {selectedStudent.submission.content.toLowerCase().endsWith('.pdf') ? (
                <FilePdf size={24} color="var(--accent-color)" style={{ flexShrink: 0 }} />
              ) : selectedStudent.submission.content.toLowerCase().includes('doc') ? (
                <FileDoc size={24} color="blue" style={{ flexShrink: 0 }} />
              ) : (
                <ImageIcon size={24} color="green" style={{ flexShrink: 0 }} />
              )}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>Liên kết tệp bài làm gốc</Text>
                <Text size="10px" c="dimmed" truncate>{selectedStudent.submission.content}</Text>
              </Box>
            </Group>
            <Button
              variant="light"
              color="copper"
              size="xs"
              leftSection={<Download size={14} />}
              component="a"
              href={selectedStudent.submission.content}
              target="_blank"
              style={{ flexShrink: 0 }}
            >
              Tải tệp gốc
            </Button>
          </Group>
        </Card>
      </Stack>
    );
  }

  return (
    <Grid gutter="md">
      {/* Cột Xem tệp nộp bài */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack gap="sm">
          <FilePreview fileUrl={selectedStudent.submission.content} />

          <Card withBorder p="sm" bg="var(--card-bg)" radius="md">
            <Group justify="space-between">
              <Group gap="xs">
                {selectedStudent.submission.content.toLowerCase().endsWith('.pdf') ? (
                  <FilePdf size={24} color="var(--accent-color)" />
                ) : selectedStudent.submission.content.toLowerCase().includes('doc') ? (
                  <FileDoc size={24} color="blue" />
                ) : (
                  <ImageIcon size={24} color="green" />
                )}
                <Box style={{ maxWidth: '280px' }}>
                  <Text size="xs" fw={600} truncate>Liên kết tệp bài làm gốc</Text>
                  <Text size="10px" c="dimmed" truncate>{selectedStudent.submission.content}</Text>
                </Box>
              </Group>
              <Button
                variant="light"
                color="copper"
                size="xs"
                leftSection={<Download size={14} />}
                component="a"
                href={selectedStudent.submission.content}
                target="_blank"
              >
                Tải tệp gốc
              </Button>
            </Group>
          </Card>
        </Stack>
      </Grid.Col>

      {/* Cột form Chấm điểm & Chữa bài */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card withBorder p="md" bg="var(--card-bg)" radius="md" style={{ position: 'sticky', top: '10px' }}>
          <Text fw={700} size="sm" mb="xs">Giao diện chấm điểm</Text>
          <Divider mb="md" />

          <Stack gap="md">
            <NumberInput
              label="Điểm số đạt được"
              placeholder={`Từ 0 đến ${assignment.maxPoints}`}
              min={0}
              max={assignment.maxPoints}
              decimalScale={1}
              value={grade}
              onChange={setGrade}
              required
              size="sm"
            />

            <Textarea
              label="Nhận xét của giáo viên"
              placeholder="Ghi chú nhận xét chi tiết..."
              minRows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              size="sm"
            />

            {/* Phần tải tệp chữa bài */}
            <Stack gap="xs">
              <Text size="sm" fw={500}>Tệp bài thi đã chữa (nếu có)</Text>
              
              {uploadedCorrectionUrl ? (
                <Card withBorder p="xs" bg="rgba(0,0,0,0.03)" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <Paperclip size={16} color="var(--accent-color)" />
                      <Text size="xs" truncate style={{ flex: 1 }}>
                        {correctionFile ? correctionFile.name : 'Đã tải lên tệp chữa bài'}
                      </Text>
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={handleRemoveCorrectionFile}
                    >
                      <X size={14} />
                    </ActionIcon>
                  </Group>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  color="gray"
                  size="sm"
                  fullWidth
                  leftSection={uploadingCorrection ? <Loader size="xs" color="gray" /> : <UploadSimple size={16} />}
                  onClick={() => document.getElementById('correction-file-btn')?.click()}
                  disabled={uploadingCorrection}
                >
                  {uploadingCorrection ? 'Đang tải lên...' : 'Tải lên tệp đã chữa'}
                </Button>
              )}
              <input
                type="file"
                id="correction-file-btn"
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => handleCorrectionFileChange(e.target.files?.[0])}
              />
            </Stack>

            <Button
              color="copper"
              leftSection={<CheckCircle size={16} />}
              onClick={handleSaveGrade}
              loading={submittingGrade}
              fullWidth
              mt="xs"
            >
              Lưu điểm số & Nhận xét
            </Button>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
}

export function AssignmentGradingPanel({ assignment, onBack }) {
  const [resolvedAssignmentId, setResolvedAssignmentId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loading = Boolean(assignment?.id) && (resolvedAssignmentId !== assignment.id || refreshing);

  // Trạng thái tìm kiếm & lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNGRADED' | 'GRADED' | 'NOT_SUBMITTED'

  // Responsive state (dưới 768px là mobile view)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showWorkspaceOnMobile, setShowWorkspaceOnMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSubmissions = useCallback(async () => {
    if (!assignment?.id) return;
    const assignmentId = assignment.id;
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    try {
      const res = await assignmentService.getAssignmentSubmissions(assignmentId);
      const data = Array.isArray(res) ? res : [];
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setSubmissions(data);
        setSelectedStudent(prev => {
          if (!prev) return null;
          return data.find(s => s.studentId === prev.studentId) || prev;
        });
      }
    } catch (error) {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        if (resolvedAssignmentId !== assignmentId) {
          setSubmissions([]);
          setSelectedStudent(null);
        }
        console.error('Lỗi tải danh sách bài nộp:', error);
        notifications.show({
          title: 'Lỗi',
          message: 'Không thể tải danh sách bài nộp của học sinh',
          color: 'red'
        });
      }
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setRefreshing(false);
        setResolvedAssignmentId(assignmentId);
      }
    }
  }, [assignment?.id, resolvedAssignmentId]);

  useEffect(() => {
    if (!assignment?.id) return;
    const assignmentId = assignment.id;
    const requestId = ++requestIdRef.current;

    const loadInitialSubmissions = async () => {
      try {
        const res = await assignmentService.getAssignmentSubmissions(assignmentId);
        const data = Array.isArray(res) ? res : [];
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setSubmissions(data);
          setSelectedStudent(prev => {
            if (!prev) return null;
            return data.find(s => s.studentId === prev.studentId) || prev;
          });
        }
      } catch (error) {
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setSubmissions([]);
          setSelectedStudent(null);
          console.error('Lỗi tải danh sách bài nộp:', error);
        }
      } finally {
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setResolvedAssignmentId(assignmentId);
        }
      }
    };

    loadInitialSubmissions();

    return () => {
      requestIdRef.current += 1;
    };
  }, [assignment?.id]);

  const visibleSubmissions = resolvedAssignmentId === assignment?.id ? submissions : [];

  // Bộ lọc tìm kiếm học viên
  const filteredSubmissions = useMemo(() => {
    return visibleSubmissions.filter(item => {
      const matchSearch = item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isSubmitted = !!item.submission;
      const hasFeedback = !!item.submission?.feedback;

      if (!matchSearch) return false;

      if (statusFilter === 'UNGRADED') return isSubmitted && !hasFeedback;
      if (statusFilter === 'GRADED') return isSubmitted && hasFeedback;
      if (statusFilter === 'NOT_SUBMITTED') return !isSubmitted;
      return true;
    });
  }, [visibleSubmissions, searchQuery, statusFilter]);

  const renderStudentItem = (item) => {
    const isSelected = selectedStudent?.studentId === item.studentId;
    const isSubmitted = !!item.submission;
    const hasFeedback = !!item.submission?.feedback;

    let badgeColor = 'red';
    let badgeText = 'Chưa nộp';
    if (isSubmitted) {
      if (hasFeedback) {
        badgeColor = 'teal';
        badgeText = `Đã chấm: ${item.submission.feedback.grade}đ`;
      } else {
        badgeColor = 'orange';
        badgeText = 'Chờ chấm';
      }
    }

    return (
      <UnstyledButton
        key={item.studentId}
        onClick={() => {
          setSelectedStudent(item);
          if (isMobile) {
            setShowWorkspaceOnMobile(true);
          }
        }}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: isSelected ? 'var(--mantine-color-copper-light)' : 'transparent',
          borderBottom: '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
        }}
        className="student-list-item"
      >
        <Group justify="space-between" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} truncate c={isSelected ? 'copper' : 'var(--text-color)'}>
              {item.fullName}
            </Text>
            <Text size="xs" c="dimmed">
              Mã: {item.studentCode}
            </Text>
          </Box>
          <Badge variant="light" color={badgeColor} size="xs" style={{ flexShrink: 0 }}>
            {badgeText}
          </Badge>
        </Group>
      </UnstyledButton>
    );
  };

  // Giao diện cột trái: Danh sách học viên
  const sidebarContent = (
    <Stack gap="md" style={{ height: '100%' }}>
      <Group justify="space-between">
        <Button
          variant="subtle"
          color="gray"
          leftSection={<ArrowLeft size={16} />}
          onClick={onBack}
          size="xs"
        >
          Quay lại danh sách
        </Button>
      </Group>

      <Card withBorder p="sm" bg="var(--card-bg)" radius="md">
        <Text size="sm" fw={700} truncate>{assignment?.title}</Text>
        <Text size="xs" c="dimmed">Điểm tối đa: {assignment?.maxPoints}đ</Text>
      </Card>

      <TextInput
        placeholder="Tìm kiếm học viên..."
        leftSection={<MagnifyingGlass size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="sm"
        radius="md"
      />

      <Group gap="xs">
        <UnstyledButton
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: statusFilter === 'ALL' ? 'var(--accent-color)' : 'var(--card-bg)',
            color: statusFilter === 'ALL' ? '#fff' : 'var(--text-color)',
            border: '1px solid var(--border-color)'
          }}
        >
          Tất cả ({submissions.length})
        </UnstyledButton>
        <UnstyledButton
          onClick={() => setStatusFilter('UNGRADED')}
          style={{
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: statusFilter === 'UNGRADED' ? 'var(--accent-color)' : 'var(--card-bg)',
            color: statusFilter === 'UNGRADED' ? '#fff' : 'var(--text-color)',
            border: '1px solid var(--border-color)'
          }}
        >
          Chờ chấm ({submissions.filter(s => s.submission && !s.submission.feedback).length})
        </UnstyledButton>
        <UnstyledButton
          onClick={() => setStatusFilter('GRADED')}
          style={{
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: statusFilter === 'GRADED' ? 'var(--accent-color)' : 'var(--card-bg)',
            color: statusFilter === 'GRADED' ? '#fff' : 'var(--text-color)',
            border: '1px solid var(--border-color)'
          }}
        >
          Đã chấm ({submissions.filter(s => s.submission?.feedback).length})
        </UnstyledButton>
      </Group>

      <ScrollArea style={{ flex: 1, minHeight: '300px' }} type="hover">
        <Stack gap={4}>
          {loading ? (
            <Center py="xl">
              <Loader color="copper" size="sm" />
            </Center>
          ) : filteredSubmissions.length === 0 ? (
            <Center py="xl">
              <Text size="xs" c="dimmed">Không tìm thấy học sinh nào phù hợp.</Text>
            </Center>
          ) : (
            filteredSubmissions.map(renderStudentItem)
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );

  // Giao diện cột phải: Không gian bài nộp & Chấm điểm
  const workspaceContent = selectedStudent ? (
    <Stack gap="md" style={{ height: '100%' }}>
      <Group justify="space-between" wrap="nowrap">
        <Box>
          <Group gap="xs">
            <Text fw={700} size="lg">{selectedStudent.fullName}</Text>
            <Text size="xs" c="dimmed">({selectedStudent.studentCode})</Text>
          </Group>
          {selectedStudent.submission && (
            <Text size="xs" c="dimmed">
              Nộp vào lúc: {new Date(selectedStudent.submission.submittedAt).toLocaleString('vi-VN')}
            </Text>
          )}
        </Box>
        {isMobile && (
          <Button
            variant="outline"
            color="gray"
            size="xs"
            onClick={() => setShowWorkspaceOnMobile(false)}
          >
            Quay lại danh sách HS
          </Button>
        )}
      </Group>

      <Divider />

      {selectedStudent.submission ? (
        <GradingEditor
          key={selectedStudent.studentId}
          selectedStudent={selectedStudent}
          assignment={assignment}
          onRefresh={fetchSubmissions}
          isMobile={isMobile}
          onMobileComplete={setShowWorkspaceOnMobile}
        />
      ) : (
        <Center py="100px">
          <Stack align="center" gap="xs">
            <ThemeIcon size="54" radius="xl" variant="light" color="red">
              <Warning size={28} />
            </ThemeIcon>
            <Text fw={600} size="md">Học viên chưa nộp bài</Text>
            <Text size="xs" c="dimmed" style={{ maxWidth: '300px', textAlign: 'center' }}>
              Học viên này chưa tải bài làm lên hệ thống nên không có nội dung để xem trước hoặc chấm điểm.
            </Text>
          </Stack>
        </Center>
      )}
    </Stack>
  ) : (
    <Center style={{ height: '100%', minHeight: '400px' }}>
      <Stack align="center" gap="xs">
        <ThemeIcon size="64" radius="xl" variant="light" color="gray">
          <Info size={32} />
        </ThemeIcon>
        <Text fw={600} size="md">Chọn học viên để bắt đầu</Text>
        <Text size="xs" c="dimmed" style={{ maxWidth: '350px', textAlign: 'center' }}>
          Hãy chọn một học sinh từ danh sách bên trái để mở rộng không gian làm việc, xem trước bài làm và tiến hành chấm điểm.
        </Text>
      </Stack>
    </Center>
  );

  return (
    <Box style={{ width: '100%', minHeight: '550px' }}>
      {isMobile ? (
        // Mobile View: Chỉ hiện một trong hai
        showWorkspaceOnMobile ? (
          <Box p="md" bg="var(--card-bg)" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '550px' }}>
            {workspaceContent}
          </Box>
        ) : (
          <Box p="md" bg="var(--card-bg)" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '550px' }}>
            {sidebarContent}
          </Box>
        )
      ) : (
        // Desktop View: Chia đôi Split View
        <Grid gutter="lg" style={{ alignItems: 'stretch' }}>
          {/* Cột trái */}
          <Grid.Col span={4}>
            <Box p="md" bg="var(--card-bg)" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', height: '100%', minHeight: '650px', display: 'flex', flexDirection: 'column' }}>
              {sidebarContent}
            </Box>
          </Grid.Col>

          {/* Cột phải */}
          <Grid.Col span={8}>
            <Box p="md" bg="var(--card-bg)" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', height: '100%', minHeight: '650px' }}>
              {workspaceContent}
            </Box>
          </Grid.Col>
        </Grid>
      )}
    </Box>
  );
}
