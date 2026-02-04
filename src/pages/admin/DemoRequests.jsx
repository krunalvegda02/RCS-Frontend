import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Space, Typography, message, Input, Row, Col, Statistic, Badge, Button, Modal, Form, DatePicker, TimePicker, Tooltip } from 'antd';
import { CalendarOutlined, PhoneOutlined, MailOutlined, TeamOutlined, SearchOutlined, LinkOutlined, ClockCircleOutlined, GlobalOutlined, CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { _get, _patch } from '../../helper/apiClient';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

export default function DemoRequests() {
  const [demoRequests, setDemoRequests] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();

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
      message.success('Schedule updated successfully');
      setEditModalVisible(false);
      fetchDemoRequests();
    } catch (error) {
      message.error('Failed to update schedule');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 150
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <div><MailOutlined style={{ marginRight: 4 }} /> {record.email}</div>
          <div><PhoneOutlined style={{ marginRight: 4 }} /> {record.phone}</div>
        </Space>
      ),
      width: 220
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      render: (text) => (
        <div><TeamOutlined style={{ marginRight: 4 }} /> {text || 'N/A'}</div>
      ),
      width: 150
    },
    {
      title: 'Scheduled',
      key: 'scheduled',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <div><CalendarOutlined style={{ marginRight: 4 }} /> {dayjs(record.date).format('MMM DD, YYYY')}</div>
          <div><ClockCircleOutlined style={{ marginRight: 4, fontSize: 12 }} /> {record.time}</div>
          <div style={{ fontSize: 11, color: '#888' }}><GlobalOutlined style={{ marginRight: 4 }} />{record.timezone || 'Asia/Kolkata'}</div>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      width: 180
    },
    {
      title: 'Meeting Link',
      dataIndex: 'meetingLink',
      key: 'meetingLink',
      render: (link) => link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <Button type="link" size="small" icon={<LinkOutlined />}>Join</Button>
        </a>
      ) : (
        <Text type="secondary" style={{ fontSize: 12 }}>Not set</Text>
      ),
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          SCHEDULED: { color: 'blue', text: 'SCHEDULED', icon: <CalendarOutlined /> },
          COMPLETED: { color: 'green', text: 'COMPLETED', icon: <CheckCircleOutlined /> },
          CANCELLED: { color: 'red', text: 'CANCELLED', icon: <CloseCircleOutlined /> },
          NO_SHOW: { color: 'orange', text: 'NO SHOW', icon: <MinusCircleOutlined /> }
        };
        const { color, text, icon } = config[status] || { color: 'default', text: status, icon: null };
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
      filters: [
        { text: 'Scheduled', value: 'SCHEDULED' },
        { text: 'Completed', value: 'COMPLETED' },
        { text: 'Cancelled', value: 'CANCELLED' },
        { text: 'No Show', value: 'NO_SHOW' }
      ],
      onFilter: (value, record) => record.status === value,
      width: 140
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => <Tag>{source || 'website'}</Tag>,
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Select
            value={record.status}
            onChange={(value) => updateStatus(record._id, value)}
            style={{ width: 120 }}
            size="small"
          >
            <Select.Option value="SCHEDULED">Scheduled</Select.Option>
            <Select.Option value="COMPLETED">Completed</Select.Option>
            <Select.Option value="CANCELLED">Cancelled</Select.Option>
            <Select.Option value="NO_SHOW">No Show</Select.Option>
          </Select>
          <Tooltip title="Edit Schedule">
            <Button size="small" icon={<CalendarOutlined />} onClick={() => handleEditSchedule(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Demo Requests</Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Requests" value={stats.total} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Scheduled" value={stats.scheduled} valueStyle={{ color: '#1890ff' }} prefix={<Badge status="processing" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Completed" value={stats.completed} valueStyle={{ color: '#52c41a' }} prefix={<Badge status="success" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="No Show" value={stats.noShow} valueStyle={{ color: '#fa8c16' }} prefix={<Badge status="warning" />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <Input
              placeholder="Search by name, email, or company"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="SCHEDULED">Scheduled</Select.Option>
              <Select.Option value="COMPLETED">Completed</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
              <Select.Option value="NO_SHOW">No Show</Select.Option>
            </Select>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} requests` }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="Edit Schedule Details"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateSchedule}>
          <Form.Item name="meetingLink" label="Meeting Link" rules={[{ type: 'url', message: 'Please enter a valid URL' }]}>
            <Input prefix={<LinkOutlined />} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
          </Form.Item>
          <Form.Item name="date" label="Date">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="time" label="Time">
            <Input prefix={<ClockCircleOutlined />} placeholder="10:00 AM" />
          </Form.Item>
          <Form.Item name="timezone" label="Timezone">
            <Select>
              <Select.Option value="Asia/Kolkata">Asia/Kolkata (IST)</Select.Option>
              <Select.Option value="America/New_York">America/New_York (EST)</Select.Option>
              <Select.Option value="Europe/London">Europe/London (GMT)</Select.Option>
              <Select.Option value="Asia/Singapore">Asia/Singapore (SGT)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}