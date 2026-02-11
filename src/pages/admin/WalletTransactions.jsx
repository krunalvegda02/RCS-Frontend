import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Empty,
  Breadcrumb,
  Spin,
  message,
  Statistic,
  Row,
  Col,
  Dropdown,
  Menu,
  Progress,
  Tooltip,
  Badge,
  Select,
  DatePicker,
  Input
} from 'antd';
import {
  WalletOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  SearchOutlined,
  FilePdfOutlined,
  CheckSquareOutlined,
  ClearOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import apiService, { _get } from '../../helper/apiClient';

dayjs.extend(relativeTime);
dayjs.extend(isBetween);
import { THEME_CONSTANTS } from '../../theme';
import { useSelector } from 'react-redux';
import ColumnGroup from 'antd/es/table/ColumnGroup';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function WalletTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0
  });
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchText, statusFilter, dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await _get('payment/admin/all', {}, {}, token);
      if (res.data.success) {
        const data = res.data.data.payments || [];
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };


console.log(transactions)        // Stats will be calculated via useEffect when filteredTransactions updates

  /* Recalculate stats whenever filtered transactions change */
  useEffect(() => {
    calculateStats(filteredTransactions);
  }, [filteredTransactions]);

  const calculateStats = (data) => {
    const stats = {
      totalAmount: 0,
      successCount: 0,
      pendingCount: 0,
      failedCount: 0
    };

    data.forEach(transaction => {
      if (transaction.status === 'captured') {
        stats.successCount++;
        stats.totalAmount += Number(transaction.amount || 0);
      } else if (transaction.status === 'pending') {
        stats.pendingCount++;
      } else {
        stats.failedCount++;
      }
    });

    setStats(stats);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(transaction =>
        (transaction.userId?.name || '').toLowerCase().includes(lowerSearch) ||
        (transaction.userId?.email || '').toLowerCase().includes(lowerSearch) ||
        (transaction.razorpayOrderId || '').toLowerCase().includes(lowerSearch)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        if (statusFilter === 'success') return transaction.status === 'captured';
        if (statusFilter === 'pending') return transaction.status === 'pending';
        if (statusFilter === 'failed') return !['captured', 'pending'].includes(transaction.status);
        return true;
      });
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');

      filtered = filtered.filter(transaction => {
        const transactionDate = dayjs(transaction.createdAt);
        return transactionDate.isBetween(start, end, null, '[]'); // [] means inclusive
      });
    }

    setFilteredTransactions(filtered);
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (date) => dayjs(date).format('DD MMM YYYY, hh:mm A');

  const handleDownloadInvoice = async (record) => {
    try {
      setDownloading(true);
      const response = await apiService.downloadInvoice(record.razorpayOrderId);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${record.razorpayOrderId}_${dayjs().format('YYYYMMDD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      message.error(error.response?.data?.message || 'Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedRowKeys.length === 0) return;

    setDownloading(true);
    let successCount = 0;
    const failedDownloads = [];

    try {
      for (let i = 0; i < selectedRowKeys.length; i++) {
        const orderId = selectedRowKeys[i];
        const record = transactions.find(t => t._id === orderId);
        if (!record) continue;

        try {
          const response = await apiService.downloadInvoice(record.razorpayOrderId);
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Invoice_${record.razorpayOrderId}_${dayjs().format('YYYYMMDD')}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          successCount++;

          // Update progress
          const progress = Math.round(((i + 1) / selectedRowKeys.length) * 100);
          // You could update a progress state here if needed

          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Failed to download invoice for ${orderId}`, err);
          failedDownloads.push(record.razorpayOrderId);
        }
      }

      if (successCount > 0) {
        message.success(`Successfully downloaded ${successCount} invoice${successCount > 1 ? 's' : ''}`);
        setSelectedRowKeys([]);
      }

      if (failedDownloads.length > 0) {
        message.warning(`${failedDownloads.length} invoice${failedDownloads.length > 1 ? 's' : ''} failed to download`);
      }
    } catch (error) {
      message.error('Bulk download failed');
    } finally {
      setDownloading(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleSelectAll = () => {
    const selectableIds = filteredTransactions
      .filter(t => t.status === 'captured')
      .map(t => t._id);
    setSelectedRowKeys(selectableIds);
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'captured',
    }),
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  const getStatusConfig = (status) => {
    const config = {
      'captured': {
        text: 'Success',
        icon: <CheckCircleOutlined />,
        color: 'success'
      },
      'pending': {
        text: 'Pending',
        icon: <ClockCircleOutlined />,
        color: 'warning'
      },
      'failed': {
        text: 'Failed',
        icon: <CloseCircleOutlined />,
        color: 'error'
      }
    };
    return config[status] || config['pending'];
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      width: 220,
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            {record.userId?.name || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.userId?.email || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'razorpayOrderId',
      key: 'orderId',
      width: 160,
      render: (orderId) => (
        <Tooltip title={orderId}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', padding: '4px 8px', background: '#f5f5f5', borderRadius: '4px' }}>
            {orderId?.slice(0, 12)}...
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 130,
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => (
        <span style={{ fontWeight: 600, fontSize: '15px', color: THEME_CONSTANTS.colors.success }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'creditsToAdd',
      width: 110,
      sorter: (a, b) => a.creditsToAdd - b.creditsToAdd,
      render: (credits) => (
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          {Number(credits).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon} style={{ margin: 0, padding: '4px 12px', fontSize: '13px' }}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 120,
      render: (method) => <span style={{ fontSize: '13px' }}>{method || 'N/A'}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 160,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: '13px', marginBottom: '2px' }}>{dayjs(date).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{dayjs(date).format('hh:mm A')}</div>
        </div>
      ),
    },
    {
      title: 'Invoice',
      key: 'invoice',
      width: 90,
      align: 'center',
      render: (_, record) =>
        record.status === 'captured' ? (
          <Tooltip title="Download Invoice">
            <Button
              type="text"
              icon={<DownloadOutlined style={{ fontSize: '16px' }} />}
              onClick={() => handleDownloadInvoice(record)}
              disabled={downloading}
              style={{ padding: '8px' }}
            />
          </Tooltip>
        ) : null,
    }
  ];

  return (
    <div style={{
      background: THEME_CONSTANTS.colors.background,
      minHeight: '100vh',
      padding: THEME_CONSTANTS.spacing.xxl
    }}>
      <div style={{
        maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div style={{
          marginBottom: THEME_CONSTANTS.spacing.xxxl,
          paddingBottom: THEME_CONSTANTS.spacing.xxl,
          borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
        }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
            <Breadcrumb.Item>
              <a href="#">Admin</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Wallet Transactions</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg, marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.primary}20 100%)`,
              borderRadius: THEME_CONSTANTS.radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <WalletOutlined style={{
                color: THEME_CONSTANTS.colors.primary,
                fontSize: '36px'
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: THEME_CONSTANTS.typography.h1.size,
                fontWeight: THEME_CONSTANTS.typography.h1.weight,
                color: THEME_CONSTANTS.colors.text,
                marginBottom: THEME_CONSTANTS.spacing.xs
              }}>
                Wallet Transactions
              </h1>
              <p style={{
                color: THEME_CONSTANTS.colors.textSecondary,
                margin: 0
              }}>
                View all payment transactions and wallet recharges
              </p>
            </div>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchTransactions}
              loading={loading}
            >
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
                <Statistic
                  title="Total Amount"
                  value={stats.totalAmount}
                  precision={2}
                  valueStyle={{ color: THEME_CONSTANTS.colors.success, fontWeight: 600 }}
                  prefix="₹"
                  // suffix={<Tag color="green">INR</Tag>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
                <Statistic
                  title="Successful"
                  value={stats.successCount}
                  valueStyle={{ color: THEME_CONSTANTS.colors.success }}
                  prefix={<CheckCircleOutlined />}
                  // suffix={<Tag color="success">{Math.round((stats.successCount / transactions.length) * 100) || 0}%</Tag>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
                <Statistic
                  title="Pending"
                  value={stats.pendingCount}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
                <Statistic
                  title="Failed"
                  value={stats.failedCount}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Filters and Bulk Actions */}
        <Card
          style={{
            marginBottom: THEME_CONSTANTS.spacing.lg,
            borderRadius: THEME_CONSTANTS.radius.lg
          }}
          bodyStyle={{ padding: THEME_CONSTANTS.spacing.md }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Input
                placeholder="Search by name, email or order ID..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={6}>
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Status</Option>
                <Option value="success">Success</Option>
                <Option value="pending">Pending</Option>
                <Option value="failed">Failed</Option>
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
            </Col>
            <Col xs={24} md={4} style={{ textAlign: 'right' }}>
              {selectedRowKeys.length > 0 && (
                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleBulkDownload}
                    loading={downloading}
                    disabled={selectedRowKeys.length === 0}
                  >
                    Download ({selectedRowKeys.length})
                  </Button>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearSelection}
                  >
                    Clear
                  </Button>
                </Space>
              )}
            </Col>
          </Row>
        </Card>

        {/* Main Table Card */}
        <Card
          title={
            <Space size="middle">
              <WalletOutlined style={{ fontSize: '18px' }} />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>All Transactions</span>
              <Tag color="blue" style={{ fontSize: '13px', padding: '2px 10px' }}>{filteredTransactions.length} records</Tag>
            </Space>
          }
          extra={
            <Space size="middle">
              <Button
                icon={<CheckSquareOutlined />}
                onClick={handleSelectAll}
                disabled={filteredTransactions.filter(t => t.status === 'captured').length === 0}
                style={{ padding: '4px 15px' }}
              >
                Select All
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('all');
                  setDateRange([]);
                  fetchTransactions();
                }}
                loading={loading}
                style={{ padding: '4px 15px' }}
              >
                Reset
              </Button>
            </Space>
          }
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            boxShadow: THEME_CONSTANTS.shadow.base
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Spin
            spinning={loading || downloading}
            tip={downloading ? `Downloading ${selectedRowKeys.length} invoices...` : 'Loading...'}
          >
            {selectedRowKeys.length > 0 && (
              <div style={{
                padding: '16px 20px',
                background: THEME_CONSTANTS.colors.primaryLight,
                borderRadius: THEME_CONSTANTS.radius.md,
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: THEME_CONSTANTS.colors.primary, fontWeight: 500, fontSize: '14px' }}>
                  <CheckSquareOutlined style={{ marginRight: '8px' }} /> 
                  {selectedRowKeys.length} invoice{selectedRowKeys.length > 1 ? 's' : ''} selected
                </span>
                <Space size="middle">
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleBulkDownload}
                    loading={downloading}
                    style={{ padding: '4px 20px' }}
                  >
                    Download All
                  </Button>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearSelection}
                    style={{ padding: '4px 15px' }}
                  >
                    Clear Selection
                  </Button>
                </Space>
              </div>
            )}

            <Table
              rowSelection={rowSelection}
              dataSource={filteredTransactions}
              columns={columns}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`,
                pageSizeOptions: ['10', '15', '25', '50'],
                style: { padding: '16px 0' }
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No transactions found"
                    style={{ padding: '40px 0' }}
                  />
                )
              }}
              scroll={{ x: 1200 }}
              size="middle"
              style={{ marginTop: '8px' }}
            />
          </Spin>
        </Card>
      </div>
    </div>
  );
}