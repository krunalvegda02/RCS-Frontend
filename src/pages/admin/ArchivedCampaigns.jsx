import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Tag, Space, Modal, Breadcrumb, Spin, Empty, message } from 'antd';
import { DownloadOutlined, UserOutlined, FolderOpenOutlined, SearchOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ArchivedCampaigns() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/archived-campaigns/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCampaigns = async (userId) => {
    setCampaignsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/archived-campaigns?userId=${userId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data.data || []);
    } catch (error) {
      message.error('Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleViewCampaigns = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    fetchUserCampaigns(user._id);
  };

  const filteredUsers = users.filter(user =>
    user.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.userEmail?.toLowerCase().includes(searchText.toLowerCase())
  );

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: THEME_CONSTANTS.colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME_CONSTANTS.colors.primary,
            fontWeight: 700
          }}>
            {record.userName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>{record.userName}</div>
            <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textSecondary }}>{record.userEmail}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Archived Campaigns',
      dataIndex: 'totalArchived',
      key: 'count',
      align: 'center',
      render: (count) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', fontWeight: 600 }}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Last Archived',
      dataIndex: 'lastArchived',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={() => handleViewCampaigns(record)}
        >
          View Campaigns
        </Button>
      ),
    },
  ];

  const campaignColumns = [
    {
      title: 'Campaign Name',
      dataIndex: 'campaignName',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 11, color: THEME_CONSTANTS.colors.textSecondary }}>
            ID: {record.campaignId.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: 'Bot',
      dataIndex: 'botId',
      key: 'bot',
      align: 'center',
      render: (botId) => <Tag>{botId}</Tag>,
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>Total: {record.stats?.total || 0}</span>
          <span style={{ fontSize: 12, color: THEME_CONSTANTS.colors.success }}>
            Delivered: {record.stats?.delivered || 0}
          </span>
          <span style={{ fontSize: 12, color: THEME_CONSTANTS.colors.danger }}>
            Failed: {record.stats?.failed || 0}
          </span>
        </Space>
      ),
    },
    {
      title: 'Archived Date',
      dataIndex: 'archivedAt',
      key: 'archived',
      render: (date) => (
        <div>
          <div style={{ fontSize: 13 }}>
            {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: THEME_CONSTANTS.colors.textSecondary }}>
            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      title: 'Download',
      key: 'download',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => window.open(record.excelUrl, '_blank')}
        >
          Excel
        </Button>
      ),
    },
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl, paddingBottom: THEME_CONSTANTS.spacing.xl, borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}` }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.md }}>
            <Breadcrumb.Item><HomeOutlined /> Admin</Breadcrumb.Item>
            <Breadcrumb.Item>Archived Campaigns</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              background: THEME_CONSTANTS.colors.primaryLight,
              borderRadius: THEME_CONSTANTS.radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderOpenOutlined style={{ fontSize: 32, color: THEME_CONSTANTS.colors.primary }} />
            </div>
            <div>
              <h1 style={{ fontSize: THEME_CONSTANTS.typography.h1.size, fontWeight: 700, margin: 0 }}>
                Archived Campaigns
              </h1>
              <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                View and download archived campaign data by user
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card style={{ marginBottom: 24, borderRadius: THEME_CONSTANTS.radius.lg }}>
          <Input
            placeholder="Search by user name or email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            allowClear
          />
        </Card>

        {/* Users Table */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
              <span>Users with Archived Campaigns</span>
            </Space>
          }
          style={{ borderRadius: THEME_CONSTANTS.radius.lg }}
        >
          <Spin spinning={loading}>
            <Table
              dataSource={filteredUsers}
              columns={userColumns}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="No archived campaigns found" /> }}
            />
          </Spin>
        </Card>

        {/* Campaigns Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UserOutlined style={{ fontSize: 20, color: THEME_CONSTANTS.colors.primary }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedUser?.userName}</div>
                <div style={{ fontSize: 13, color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 400 }}>
                  {selectedUser?.userEmail}
                </div>
              </div>
            </div>
          }
          open={showModal}
          onCancel={() => setShowModal(false)}
          footer={null}
          width={1000}
        >
          <Spin spinning={campaignsLoading}>
            <Table
              dataSource={campaigns}
              columns={campaignColumns}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: <Empty description="No campaigns found" /> }}
            />
          </Spin>
        </Modal>
      </div>
    </div>
  );
}
