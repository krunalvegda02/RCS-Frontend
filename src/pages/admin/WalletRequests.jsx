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
        background: bgColor,
        border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
        borderRadius: THEME_CONSTANTS.radius.md,
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Space>
          <Icon style={{ fontSize: '20px', color: color }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: THEME_CONSTANTS.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </span>
        </Space>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: THEME_CONSTANTS.colors.textPrimary,
            lineHeight: 1,
          }}
        >
          {value}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: THEME_CONSTANTS.colors.textSecondary,
              marginLeft: '4px',
            }}
          >
            {unit}
          </span>
        </div>
      </Space>
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
            size={32}
            icon={<UserOutlined />}
            style={{
              backgroundColor: THEME_CONSTANTS.colors.primary,
            }}
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
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
        <div style={{ 
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
          margin: '0 auto',
          padding: THEME_CONSTANTS.spacing.xl
        }}>
          {/* Enhanced Header Section */}
          <div style={{
            marginBottom: THEME_CONSTANTS.spacing.xxxl,
            paddingBottom: THEME_CONSTANTS.spacing.xl,
            borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`
          }}>
            <Breadcrumb style={{
              marginBottom: THEME_CONSTANTS.spacing.md,
              fontSize: THEME_CONSTANTS.typography.caption.size
            }}>
              <Breadcrumb.Item>
                <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Admin</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight
                }}>
                  Wallet Requests
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={6} md={4} lg={3}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: THEME_CONSTANTS.colors.primaryLight,
                      borderRadius: THEME_CONSTANTS.radius.xl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: THEME_CONSTANTS.shadow.md,
                      margin: '0 auto'
                    }}>
                      <WalletOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={18} md={20} lg={21}>
                    <div style={{ textAlign: window.innerWidth <= 576 ? 'center' : 'left' }}>
                      <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight
                      }}>
                        Wallet Requests 💳
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Manage and process wallet recharge requests from users
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: window.innerWidth <= 992 ? 'center' : 'right', marginTop: window.innerWidth <= 992 ? '16px' : '0' }}>
                  {/* Wallet actions can go here if needed */}
                </div>
              </Col>
            </Row>
          </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
          <Col xs={24} sm={12} lg={5}>
            <StatCard
              icon={WalletOutlined}
              title="Total Requests"
              value={stats.totalRequests}
              color={THEME_CONSTANTS.colors.primary}
              bgColor={THEME_CONSTANTS.colors.bgLight}
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <StatCard
              icon={ClockCircleOutlined}
              title="Pending"
              value={stats.pendingRequests}
              color="#FAAD14"
              bgColor="#FFFBE6"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <StatCard
              icon={CheckCircleOutlined}
              title="Approved"
              value={stats.approvedRequests}
              color={THEME_CONSTANTS.colors.success}
              bgColor="#F6FFED"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <StatCard
              icon={CloseOutlined}
              title="Total Rejectd"
              value={stats.totalReject}
              color={THEME_CONSTANTS.colors.danger}
              bgColor="#FFF0F6"
            />
          </Col>
          <Col xs={24} sm={24} lg={4}>
            <StatCard
              icon={DollarOutlined}
              title="Total Amount"
              value={stats.totalAmount > 999999 ? (stats.totalAmount / 100000).toFixed(1) : stats.totalAmount}
              unit={stats.totalAmount > 999999 ? 'L' : ''}
              color="#EB2F96"
              bgColor="#FFF0F6"
            />
          </Col>
        </Row>

        {/* Table Card */}
        <Card
          style={{
            borderRadius: THEME_CONSTANTS.radius.md,
            border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
            boxShadow: THEME_CONSTANTS.shadow.sm,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Spin spinning={loading.walletRequests}>
            {walletRequests.length === 0 ? (
              <Empty
                description="No wallet requests"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={walletRequests}
                rowKey="_id"
                loading={loading.walletRequests}
                pagination={{
                  pageSize: 10,
                  total: walletRequests.length,
                  showSizeChanger: window.innerWidth > 768,
                  showQuickJumper: window.innerWidth > 768,
                  pageSizeOptions: ['5', '10', '20', '50'],
                  style: { padding: '16px' },
                  size: window.innerWidth <= 768 ? 'small' : 'default'
                }}
                scroll={{ x: 800 }}
                size={window.innerWidth <= 768 ? 'small' : 'default'}
                style={{
                  borderCollapse: 'collapse',
                }}
              />
            )}
          </Spin>
        </Card>
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