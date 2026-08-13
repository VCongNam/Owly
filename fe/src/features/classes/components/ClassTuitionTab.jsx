import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Group,
  Text,
  Button,
  Paper,
  Table,
  Badge,
  ActionIcon,
  TextInput,
  Select,
  Pagination,
  ScrollArea,
  Stack,
  SimpleGrid,
  Center,
  Loader,
  Tooltip,
  Alert,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import {
  CurrencyCircleDollar,
  Receipt,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Plus,
  Gear,
  Eye,
  WarningCircle,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { useClassTuition, useStudentTuition } from '../hooks/useTuition';
import { useClassDetails } from '../hooks/useClasses';
import { TuitionConfigModal } from './TuitionConfigModal';
import { GenerateInvoicesModal } from './GenerateInvoicesModal';
import { PaymentProofModal } from './PaymentProofModal';
import { StudentPaymentProofModal } from './StudentPaymentProofModal';
import { useAuth } from '../../auth';

export function ClassTuitionTab() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const { classId } = useParams();
  const { classDetail } = useClassDetails(classId);

  // Teacher hook called only if not student
  const teacherClassTuition = useClassTuition(isStudent ? null : classId);

  const {
    studentInvoices,
    loadingStudentInvoices,
    fetchStudentClassInvoices
  } = useStudentTuition(isStudent ? classId : null);

  // Student specific state
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [studentSelectedInvoice, setStudentSelectedInvoice] = useState(null);

  const {
    config,
    loadingConfig,
    invoices,
    loadingInvoices,
    stats,
    unbilledPastMonths,
    pagination,
    submitting,
    updateConfig,
    fetchInvoices,
    generateInvoices,
    reviewTransaction,
  } = isStudent
    ? {
        config: { amount: 0 },
        loadingConfig: false,
        invoices: [],
        loadingInvoices: false,
        stats: { totalExpected: 0, totalCollected: 0, totalPending: 0, totalUnpaid: 0 },
        unbilledPastMonths: [],
        pagination: { totalPages: 1 },
        submitting: false,
        updateConfig: () => {},
        fetchInvoices: () => {},
        generateInvoices: () => {},
        reviewTransaction: () => {},
      }
    : teacherClassTuition;

  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [generateModalMonthDate, setGenerateModalMonthDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);

  // Modals state
  const [configModalOpened, setConfigModalOpened] = useState(false);
  const [generateModalOpened, setGenerateModalOpened] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleOpenGenerateModal = (monthStr) => {
    if (monthStr) {
      const [yearStr, monthStrPart] = monthStr.split('-');
      setGenerateModalMonthDate(new Date(parseInt(yearStr, 10), parseInt(monthStrPart, 10) - 1, 1));
    } else {
      setGenerateModalMonthDate(selectedMonthDate || new Date());
    }
    setGenerateModalOpened(true);
  };

  const handleMonthFilterChange = (date) => {
    setSelectedMonthDate(date ?? new Date());
    setActivePage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value ?? '');
    setActivePage(1);
  };

  const currentBillingMonth = selectedMonthDate ? dayjs(selectedMonthDate).format('YYYY-MM') : '';

  const handleFetch = useCallback(
    (page = 1) => {
      if (isStudent) return;
      fetchInvoices({
        page,
        limit: 10,
        billingMonth: currentBillingMonth,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
    },
    [fetchInvoices, currentBillingMonth, statusFilter, searchQuery, isStudent]
  );

  useEffect(() => {
    if (isStudent) return;
    handleFetch(1);
  }, [currentBillingMonth, statusFilter, handleFetch, isStudent]);

  const handlePageChange = (page) => {
    setActivePage(page);
    handleFetch(page);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActivePage(1);
    handleFetch(1);
  };

  const teacherBank = classDetail?.teacher
    ? {
        bankName: classDetail.teacher.bankName,
        bankAccountNo: classDetail.teacher.bankAccountNo,
        bankAccountName: classDetail.teacher.bankAccountName,
        bankBin: classDetail.teacher.bankBin,
      }
    : {};

  if (isStudent) {
    const unpaidInvoices = studentInvoices.filter(i => i.status === 'Unpaid');
    const pendingInvoices = studentInvoices.filter(i => i.status === 'Pending');
    const paidInvoices = studentInvoices.filter(i => i.status === 'Paid');

    const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalPaidAmount = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    const filteredInvoices = studentStatusFilter
      ? studentInvoices.filter(i => i.status === studentStatusFilter)
      : studentInvoices;

    return (
      <Stack gap="lg">
        {/* Thẻ thống kê Học sinh */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {/* Chưa thanh toán */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  Chưa thanh toán
                </Text>
                <Text size="xl" fw={700} c="red" mt={4}>
                  {totalUnpaidAmount.toLocaleString('vi-VN')} đ
                </Text>
              </div>
              <Clock size={24} weight="duotone" color="red" />
            </Group>
          </Paper>

          {/* Chờ đối soát */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  Chờ đối soát
                </Text>
                <Text size="xl" fw={700} c="orange" mt={4}>
                  {totalPendingAmount.toLocaleString('vi-VN')} đ
                </Text>
              </div>
              <Clock size={24} weight="duotone" color="orange" />
            </Group>
          </Paper>

          {/* Đã thanh toán */}
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  Đã thanh toán
                </Text>
                <Text size="xl" fw={700} c="teal" mt={4}>
                  {totalPaidAmount.toLocaleString('vi-VN')} đ
                </Text>
              </div>
              <CheckCircle size={24} weight="duotone" color="teal" />
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Thanh công cụ học sinh */}
        <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Select
              placeholder="Trạng thái thanh toán"
              value={studentStatusFilter}
              onChange={(val) => setStudentStatusFilter(val || '')}
              data={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'Unpaid', label: 'Chưa thanh toán' },
                { value: 'Pending', label: 'Chờ đối soát' },
                { value: 'Paid', label: 'Đã thanh toán' },
              ]}
              clearable
              size="sm"
              style={{ width: 220 }}
            />
          </Group>
        </Paper>

        {/* Bảng danh sách hóa đơn cá nhân */}
        <Paper radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)', overflow: 'hidden' }}>
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover style={{ minWidth: 600 }}>
              <Table.Thead style={{ backgroundColor: 'var(--bg-color)' }}>
                <Table.Tr>
                  <Table.Th>Hóa đơn</Table.Th>
                  <Table.Th>Tháng</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Số buổi</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Số tiền (VNĐ)</Table.Th>
                  <Table.Th>Hạn nộp</Table.Th>
                  <Table.Th>Trạng thái</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Hành động</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loadingStudentInvoices ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Center py="xl">
                        <Loader color="copper" size="sm" />
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredInvoices.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Center py="xl">
                        <Stack align="center" gap="xs">
                          <CurrencyCircleDollar size={40} weight="duotone" color="var(--mantine-color-gray-4)" />
                          <Text size="sm" c="dimmed">
                            Không tìm thấy hóa đơn học phí nào.
                          </Text>
                        </Stack>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const STATUS_MAP = {
                      Paid: { label: 'Đã thanh toán', color: 'teal' },
                      Pending: { label: 'Chờ đối soát', color: 'orange' },
                      Unpaid: { label: 'Chưa thanh toán', color: 'red' },
                    };
                    const statusInfo = STATUS_MAP[inv.status] || { label: inv.status, color: 'gray' };

                    return (
                      <Table.Tr key={inv.id}>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {inv.title || 'Hóa đơn học phí'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="dot" color="blue" size="sm">
                            {inv.billingMonth ? `Tháng ${inv.billingMonth.split('-')[1]}/${inv.billingMonth.split('-')[0]}` : '---'}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Text size="sm" fw={500}>
                            {inv.sessionCount || 0} buổi
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm" fw={700} c="copper">
                            {Number(inv.amount).toLocaleString('vi-VN')} đ
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {inv.dueDate ? dayjs(inv.dueDate).format('DD/MM/YYYY') : '---'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={statusInfo.color} size="md">
                            {statusInfo.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Button
                            variant={inv.status === 'Unpaid' ? 'filled' : 'light'}
                            color={inv.status === 'Unpaid' ? 'copper' : 'gray'}
                            size="xs"
                            onClick={() => setStudentSelectedInvoice(inv)}
                          >
                            {inv.status === 'Unpaid' ? 'Thanh toán' : 'Chi tiết'}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>

        {studentSelectedInvoice && (
          <StudentPaymentProofModal
            key={studentSelectedInvoice.id}
            opened={!!studentSelectedInvoice}
            onClose={() => setStudentSelectedInvoice(null)}
            invoice={studentSelectedInvoice}
            teacherBank={teacherBank}
            onSuccess={fetchStudentClassInvoices}
          />
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* ── Alert Nhắc nhở phát hành Hóa đơn Tồn đọng trong Quá khứ ──── */}
      {unbilledPastMonths && unbilledPastMonths.length > 0 && (
        <Alert
          color="orange"
          variant="light"
          title="Nhắc nhở phát hành Hóa đơn Tồn đọng"
          icon={<WarningCircle size={22} weight="bold" />}
          radius="md"
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm">
              Lớp học có <b>{unbilledPastMonths.length} tháng</b> trong quá khứ đã học nhưng chưa tạo hóa đơn học phí:{' '}
              <b>
                {unbilledPastMonths
                  .map((m) => `Tháng ${m.split('-')[1]}/${m.split('-')[0]}`)
                  .join(', ')}
              </b>
              .
            </Text>
            <Button
              size="xs"
              color="orange"
              leftSection={<Plus size={14} weight="bold" />}
              onClick={() => handleOpenGenerateModal(unbilledPastMonths[0])}
            >
              Tạo hóa đơn tháng {unbilledPastMonths[0].split('-')[1]}/{unbilledPastMonths[0].split('-')[0]}
            </Button>
          </Group>
        </Alert>
      )}

      {/* ── Thẻ thống kê Tổng quan ────────────────────────────── */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {/* Đơn giá / buổi */}
        <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Đơn giá / Buổi học
              </Text>
              <Text size="xl" fw={700} c="copper" mt={4}>
                {loadingConfig ? '...' : `${Number(config.amount).toLocaleString('vi-VN')} đ`}
              </Text>
            </div>
            <Tooltip label="Cấu hình đơn giá">
              <ActionIcon
                variant="light"
                color="copper"
                size="lg"
                radius="md"
                onClick={() => setConfigModalOpened(true)}
              >
                <Gear size={20} weight="bold" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>

        {/* Tổng dự thu trong tháng */}
        <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Tổng dự thu (Tháng {dayjs(selectedMonthDate).format('MM/YYYY')})
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {Number(stats.totalExpected).toLocaleString('vi-VN')} đ
              </Text>
            </div>
            <Receipt size={24} weight="duotone" color="var(--accent-color)" />
          </Group>
        </Paper>

        {/* Đã thu */}
        <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Đã thanh toán
              </Text>
              <Text size="xl" fw={700} c="teal" mt={4}>
                {Number(stats.totalCollected).toLocaleString('vi-VN')} đ
              </Text>
            </div>
            <CheckCircle size={24} weight="duotone" color="teal" />
          </Group>
        </Paper>

        {/* Chưa thu & Chờ đối soát */}
        <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Còn tồn / Chờ duyệt
              </Text>
              <Text size="xl" fw={700} c="orange" mt={4}>
                {Number(stats.totalUnpaid + stats.totalPending).toLocaleString('vi-VN')} đ
              </Text>
            </div>
            <Clock size={24} weight="duotone" color="orange" />
          </Group>
        </Paper>
      </SimpleGrid>

      {/* ── Thanh Công cụ & Bộ lọc ───────────────────────────────── */}
      <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)' }}>
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group wrap="wrap" gap="sm" style={{ flex: 1 }}>
            {/* Chọn Tháng */}
            <MonthPickerInput
              placeholder="Chọn tháng"
              value={selectedMonthDate}
              onChange={handleMonthFilterChange}
              maxDate={new Date()}
              valueFormat="MM/YYYY"
              locale="vi"
              size="sm"
              style={{ width: 140 }}
            />

            {/* Tìm kiếm tên/mã học sinh */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <TextInput
                placeholder="Tìm tên/mã học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftSection={<MagnifyingGlass size={16} />}
                size="sm"
                style={{ width: 200 }}
              />
            </form>

            {/* Bộ lọc trạng thái */}
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              data={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'Pending', label: 'Chờ đối soát' },
                { value: 'Unpaid', label: 'Chưa thanh toán' },
                { value: 'Paid', label: 'Đã thanh toán' },
              ]}
              clearable
              size="sm"
              style={{ width: 170 }}
            />
          </Group>

          {/* Nút Tạo hóa đơn tháng */}
          <Button
            color="copper"
            leftSection={<Plus size={18} weight="bold" />}
            onClick={() => handleOpenGenerateModal()}
            size="sm"
          >
            Tạo phiếu thu học phí
          </Button>
        </Group>
      </Paper>

      {/* ── Bảng Danh sách Hóa đơn Học viên ────────────────────── */}
      <Paper radius="md" withBorder style={{ backgroundColor: 'var(--card-bg)', overflow: 'hidden' }}>
        <ScrollArea>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover style={{ minWidth: 800 }}>
            <Table.Thead style={{ backgroundColor: 'var(--bg-color)' }}>
              <Table.Tr>
                <Table.Th>Học viên</Table.Th>
                <Table.Th>Tên Hóa đơn</Table.Th>
                <Table.Th>Tháng</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Số buổi</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Số tiền (VNĐ)</Table.Th>
                <Table.Th>Hạn nộp</Table.Th>
                <Table.Th>Trạng thái</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Đối soát</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loadingInvoices ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Center py="xl">
                      <Loader color="copper" size="sm" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : invoices.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Center py="xl">
                      <Stack align="center" gap="xs">
                        <CurrencyCircleDollar size={40} weight="duotone" color="var(--mantine-color-gray-4)" />
                        <Text size="sm" c="dimmed">
                          Chưa có hóa đơn nào cho tháng {dayjs(selectedMonthDate).format('MM/YYYY')}
                        </Text>
                      </Stack>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                invoices.map((inv) => {
                  const STATUS_MAP = {
                    Paid: { label: 'Đã thanh toán', color: 'teal' },
                    Pending: { label: 'Chờ đối soát', color: 'orange' },
                    Unpaid: { label: 'Chưa thanh toán', color: 'red' },
                  };
                  const statusInfo = STATUS_MAP[inv.status] || { label: inv.status, color: 'gray' };

                  return (
                    <Table.Tr key={inv.id}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {inv.student?.fullName}
                        </Text>
                       
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {inv.title || 'Hóa đơn học phí'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="dot" color="blue" size="sm">
                          {inv.billingMonth ? `Tháng ${inv.billingMonth.split('-')[1]}/${inv.billingMonth.split('-')[0]}` : '---'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Text size="sm" fw={500}>
                          {inv.sessionCount || 0} buổi
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text size="sm" fw={700} c="copper">
                          {Number(inv.amount).toLocaleString('vi-VN')} đ
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {inv.dueDate ? dayjs(inv.dueDate).format('DD/MM/YYYY') : '---'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={statusInfo.color} size="md">
                          {statusInfo.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Button
                          variant={inv.status === 'Pending' ? 'filled' : 'light'}
                          color={inv.status === 'Pending' ? 'orange' : 'copper'}
                          size="xs"
                          leftSection={<Eye size={14} />}
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          {inv.status === 'Pending' ? 'Duyệt ngay' : 'Chi tiết'}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {pagination.totalPages > 1 && (
          <Group justify="center" p="md">
            <Pagination
              value={activePage}
              onChange={handlePageChange}
              total={pagination.totalPages}
              color="copper"
              size="sm"
            />
          </Group>
        )}
      </Paper>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {configModalOpened && classId && (
        <TuitionConfigModal
          key={classId}
          opened={configModalOpened}
          onClose={() => setConfigModalOpened(false)}
          currentAmount={config.amount}
          onSave={updateConfig}
          loading={submitting}
        />
      )}

      {generateModalOpened && generateModalMonthDate && classId && (
        <GenerateInvoicesModal
          key={`${classId}-${generateModalMonthDate.getTime()}`}
          opened={generateModalOpened}
          onClose={() => setGenerateModalOpened(false)}
          defaultAmount={config.amount}
          initialMonthDate={generateModalMonthDate}
          onGenerate={generateInvoices}
          loading={submitting}
        />
      )}

      <PaymentProofModal
        opened={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        teacherBank={teacherBank}
        onReview={async (txId, status, reason) => {
          const ok = await reviewTransaction(txId, status, reason);
          if (ok) {
            handleFetch(activePage);
          }
          return ok;
        }}
        loading={submitting}
      />
    </Stack>
  );
}
