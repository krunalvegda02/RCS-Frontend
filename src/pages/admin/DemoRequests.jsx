import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Select, Space, Typography, message } from 'antd';
import { CalendarOutlined, PhoneOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import ApiService from '../../helper/apiClient';

const { Title } = Typography;

export default function DemoRequests() {
  const [demoRequests, setDemoRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDemoRequests = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get('demo-requests');
      setDemoRequests(response.data.data);
    } catch (error) {
      message.error('Failed to fetch demo requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await ApiService.patch(`demo-requests/${id}/status`, { status });
      message.success('Status updated');
      fetchDemoRequests();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div><MailOutlined /> {record.email}</div>
          <div><PhoneOutlined /> {record.phone}</div>
        </Space>
      )
    },
    {
      title: 'Company',
      key: 'company',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div><TeamOutlined /> {record.company}</div>
          <div>Size: {record.companySize}</div>
        </Space>
      )
    },
    {
      title: 'Scheduled',
      key: 'scheduled',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div><CalendarOutlined /> {record.date}</div>
          <div>{record.time}</div>
        </Space>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', contacted: 'blue', completed: 'green', cancelled: 'red' };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(value) => updateStatus(record._id, value)}
          style={{ width: 120 }}
        >
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="contacted">Contacted</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
          <Select.Option value="cancelled">Cancelled</Select.Option>
        </Select>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Demo Requests</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={demoRequests}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
