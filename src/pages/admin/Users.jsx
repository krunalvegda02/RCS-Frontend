import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Switch,
  Divider,
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
  EyeOutlined,
  StopOutlined,
  LoginOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { getAllUsers, updateWallet, updateUserPassword, getUserTransactionHistory, createUser, updateUser, toggleUserStatus, getUserPassword } from '../../redux/slices/adminSlice';
import { loginSuccess } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import apiService from '../../helper/apiClient';


function UserManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { users, transactions, loading, error, stats } = useSelector(state => state.admin);

  // Local state for modals
  const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);
  const [isEditUserModalVisible, setIsEditUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletOperation, setWalletOperation] = useState('add');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createUserForm] = Form.useForm();
  const [editUserForm] = Form.useForm();

  // Multi-config state
  const [createMultiConfig, setCreateMultiConfig] = useState(false);
  const [createJioConfigs, setCreateJioConfigs] = useState([]);
  const [editMultiConfig, setEditMultiConfig] = useState(false);
  const [editJioConfigs, setEditJioConfigs] = useState([]);

  useEffect(() => {
    dispatch(getAllUsers({ page: 1, limit: 50, status: 'active', verified: true }));
  }, [dispatch]);

  const fetchUsers = () => {
    dispatch(getAllUsers({ page: 1, limit: 50, status: 'active', verified: true }));
  };

  const openWalletModal = (user) => {
    setSelectedUser(user);
    setWalletAmount('');
    setWalletOperation('add');
    setIsWalletModalVisible(true);
  };

  const openPasswordModal = async (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setCurrentPassword('');
    setIsPasswordModalVisible(true);

    try {
      const result = await dispatch(getUserPassword({ userId: user._id })).unwrap();
      setCurrentPassword(result.data?.currentPassword || '');
    } catch (error) {
      console.error('Failed to fetch password:', error);
    }
  };

  const openTransactionModal = async (user) => {
    setSelectedUser(user);
    setIsTransactionModalVisible(true);
    // Always fetch fresh transaction data from API when modal opens
    try {
      await dispatch(getUserTransactionHistory({ userId: user._id })).unwrap();
    } catch (error) {
      message.error('Failed to load transaction history');
    }
  };

  const handleAddWallet = async () => {
    if (!walletAmount || walletAmount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    if (walletOperation === 'deduct' && walletAmount > (selectedUser?.wallet?.balance || 0)) {
      message.error('Deduct amount cannot exceed current balance');
      return;
    }

    try {
      const backendOperation = walletOperation === 'deduct' ? 'subtract' : 'add';
      await dispatch(updateWallet({
        userId: selectedUser._id,
        amount: Number(walletAmount),
        operation: backendOperation
      })).unwrap();

      message.success(`Wallet balance ${walletOperation === 'add' ? 'added' : 'deducted'} successfully!`);
      setIsWalletModalVisible(false);
      dispatch(getAllUsers({ page: 1, limit: 50, status: 'active', verified: true }));
    } catch (error) {
      message.error(error || `Error ${walletOperation === 'add' ? 'adding' : 'deducting'} wallet balance`);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      message.error('Password must be at least 6 characters long');
      return;
    }

    try {
      await dispatch(updateUserPassword({
        userId: selectedUser._id,
        newPassword
      })).unwrap();

      message.success('Password updated successfully!');
      setIsPasswordModalVisible(false);
    } catch (error) {
      message.error(error || 'Error updating password');
    }
  };

  const handleCreateUser = async () => {
    try {
      const values = await createUserForm.validateFields();
      const userData = {
        ...values,
        role: 'USER'
      };

      // Add multi-config data
      if (createMultiConfig && createJioConfigs.length > 0) {
        userData.isMultiConfig = true;
        userData.jioConfigs = createJioConfigs;
      }

      await dispatch(createUser(userData)).unwrap();
      message.success('User created successfully!');
      setIsCreateUserModalVisible(false);
      createUserForm.resetFields();
      setCreateMultiConfig(false);
      setCreateJioConfigs([]);
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error || 'Error creating user');
      }
    }
  };

  const openEditModal = (user) => {
    console.log('User data:', user);
    setSelectedUser(user);
    setIsEditUserModalVisible(true);

    // Set multi-config state
    const isMulti = user.isMultiConfig || false;
    setEditMultiConfig(isMulti);
    setEditJioConfigs(isMulti && user.jioConfigs ? user.jioConfigs.map(c => ({
      label: c.label || '',
      clientId: c.clientId || '',
      clientSecret: c.clientSecret || '',
      assistantId: c.assistantId || '',
    })) : []);

    setTimeout(() => {
      const formValues = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyname: user.companyname || '',
        clientId: user.jioConfig?.clientId || '',
        clientSecret: user.jioConfig?.clientSecret || '',
        assistantId: user.jioConfig?.assistantId || '',
        perMessageCharge: user.perMessageCharge || 0
      };
      editUserForm.setFieldsValue(formValues);
    }, 100);
  };

  const handleEditUser = async () => {
    try {
      const values = await editUserForm.validateFields();
      const { clientId, clientSecret, assistantId, ...userData } = values;

      const updatePayload = {
        userId: selectedUser._id,
        ...userData,
        isMultiConfig: editMultiConfig,
      };

      if (editMultiConfig && editJioConfigs.length > 0) {
        updatePayload.jioConfigs = editJioConfigs;
      } else {
        // Single config - validate same as before
        if ((clientId || clientSecret || assistantId) && (!clientId || !clientSecret || !assistantId)) {
          message.error('All 3 Jio config fields (Client ID, Client Secret, Assistant ID) are required if updating');
          return;
        }
        if (clientId && clientSecret && assistantId) {
          updatePayload.jioConfig = {
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
            assistantId: assistantId.trim()
          };
        }
      }

      await dispatch(updateUser(updatePayload)).unwrap();

      message.success('User updated successfully!');
      setIsEditUserModalVisible(false);
      dispatch(getAllUsers({ page: 1, limit: 50, status: 'active', verified: true }));
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error || 'Error updating user');
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await dispatch(toggleUserStatus({ userId })).unwrap();
      message.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      message.error(error || 'Failed to update user status');
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      const response = await apiService.impersonateUser(userId);
      if (response.data.success) {
        const { user: impersonatedUser, token } = response.data;

        // Update auth state to become the user
        dispatch(loginSuccess({ user: impersonatedUser, token }));

        // Persist to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(impersonatedUser));

        message.success(`Now logged in as ${impersonatedUser.name}`);

        // Redirect to user dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Impersonation failed');
    }
  };

  const handleDeleteUser = (userId, userName) => {
    message.info('Delete user functionality will be implemented soon');
  };

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('en-IN')}`;
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
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
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
          <IconComponent />
        </div>
      </div>
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
            style={{ background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary }}
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
      render: (phone) => <span style={{ fontSize: 14, color: '#666' }}>{phone}</span>,
    },
    {
      title: 'Wallet',
      dataIndex: 'wallet',
      key: 'wallet',
      width: '15%',
      render: (wallet) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
          {formatCurrency(wallet?.balance || 0)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: '15%',
      render: (isActive) => (
        <Tag
          icon={isActive ? <CheckOutlined /> : <CloseOutlined />}
          color={isActive ? '#F6FFED' : '#FFF1F0'}
          style={{
            color: isActive ? THEME_CONSTANTS.colors.success : '#FF4D4F',
            border: `1px solid ${isActive ? THEME_CONSTANTS.colors.success : '#FF4D4F'}`,
            fontWeight: 500,
            padding: '4px 12px',
            borderRadius: THEME_CONSTANTS.radius.sm,
          }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space size={4} wrap>
          <Tooltip title="View Report">
            <Button
              type="primary"
              size="middle"
              icon={<EyeOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/user-report/${record._id}`);
              }}
              style={{ borderRadius: THEME_CONSTANTS.radius.sm }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.primary,
                borderColor: THEME_CONSTANTS.colors.primary,
              }}
              size="middle"
              icon={<EditOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(record);
              }}
            />
          </Tooltip>
          <Tooltip title="Wallet">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.success,
                borderColor: THEME_CONSTANTS.colors.success,
              }}
              size="middle"
              icon={<DollarOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                openWalletModal(record);
              }}
            />
          </Tooltip>
          <Tooltip title="Password">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.warning,
                borderColor: THEME_CONSTANTS.colors.warning,
              }}
              size="middle"
              icon={<KeyOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                openPasswordModal(record);
              }}
            />
          </Tooltip>
          <Tooltip title="History">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.primary,
                borderColor: THEME_CONSTANTS.colors.primary,
              }}
              size="middle"
              icon={<HistoryOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                openTransactionModal(record);
              }}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: record.isActive ? THEME_CONSTANTS.colors.danger : THEME_CONSTANTS.colors.success,
                borderColor: record.isActive ? THEME_CONSTANTS.colors.danger : THEME_CONSTANTS.colors.success,
              }}
              size="middle"
              icon={<StopOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(record._id, record.isActive);
              }}
            />
          </Tooltip>
          <Tooltip title="Login as User">
            <Button
              style={{
                borderRadius: THEME_CONSTANTS.radius.sm,
                color: THEME_CONSTANTS.colors.primary,
                borderColor: THEME_CONSTANTS.colors.primary,
              }}
              size="middle"
              icon={<LoginOutlined style={{ fontSize: '16px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                Modal.confirm({
                  title: 'Impersonate User',
                  content: `Are you sure you want to log in as ${record.name}?`,
                  onOk: () => handleImpersonate(record._id)
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const calculatedStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    totalWallet: users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0),
  };

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
        <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
          <Spin spinning={loading.users}>
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
                  <span style={{ color: THEME_CONSTANTS.colors.primary, fontSize: THEME_CONSTANTS.typography.caption.size, fontWeight: 600 }}>Active User Management</span>
                </Breadcrumb.Item>
              </Breadcrumb>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: THEME_CONSTANTS.spacing.lg, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.primaryLight} 100%)`,
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.primary}40`,
                    flexShrink: 0
                  }}>
                    <UserOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '36px' }} />
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
                      User Management
                    </h1>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size,
                      lineHeight: 1.5,
                      margin: 0
                    }}>
                      Manage and monitor all platform users, accounts, and wallet balances.
                    </p>
                  </div>
                </div>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateUserModalVisible(true)}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    fontWeight: 600,
                    height: '44px',
                    padding: '0 24px',
                    boxShadow: `0 4px 12px ${THEME_CONSTANTS.colors.primary}30`
                  }}
                >
                  Create User
                </Button>
              </div>
            </div>

            <Row gutter={[20, 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  icon={UserOutlined}
                  title="Total Users"
                  value={calculatedStats.totalUsers}
                  color={THEME_CONSTANTS.colors.primary}
                  bgColor={`${THEME_CONSTANTS.colors.primary}15`}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <StatCard
                  icon={CheckOutlined}
                  title="Active Users"
                  value={calculatedStats.activeUsers}
                  color={THEME_CONSTANTS.colors.success}
                  bgColor={`${THEME_CONSTANTS.colors.success}15`}
                />
              </Col>
              <Col xs={24} sm={24} lg={8}>
                <StatCard
                  icon={DollarOutlined}
                  title="Total Wallet"
                  value={formatCurrency(calculatedStats.totalWallet)}
                  color={THEME_CONSTANTS.colors.warning}
                  bgColor={`${THEME_CONSTANTS.colors.warning}15`}
                />
              </Col>
            </Row>

            <Card
              title={
                <Space size={8}>
                  <UserOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
                  <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>All Users</span>
                </Space>
              }
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                boxShadow: THEME_CONSTANTS.shadow.base,
                background: THEME_CONSTANTS.colors.surface
              }}
              extra={
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                  loading={loading.users}
                  style={{ borderRadius: THEME_CONSTANTS.radius.md, fontWeight: 500 }}
                >
                  Refresh
                </Button>
              }
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={users}
                columns={userColumns}
                rowKey="_id"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="No users found" /> }}
                scroll={{ x: 800 }}
                onRow={(record) => ({
                  onClick: () => navigate(`/admin/user-report/${record._id}`),
                  style: { cursor: 'pointer' }
                })}
              />
            </Card>
          </Spin>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal
        title={<div className='flex justify-between items-center w-full'>
          <div className='flex items-center gap-2 text-primary font-semibold text-xl'>
            Edit User Details
          </div>
          <div className='pr-8'>
            <Tag
              icon={selectedUser?.isActive ? <CheckOutlined /> : <CloseOutlined />}
              color={selectedUser?.isActive ? '#F6FFED' : '#FFF1F0'}
              style={{
                color: selectedUser?.isActive ? THEME_CONSTANTS.colors.success : '#FF4D4F',
                border: `1px solid ${selectedUser?.isActive ? THEME_CONSTANTS.colors.success : '#FF4D4F'}`,
                fontWeight: 500,
                padding: '4px 12px',
                borderRadius: THEME_CONSTANTS.radius.sm,
              }}
            >
              {selectedUser?.isActive ? 'Active' : 'Inactive'}
            </Tag>

          </div>
        </div>}
        open={isEditUserModalVisible}
        onCancel={() => {
          setIsEditUserModalVisible(false);
          editUserForm.resetFields();
        }}
        onOk={handleEditUser}
        confirmLoading={loading.updateUser}
        width={window.innerWidth <= 768 ? '95vw' : 600}
      >
        <Form
          form={editUserForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^[0-9]{10}$/, message: 'Phone must be 10 digits' }
                ]}
              >
                <Input placeholder="Enter 10-digit phone number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Company Name"
                name="companyname"
              >
                <Input placeholder="Enter company name (optional)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={100}>
            <Col span={12}>
              <Form.Item
                type="number"
                label="Per Message Charge"
                name="perMessageCharge"

              >
                <InputNumber
                  placeholder="Per Message Charge"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Client ID"
                name="clientId"
              >
                <Input placeholder="Enter Jio RCS Client ID (optional)" disabled={editMultiConfig} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Client Secret"
                name="clientSecret"
              >
                <Input.Password placeholder="Enter Jio RCS Client Secret (optional)" disabled={editMultiConfig} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Assistant ID"
                name="assistantId"
              >
                <Input placeholder="Enter Jio RCS Assistant ID (optional)" disabled={editMultiConfig} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Switch
              checked={editMultiConfig}
              onChange={(checked) => {
                setEditMultiConfig(checked);
                if (checked && editJioConfigs.length === 0) {
                  setEditJioConfigs([{ label: 'Bot 1', clientId: '', clientSecret: '', assistantId: '' }]);
                }
              }}
            />
            <span style={{ fontWeight: 600 }}>Enable Multi Config</span>
            {editMultiConfig && <Tag color="blue">{editJioConfigs.length} config(s)</Tag>}
          </div>

          {editMultiConfig && (
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
              {editJioConfigs.map((cfg, idx) => (
                <div key={idx} style={{ marginBottom: 16, background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #d9d9d9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>Config {idx + 1}</strong>
                    {editJioConfigs.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => setEditJioConfigs(prev => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Row gutter={8}>
                    <Col span={6}>
                      <Input
                        placeholder="Label"
                        value={cfg.label}
                        onChange={e => {
                          const updated = [...editJioConfigs];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setEditJioConfigs(updated);
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Input
                        placeholder="Client ID"
                        value={cfg.clientId}
                        onChange={e => {
                          const updated = [...editJioConfigs];
                          updated[idx] = { ...updated[idx], clientId: e.target.value };
                          setEditJioConfigs(updated);
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Input.Password
                        placeholder="Client Secret"
                        value={cfg.clientSecret}
                        onChange={e => {
                          const updated = [...editJioConfigs];
                          updated[idx] = { ...updated[idx], clientSecret: e.target.value };
                          setEditJioConfigs(updated);
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Input
                        placeholder="Assistant ID"
                        value={cfg.assistantId}
                        onChange={e => {
                          const updated = [...editJioConfigs];
                          updated[idx] = { ...updated[idx], assistantId: e.target.value };
                          setEditJioConfigs(updated);
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => setEditJioConfigs(prev => [...prev, { label: `Bot ${prev.length + 1}`, clientId: '', clientSecret: '', assistantId: '' }])}
                icon={<PlusOutlined />}
                block
              >
                Add Config
              </Button>
            </div>
          )}
        </Form>
      </Modal >

      {/* Create User Modal */}
      < Modal
        title="Create New User"
        open={isCreateUserModalVisible}
        onCancel={() => {
          setIsCreateUserModalVisible(false);
          createUserForm.resetFields();
        }
        }
        onOk={handleCreateUser}
        confirmLoading={loading.createUser}
        width={window.innerWidth <= 768 ? '95vw' : 800}
      >
        <Form
          form={createUserForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^[0-9]{10}$/, message: 'Phone must be 10 digits' }
                ]}
              >
                <Input placeholder="Enter 10-digit phone number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password placeholder="Enter password (min 6 chars)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Company Name"
                name="companyname"
              >
                <Input placeholder="Enter company name (optional)" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Initial Wallet Credits"
                name="walletBalance"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  placeholder="Enter initial Credits"
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Per message charge"
                name="perMessageCharge"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  placeholder="Enter initial balance"
                  style={{ width: '100%' }}
                  formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Client ID"
                name="clientId"
              >
                <Input placeholder="Enter Jio RCS Client ID (optional)" disabled={createMultiConfig} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Client Secret"
                name="clientSecret"
              >
                <Input.Password placeholder="Enter Jio RCS Client Secret (optional)" disabled={createMultiConfig} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Assistant ID"
                name="assistantId"
              >
                <Input placeholder="Enter Jio RCS Assistant ID (optional)" disabled={createMultiConfig} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Switch
              checked={createMultiConfig}
              onChange={(checked) => {
                setCreateMultiConfig(checked);
                if (checked && createJioConfigs.length === 0) {
                  setCreateJioConfigs([{ label: 'Bot 1', clientId: '', clientSecret: '', assistantId: '' }]);
                }
              }}
            />
            <span style={{ fontWeight: 600 }}>Enable Multi Config</span>
            {createMultiConfig && <Tag color="blue">{createJioConfigs.length} config(s)</Tag>}
          </div>

          {createMultiConfig && (
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
              {createJioConfigs.map((cfg, idx) => (
                <div key={idx} style={{ marginBottom: 16, background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #d9d9d9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>Config {idx + 1}</strong>
                    {createJioConfigs.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => setCreateJioConfigs(prev => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Row gutter={8}>
                    <Col span={6}>
                      <Input
                        placeholder="Label"
                        value={cfg.label}
                        onChange={e => {
                          const updated = [...createJioConfigs];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setCreateJioConfigs(updated);
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Input
                        placeholder="Client ID"
                        value={cfg.clientId}
                        onChange={e => {
                          const updated = [...createJioConfigs];
                          updated[idx] = { ...updated[idx], clientId: e.target.value };
                          setCreateJioConfigs(updated);
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Input.Password
                        placeholder="Client Secret"
                        value={cfg.clientSecret}
                        onChange={e => {
                          const updated = [...createJioConfigs];
                          updated[idx] = { ...updated[idx], clientSecret: e.target.value };
                          setCreateJioConfigs(updated);
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Input
                        placeholder="Assistant ID"
                        value={cfg.assistantId}
                        onChange={e => {
                          const updated = [...createJioConfigs];
                          updated[idx] = { ...updated[idx], assistantId: e.target.value };
                          setCreateJioConfigs(updated);
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => setCreateJioConfigs(prev => [...prev, { label: `Bot ${prev.length + 1}`, clientId: '', clientSecret: '', assistantId: '' }])}
                icon={<PlusOutlined />}
                block
              >
                Add Config
              </Button>
            </div>
          )}
        </Form>
      </Modal >

      <Modal
        title="Manage Wallet Balance"
        open={isWalletModalVisible}
        onCancel={() => setIsWalletModalVisible(false)}
        onOk={handleAddWallet}
        confirmLoading={loading.updateWallet}
        width={window.innerWidth <= 768 ? '95vw' : 500}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="User">
            <Input
              value={selectedUser?.name}
              disabled
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label="Current Balance">
            <Input
              value={formatCurrency(selectedUser?.wallet?.balance || 0)}
              disabled
              prefix={<DollarOutlined />}
            />
          </Form.Item>
          <Form.Item label="Operation *">
            <Space.Compact style={{ width: '100%' }}>
              <Button
                type={walletOperation === 'add' ? 'primary' : 'default'}
                icon={<ArrowUpOutlined />}
                onClick={() => setWalletOperation('add')}
                style={{
                  width: '50%',
                  height: '44px',
                  fontWeight: 600,
                  background: walletOperation === 'add' ? THEME_CONSTANTS.colors.success : undefined,
                  borderColor: walletOperation === 'add' ? THEME_CONSTANTS.colors.success : undefined
                }}
              >
                Add Balance
              </Button>
              <Button
                type={walletOperation === 'deduct' ? 'primary' : 'default'}
                icon={<ArrowDownOutlined />}
                onClick={() => setWalletOperation('deduct')}
                style={{
                  width: '50%',
                  height: '44px',
                  fontWeight: 600,
                  background: walletOperation === 'deduct' ? THEME_CONSTANTS.colors.danger : undefined,
                  borderColor: walletOperation === 'deduct' ? THEME_CONSTANTS.colors.danger : undefined
                }}
              >
                Deduct Balance
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label={`Amount to ${walletOperation === 'add' ? 'Add' : 'Deduct'} *`}>
            <InputNumber
              min={1}
              max={walletOperation === 'deduct' ? (selectedUser?.wallet?.balance || 0) : undefined}
              value={walletAmount}
              onChange={setWalletAmount}
              placeholder="Enter amount"
              style={{ width: '100%' }}
              formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          {walletOperation === 'deduct' && (
            <div style={{
              padding: '12px',
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: THEME_CONSTANTS.radius.sm,
              marginTop: '-8px'
            }}>
              <span style={{ color: '#d46b08', fontSize: '13px' }}>
                ⚠️ Maximum deductible: {formatCurrency(selectedUser?.wallet?.balance || 0)}
              </span>
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="Update Password"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        onOk={handleUpdatePassword}
        confirmLoading={loading.updatePassword}
        width={window.innerWidth <= 768 ? '95vw' : 500}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="User">
            <Input
              value={selectedUser?.name}
              disabled
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label="Current Password">
            <Input.Password
              value={currentPassword}
              prefix={<LockOutlined />}
              readOnly
              style={{ cursor: 'not-allowed', backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>
          <Form.Item label="New Password *">
            <Input.Password
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              prefix={<LockOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Transaction History - ${selectedUser?.name}`}
        open={isTransactionModalVisible}
        onCancel={() => setIsTransactionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsTransactionModalVisible(false)}>
            Close
          </Button>
        ]}
        width={window.innerWidth <= 768 ? '95vw' : 900}
      >
        <div style={{ marginTop: 24 }}>
          <div style={{
            marginBottom: 16,
            padding: 16,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: 8,
            border: `1px solid ${THEME_CONSTANTS.colors.border}`
          }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar size={48} style={{ background: THEME_CONSTANTS.colors.primary, marginBottom: 8 }}>
                    {selectedUser?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>
                    {selectedUser?.name}
                  </div>
                  <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textSecondary }}>
                    {selectedUser?.email}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>
                    {formatCurrency(selectedUser?.wallet?.balance || 0)}
                  </div>
                  <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Current Balance
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>
                    {transactions.length}
                  </div>
                  <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Total Transactions
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <Spin spinning={loading.transactions}>
            {transactions && transactions.length > 0 ? (
              <Table
                dataSource={transactions}
                columns={[
                  {
                    title: 'Date & Time',
                    dataIndex: 'createdAt',
                    key: 'date',
                    width: '20%',
                    render: (date) => (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {new Date(date).toLocaleDateString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                          {new Date(date).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'Type',
                    dataIndex: 'type',
                    key: 'type',
                    width: '15%',
                    render: (type) => (
                      <Tag
                        icon={type === 'credit' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        color={type === 'credit' ? 'green' : 'red'}
                        style={{ fontWeight: 500 }}
                      >
                        {type.toUpperCase()}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'amount',
                    key: 'amount',
                    width: '15%',
                    render: (amount, record) => (
                      <span style={{
                        color: record.type === 'credit' ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.error,
                        fontWeight: 600,
                        fontSize: 14
                      }}>
                        {record.type === 'credit' ? '+' : '-'}{formatCurrency(amount)}
                      </span>
                    ),
                  },
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description',
                    width: '30%',
                    render: (description) => (
                      <span style={{ fontSize: 13 }}>{description || 'No description'}</span>
                    ),
                  },
                  {
                    title: 'Balance After',
                    dataIndex: 'balanceAfter',
                    key: 'balanceAfter',
                    width: '20%',
                    render: (balance) => (
                      <span style={{ fontWeight: 500, color: THEME_CONSTANTS.colors.text }}>
                        {formatCurrency(balance)}
                      </span>
                    ),
                  },
                ]}
                rowKey={(record, index) => record._id || index}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                  showQuickJumper: window.innerWidth > 768,
                  size: 'small'
                }}
                size="small"
                scroll={{ x: 600 }}
                style={{
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  borderRadius: THEME_CONSTANTS.radius.md
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Empty
                  description={
                    <div>
                      <div style={{ marginBottom: 8, color: THEME_CONSTANTS.colors.text }}>
                        No transactions found
                      </div>
                      <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textSecondary }}>
                        This user hasn't made any transactions yet
                      </div>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </Spin>
        </div>
      </Modal>
    </>
  );
}

export default UserManagement;