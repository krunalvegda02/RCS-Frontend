import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Select, 
  Space, 
  Typography, 
  message, 
  Input, 
  Row, 
  Col, 
  Statistic, 
  Badge, 
  Button, 
  Modal, 
  Form, 
  DatePicker, 
  TimePicker, 
  Tooltip,
  Avatar,
  Breadcrumb,
  Divider,
  Empty,
  Grid
} from 'antd';
import { 
  CalendarOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  TeamOutlined, 
  SearchOutlined, 
  LinkOutlined, 
  ClockCircleOutlined, 
  GlobalOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  MinusCircleOutlined,
  VideoCameraOutlined,
  UserOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  HistoryOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  RightOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { _get, _patch } from '../../helper/apiClient';
import { THEME_CONSTANTS } from '../../theme';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function DemoRequests() {
  const [demoRequests, setDemoRequests] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchDemoRequests = async () => {
    setLoading(true);
    try {
      const response = await _get('/demo-requests');
      const data = response.data?.data || response.data || [];
      setDemoRequests(data);
      setFilteredData(data);
    } catch (error) {
      message.error('Failed to fetch demo requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoRequests();
  }, []);

  useEffect(() => {
    let filtered = demoRequests;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (searchText) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.company?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [searchText, statusFilter, demoRequests]);

  const updateStatus = async (id, status) => {
    try {
      await _patch(`/demo-requests/${id}/status`, { status });
      message.success('Status updated successfully');
      fetchDemoRequests();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const getStats = () => {
    return {
      total: demoRequests.length,
      scheduled: demoRequests.filter(r => r.status === 'SCHEDULED').length,
      completed: demoRequests.filter(r => r.status === 'COMPLETED').length,
      cancelled: demoRequests.filter(r => r.status === 'CANCELLED').length,
      noShow: demoRequests.filter(r => r.status === 'NO_SHOW').length
    };
  };

  const stats = getStats();

  const handleEditSchedule = (record) => {
    setSelectedRequest(record);
    form.setFieldsValue({
      meetingLink: record.meetingLink,
      date: record.date ? dayjs(record.date) : null,
      time: record.time,
      timezone: record.timezone || 'Asia/Kolkata'
    });
    setEditModalVisible(true);
  };

  const handleUpdateSchedule = async (values) => {
    try {
      await _patch(`/demo-requests/${selectedRequest._id}`, {
        meetingLink: values.meetingLink,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : selectedRequest.date,
        time: values.time || selectedRequest.time,
        timezone: values.timezone
      });
      message.success('Schedule updated successfully. User will receive an email with meeting details.');
      setEditModalVisible(false);
      fetchDemoRequests();
    } catch (error) {
      message.error('Failed to update schedule');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'SCHEDULED': {
        color: '#1890ff',
        bgColor: '#e6f7ff',
        icon: <ScheduleOutlined />,
        label: 'SCHEDULED',
        badge: 'processing'
      },
      'COMPLETED': {
        color: '#52c41a',
        bgColor: '#f6ffed',
        icon: <CheckCircleOutlined />,
        label: 'COMPLETED',
        badge: 'success'
      },
      'CANCELLED': {
        color: '#ff4d4f',
        bgColor: '#fff2f0',
        icon: <CloseCircleOutlined />,
        label: 'CANCELLED',
        badge: 'error'
      },
      'NO_SHOW': {
        color: '#fa8c16',
        bgColor: '#fff7e6',
        icon: <MinusCircleOutlined />,
        label: 'NO SHOW',
        badge: 'warning'
      }
    };
    return configs[status] || configs['SCHEDULED'];
  };

  const columns = [
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>DEMO REQUEST</span>,
      key: 'request',
      width: 240,
      fixed: screens.md ? 'left' : false,
      render: (_, record) => (
        <Space align="center">
          <Avatar 
            size={44} 
            style={{ 
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.infoLight} 0%, ${THEME_CONSTANTS.colors.info} 100%)`,
              color: 'white',
              fontWeight: 600,
              fontSize: '16px',
              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)'
            }}
          >
            {record.name?.charAt(0)?.toUpperCase() || 'G'}
          </Avatar>
          <div style={{ lineHeight: '1.3' }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: '15px',
              color: THEME_CONSTANTS.colors.text,
              marginBottom: '2px'
            }}>
              {record.name || 'Guest User'}
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
              {record.createdAt ? dayjs(record.createdAt).format('DD MMM YYYY') : 'Recent'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>COMPANY & CONTACT</span>,
      key: 'company',
      width: 220,
      render: (_, record) => (
        <div style={{ lineHeight: '1.4' }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: THEME_CONSTANTS.colors.text,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <TeamOutlined style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.primary }} />
            {record.company || 'Individual'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: THEME_CONSTANTS.colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px'
          }}>
            <PhoneOutlined style={{ fontSize: '11px' }} />
            {record.phone || 'No phone'}
          </div>
        </div>
      ),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>SCHEDULE</span>,
      key: 'scheduled',
      width: 200,
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
            <CalendarOutlined style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.success }} />
            {record.date ? dayjs(record.date).format('DD MMM') : 'Not set'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: THEME_CONSTANTS.colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ClockCircleOutlined style={{ fontSize: '11px' }} />
            {record.time || 'Time not set'}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: THEME_CONSTANTS.colors.textTertiary,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px'
          }}>
            <GlobalOutlined style={{ fontSize: '10px' }} />
            {record.timezone?.split('/')[1] || 'IST'}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>MEETING LINK</span>,
      key: 'meetingLink',
      width: 140,
      render: (_, record) => record.meetingLink ? (
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => window.open(record.meetingLink, '_blank')}
            style={{
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.success} 0%, ${THEME_CONSTANTS.colors.successDark} 100%)`,
              border: 'none',
              fontWeight: 500,
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: '0 auto'
            }}
          >
            Join Demo
          </Button>
          <div style={{ 
            fontSize: '11px', 
            color: THEME_CONSTANTS.colors.success,
            marginTop: '4px',
            textDecoration: 'underline',
            cursor: 'pointer'
          }} onClick={() => navigator.clipboard.writeText(record.meetingLink)}>
            Copy Link
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: '8px',
          background: `${THEME_CONSTANTS.colors.warning}10`,
          borderRadius: '8px',
          border: `1px dashed ${THEME_CONSTANTS.colors.warning}30`
        }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <LinkOutlined />
            Not set
          </Text>
          <Text type="secondary" style={{ fontSize: '10px', color: THEME_CONSTANTS.colors.textTertiary, display: 'block', marginTop: '2px' }}>
            Click Edit to add
          </Text>
        </div>
      ),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>STATUS</span>,
      key: 'status',
      width: 150,
      render: (_, record) => {
        const config = getStatusConfig(record.status);
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
      filters: [
        { text: 'Scheduled', value: 'SCHEDULED' },
        { text: 'Completed', value: 'COMPLETED' },
        { text: 'Cancelled', value: 'CANCELLED' },
        { text: 'No Show', value: 'NO_SHOW' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>SOURCE</span>,
      key: 'source',
      width: 120,
      render: (_, record) => (
        <Tag
          style={{
            background: `${THEME_CONSTANTS.colors.info}15`,
            color: THEME_CONSTANTS.colors.info,
            border: `1px solid ${THEME_CONSTANTS.colors.info}30`,
            fontWeight: 500,
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '12px',
            margin: 0,
            textTransform: 'capitalize'
          }}
        >
          {record.source || 'Website'}
        </Tag>
      ),
    },
    {
      title: <span style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>ACTIONS</span>,
      key: 'actions',
      width: 180,
      fixed: screens.md ? 'right' : false,
      render: (_, record) => (
        <Space size={screens.xs ? 6 : 8} wrap>
          <Tooltip title="View Details">
            <Button 
              size={screens.xs ? "small" : "middle"}
              icon={<EyeOutlined />}
              style={{
                background: `${THEME_CONSTANTS.colors.primary}08`,
                borderColor: `${THEME_CONSTANTS.colors.primary}30`,
                color: THEME_CONSTANTS.colors.primary
              }}
            >
              {screens.md && 'View'}
            </Button>
          </Tooltip>
          <Tooltip title="Edit Schedule">
            <Button 
              size={screens.xs ? "small" : "middle"}
              icon={<EditOutlined />}
              onClick={() => handleEditSchedule(record)}
              style={{
                background: `${THEME_CONSTANTS.colors.success}08`,
                borderColor: `${THEME_CONSTANTS.colors.success}30`,
                color: THEME_CONSTANTS.colors.success
              }}
            >
              {screens.md && 'Edit'}
            </Button>
          </Tooltip>
          <Select
            value={record.status}
            onChange={(value) => updateStatus(record._id, value)}
            style={{ width: screens.xs ? 100 : 120 }}
            size="small"
            dropdownStyle={{ minWidth: 140 }}
          >
            <Select.Option value="SCHEDULED">
              <Badge status="processing" text="Scheduled" />
            </Select.Option>
            <Select.Option value="COMPLETED">
              <Badge status="success" text="Completed" />
            </Select.Option>
            <Select.Option value="CANCELLED">
              <Badge status="error" text="Cancelled" />
            </Select.Option>
            <Select.Option value="NO_SHOW">
              <Badge status="warning" text="No Show" />
            </Select.Option>
          </Select>
        </Space>
      )
    }
  ];

  const statusCards = [
    {
      title: 'Total Demos',
      value: stats.total,
      icon: <CalendarOutlined />,
      color: THEME_CONSTANTS.colors.info,
      bgColor: `${THEME_CONSTANTS.colors.info}15`,
      description: 'All demo requests'
    },
    {
      title: 'Scheduled',
      value: stats.scheduled,
      icon: <ScheduleOutlined />,
      color: THEME_CONSTANTS.colors.primary,
      bgColor: `${THEME_CONSTANTS.colors.primary}15`,
      description: 'Upcoming demos'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckCircleOutlined />,
      color: THEME_CONSTANTS.colors.success,
      bgColor: `${THEME_CONSTANTS.colors.success}15`,
      description: 'Successful demos'
    },
    {
      title: 'No Show',
      value: stats.noShow,
      icon: <MinusCircleOutlined />,
      color: THEME_CONSTANTS.colors.warning,
      bgColor: `${THEME_CONSTANTS.colors.warning}15`,
      description: 'Missed demos'
    }
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ 
          marginBottom: THEME_CONSTANTS.spacing.xxxl, 
          paddingBottom: THEME_CONSTANTS.spacing.xxl, 
          borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` 
        }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>Demo Management</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
            <div style={{ 
              width: 72, 
              height: 72, 
              background: THEME_CONSTANTS.colors.infoLight,
              borderRadius: THEME_CONSTANTS.radius.xl, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CalendarOutlined style={{ color: THEME_CONSTANTS.colors.info, fontSize: 36 }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: THEME_CONSTANTS.typography.h1.size, 
                fontWeight: THEME_CONSTANTS.typography.h1.weight, 
                marginBottom: THEME_CONSTANTS.spacing.xs,
                color: THEME_CONSTANTS.colors.text
              }}>
                Demo Request Management
              </h1>
              <p style={{ 
                color: THEME_CONSTANTS.colors.textSecondary, 
                margin: 0,
                fontSize: '16px'
              }}>
                Schedule, manage, and track product demonstration sessions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {statusCards.map((card, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  background: card.bgColor,
                  border: `1px solid ${card.color}30`,
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                bodyStyle={{ padding: '20px' }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: THEME_CONSTANTS.colors.textSecondary, 
                      fontWeight: 500, 
                      marginBottom: 8 
                    }}>
                      {card.title}
                    </div>
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: card.color,
                      lineHeight: 1
                    }}>
                      {card.value}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: THEME_CONSTANTS.colors.textTertiary,
                      marginTop: 8
                    }}>
                      {card.description}
                    </div>
                  </div>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {React.cloneElement(card.icon, { 
                      style: { 
                        color: 'white', 
                        fontSize: '20px' 
                      } 
                    })}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Main Table Card */}
        <Card style={{ 
          borderRadius: THEME_CONSTANTS.radius.lg, 
          boxShadow: THEME_CONSTANTS.shadow.base,
          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
          overflow: 'hidden'
        }}>
          {/* Filters Section */}
          <div style={{ 
            padding: '24px 24px 0 24px',
            background: THEME_CONSTANTS.colors.surface,
            borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FilterOutlined style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontSize: '18px' 
                }} />
                <Text strong style={{ fontSize: '16px' }}>Filter & Search</Text>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Input
                  placeholder="Search name, email, or company..."
                  prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textTertiary }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: screens.xs ? '100%' : 280 }}
                  allowClear
                  size="large"
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: screens.xs ? '100%' : 160 }}
                  size="large"
                  suffixIcon={<FilterOutlined />}
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="SCHEDULED">Scheduled</Select.Option>
                  <Select.Option value="COMPLETED">Completed</Select.Option>
                  <Select.Option value="CANCELLED">Cancelled</Select.Option>
                  <Select.Option value="NO_SHOW">No Show</Select.Option>
                </Select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div style={{ padding: '24px' }}>
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => (
                  <span style={{ 
                    fontSize: '13px', 
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontWeight: 500
                  }}>
                    Showing {range[0]}-{range[1]} of {total} demo requests
                  </span>
                ),
                itemRender: (_, type, originalElement) => {
                  if (type === 'prev') {
                    return (
                      <Button 
                        size="small" 
                        icon={<RightOutlined rotate={180} />} 
                        style={{ 
                          border: 'none',
                          color: THEME_CONSTANTS.colors.textSecondary
                        }} 
                      />
                    );
                  }
                  if (type === 'next') {
                    return (
                      <Button 
                        size="small" 
                        icon={<RightOutlined />} 
                        style={{ 
                          border: 'none',
                          color: THEME_CONSTANTS.colors.textSecondary
                        }} 
                      />
                    );
                  }
                  return originalElement;
                }
              }}
              locale={{ 
                emptyText: (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div>
                          <Paragraph style={{ 
                            color: THEME_CONSTANTS.colors.textSecondary,
                            fontSize: '16px',
                            marginBottom: '8px'
                          }}>
                            No demo requests found
                          </Paragraph>
                          <Paragraph style={{ 
                            color: THEME_CONSTANTS.colors.textTertiary,
                            fontSize: '14px'
                          }}>
                            Try adjusting your filters or check back later
                          </Paragraph>
                        </div>
                      }
                    />
                  </div>
                ) 
              }}
              scroll={{ x: screens.xs ? 1200 : '100%' }}
              style={{
                fontSize: '14px',
                borderRadius: THEME_CONSTANTS.radius.md,
                overflow: 'hidden'
              }}
              rowClassName="table-row-hover"
            />
          </div>
        </Card>

        {/* Edit Schedule Modal */}
        <Modal
          title="Edit Demo Schedule"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={() => form.submit()}
          okText="Update Schedule"
          cancelText="Cancel"
          width={500}
          centered
          okButtonProps={{
            style: {
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
              border: 'none'
            }
          }}
        >
          <div style={{ 
            background: `${THEME_CONSTANTS.colors.primary}08`, 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            border: `1px solid ${THEME_CONSTANTS.colors.primary}20`
          }}>
            <Text strong style={{ color: THEME_CONSTANTS.colors.primary, marginBottom: '8px', display: 'block' }}>
              Demo for {selectedRequest?.name}
            </Text>
            <div style={{ 
              fontSize: '14px', 
              color: THEME_CONSTANTS.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <MailOutlined /> {selectedRequest?.email}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: THEME_CONSTANTS.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TeamOutlined /> {selectedRequest?.company || 'Individual'}
            </div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleUpdateSchedule}>
            <Form.Item 
              name="meetingLink" 
              label={<Text strong style={{ fontSize: '14px' }}>Meeting Link</Text>}
              rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
            >
              <Input 
                prefix={<LinkOutlined style={{ color: THEME_CONSTANTS.colors.textTertiary }} />} 
                placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                size="large"
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="date" 
                  label={<Text strong style={{ fontSize: '14px' }}>Date</Text>}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD MMM YYYY" 
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="time" 
                  label={<Text strong style={{ fontSize: '14px' }}>Time</Text>}
                >
                  <Input 
                    prefix={<ClockCircleOutlined style={{ color: THEME_CONSTANTS.colors.textTertiary }} />} 
                    placeholder="10:00 AM" 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item 
              name="timezone" 
              label={<Text strong style={{ fontSize: '14px' }}>Timezone</Text>}
            >
              <Select size="large">
                <Select.Option value="Asia/Kolkata">
                  <Space>
                    <GlobalOutlined />
                    Asia/Kolkata (IST)
                  </Space>
                </Select.Option>
                <Select.Option value="America/New_York">America/New_York (EST)</Select.Option>
                <Select.Option value="Europe/London">Europe/London (GMT)</Select.Option>
                <Select.Option value="Asia/Singapore">Asia/Singapore (SGT)</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}