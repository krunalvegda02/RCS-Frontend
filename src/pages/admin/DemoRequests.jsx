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
  ScheduleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { _get, _patch, _delete } from '../../helper/apiClient';
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
  const [updateLoading, setUpdateLoading] = useState(false);
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

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Demo Request',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete the demo request from ${record.name}?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await _delete(`/demo-requests/${record._id}`);
          message.success('Demo request deleted successfully');
          fetchDemoRequests();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete demo request');
        }
      }
    });
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
    setEditModalVisible(true);
    // Set form values after modal opens to ensure proper rendering
    setTimeout(() => {
      form.setFieldsValue({
        meetingLink: record.meetingLink || '',
        date: record.date ? dayjs(record.date) : null,
        time: record.time || '',
        timezone: record.timezone || 'Asia/Kolkata'
      });
    }, 0);
  };

  const handleUpdateSchedule = async (values) => {
    setUpdateLoading(true);
    try {
      const updateData = {
        meetingLink: values.meetingLink || selectedRequest.meetingLink,
        date: values.date ? values.date.format('YYYY-MM-DD') : selectedRequest.date,
        time: values.time || selectedRequest.time,
        timezone: values.timezone || selectedRequest.timezone
      };
      
      await _patch(`/demo-requests/${selectedRequest._id}`, updateData);
      message.success('Schedule updated successfully!');
      setEditModalVisible(false);
      form.resetFields();
      fetchDemoRequests();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update schedule');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'SCHEDULED': { color: 'blue', label: 'Scheduled', icon: <ScheduleOutlined /> },
      'COMPLETED': { color: 'success', label: 'Completed', icon: <CheckCircleOutlined /> },
      'CANCELLED': { color: 'error', label: 'Cancelled', icon: <CloseCircleOutlined /> },
      'NO_SHOW': { color: 'warning', label: 'No Show', icon: <MinusCircleOutlined /> }
    };
    return configs[status] || configs['SCHEDULED'];
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{name || 'Guest User'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
        </div>
      )
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      width: 150,
      render: (company) => company || 'Individual'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: 'Schedule',
      key: 'schedule',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.date ? dayjs(record.date).format('DD MMM YYYY') : 'Not set'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.time || 'Time not set'}</div>
        </div>
      )
    },
    {
      title: 'Meeting Link',
      key: 'meetingLink',
      width: 120,
      align: 'center',
      render: (_, record) => record.meetingLink ? (
        <Button 
          type="link" 
          size="small"
          icon={<VideoCameraOutlined />}
          onClick={() => window.open(record.meetingLink, '_blank')}
        >
          Join
        </Button>
      ) : (
        <span style={{ color: '#999', fontSize: '12px' }}>Not Set</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
            {config.label}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Schedule">
            <Button 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditSchedule(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
          <Select
            value={record.status}
            onChange={(value) => updateStatus(record._id, value)}
            style={{ width: 110 }}
            size="small"
          >
            <Select.Option value="SCHEDULED">Scheduled</Select.Option>
            <Select.Option value="COMPLETED">Completed</Select.Option>
            <Select.Option value="CANCELLED">Cancelled</Select.Option>
            <Select.Option value="NO_SHOW">No Show</Select.Option>
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
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: screens.xs ? THEME_CONSTANTS.spacing.md : THEME_CONSTANTS.spacing.xxl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ 
          marginBottom: screens.xs ? THEME_CONSTANTS.spacing.xl : THEME_CONSTANTS.spacing.xxxl, 
          paddingBottom: screens.xs ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxl, 
          borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` 
        }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>Demo Management</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: screens.xs ? THEME_CONSTANTS.spacing.md : THEME_CONSTANTS.spacing.lg }}>
            <div style={{ 
              width: screens.xs ? 56 : 72, 
              height: screens.xs ? 56 : 72, 
              background: THEME_CONSTANTS.colors.infoLight,
              borderRadius: THEME_CONSTANTS.radius.xl, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CalendarOutlined style={{ color: THEME_CONSTANTS.colors.info, fontSize: screens.xs ? 28 : 36 }} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: screens.xs ? THEME_CONSTANTS.typography.h3.size : THEME_CONSTANTS.typography.h1.size, 
                fontWeight: THEME_CONSTANTS.typography.h1.weight, 
                marginBottom: THEME_CONSTANTS.spacing.xs,
                color: THEME_CONSTANTS.colors.text
              }}>
                Demo Request Management
              </h1>
              <p style={{ 
                color: THEME_CONSTANTS.colors.textSecondary, 
                margin: 0,
                fontSize: screens.xs ? '14px' : '16px'
              }}>
                Schedule, manage, and track product demonstration sessions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[screens.xs ? 12 : 16, screens.xs ? 12 : 16]} style={{ marginBottom: screens.xs ? 20 : 32 }}>
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
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: screens.xs ? '100%' : 'auto' }}>
                <Input
                  placeholder={screens.xs ? "Search..." : "Search name, email, or company..."}
                  prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textTertiary }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: screens.xs ? '100%' : 280 }}
                  allowClear
                  size={screens.xs ? 'middle' : 'large'}
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: screens.xs ? '100%' : 160 }}
                  size={screens.xs ? 'middle' : 'large'}
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
          <div style={{ padding: screens.xs ? '12px' : '24px' }}>
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
              scroll={{ x: screens.xs ? 1100 : screens.md ? 1300 : '100%' }}
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
          title={
            <Space>
              <EditOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
              <span>Edit Demo Schedule</span>
            </Space>
          }
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="Save Changes"
          cancelText="Cancel"
          width={560}
          centered
          confirmLoading={updateLoading}
          okButtonProps={{
            loading: updateLoading
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

          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleUpdateSchedule}
            preserve={false}
          >
            <Form.Item 
              name="meetingLink" 
              label={<Text strong style={{ fontSize: '14px' }}>Meeting Link (Google Meet, Zoom, etc.)</Text>}
              rules={[
                { type: 'url', message: 'Please enter a valid URL starting with http:// or https://' }
              ]}
            >
              <Input 
                prefix={<VideoCameraOutlined style={{ color: THEME_CONSTANTS.colors.success }} />} 
                placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                size="large"
                allowClear
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="date" 
                  label={<Text strong style={{ fontSize: '14px' }}>Demo Date</Text>}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD MMM YYYY" 
                    size="large"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="time" 
                  label={<Text strong style={{ fontSize: '14px' }}>Demo Time</Text>}
                >
                  <Input 
                    prefix={<ClockCircleOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />} 
                    placeholder="10:00 AM" 
                    size="large"
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item 
              name="timezone" 
              label={<Text strong style={{ fontSize: '14px' }}>Timezone</Text>}
            >
              <Select size="large" suffixIcon={<GlobalOutlined />}>
                <Select.Option value="Asia/Kolkata">
                  <Space>
                    <GlobalOutlined />
                    India (IST - UTC+5:30)
                  </Space>
                </Select.Option>
                <Select.Option value="America/New_York">
                  <Space>
                    <GlobalOutlined />
                    New York (EST - UTC-5)
                  </Space>
                </Select.Option>
                <Select.Option value="Europe/London">
                  <Space>
                    <GlobalOutlined />
                    London (GMT - UTC+0)
                  </Space>
                </Select.Option>
                <Select.Option value="Asia/Singapore">
                  <Space>
                    <GlobalOutlined />
                    Singapore (SGT - UTC+8)
                  </Space>
                </Select.Option>
                <Select.Option value="America/Los_Angeles">
                  <Space>
                    <GlobalOutlined />
                    Los Angeles (PST - UTC-8)
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>
            
            <div style={{
              background: `${THEME_CONSTANTS.colors.info}08`,
              padding: '12px 16px',
              borderRadius: '8px',
              border: `1px solid ${THEME_CONSTANTS.colors.info}20`,
              marginTop: '16px'
            }}>
              <Text style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                💡 User will receive an email notification with the updated meeting details
              </Text>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
}