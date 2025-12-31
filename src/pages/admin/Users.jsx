import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Row,
  Col,
  Avatar,
  Tooltip,
  Empty,
  InputNumber,
  Breadcrumb,
  Spin,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  KeyOutlined,
  ReloadOutlined,
  LockOutlined,
  BuildOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import apiService from '../../helper/apiClient';
import { THEME_CONSTANTS } from '../../theme';


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
const APIURL = "https://rcssender.com";

  // Create User Modal States
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    jioId: '',
    jioSecret: '',
    companyname: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit User States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Wallet Modal States
  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
  const [selectedUserForWallet, setSelectedUserForWallet] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  // Password Modal States
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Transaction Modal States
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [selectedUserForTransaction, setSelectedUserForTransaction] = useState(null);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [transactionLoading, setTransactionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${APIURL}/api/admin/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const data = await apiService.createUser(createFormData);
      if (data.success) {
        message.success('User created successfully!');
        setCreateFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          // role: 'user',
          jioId: '',
          jioSecret: '',
          companyname: '',
        });
        setIsCreateModalVisible(false);
        fetchUsers();
      } else {
        message.error(data.message || 'Failed to create user');
      }
    } catch (err) {
      message.error('Error creating user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData({ ...createFormData, [name]: value });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      // role: user.role,
      jioId: user.jioId || '',
      jioSecret: user.jioSecret || '',
      status: user.status || 'active',
      companyname: user.companyname || '',
    });
    setIsEditModalVisible(true);
  };

  const handleEditUser = async () => {
    setEditLoading(true);
    try {
      const response = await apiService.editUser(editingUser._id, editFormData);
      if (response.success) {
        message.success('User updated successfully!');
        fetchUsers();
        setIsEditModalVisible(false);
      }
    } catch (err) {
      message.error('Error updating user');
    } finally {
      setEditLoading(false);
    }
  };

  const openWalletModal = (user) => {
    setSelectedUserForWallet(user);
    setWalletAmount('');
    setIsWalletModalVisible(true);
  };

  const handleAddWallet = async () => {
    if (!walletAmount || walletAmount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }
    setWalletLoading(true);
    try {
      const response = await apiService.addWalletBalance(
        selectedUserForWallet._id,
        Number(walletAmount)
      );
      if (response.success) {
        message.success('Wallet balance added successfully!');
        fetchUsers();
        setIsWalletModalVisible(false);
      }
    } catch (err) {
      message.error('Error adding wallet balance');
    } finally {
      setWalletLoading(false);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setNewPassword('');
    setShowNewPassword(false);
    setIsPasswordModalVisible(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      message.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await apiService.resetPassword(
        selectedUserForPassword._id,
        newPassword
      );
      if (response.success) {
        message.success('Password reset successfully!');
        setIsPasswordModalVisible(false);
      }
    } catch (err) {
      message.error('Error resetting password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openTransactionModal = async (user) => {
    setSelectedUserForTransaction(user);
    setIsTransactionModalVisible(true);
    setTransactionLoading(true);
    try {
      const data = await apiService.getUserTransactionSummary(user._id);
      if (data.success) {
        setTransactionSummary(data.summary);
      }
    } catch (err) {
      message.error('Error fetching transactions');
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${userName}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await apiService.deleteUser(userId);
          if (response.success) {
            message.success('User deleted successfully!');
            fetchUsers();
          }
        } catch (err) {
          message.error('Error deleting user');
        }
      },
    });
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await apiService.updateUserStatus(userId, newStatus);
      if (response.success) {
        message.success(`User status updated to ${newStatus}`);
        fetchUsers();
      }
    } catch (err) {
      message.error('Error updating user status');
    }
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => {
    if (!d) return '-';
    const now = new Date();
    const diffHours = Math.floor((now - new Date(d)) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(d).toLocaleDateString('en-IN');
  };

  const StatCard = ({ icon: IconComponent, title, value, color, bgColor }) => (
    <Card
      style={{
        borderRadius: THEME_CONSTANTS.radius.lg,
        boxShadow: THEME_CONSTANTS.shadow.sm,
        border: `1px solid ${bgColor}`,
      }}
      hoverable
    >
      <Row gutter={16} align="middle">
        <Col>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: THEME_CONSTANTS.radius.md,
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent style={{ fontSize: 24, color }} />
          </div>
        </Col>
        <Col flex="auto">
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>
              {title}
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color }}>
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </span>
        </Col>
      </Row>
    </Card>
  );

  const userColumns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'user',
      width: '35%',
      render: (text, record) => (
        <Space>
          <Avatar
            size={40}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            {record.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
      width: '15%',
      render: (phone) => <span style={{ fontSize: 13, color: '#666' }}>{phone}</span>,
    },
    {
      title: 'Wallet',
      dataIndex: 'Wallet',
      key: 'wallet',
      width: '15%',
      render: (wallet) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
          {formatCurrency(wallet)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => (
        <Tag
          icon={status === 'active' ? <CheckOutlined /> : <CloseOutlined />}
          color={status === 'active' ? '#F6FFED' : '#FFF1F0'}
          style={{
            color: status === 'active' ? THEME_CONSTANTS.colors.success : '#FF4D4F',
            border: `1px solid ${status === 'active' ? THEME_CONSTANTS.colors.success : '#FF4D4F'}`,
            fontWeight: 500,
            padding: '4px 12px',
            borderRadius: THEME_CONSTANTS.radius.sm,
          }}
        >
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              style={{ borderRadius: THEME_CONSTANTS.radius.sm }}
            />
          </Tooltip>
          <Tooltip title="Wallet">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.success,
                borderColor: THEME_CONSTANTS.colors.success,
              }}
              size="small"
              icon={<DollarOutlined />}
              onClick={() => openWalletModal(record)}
            />
          </Tooltip>
          <Tooltip title="Password">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.warning,
                borderColor: THEME_CONSTANTS.colors.warning,
              }}
              size="small"
              icon={<KeyOutlined />}
              onClick={() => openPasswordModal(record)}
            />
          </Tooltip>
          <Tooltip title="History">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.primary,
                borderColor: THEME_CONSTANTS.colors.primary,
              }}
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => openTransactionModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: record.status === 'active' ? '#ef4444' : '#10b981',
                borderColor: record.status === 'active' ? '#ef4444' : '#10b981',
              }}
              size="small"
              icon={
                record.status === 'active' ? (
                  <CloseOutlined />
                ) : (
                  <CheckOutlined />
                )
              }
              onClick={() => handleToggleStatus(record._id, record.status)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record._id, record.name)}
              style={{ borderRadius: THEME_CONSTANTS.radius.sm }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    totalWallet: users.reduce((sum, u) => sum + (u.Wallet || 0), 0),
  };

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
        <div style={{ 
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
          margin: '0 auto',
          padding: THEME_CONSTANTS.spacing.xl
        }}>
          <Spin spinning={loading}>
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
                    User Management
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
                      <UserOutlined style={{
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
                        User Management
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Manage and monitor all platform users, their accounts, and wallet balances.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: window.innerWidth <= 992 ? 'center' : 'right', marginTop: window.innerWidth <= 992 ? '16px' : '0' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateModalVisible(true)}
                    style={{
                      borderRadius: THEME_CONSTANTS.radius.md,
                      fontWeight: 600,
                      height: 44,
                    }}
                    block={window.innerWidth <= 576}
                  >
                    Create User
                  </Button>
                </div>
              </Col>
            </Row>
            </div>

        <Row gutter={[16, 16]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              icon={UserOutlined}
              title="Total Users"
              value={stats.totalUsers}
              color={THEME_CONSTANTS.colors.primary}
              bgColor={`${THEME_CONSTANTS.colors.primary}15`}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              icon={CheckOutlined}
              title="Active Users"
              value={stats.activeUsers}
              color={THEME_CONSTANTS.colors.success}
              bgColor={`${THEME_CONSTANTS.colors.success}15`}
            />
          </Col>
          <Col xs={24} sm={24} lg={8}>
            <StatCard
              icon={DollarOutlined}
              title="Total Wallet"
              value={formatCurrency(stats.totalWallet)}
              color={THEME_CONSTANTS.colors.warning}
              bgColor={`${THEME_CONSTANTS.colors.warning}15`}
            />
          </Col>
        </Row>

        <Card
          title={
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 600 }}>
              <UserOutlined
                style={{
                  marginRight: 8,
                  color: THEME_CONSTANTS.colors.primary,
                }}
              />
              All Users
            </div>
          }
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            boxShadow: THEME_CONSTANTS.shadow.sm,
          }}
          extra={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              loading={loading}
              size={window.innerWidth <= 768 ? 'small' : 'default'}
            >
              {window.innerWidth <= 576 ? '' : 'Refresh'}
            </Button>
          }
        >
          <Table
            dataSource={users}
            columns={userColumns}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: window.innerWidth > 768,
              showQuickJumper: window.innerWidth > 768,
              size: window.innerWidth <= 768 ? 'small' : 'default'
            }}
            locale={{ emptyText: <Empty /> }}
            style={{ fontSize: 14 }}
            scroll={{ x: 800 }}
            size={window.innerWidth <= 768 ? 'small' : 'default'}
          />
        </Card>
          </Spin>
        </div>
      </div>

      <Modal
        title="Create New User"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setCreateFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            role: 'user',
            jioId: '',
            jioSecret: '',
            companyname: '',
          });
        }}
        onOk={handleCreateUser}
        confirmLoading={createLoading}
        width={window.innerWidth <= 768 ? '95vw' : 800}
        okText="Create User"
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Full Name *">
                <Input
                  prefix={<UserOutlined />}
                  placeholder="e.g., John Doe"
                  name="name"
                  value={createFormData.name}
                  onChange={handleCreateChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Email Address *">
                <Input
                  prefix={<MailOutlined />}
                  placeholder="e.g., john@example.com"
                  type="email"
                  name="email"
                  value={createFormData.email}
                  onChange={handleCreateChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Phone Number *">
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="e.g., 9876543210"
                  name="phone"
                  value={createFormData.phone}
                  onChange={handleCreateChange}
                  maxLength={10}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Company Name">
                <Input
                  prefix={<BuildOutlined />}
                  placeholder="e.g., Tech Solutions Inc."
                  name="companyname"
                  value={createFormData.companyname}
                  onChange={handleCreateChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Password *">
                <Input
                  prefix={<LockOutlined />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secure password"
                  name="password"
                  value={createFormData.password}
                  onChange={handleCreateChange}
                  suffix={
                    <Button
                      type="text"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ fontSize: 12 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="User Role *">
                <Select
                  value={createFormData.role}
                  onChange={(value) =>
                    setCreateFormData({ ...createFormData, role: value })
                  }
                  options={[
                    { label: 'Regular User', value: 'user' },
                    { label: 'Admin', value: 'admin' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Jio Client ID">
                <Input
                  prefix={<KeyOutlined />}
                  placeholder="e.g., jio_client_xxxxx"
                  name="jioId"
                  value={createFormData.jioId}
                  onChange={handleCreateChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Jio Client Secret">
                <Input
                  prefix={<LockOutlined />}
                  type="password"
                  placeholder="Enter API secret key"
                  name="jioSecret"
                  value={createFormData.jioSecret}
                  onChange={handleCreateChange}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleEditUser}
        confirmLoading={editLoading}
        width={window.innerWidth <= 768 ? '95vw' : 600}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="Name">
            <Input
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label="Email">
            <Input
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData({ ...editFormData, email: e.target.value })
              }
              prefix={<MailOutlined />}
            />
          </Form.Item>
          <Form.Item label="Phone">
            <Input
              value={editFormData.phone}
              onChange={(e) =>
                setEditFormData({ ...editFormData, phone: e.target.value })
              }
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
          <Form.Item label="Company">
            <Input
              value={editFormData.companyname}
              onChange={(e) =>
                setEditFormData({ ...editFormData, companyname: e.target.value })
              }
              prefix={<BuildOutlined />}
            />
          </Form.Item>
          <Form.Item label="Role">
            <Select
              value={editFormData.role}
              onChange={(value) =>
                setEditFormData({ ...editFormData, role: value })
              }
              options={[
                { label: 'User', value: 'user' },
                { label: 'Admin', value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Status">
            <Select
              value={editFormData.status}
              onChange={(value) =>
                setEditFormData({ ...editFormData, status: value })
              }
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Wallet Balance"
        open={isWalletModalVisible}
        onCancel={() => setIsWalletModalVisible(false)}
        onOk={handleAddWallet}
        confirmLoading={walletLoading}
        width={window.innerWidth <= 768 ? '95vw' : 500}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="User">
            <Input
              value={selectedUserForWallet?.name}
              disabled
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label="Current Balance">
            <Input
              value={formatCurrency(selectedUserForWallet?.Wallet)}
              disabled
              prefix={<DollarOutlined />}
            />
          </Form.Item>
          <Form.Item label="Amount to Add *">
            <InputNumber
              min={1}
              value={walletAmount}
              onChange={setWalletAmount}
              placeholder="Enter amount"
              style={{ width: '100%' }}
              formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Reset Password"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        onOk={handleResetPassword}
        confirmLoading={passwordLoading}
        width={window.innerWidth <= 768 ? '95vw' : 500}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="User">
            <Input
              value={selectedUserForPassword?.name}
              disabled
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label="New Password *">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              prefix={<LockOutlined />}
              suffix={
                <Button
                  type="text"
                  size="small"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </Button>
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Transaction History - ${selectedUserForTransaction?.name}`}
        open={isTransactionModalVisible}
        onCancel={() => setIsTransactionModalVisible(false)}
        width={window.innerWidth <= 768 ? '95vw' : 800}
        footer={null}
      >
        <Spin spinning={transactionLoading}>
          {transactionSummary && (
            <div style={{ marginTop: 24 }}>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12}>
                  <Card style={{ backgroundColor: `${THEME_CONSTANTS.colors.primary}05` }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Current Balance</div>
                    <div
                      style={{
                        fontSize: 'clamp(18px, 4vw, 24px)',
                        fontWeight: 700,
                        color: THEME_CONSTANTS.colors.primary,
                        marginTop: 8,
                      }}
                    >
                      {formatCurrency(transactionSummary.currentBalance)}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card style={{ backgroundColor: `${THEME_CONSTANTS.colors.success}05` }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Total Credit</div>
                    <div
                      style={{
                        fontSize: 'clamp(18px, 4vw, 24px)',
                        fontWeight: 700,
                        color: THEME_CONSTANTS.colors.success,
                        marginTop: 8,
                      }}
                    >
                      {formatCurrency(transactionSummary.totalCredit)}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card style={{ backgroundColor: `${THEME_CONSTANTS.colors.danger}05` }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Total Debit</div>
                    <div
                      style={{
                        fontSize: 'clamp(18px, 4vw, 24px)',
                        fontWeight: 700,
                        color: THEME_CONSTANTS.colors.danger,
                        marginTop: 8,
                      }}
                    >
                      {formatCurrency(transactionSummary.totalDebit)}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card style={{ backgroundColor: `${THEME_CONSTANTS.colors.warning}05` }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Net Amount</div>
                    <div
                      style={{
                        fontSize: 'clamp(18px, 4vw, 24px)',
                        fontWeight: 700,
                        color: THEME_CONSTANTS.colors.warning,
                        marginTop: 8,
                      }}
                    >
                      {formatCurrency(transactionSummary.netAmount)}
                    </div>
                  </Card>
                </Col>
              </Row>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Recent Transactions
              </h4>
              <Table
                dataSource={transactionSummary.recentTransactions || []}
                rowKey={(_, index) => index}
                pagination={false}
                scroll={{ x: 600 }}
                size={window.innerWidth <= 768 ? 'small' : 'default'}
                columns={[
                  {
                    title: 'Type',
                    dataIndex: 'type',
                    render: (type) => (
                      <Tag
                        color={type === 'credit' ? 'green' : 'red'}
                        icon={
                          type === 'credit' ? (
                            <ArrowDownOutlined />
                          ) : (
                            <ArrowUpOutlined />
                          )
                        }
                      >
                        {type?.toUpperCase()}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'amount',
                    render: (amount, record) => (
                      <span
                        style={{
                          color: record.type === 'credit' ? '#10b981' : '#ef4444',
                          fontWeight: 600,
                        }}
                      >
                        {record.type === 'credit' ? '+' : '-'}
                        {formatCurrency(amount)}
                      </span>
                    ),
                  },
                  {
                    title: 'Description',
                    dataIndex: 'description',
                  },
                  {
                    title: 'Date',
                    dataIndex: 'createdAt',
                    render: (date) => formatDate(date),
                  },
                ]}
              />
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
}

export default UserManagement;