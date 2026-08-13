import { useState, useEffect, useMemo } from 'react';
import {
  Drawer, Text, Group, Stack, Button,
  TextInput, Title, Badge,
  Select, Textarea, Box, ActionIcon, Tooltip,
  Tabs, ScrollArea, Image, CloseButton, HoverCard, Modal, Accordion
} from '@mantine/core';
import { 
  ChatTeardropText, ArrowCounterClockwise, Bug, 
  Lightbulb, ChatText, ClockCounterClockwise, 
  PaperPlaneRight, ImageSquare, MagnifyingGlass, FileImage
} from '@phosphor-icons/react';
import { useForm } from '@mantine/form';
import { feedbackService } from '../services/feedbackService';
import { notifications } from '@mantine/notifications';
import classes from './FeedbackDrawer.module.css';

export function FeedbackDrawer({ opened, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('submit');

  // Image Upload State (Multiple)
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageError, setImageError] = useState('');

  // Lightbox State
  const [lightboxOpened, setLightboxOpened] = useState(false);
  const [currentLightboxImage, setCurrentLightboxImage] = useState(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [visibleCount, setVisibleCount] = useState(15);

  const form = useForm({
    initialValues: {
      type: 'Bug',
      title: '',
      content: ''
    },
    validate: {
      type: (val) => (val ? null : 'Vui lòng chọn loại phản hồi'),
      title: (val) => (val.trim().length > 0 ? null : 'Tiêu đề không được để trống'),
      content: (val) => (val.trim().length >= 10 ? null : 'Nội dung phải dài ít nhất 10 ký tự')
    }
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'history') {
      setLoading(true);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClose = () => {
    setActiveTab('submit');
    onClose();
  };

  useEffect(() => {
    if (!opened || activeTab !== 'history') return;
    let active = true;

    const performFetch = async () => {
      try {
        const res = await feedbackService.getMyFeedbacks();
        if (active) {
          if (Array.isArray(res)) {
            setFeedbacks(res);
          } else if (res?.data) {
            setFeedbacks(res.data);
          }
        }
      } catch (err) {
        console.error('Không thể tải lịch sử phản hồi:', err);
        if (active) {
          notifications.show({
            title: 'Lỗi',
            message: 'Không thể tải lịch sử phản hồi. Vui lòng thử lại sau!',
            color: 'red'
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    performFetch();

    return () => {
      active = false;
    };
  }, [opened, activeTab, refreshTrigger]);

  const addFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    if (imageFiles.length + validFiles.length > 5) {
      setImageError('Vượt quá giới hạn 5 ảnh.');
      return;
    }
    setImageError('');

    const newFiles = [...imageFiles, ...validFiles];
    const newPreviews = [...imagePreviews, ...validFiles.map(f => URL.createObjectURL(f))];
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleImageSelect = (e) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handlePaste = (e) => {
    if (e.clipboardData.files.length > 0) {
      addFiles(e.clipboardData.files);
      e.preventDefault(); 
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      let attachmentUrls = [];

      if (imageFiles.length > 0) {
        const uploadRes = await feedbackService.uploadImages(imageFiles);
        if (uploadRes?.data?.attachmentUrls) {
          attachmentUrls = uploadRes.data.attachmentUrls;
        } else if (uploadRes?.attachmentUrls) {
          attachmentUrls = uploadRes.attachmentUrls;
        }
      }

      const payload = { ...values, attachmentUrls };
      const res = await feedbackService.createFeedback(payload);
      
      if (res && (res.id || res.success || res.data)) {
        notifications.show({
          title: 'Thành công',
          message: res.message || 'Gửi phản hồi thành công!',
          color: 'green'
        });
        form.reset();
        setImageFiles([]);
        setImagePreviews([]);
        setImageError('');
        handleTabChange('history');
      }
    } catch (err) {
      console.error('Không thể gửi phản hồi:', err);
      notifications.show({
        title: 'Thất bại',
        message: err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi phản hồi',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeedbackTypeBadge = (type) => {
    switch (type) {
      case 'Bug':
        return <Badge variant="light" color="red" leftSection={<Bug size={12} />} size="sm">Báo lỗi</Badge>;
      case 'FeatureRequest':
        return <Badge variant="light" color="blue" leftSection={<Lightbulb size={12} />} size="sm">Đề xuất</Badge>;
      default:
        return <Badge variant="light" color="teal" leftSection={<ChatText size={12} />} size="sm">Góp ý</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <Badge variant="dot" color="green" size="sm">Đã giải quyết</Badge>;
      case 'Reviewed':
        return <Badge variant="dot" color="blue" size="sm">Đang xem xét</Badge>;
      default:
        return <Badge variant="dot" color="yellow" size="sm">Chờ xử lý</Badge>;
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      const matchType = filterType === 'All' || item.type === filterType;
      const term = searchQuery.toLowerCase();
      const matchSearch = item.title?.toLowerCase().includes(term) || item.content?.toLowerCase().includes(term);
      return matchType && matchSearch;
    });
  }, [feedbacks, filterType, searchQuery]);

  const visibleFeedbacks = filteredFeedbacks.slice(0, visibleCount);

  const openLightbox = (url) => {
    setCurrentLightboxImage(url);
    setLightboxOpened(true);
  };

  return (
    <>
      <Drawer
        opened={opened}
        onClose={handleClose}
        position="right"
        size="xl" 
        title={
          <Box>
            <Title order={3}>Feedback Hub</Title>
            <Text c="dimmed" size="xs" mt={2}>Đóng góp ý kiến để hoàn thiện Owly</Text>
          </Box>
        }
        classNames={{
          content: classes.drawerContent,
          header: classes.drawerHeader,
          body: classes.drawerBody,
        }}
        overlayProps={{ opacity: 0.5, blur: 4 }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} classNames={{ list: classes.tabsList, tab: classes.tab }} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <Tabs.List>
            <Tabs.Tab value="submit" leftSection={<PaperPlaneRight size={16} />}>Gửi phản hồi</Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<ClockCounterClockwise size={16} />}>Lịch sử của tôi</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="submit" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Box pos="relative" className={classes.formSection} onPaste={handlePaste}>
              <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
                <Stack gap="md" mt="md" pb="xl">
                  <Select
                    label="Loại phản hồi"
                    placeholder="Chọn phân loại..."
                    data={[
                      { value: 'Bug', label: 'Báo lỗi hệ thống' },
                      { value: 'FeatureRequest', label: 'Đề xuất tính năng mới' },
                      { value: 'GeneralFeedback', label: 'Góp ý chung' }
                    ]}
                    required
                    {...form.getInputProps('type')}
                  />

                  <TextInput
                    label="Tiêu đề"
                    placeholder="Nhập tiêu đề ngắn gọn..."
                    required
                    {...form.getInputProps('title')}
                  />

                  <Textarea
                    label="Nội dung chi tiết"
                    placeholder="Mô tả chi tiết lỗi (có thể bấm Ctrl+V để dán nhiều ảnh vào đây)..."
                    required
                    minRows={5}
                    maxRows={10}
                    {...form.getInputProps('content')}
                  />

                  <Box>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={500}>Ảnh đính kèm (Tối đa 5 ảnh)</Text>
                      {imageError && <Text size="sm" c="red" fw={500}>{imageError}</Text>}
                    </Group>
                    <Stack gap="xs">
                      {imageFiles.map((file, idx) => (
                        <Box key={idx} className={classes.uploadedFileRow}>
                          <HoverCard width={240} shadow="md" withArrow position="top">
                            <HoverCard.Target>
                              <Group gap="xs" style={{ cursor: 'pointer', flex: 1 }} onClick={() => openLightbox(imagePreviews[idx])}>
                                <FileImage size={20} color="var(--mantine-color-blue-filled)" />
                                <Text size="sm" fw={500} lineClamp={1}>
                                  Ảnh {idx + 1}: {file.name}
                                </Text>
                              </Group>
                            </HoverCard.Target>
                            <HoverCard.Dropdown p={4}>
                              <Image src={imagePreviews[idx]} radius="sm" alt="Preview" />
                            </HoverCard.Dropdown>
                          </HoverCard>

                          <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <CloseButton size="sm" iconSize={16} />
                          </ActionIcon>
                        </Box>
                      ))}

                      {imageFiles.length < 5 && (
                        <label className={classes.imageUploadBox}>
                          <input 
                            type="file" 
                            multiple
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleImageSelect} 
                          />
                          <Stack align="center" gap="xs">
                            <ImageSquare size={24} color="var(--mantine-color-dimmed)" />
                            <Text size="sm" c="dimmed">Bấm để chọn file hoặc dán ảnh vào form</Text>
                          </Stack>
                        </label>
                      )}
                    </Stack>
                  </Box>

                  <Button 
                    type="submit" 
                    color="copper" 
                    leftSection={<ChatTeardropText size={18} />}
                    mt="md"
                    className={classes.submitBtn}
                    loading={submitting}
                    fullWidth
                  >
                    Gửi phản hồi
                  </Button>
                </Stack>
              </form>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="history" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <Box pos="relative" className={classes.historyList} mt="md" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              
              <Group justify="space-between" mb="sm" align="flex-end">
                <Box className={classes.filterBar} style={{ flex: 1, marginBottom: 0 }}>
                  <TextInput
                    placeholder="Tìm từ khóa..."
                    leftSection={<MagnifyingGlass size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    style={{ flex: 2 }}
                  />
                  <Select
                    data={[
                      { value: 'All', label: 'Tất cả loại' },
                      { value: 'Bug', label: 'Báo lỗi' },
                      { value: 'FeatureRequest', label: 'Đề xuất' },
                      { value: 'GeneralFeedback', label: 'Góp ý' }
                    ]}
                    value={filterType}
                    onChange={(v) => { setFilterType(v); setVisibleCount(15); }}
                    style={{ flex: 1, minWidth: 120 }}
                  />
                </Box>
                <Tooltip label="Làm mới">
                  <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleRefresh} loading={loading}>
                    <ArrowCounterClockwise size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                {filteredFeedbacks.length === 0 && !loading ? (
                  <Box className={classes.emptyState}>
                    <Text size="sm" c="dimmed">Không tìm thấy phản hồi nào phù hợp.</Text>
                  </Box>
                ) : (
                  <Stack gap="sm" pb="xl">
                    <Accordion variant="separated" chevronPosition="right" style={{ width: '100%' }}>
                      {visibleFeedbacks.map((item) => (
                        <Accordion.Item key={item.id} value={item.id}>
                          <Accordion.Control>
                            <Group justify="space-between" align="center" mb={8}>
                              <Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>{item.title}</Text>
                              <Text size="xs" c="dimmed">
                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              {getFeedbackTypeBadge(item.type)}
                              {getStatusBadge(item.status)}
                            </Group>
                          </Accordion.Control>
                          
                          <Accordion.Panel>
                            <Text size="sm" mb="md" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                            
                            {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                              <Stack gap="xs">
                                <Text size="xs" fw={500} c="dimmed">Ảnh đính kèm:</Text>
                                {item.attachmentUrls.map((url, i) => (
                                  <Box key={i} className={classes.uploadedFileRow}>
                                    <HoverCard width={240} shadow="md" withArrow position="top">
                                      <HoverCard.Target>
                                        <Group gap="xs" style={{ cursor: 'pointer', flex: 1 }} onClick={() => openLightbox(url)}>
                                          <FileImage size={18} color="var(--mantine-color-blue-filled)" />
                                          <Text size="xs" fw={500} lineClamp={1}>
                                            Ảnh đính kèm {i + 1}
                                          </Text>
                                        </Group>
                                      </HoverCard.Target>
                                      <HoverCard.Dropdown p={4}>
                                        <Image src={url} radius="sm" alt="Preview" fallbackSrc="https://placehold.co/600x400?text=Lỗi+tải+ảnh" />
                                      </HoverCard.Dropdown>
                                    </HoverCard>
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                    
                    {filteredFeedbacks.length > visibleCount && (
                      <Button 
                        variant="light" 
                        color="gray" 
                        onClick={() => setVisibleCount((prev) => prev + 15)}
                        fullWidth
                      >
                        Xem thêm
                      </Button>
                    )}
                  </Stack>
                )}
              </ScrollArea>
            </Box>
          </Tabs.Panel>
        </Tabs>
      </Drawer>

      <Modal 
        opened={lightboxOpened} 
        onClose={() => setLightboxOpened(false)} 
        size="auto" 
        centered
        withCloseButton={false}
        overlayProps={{ opacity: 0.8, blur: 10 }}
      >
        <Image src={currentLightboxImage} alt="Fullscreen View" style={{ maxHeight: '85vh', objectFit: 'contain' }} />
      </Modal>
    </>
  );
}

export default FeedbackDrawer;
