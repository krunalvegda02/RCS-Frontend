import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Modal,
  Form,
  Input,
  Empty,
  Tooltip,
  Grid,
  Statistic,
  Popconfirm,
  message,
  Breadcrumb,
  Spin,
} from 'antd';
import {
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  CheckOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { getWalletRequests, approveWalletRequest, rejectWalletRequest, deleteWalletRequest } from '../../redux/slices/adminSlice';

const { useBreakpoint } = Grid;

function WalletRequests() {
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  // Redux state
  const { walletRequests, loading } = useSelector(state => state.admin);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalAmount: 0,
    totalReject: 0
  });

  // ==================== FETCH DATA ====================

  useEffect(() => {
    dispatch(getWalletRequests());
  }, [dispatch]);

  useEffect(() => {
    if (walletRequests.length > 0) {
      calculateStats(walletRequests);
    }
  }, [walletRequests]);

  const fetchRequests = () => {
    dispatch(getWalletRequests());
  };

  const calculateStats = (requestsList) => {
    const pending = requestsList.filter((r) => r.status === 'pending').length;
    const approved = requestsList.filter((r) => r.status === 'approved').length;
    const reject = requestsList.filter((r) => r.status === 'rejected').length;
    const totalAmount = requestsList.reduce((sum, r) => sum + (r.amount || 0), 0);

    setStats({
      totalRequests: requestsList.length,
      pendingRequests: pending,
      approvedRequests: approved,
      totalAmount: totalAmount,
      totalReject: reject
    });
  };

  // ==================== HANDLERS ====================

  const handleApprove = async (requestId) => {
    try {
      await dispatch(approveWalletRequest({
        requestId,
        adminNote: 'Approved by admin'
      })).unwrap();
      message.success('Request approved successfully!');
    } catch (error) {
      message.error(error || 'Error approving request');
    }
  };

  const handleReject = async () => {
    try {
      const reason = form.getFieldValue('reason');
      if (!reason || reason.trim() === '') {
        message.warning('Please enter rejection reason');
        return;
      }

      await dispatch(rejectWalletRequest({
        requestId: selectedRequest._id,
        rejectionReason: reason
      })).unwrap();

      message.success('Request rejected successfully!');
      setRejectModalVisible(false);
      form.resetFields();
      setSelectedRequest(null);
    } catch (error) {
      message.error(error || 'Error rejecting request');
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await dispatch(deleteWalletRequest({ requestId })).unwrap();
      message.success('Request deleted successfully!');
    } catch (error) {
      message.error(error || 'Error deleting request');
    }
  };

  const showRejectModal = (record) => {
    setSelectedRequest(record);
    setRejectModalVisible(true);
    form.resetFields();
  };

  // ==================== FORMATTERS ====================

  const formatCurrency = (value) => `₹${value?.toLocaleString('en-IN') || 0}`;
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeDate = (date) => {
    if (!date) return '-';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  // ==================== STAT CARD COMPONENT ====================

  const StatCard = ({ icon: Icon, title, value, unit, color, bgColor }) => (
    <Card
      style={{
        borderRadius: THEME_CONSTANTS.radius.lg,
        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
        boxShadow: THEME_CONSTANTS.shadow.base,
        height: '100%',
        transition: THEME_CONSTANTS.transition.normal,
        background: THEME_CONSTANTS.colors.surface,
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.lg;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.base;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = THEME_CONSTANTS.colors.border;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: THEME_CONSTANTS.spacing.md }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: THEME_CONSTANTS.typography.label.size,
            color: THEME_CONSTANTS.colors.textSecondary,
            marginBottom: THEME_CONSTANTS.spacing.sm,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: THEME_CONSTANTS.colors.text,
            lineHeight: 1.2
          }}>
            {value}
            {unit && <span style={{ fontSize: '16px', marginLeft: '4px', color: THEME_CONSTANTS.colors.textSecondary }}>{unit}</span>}
          </div>
        </div>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: THEME_CONSTANTS.radius.xl,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: 28,
          flexShrink: 0
        }}>
          <Icon />
        </div>
      </div>
    </Card>
  );

  // ==================== TABLE COLUMNS ====================

  const columns = [
    {
      title: 'User',
      dataIndex: ['userId', 'name'],
      key: 'user',
      render: (text, record) => (
        <Space size={8}>
          <Avatar
            size={40}
            style={{ background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary }}
          >
            {record.userId?.name?.charAt(0).toUpperCase()}
          </Avatar>

          <div>
            <div
              style={{
                fontWeight: 500,
                color: THEME_CONSTANTS.colors.textPrimary,
              }}
            >
              {record.userId?.name || 'N/A'}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: THEME_CONSTANTS.colors.textSecondary,
              }}
            >
              {record.userId?.email || 'N/A'}
            </div>
          </div>
        </Space>
      ),
      width: '25%',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>
          {formatCurrency(amount)}
        </div>
      ),
      width: '12%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color, icon, bgColor;
        switch (status) {
          case 'pending':
            color = '#FAAD14';
            bgColor = '#FFF7E6';
            icon = <ClockCircleOutlined />;
            break;
          case 'approved':
            color = '#52C41A';
            bgColor = '#F6FFED';
            icon = <CheckCircleOutlined />;
            break;
          case 'rejected':
            color = '#FF4D4F';
            bgColor = '#FFF1F0';
            icon = <CloseOutlined />;
            break;
          default:
            color = '#1890FF';
            bgColor = '#E6F7FF';
            icon = null;
        }
        return (
          <Tag
            icon={icon}
            color={bgColor}
            style={{
              color: color,
              border: `1px solid ${color}`,
              fontWeight: 500,
              padding: '4px 12px',
            }}
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Tag>
        );
      },
      width: '12%',
    },
    {
      title: 'Requested',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (date) => (
        <Tooltip title={formatDate(date)}>
          <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
            {formatRelativeDate(date)}
          </span>
        </Tooltip>
      ),
      width: '12%',
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      render: (reason, record) => (
        record.status === 'rejected' ? (
          <Tooltip title={reason}>
            <span style={{
              fontSize: '13px',
              color: '#ff4d4f',
              display: 'block',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {reason || 'No reason provided'}
            </span>
          </Tooltip>
        ) : (
          <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>-</span>
        )
      ),
      width: '15%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size={8}>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record._id)}
                  style={{
                    backgroundColor: THEME_CONSTANTS.colors.success,
                    borderColor: THEME_CONSTANTS.colors.success,
                  }}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => showRejectModal(record)}
                />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title="Delete Request"
            description="Are you sure you want to delete this wallet request?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              danger: true,
            }}
          >
            <Tooltip title="Delete">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                type="text"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: '12%',
      align: 'center',
    },
  ];

  // Mobile expanded render
  const expandedRowRender = (record) => (
    <div style={{ padding: '0 16px' }}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
            Amount
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: THEME_CONSTANTS.colors.primary,
            }}
          >
            {formatCurrency(record.amount)}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
            Status
          </div>
          <div style={{ marginTop: '4px' }}>
            <Tag
              color={
                record.status === 'pending'
                  ? 'warning'
                  : record.status === 'approved'
                    ? 'success'
                    : 'error'
              }
            >
              {record.status?.toUpperCase()}
            </Tag>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
            Requested
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>
            {formatDate(record.requestedAt)}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
            Time Ago
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>
            {formatRelativeDate(record.requestedAt)}
          </div>
        </Col>
        <Col span={24}>
          <Space wrap style={{ marginTop: '8px' }}>
            {record.status === 'pending' && (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApprove(record._id)}
                  style={{
                    backgroundColor: THEME_CONSTANTS.colors.success,
                    borderColor: THEME_CONSTANTS.colors.success,
                  }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => showRejectModal(record)}
                >
                  Reject
                </Button>
              </>
            )}
            <Popconfirm
              title="Delete Request"
              description="Are you sure you want to delete this wallet request?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{
                danger: true,
              }}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </Col>
      </Row>
    </div>
  );

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
        <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
          <Spin spinning={loading.walletRequests}>
            {/* Header Section - Left Aligned */}
            <div style={{
              marginBottom: THEME_CONSTANTS.spacing.xxxl,
              paddingBottom: THEME_CONSTANTS.spacing.xxl,
              borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
            }}>
              <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
                <Breadcrumb.Item>
                  <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: THEME_CONSTANTS.typography.caption.size }}>Admin</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  <span style={{ color: THEME_CONSTANTS.colors.primary, fontSize: THEME_CONSTANTS.typography.caption.size, fontWeight: 600 }}>Wallet Requests</span>
                </Breadcrumb.Item>
              </Breadcrumb>

              <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.warningLight} 0%, ${THEME_CONSTANTS.colors.warningLight} 100%)`,
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.warning}40`,
                  flexShrink: 0
                }}>
                  <WalletOutlined style={{ color: THEME_CONSTANTS.colors.warning, fontSize: '36px' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: THEME_CONSTANTS.typography.h1.size,
                    fontWeight: THEME_CONSTANTS.typography.h1.weight,
                    color: THEME_CONSTANTS.colors.text,
                    marginBottom: THEME_CONSTANTS.spacing.xs,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em'
                  }}>
                    Wallet Requests
                  </h1>
                  <p style={{
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontSize: THEME_CONSTANTS.typography.body.size,
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    Manage and process wallet recharge requests from users.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <Row gutter={[20, 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
              <Col xs={24} sm={12} lg={5}>
                <StatCard
                  icon={WalletOutlined}
                  title="Total Requests"
                  value={stats.totalRequests}
                  color={THEME_CONSTANTS.colors.primary}
                />
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <StatCard
                  icon={ClockCircleOutlined}
                  title="Pending"
                  value={stats.pendingRequests}
                  color="#FAAD14"
                />
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <StatCard
                  icon={CheckCircleOutlined}
                  title="Approved"
                  value={stats.approvedRequests}
                  color={THEME_CONSTANTS.colors.success}
                />
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <StatCard
                  icon={CloseOutlined}
                  title="Rejected"
                  value={stats.totalReject}
                  color={THEME_CONSTANTS.colors.danger}
                />
              </Col>
              <Col xs={24} sm={24} lg={4}>
                <StatCard
                  icon={DollarOutlined}
                  title="Total Amount"
                  value={stats.totalAmount > 999999 ? (stats.totalAmount / 100000).toFixed(1) : stats.totalAmount}
                  unit={stats.totalAmount > 999999 ? 'L' : ''}
                  color="#EB2F96"
                />
              </Col>
            </Row>

            {/* Table Card */}
            <Card
              title={
                <Space size={8}>
                  <WalletOutlined style={{ color: THEME_CONSTANTS.colors.warning, fontSize: '18px' }} />
                  <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>All Wallet Requests</span>
                </Space>
              }
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                boxShadow: THEME_CONSTANTS.shadow.base,
                background: THEME_CONSTANTS.colors.surface
              }}
              bodyStyle={{ padding: 0 }}
            >
              {walletRequests.length === 0 ? (
                <Empty
                  description="No wallet requests found"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={walletRequests}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  locale={{ emptyText: <Empty description="No requests found" /> }}
                  scroll={{ x: 800 }}
                />
              )}
            </Card>
          </Spin>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        title={
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: THEME_CONSTANTS.colors.textPrimary,
            }}
          >
            Reject Wallet Request
          </div>
        }
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          form.resetFields();
          setSelectedRequest(null);
        }}
        width={window.innerWidth <= 768 ? '95vw' : 500}
        okText="Reject Request"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
        }}
        style={{
          borderRadius: THEME_CONSTANTS.radius.md,
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
            User
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: THEME_CONSTANTS.colors.textPrimary,
              marginTop: '4px',
            }}
          >
            {selectedRequest?.userId?.name}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
            Amount
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: THEME_CONSTANTS.colors.primary,
              marginTop: '4px',
            }}
          >
            {formatCurrency(selectedRequest?.amount)}
          </div>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            label={
              <span style={{ color: THEME_CONSTANTS.colors.textPrimary }}>
                Rejection Reason <span style={{ color: '#FF4D4F' }}>*</span>
              </span>
            }
            name="reason"
            rules={[
              {
                required: true,
                message: 'Please enter rejection reason',
              },
            ]}
          >
            <Input.TextArea
              placeholder="Enter reason for rejection..."
              rows={4}
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                borderColor: THEME_CONSTANTS.colors.borderLight,
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default WalletRequests;