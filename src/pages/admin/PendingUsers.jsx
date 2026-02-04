import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Avatar, 
  Breadcrumb, 
  Spin, 
  Empty, 
  Modal, 
  Form, 
  Input, 
  message, 
  Divider, 
  Descriptions, 
  Badge, 
  Tabs, 
  Tooltip,
  Typography,
  Grid,
  Statistic,
  Row,
  Col,
  Progress
} from 'antd';
import { 
  UserAddOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined, 
  BuildOutlined, 
  GlobalOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined, 
  SearchOutlined,
  TeamOutlined,
  FileDoneOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  DollarOutlined,
  SafetyOutlined,
  CalendarOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { _get, _post, _delete } from '../../helper/apiClient';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const PendingUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL_PENDING');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const screens = useBreakpoint();

  useEffect(() => {
    fetchUsers(activeTab, 1);
  }, [activeTab]);

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      message.success('Download started');
    } catch (error) {
      message.error('Failed to download file');
    }
  };

  const fetchUsers = async (status, page = 1) => {
    setLoading(true);
    try {
      const url = status === 'ALL_PENDING' 
        ? `/onboarding/admin/requests?page=${page}&limit=${pagination.pageSize}`
        : `/onboarding/admin/requests?status=${status}&page=${page}&limit=${pagination.pageSize}`;
      const response = await _get(url);
      
      const userData = Array.isArray(response.data?.data) ? response.data.data : [];
      const paginationData = response.data?.pagination || { page: 1, limit: 10, total: userData.length };
      
      setUsers(userData);
      setPagination({
        current: paginationData.page,
        pageSize: paginationData.limit,
        total: paginationData.total
      });
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to load users');
      setUsers([]);
      setPagination({ current: 1, pageSize: 10, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (paginationConfig) => {
    fetchUsers(activeTab, paginationConfig.current);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsModalVisible(true);
  };

  const handleApprove = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      walletBalance: 0
    });
    setIsApproveModalVisible(true);
  };

  const handleApproveSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        jioConfig: {
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          assistantId: values.assistantId
        },
        walletBalance: values.walletBalance,
        adminNotes: values.adminNotes
      };

      await _post(`/onboarding/admin/approve/${selectedUser._id}`, payload);
      message.success('User approved successfully!');
      setIsApproveModalVisible(false);
      fetchUsers(activeTab, pagination.current);
    } catch (error) {
      message.error(error?.message || 'Failed to approve user');
    }
  };

  const handleRejectClick = (user) => {
    setSelectedUser(user);
    rejectForm.resetFields();
    setIsRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      await _post(`/onboarding/admin/reject/${selectedUser._id}`, values);
      message.success('User rejected successfully');
      setIsRejectModalVisible(false);
      fetchUsers(activeTab, pagination.current);
    } catch (error) {
      message.error(error?.message || 'Failed to reject user');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'ONBOARDING_SUBMITTED': {
        color: '#faad14',
        bgColor: '#fff7e6',
        icon: <ClockCircleOutlined />,
        label: 'Submitted',
        badge: 'warning'
      },
      'VERIFIED': {
        color: '#52c41a',
        bgColor: '#f6ffed',
        icon: <CheckCircleOutlined />,
        label: 'Verified',
        badge: 'success'
      },
      'REJECTED': {
        color: '#ff4d4f',
        bgColor: '#fff2f0',
        icon: <CloseCircleOutlined />,
        label: 'Rejected',
        badge: 'error'
      }
    };
    return configs[status] || configs['ONBOARDING_SUBMITTED'];
  };

  const getIndustryColor = (industry) => {
    const colors = {
      'ecommerce': '#1890ff',
      'banking': '#52c41a',
      'healthcare': '#ff4d4f',
      'education': '#faad14',
      'travel': '#722ed1',
      'logistics': '#13c2c2',
      'telecom': '#eb2f96',
      'technology': '#2f54eb',
      'automotive': '#fa8c16',
      'real_estate': '#08979c',
      'media': '#7cb305',
      'government': '#d4380d',
      'other': '#8c8c8c'
    };
    return colors[industry] || '#8c8c8c';
  };

  const columns = [
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px' }}>APPLICANT</span>,
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space align="center">
          <Avatar 
            size={44} 
            style={{ 
              background: THEME_CONSTANTS.colors.primaryLight,
              color: THEME_CONSTANTS.colors.primary,
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            {record.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <div style={{ lineHeight: '1.3' }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: '15px',
              color: THEME_CONSTANTS.colors.text,
              marginBottom: '2px'
            }}>
              {record.name || 'N/A'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: THEME_CONSTANTS.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MailOutlined style={{ fontSize: '11px' }} />
              {record.email || 'No email'}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: THEME_CONSTANTS.colors.textTertiary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px'
            }}>
              <CalendarOutlined style={{ fontSize: '10px' }} />
              {new Date(record.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </Space>
      ),
      fixed: screens.md ? 'left' : false,
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px' }}>COMPANY</span>,
      key: 'company',
      width: 220,
      render: (_, record) => (
        <div style={{ lineHeight: '1.4' }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: THEME_CONSTANTS.colors.text,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShopOutlined style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.primary }} />
            {record.onboardingData?.companyName || record.companyname || '-'}
          </div>
          {record.onboardingData?.brandName && (
            <div style={{ 
              fontSize: '12px', 
              color: THEME_CONSTANTS.colors.textSecondary,
              background: `${THEME_CONSTANTS.colors.primaryLight}15`,
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '4px'
            }}>
              {record.onboardingData.brandName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px' }}>INDUSTRY</span>,
      key: 'industry',
      width: 150,
      render: (_, record) => {
        const industry = record.onboardingData?.industry;
        const color = getIndustryColor(industry);
        return industry ? (
          <Tag
            style={{
              background: `${color}15`,
              color: color,
              border: `1px solid ${color}30`,
              fontWeight: 500,
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '12px',
              margin: 0
            }}
          >
            {industry.replace(/_/g, ' ').toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: THEME_CONSTANTS.colors.textTertiary, fontSize: '13px' }}>-</span>
        );
      },
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px' }}>DOCUMENTS</span>,
      key: 'documents',
      width: 120,
      render: (_, record) => (
        <Space size={screens.xs ? 4 : 8}>
          {record.onboardingData?.registrationCertificateUrl && (
            <Tooltip title="View Certificate">
              <Button 
                size="small" 
                icon={<FileTextOutlined />}
                style={{
                  background: `${THEME_CONSTANTS.colors.success}15`,
                  borderColor: `${THEME_CONSTANTS.colors.success}30`,
                  color: THEME_CONSTANTS.colors.success
                }}
              />
            </Tooltip>
          )}
          {record.onboardingData?.brandLogoUrl && (
            <Tooltip title="View Logo">
              <Button 
                size="small" 
                icon={<BuildOutlined />}
                style={{
                  background: `${THEME_CONSTANTS.colors.info}15`,
                  borderColor: `${THEME_CONSTANTS.colors.info}30`,
                  color: THEME_CONSTANTS.colors.info
                }}
              />
            </Tooltip>
          )}
          {(!record.onboardingData?.registrationCertificateUrl && !record.onboardingData?.brandLogoUrl) && (
            <span style={{ color: THEME_CONSTANTS.colors.textTertiary, fontSize: '12px' }}>No docs</span>
          )}
        </Space>
      ),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px' }}>STATUS</span>,
      key: 'status',
      width: 160,
      render: (_, record) => {
        const config = getStatusConfig(record.onboardingStatus);
        return (
          <Badge
            status={config.badge}
            text={
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: config.color,
                background: config.bgColor,
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${config.color}30`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {config.icon}
                {config.label}
              </span>
            }
          />
        );
      },
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px' }}>ACTIONS</span>,
      key: 'actions',
      width: 180,
      fixed: screens.md ? 'right' : false,
      render: (_, record) => {
        const isPending = record.onboardingStatus === 'ONBOARDING_SUBMITTED';
        return (
          <Space size={screens.xs ? 6 : 8} wrap>
            <Tooltip title="View Details">
              <Button 
                size={screens.xs ? "small" : "middle"}
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
                style={{
                  background: `${THEME_CONSTANTS.colors.primary}08`,
                  borderColor: `${THEME_CONSTANTS.colors.primary}30`,
                  color: THEME_CONSTANTS.colors.primary
                }}
              >
                {screens.md && 'View'}
              </Button>
            </Tooltip>
            {isPending && (
              <>
                <Tooltip title="Approve">
                  <Button 
                    type="primary" 
                    size={screens.xs ? "small" : "middle"}
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove(record)}
                    style={{
                      background: THEME_CONSTANTS.colors.success,
                      borderColor: THEME_CONSTANTS.colors.success,
                      fontWeight: 500
                    }}
                  >
                    {screens.md && 'Approve'}
                  </Button>
                </Tooltip>
                <Tooltip title="Reject">
                  <Button 
                    danger
                    size={screens.xs ? "small" : "middle"}
                    icon={<CloseOutlined />}
                    onClick={() => handleRejectClick(record)}
                  >
                    {screens.md && 'Reject'}
                  </Button>
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  const stats = [
    {
      title: 'Total Pending',
      value: activeTab === 'ALL_PENDING' ? pagination.total : users.filter(u => u.onboardingStatus === 'ONBOARDING_SUBMITTED').length,
      color: THEME_CONSTANTS.colors.warning,
      icon: <ClockCircleOutlined />,
      bg: `${THEME_CONSTANTS.colors.warning}15`
    },
    {
      title: 'Verified',
      value: activeTab === 'VERIFIED' ? pagination.total : users.filter(u => u.onboardingStatus === 'VERIFIED').length,
      color: THEME_CONSTANTS.colors.success,
      icon: <CheckCircleOutlined />,
      bg: `${THEME_CONSTANTS.colors.success}15`
    },
    {
      title: 'Rejected',
      value: activeTab === 'REJECTED' ? pagination.total : users.filter(u => u.onboardingStatus === 'REJECTED').length,
      color: THEME_CONSTANTS.colors.error,
      icon: <CloseCircleOutlined />,
      bg: `${THEME_CONSTANTS.colors.error}15`
    },
    {
      title: 'Total Applications',
      value: pagination.total || users.length,
      color: THEME_CONSTANTS.colors.info,
      icon: <TeamOutlined />,
      bg: `${THEME_CONSTANTS.colors.info}15`
    }
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl, paddingBottom: THEME_CONSTANTS.spacing.xxl, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
            <Breadcrumb.Item>Admin</Breadcrumb.Item>
            <Breadcrumb.Item>Onboarding Management</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
            <div style={{ width: 72, height: 72, background: THEME_CONSTANTS.colors.primaryLight, borderRadius: THEME_CONSTANTS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserAddOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: 36 }} />
            </div>
            <div>
              <h1 style={{ fontSize: THEME_CONSTANTS.typography.h1.size, fontWeight: THEME_CONSTANTS.typography.h1.weight, marginBottom: THEME_CONSTANTS.spacing.xs }}>
                Onboarding Requests
              </h1>
              <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                Manage user applications, verification, and Jio RCS configuration
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  background: stat.bg,
                  border: `1px solid ${stat.color}30`,
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 500, marginBottom: 8 }}>
                      {stat.title}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {React.cloneElement(stat.icon, { style: { color: 'white', fontSize: '20px' } })}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ 
          borderRadius: THEME_CONSTANTS.radius.lg, 
          boxShadow: THEME_CONSTANTS.shadow.base,
          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
          overflow: 'hidden'
        }}>
          <Tabs 
            defaultActiveKey="ALL_PENDING" 
            onChange={handleTabChange} 
            activeKey={activeTab}
            style={{ 
              marginBottom: 0,
              padding: '0 24px',
              background: THEME_CONSTANTS.colors.surface
            }}
            tabBarStyle={{ 
              marginBottom: 0,
              borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
            }}
          >
            <TabPane 
              tab={
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  All Pending
                  <Badge 
                    count={users.filter(u => u.onboardingStatus === 'ONBOARDING_SUBMITTED').length} 
                    style={{ marginLeft: 8, background: THEME_CONSTANTS.colors.warning }}
                  />
                </span>
              } 
              key="ALL_PENDING" 
            />
            <TabPane 
              tab={
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  <SearchOutlined style={{ marginRight: 8 }} />
                  Submitted
                </span>
              } 
              key="ONBOARDING_SUBMITTED" 
            />
            <TabPane 
              tab={
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  Verified
                </span>
              } 
              key="VERIFIED" 
            />
            <TabPane 
              tab={
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  <CloseCircleOutlined style={{ marginRight: 8 }} />
                  Rejected
                </span>
              } 
              key="REJECTED" 
            />
          </Tabs>

          <div style={{ padding: '24px' }}>
            <Table
              dataSource={users}
              columns={columns}
              rowKey="_id"
              pagination={{
                ...pagination,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) => (
                  <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
                    Showing {range[0]}-{range[1]} of {total} applications
                  </span>
                ),
                itemRender: (_, type, originalElement) => {
                  if (type === 'prev') {
                    return <Button size="small" icon={<RightOutlined rotate={180} />} style={{ border: 'none' }} />;
                  }
                  if (type === 'next') {
                    return <Button size="small" icon={<RightOutlined />} style={{ border: 'none' }} />;
                  }
                  return originalElement;
                }
              }}
              onChange={handleTableChange}
              loading={loading}
              locale={{ 
                emptyText: (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
                          No applications found
                        </span>
                      }
                    />
                  </div>
                ) 
              }}
              scroll={{ x: screens.xs ? 800 : '100%' }}
              style={{
                fontSize: '14px',
                borderRadius: THEME_CONSTANTS.radius.md,
                overflow: 'hidden'
              }}
              rowClassName={() => 'table-row'}
            />
          </div>
        </Card>

        {/* View Details Modal */}
        <Modal
          title="Application Details"
          open={isDetailsModalVisible}
          onCancel={() => setIsDetailsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
              Close
            </Button>,
            (selectedUser?.onboardingStatus === 'ONBOARDING_SUBMITTED') && (
              <Button key="reject" danger onClick={() => {
                setIsDetailsModalVisible(false);
                handleRejectClick(selectedUser);
              }}>
                Reject
              </Button>
            ),
            (selectedUser?.onboardingStatus === 'ONBOARDING_SUBMITTED') && (
              <Button key="approve" type="primary" onClick={() => {
                setIsDetailsModalVisible(false);
                handleApprove(selectedUser);
              }}>
                Approve
              </Button>
            ),
          ]}
          width={800}
        >
          {selectedUser && (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedUser.onboardingStatus === 'VERIFIED' && (
                <div style={{ marginBottom: 24 }}>
                  <Descriptions title="Approval Details" bordered column={2}>
                    <Descriptions.Item label="Approved By">{selectedUser.reviewDetails?.reviewedBy?.name || 'Admin'}</Descriptions.Item>
                    <Descriptions.Item label="Approved At">{new Date(selectedUser.reviewDetails?.reviewedAt).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Admin Notes" span={2}>{selectedUser.reviewDetails?.adminNotes || '-'}</Descriptions.Item>
                  </Descriptions>
                  <Divider />
                </div>
              )}

              {selectedUser.onboardingStatus === 'REJECTED' && (
                <div style={{ marginBottom: 24 }}>
                  <Descriptions title="Rejection Details" bordered column={1}>
                    <Descriptions.Item label="Rejected By">{selectedUser.reviewDetails?.reviewedBy?.name || 'Admin'}</Descriptions.Item>
                    <Descriptions.Item label="Reason" contentStyle={{ color: 'red' }}>{selectedUser.reviewDetails?.rejectionReason}</Descriptions.Item>
                    <Descriptions.Item label="Admin Notes">{selectedUser.reviewDetails?.adminNotes || '-'}</Descriptions.Item>
                  </Descriptions>
                  <Divider />
                </div>
              )}

              <Descriptions title="Business Information" bordered column={2}>
                <Descriptions.Item label="Company Name">{selectedUser.onboardingData?.companyName}</Descriptions.Item>
                <Descriptions.Item label="Brand Name">{selectedUser.onboardingData?.brandName}</Descriptions.Item>
                <Descriptions.Item label="Industry">{selectedUser.onboardingData?.industry}</Descriptions.Item>
                <Descriptions.Item label="GST Number">{selectedUser.onboardingData?.gstNumber}</Descriptions.Item>
                <Descriptions.Item label="Website" span={2}>
                  <a href={selectedUser.onboardingData?.website} target="_blank" rel="noopener noreferrer">
                    {selectedUser.onboardingData?.website}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>{selectedUser.onboardingData?.companyAddress}</Descriptions.Item>
              </Descriptions>

              <Divider />

              <Descriptions title="Contact Details" bordered column={2}>
                <Descriptions.Item label="Contact Name">{selectedUser.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedUser.phone}</Descriptions.Item>
                <Descriptions.Item label="Business Email">{selectedUser.onboardingData?.businessEmail}</Descriptions.Item>
              </Descriptions>

              <Divider />

              <Descriptions title="Documents" bordered column={1}>
                {selectedUser.onboardingData?.registrationCertificateUrl && (
                  <Descriptions.Item label="Registration Certificate">
                    <Space>
                      <a href={selectedUser.onboardingData.registrationCertificateUrl} target="_blank" rel="noopener noreferrer">
                        <Button icon={<FileTextOutlined />}>View Certificate</Button>
                      </a>
                      <Button 
                        icon={<DownloadOutlined />} 
                        onClick={() => handleDownload(
                          selectedUser.onboardingData.registrationCertificateUrl, 
                          `${selectedUser.onboardingData.companyName}_certificate.pdf`
                        )}
                      >
                        Download
                      </Button>
                    </Space>
                  </Descriptions.Item>
                )}
                {selectedUser.onboardingData?.brandLogoUrl && (
                  <Descriptions.Item label="Brand Logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Avatar src={selectedUser.onboardingData.brandLogoUrl} size={64} shape="square" />
                      <Space>
                        <a href={selectedUser.onboardingData.brandLogoUrl} target="_blank" rel="noopener noreferrer">
                          <Button>View Full Size</Button>
                        </a>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(
                            selectedUser.onboardingData.brandLogoUrl, 
                            `${selectedUser.onboardingData.companyName}_logo.png`
                          )}
                        >
                          Download
                        </Button>
                      </Space>
                    </div>
                  </Descriptions.Item>
                )}
                {selectedUser.onboardingData?.companyBannerUrl && (
                  <Descriptions.Item label="Company Banner">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <img 
                        src={selectedUser.onboardingData.companyBannerUrl} 
                        alt="Company Banner" 
                        style={{ width: '100%', maxWidth: '400px', height: 'auto', borderRadius: '8px', border: `1px solid ${THEME_CONSTANTS.colors.border}` }}
                      />
                      <Space>
                        <a href={selectedUser.onboardingData.companyBannerUrl} target="_blank" rel="noopener noreferrer">
                          <Button icon={<GlobalOutlined />}>View Full Size</Button>
                        </a>
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(
                            selectedUser.onboardingData.companyBannerUrl, 
                            `${selectedUser.onboardingData.companyName}_banner.png`
                          )}
                        >
                          Download
                        </Button>
                      </Space>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
        </Modal>

        {/* Approve Modal */}
        <Modal
          title="Approve & Configure Jio RCS"
          open={isApproveModalVisible}
          onCancel={() => setIsApproveModalVisible(false)}
          onOk={handleApproveSubmit}
          width={600}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
            <div style={{ background: '#e6fffa', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #b7eb8f' }}>
              <div style={{ fontWeight: 600, color: '#389e0d', marginBottom: 4 }}>Approved User</div>
              <div>{selectedUser?.name} ({selectedUser?.email})</div>
              <div>{selectedUser?.onboardingData?.companyName}</div>
            </div>

            <Divider orientation="left">Jio Configuration</Divider>

            <Form.Item label="Client ID" name="clientId" rules={[{ required: true, message: 'Client ID is required' }]}>
              <Input placeholder="Enter Jio Client ID" />
            </Form.Item>

            <Form.Item label="Client Secret" name="clientSecret" rules={[{ required: true, message: 'Client Secret is required' }]}>
              <Input.Password placeholder="Enter Jio Client Secret" />
            </Form.Item>

            <Form.Item label="Assistant ID (Optional)" name="assistantId">
              <Input placeholder="Enter Jio Assistant ID" />
            </Form.Item>

            <Divider orientation="left">Account Setup</Divider>

            <Form.Item label="Initial Wallet Balance (INR)" name="walletBalance">
              <Input type="number" min={0} addonBefore="₹" />
            </Form.Item>

            <Form.Item label="Admin Notes" name="adminNotes">
              <TextArea placeholder="Internal notes about this approval..." rows={2} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Reject Modal */}
        <Modal
          title="Reject Application"
          open={isRejectModalVisible}
          onCancel={() => setIsRejectModalVisible(false)}
          onOk={handleRejectSubmit}
          okText="Reject Application"
          okButtonProps={{ danger: true }}
        >
          <Form form={rejectForm} layout="vertical">
            <p>You are about to reject the application for <strong>{selectedUser?.onboardingData?.companyName || selectedUser?.name}</strong>.</p>
            <p>This action will send an email to the user explaining the reason.</p>

            <Form.Item
              label="Rejection Reason"
              name="rejectionReason"
              rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
            >
              <TextArea rows={4} placeholder="E.g. Document verification failed, Invalid GST number, etc." />
            </Form.Item>

            <Form.Item label="Admin Notes (Internal)" name="adminNotes">
              <TextArea rows={2} placeholder="Internal notes..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default PendingUsers;