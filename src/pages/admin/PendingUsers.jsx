import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Avatar, Breadcrumb, Spin, Empty, Modal, Form, Input, message } from 'antd';
import { UserAddOutlined, CheckOutlined, CloseOutlined, MailOutlined, PhoneOutlined, BankOutlined, CalendarOutlined } from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { _get, _post, _delete } from '../../helper/apiClient';

const PendingUsers = () => {
  const [loading, setLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await _get('auth/admin/pending-users');
      setPendingUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('Failed to load pending users');
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyname: user.companyname || '',
      walletBalance: 0
    });
    setIsApproveModalVisible(true);
  };

  const handleApproveSubmit = async () => {
    try {
      const values = await form.validateFields();
      await _post(`auth/admin/approve-user/${selectedUser._id}`, values);
      message.success('User approved successfully!');
      setIsApproveModalVisible(false);
      fetchPendingUsers();
    } catch (error) {
      message.error(error?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    Modal.confirm({
      title: 'Reject User',
      content: 'Are you sure you want to reject this user request?',
      okText: 'Reject',
      okType: 'danger',
      onOk: async () => {
        try {
          await _delete(`auth/admin/reject-user/${userId}`);
          message.success('User rejected successfully');
          fetchPendingUsers();
        } catch (error) {
          message.error('Failed to reject user');
        }
      }
    });
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar size={40} style={{ background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary }}>
            {record.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Company',
      dataIndex: 'companyname',
      key: 'company',
      render: (text) => text || '-',
    },
    {
      title: 'Requested On',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('en-IN'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
            Approve
          </Button>
          <Button danger icon={<CloseOutlined />} onClick={() => handleReject(record._id)}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        <Spin spinning={loading}>
          <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl, paddingBottom: THEME_CONSTANTS.spacing.xxl, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
            <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
              <Breadcrumb.Item>Admin</Breadcrumb.Item>
              <Breadcrumb.Item>Pending Users</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
              <div style={{ width: 72, height: 72, background: THEME_CONSTANTS.colors.primaryLight, borderRadius: THEME_CONSTANTS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserAddOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: 36 }} />
              </div>
              <div>
                <h1 style={{ fontSize: THEME_CONSTANTS.typography.h1.size, fontWeight: THEME_CONSTANTS.typography.h1.weight, marginBottom: THEME_CONSTANTS.spacing.xs }}>
                  Pending User Requests
                </h1>
                <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                  Review and approve user onboarding requests
                </p>
              </div>
            </div>
          </div>

          <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg, boxShadow: THEME_CONSTANTS.shadow.base }}>
            <Table
              dataSource={pendingUsers}
              columns={columns}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="No pending users" /> }}
            />
          </Card>
        </Spin>

        <Modal
          title="Approve User"
          open={isApproveModalVisible}
          onCancel={() => setIsApproveModalVisible(false)}
          onOk={handleApproveSubmit}
          width={600}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Company" name="companyname">
              <Input />
            </Form.Item>
            <Form.Item label="Initial Wallet Balance" name="walletBalance">
              <Input type="number" min={0} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default PendingUsers;
