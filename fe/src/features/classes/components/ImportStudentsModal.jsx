import { useState, useEffect, useRef } from 'react';
import {
  Modal, Stack, Text, Button, FileInput, Textarea, Table, Group,
  Badge, ActionIcon, ScrollArea, TextInput, Card, Alert, Divider
} from '@mantine/core';
import { UploadSimple, DownloadSimple, Check, Trash, WarningCircle, ClipboardText } from '@phosphor-icons/react';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';
import studentService from '../../students/services/studentService';
import apiClient from '../../../services/apiClient';

export function ImportStudentsModal({ opened, onClose, classId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [parsedStudents, setParsedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successList, setSuccessList] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (readerRef.current && readerRef.current.readyState === FileReader.LOADING) {
        readerRef.current.abort();
      }
    };
  }, []);

  // Tải file excel mẫu
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/api/utils/excel/template-students', {
        responseType: 'blob'
      });
      const blob = response instanceof Blob ? response : new Blob([response]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'owly_template_hoc_sinh.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi khi tải file mẫu:', error);
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải file mẫu. Vui lòng thử lại.',
        color: 'red'
      });
    }
  };

  // Chuẩn hóa định dạng ngày
  const parseExcelDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) {
      return val;
    }
    if (typeof val === 'number') {
      const utcDays = Math.floor(val - 25569);
      const utcValue = utcDays * 86400;
      return new Date(utcValue * 1000);
    }
    const strVal = String(val).trim();
    // Parse DD/MM/YYYY
    const parts = strVal.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const parsedDate = new Date(y, m, d);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    // Parse YYYY-MM-DD
    const parsedDate = new Date(strVal);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
    return null;
  };

  // Đọc file excel tải lên
  const handleFileChange = (selectedFile) => {
    if (readerRef.current) {
      readerRef.current.abort();
      readerRef.current = null;
    }

    setFile(selectedFile);
    if (!selectedFile) return;

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Dòng 1 là header, bỏ qua dòng 1
        const students = rawRows.slice(1).map((row, index) => {
          const rawDob = row[1];
          const dobDate = parseExcelDate(rawDob);
          return {
            tempId: index,
            fullName: String(row[0] || '').trim(),
            dateOfBirth: dobDate,
            parentPhone: String(row[2] || '').trim(),
            phone: String(row[3] || '').trim() || null,
            email: String(row[4] || '').trim() || null
          };
        }).filter(s => s.fullName || s.dateOfBirth || s.parentPhone);

        setParsedStudents(students);
        setPasteText('');
      } catch (err) {
        console.error(err);
        notifications.show({
          title: 'Lỗi đọc file',
          message: 'Không thể đọc dữ liệu từ file Excel này',
          color: 'red'
        });
      }
    };

    reader.onloadend = () => {
      if (readerRef.current === reader) {
        readerRef.current = null;
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Đọc dữ liệu copy-paste (TSV)
  const handlePasteChange = (val) => {
    setPasteText(val);
    if (!val.trim()) return;

    try {
      const rows = val.split(/\r?\n/);
      const students = rows.map((row, index) => {
        const cols = row.split('\t');
        if (cols.length < 2) return null;
        
        const rawDob = cols[1]?.trim();
        const dobDate = parseExcelDate(rawDob);

        return {
          tempId: index,
          fullName: cols[0]?.trim() || '',
          dateOfBirth: dobDate,
          parentPhone: cols[2]?.trim() || '',
          phone: cols[3]?.trim() || null,
          email: cols[4]?.trim() || null
        };
      }).filter(s => s && (s.fullName || s.dateOfBirth || s.parentPhone));

      setParsedStudents(students);
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Cập nhật giá trị sửa đổi trực tiếp trên bảng preview
  const handleUpdateField = (tempId, field, value) => {
    setParsedStudents(prev => prev.map(s => {
      if (s.tempId === tempId) {
        let val = value;
        if (field === 'dateOfBirth') {
          val = parseExcelDate(value);
        }
        if (val === '') {
          val = null;
        }
        return { ...s, [field]: val };
      }
      return s;
    }));
  };

  // Xóa học sinh khỏi bảng preview
  const handleRemoveStudent = (tempId) => {
    setParsedStudents(prev => prev.filter(s => s.tempId !== tempId));
  };

  // Validate từng học sinh
  const validateStudent = (student) => {
    const errors = [];
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

    if (!student.fullName || student.fullName.trim().length < 2) {
      errors.push('Họ tên tối thiểu 2 ký tự');
    }
    if (!student.dateOfBirth || isNaN(new Date(student.dateOfBirth).getTime())) {
      errors.push('Ngày sinh không hợp lệ');
    }
    if (!student.parentPhone || !phoneRegex.test(student.parentPhone)) {
      errors.push('SĐT Phụ huynh sai');
    }
    if (student.phone && !phoneRegex.test(student.phone)) {
      errors.push('SĐT Học sinh sai');
    }
    if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      errors.push('Email học sinh sai');
    }
    return errors;
  };

  // Xác nhận lưu hàng loạt học sinh
  const handleSubmit = async () => {
    const hasErrors = parsedStudents.some(s => validateStudent(s).length > 0);
    if (hasErrors) {
      notifications.show({
        title: 'Không thể tạo',
        message: 'Vui lòng sửa toàn bộ thông tin bị lỗi màu đỏ trước khi gửi.',
        color: 'red'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = parsedStudents.map(s => ({
        fullName: s.fullName,
        dateOfBirth: new Date(s.dateOfBirth).toISOString(),
        parentPhone: s.parentPhone,
        phone: s.phone || null,
        email: s.email || null
      }));

      const res = await studentService.bulkCreateAndEnroll(classId, payload);
      const list = res.data || res || [];
      setSuccessList(list);
      
      notifications.show({
        title: 'Thành công',
        message: `Đã nhập và ghi danh thành công ${list.length} học viên mới`,
        color: 'green'
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Thất bại',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo học viên hàng loạt',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasValidationError = parsedStudents.some(s => validateStudent(s).length > 0);

  const handleCopyAllAccounts = () => {
    if (!successList) return;
    const header = 'DANH SÁCH TÀI KHOẢN HỌC VIÊN MỚI ĐƯỢC CẤP:\n\n';
    const body = successList.map((std, idx) => 
      `${idx + 1}. Họ tên: ${std.fullName}\n   Tên đăng nhập (Mã HS): ${std.studentCode}\n   Mật khẩu: Owly@123456\n   SĐT Phụ huynh: ${std.parentPhone}`
    ).join('\n\n');
    const footer = '\n\nHướng dẫn: Học sinh sử dụng vai trò "Học sinh" để đăng nhập với mã HS ở trên và đổi mật khẩu ở lần đăng nhập đầu tiên.';
    
    navigator.clipboard.writeText(header + body + footer);
    notifications.show({
      title: 'Đã sao chép',
      message: 'Đã sao chép thông tin của toàn bộ học viên mới',
      color: 'teal'
    });
  };

  if (successList) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={<Text fw={700} size="md">Nhập học viên thành công</Text>}
        size="lg"
        centered
        closeOnClickOutside={false}
      >
        <Stack gap="md" pt="xs">
          <Alert color="teal" icon={<Check size={18} />} title="Kết quả nhập danh sách">
            Hệ thống đã tạo thành công <b>{successList.length} tài khoản</b> học viên mới và ghi danh vào lớp. Dưới đây là thông tin tài khoản:
          </Alert>

          <Button
            leftSection={<ClipboardText size={16} />}
            variant="light"
            color="copper"
            onClick={handleCopyAllAccounts}
            fullWidth
          >
            Sao chép thông tin toàn bộ tài khoản
          </Button>

          <Card withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
            <ScrollArea h={300}>
              <Table verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead style={{ backgroundColor: 'var(--bg-color)' }}>
                  <Table.Tr>
                    <Table.Th>Học viên</Table.Th>
                    <Table.Th>Mã HS (Đăng nhập)</Table.Th>
                    <Table.Th>Mật khẩu</Table.Th>
                    <Table.Th>SĐT Phụ huynh</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {successList.map(std => (
                    <Table.Tr key={std.id}>
                      <Table.Td><Text size="sm" fw={600}>{std.fullName}</Text></Table.Td>
                      <Table.Td><Badge color="copper" variant="filled">{std.studentCode}</Badge></Table.Td>
                      <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>Owly@123456</Text></Table.Td>
                      <Table.Td><Text size="sm">{std.parentPhone}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>

          <Group justify="flex-end" mt="md">
            <Button color="copper" onClick={onClose}>Hoàn tất</Button>
          </Group>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} size="xl">Nhập học viên mới từ Excel</Text>}
      size="1000px"
      centered
    >
      <Stack gap="md" pt="xs">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Tải file mẫu về điền thông tin hoặc kéo thả file Excel, hoặc sao chép & dán cột từ Excel.</Text>
          <Button
            size="xs"
            variant="outline"
            color="copper"
            leftSection={<DownloadSimple size={14} />}
            onClick={handleDownloadTemplate}
          >
            Tải file mẫu (.xlsx)
          </Button>
        </Group>

        <Divider />

        <Group grow align="flex-start" gap="md">
          {/* Cột Tải File */}
          <Card withBorder p="sm" bg="var(--card-bg)" style={{ flex: 1 }}>
            <FileInput
              label="Cách 1: Tải lên file Excel"
              placeholder="Chọn file .xlsx hoặc .xls..."
              leftSection={<UploadSimple size={16} />}
              value={file}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              disabled={submitting}
            />
          </Card>

          {/* Cột Copy-Paste */}
          <Card withBorder p="sm" bg="var(--card-bg)" style={{ flex: 1 }}>
            <Textarea
              label="Cách 2: Copy-Paste từ Excel"
              placeholder="Sao chép các dòng thông tin trong Excel và dán vào đây (Họ tên [Tab] Ngày sinh [Tab] SĐT)..."
              value={pasteText}
              onChange={(e) => handlePasteChange(e.currentTarget.value)}  
              disabled={submitting}
              rows={2}
            />
          </Card>
        </Group>

        {parsedStudents.length > 0 && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600} size="sm">
                Danh sách xem trước ({parsedStudents.length} học viên):
              </Text>
              {hasValidationError && (
                <Badge color="red" leftSection={<WarningCircle size={12} />} variant="light">
                  Phát hiện thông tin lỗi (tô đỏ). Nhập đúp để chỉnh sửa trực tiếp.
                </Badge>
              )}
            </Group>

            <Card withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
              <ScrollArea h={320}>
                <Table verticalSpacing="xs" horizontalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
                  <Table.Thead style={{ backgroundColor: 'var(--bg-color)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <Table.Tr>
                      <Table.Th style={{ width: 160 }}>Họ và tên (*)</Table.Th>
                      <Table.Th style={{ width: 130 }}>Ngày sinh (*)</Table.Th>
                      <Table.Th style={{ width: 130 }}>SĐT Phụ huynh (*)</Table.Th>
                      <Table.Th style={{ width: 130 }}>SĐT Học sinh</Table.Th>
                      <Table.Th style={{ width: 160 }}>Email Học sinh</Table.Th>
                      <Table.Th>Trạng thái</Table.Th>
                      <Table.Th style={{ width: 50, textAlign: 'center' }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {parsedStudents.map((std) => {
                      const errors = validateStudent(std);
                      const formattedDob = std.dateOfBirth
                        ? new Date(std.dateOfBirth).toLocaleDateString('vi-VN')
                        : '';
                      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

                      return (
                        <Table.Tr key={std.tempId} style={{ backgroundColor: errors.length > 0 ? 'var(--mantine-color-red-0)' : undefined }}>
                          {/* Họ và tên */}
                          <Table.Td>
                            <TextInput
                              value={std.fullName}
                              onChange={(e) => handleUpdateField(std.tempId, 'fullName', e.target.value)}
                              variant="unstyled"
                              size="xs"
                              styles={{ input: { padding: 0, height: 'auto', minHeight: 0 } }}
                              error={!std.fullName || std.fullName.trim().length < 2}
                            />
                          </Table.Td>

                          {/* Ngày sinh */}
                          <Table.Td>
                            <TextInput
                              value={formattedDob}
                              placeholder="DD/MM/YYYY"
                              onChange={(e) => handleUpdateField(std.tempId, 'dateOfBirth', e.target.value)}
                              variant="unstyled"
                              size="xs"
                              styles={{ input: { padding: 0, height: 'auto', minHeight: 0 } }}
                              error={!std.dateOfBirth}
                            />
                          </Table.Td>

                          {/* SĐT Phụ huynh */}
                          <Table.Td>
                            <TextInput
                              value={std.parentPhone}
                              onChange={(e) => handleUpdateField(std.tempId, 'parentPhone', e.target.value)}
                              variant="unstyled"
                              size="xs"
                              styles={{ input: { padding: 0, height: 'auto', minHeight: 0 } }}
                              error={!std.parentPhone || !phoneRegex.test(std.parentPhone)}
                            />
                          </Table.Td>

                          {/* SĐT Học sinh */}
                          <Table.Td>
                            <TextInput
                              value={std.phone || ''}
                              placeholder="Không bắt buộc"
                              onChange={(e) => handleUpdateField(std.tempId, 'phone', e.target.value)}
                              variant="unstyled"
                              size="xs"
                              styles={{ input: { padding: 0, height: 'auto', minHeight: 0 } }}
                              error={std.phone && !phoneRegex.test(std.phone)}
                            />
                          </Table.Td>

                          {/* Email Học sinh */}
                          <Table.Td>
                            <TextInput
                              value={std.email || ''}
                              placeholder="Không bắt buộc"
                              onChange={(e) => handleUpdateField(std.tempId, 'email', e.target.value)}
                              variant="unstyled"
                              size="xs"
                              styles={{ input: { padding: 0, height: 'auto', minHeight: 0 } }}
                              error={std.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(std.email)}
                            />
                          </Table.Td>

                          {/* Trạng thái lỗi */}
                          <Table.Td>
                            {errors.length > 0 ? (
                              <Group gap={4}>
                                {errors.map((err, i) => (
                                  <Badge key={i} color="red" size="xs" variant="light">
                                    {err}
                                  </Badge>
                                ))}
                              </Group>
                            ) : (
                              <Badge color="teal" size="xs" variant="light">Hợp lệ</Badge>
                            )}
                          </Table.Td>

                          {/* Xóa dòng */}
                          <Table.Td style={{ textAlign: 'center' }}>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() => handleRemoveStudent(std.tempId)}
                            >
                              <Trash size={14} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card>
          </Stack>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button
            color="copper"
            onClick={handleSubmit}
            loading={submitting}
            disabled={parsedStudents.length === 0 || hasValidationError}
          >
            Xác nhận tạo {parsedStudents.length} học viên
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
