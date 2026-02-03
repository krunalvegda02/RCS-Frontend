import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Avatar,
  Breadcrumb,
  Spin,
  Empty,
  Tooltip,
  Progress,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  CalendarOutlined,
  EyeOutlined,
  MessageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getUserReport } from '../../redux/slices/userReportSlice';

const UserReports = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { reportData, loading, error } = useSelector(state => state.userReport);
  const [campaignPage, setCampaignPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);

  useEffect(() => {
    if (userId) {
      dispatch(getUserReport({ userId, campaignPage, transactionPage }));
    }
  }, [dispatch, userId, campaignPage, transactionPage]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to load user report');
    }
  }, [error]);

  const exportToExcel = () => {
    if (!reportData) return;

    const { user, wallet, messageStats, campaignStats, campaigns = [], userStats } = reportData;

    const formatDate = (date) => {
      if (!date) return 'N/A';
      try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return 'N/A';
      }
    };

    const formatDateTime = (date) => {
      if (!date) return 'N/A';
      try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? 'N/A'   : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch {
        return 'N/A';
      }
    };

    // User Info Sheet
    const userInfo = [{
      'Name': user.name || 'N/A',
      'Email': user.email || 'N/A',
      'Phone': user.phone || 'N/A',
      'Company': user.companyname || 'N/A',
      'Role': user.role || 'USER',
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Verified': user.isVerified ? 'Yes' : 'No',
      'Joined Date': formatDate(user.createdAt),
      'Last Login': formatDateTime(user.lastLogin),
      'Jio RCS Configured': user.jioConfig?.isConfigured ? 'Yes' : 'No'
    }];

    // Wallet Info Sheet
    const walletInfo = [{
      'Current Balance': wallet.balance || 0,
      'Blocked Balance': wallet.blockedBalance || 0,
      'Available Balance': wallet.availableBalance || 0,
      'Currency': wallet.currency || 'INR',
      'Total Transactions': wallet.totalTransactions || 0
    }];

    // Message Stats Sheet
    const messageStatsData = [{
      'Total Messages Sent': messageStats.totalSent || 0,
      'Successfully Delivered': messageStats.delivered || 0,
      'Failed Messages': messageStats.failed || 0,
      'Messages Read': messageStats.read || 0,
      'Messages Replied': messageStats.replied || 0,
      'Total User Interactions': messageStats.totalInteractions || 0,
      'Total User Replies': messageStats.totalReplies || 0,
      'Success Rate (%)': messageStats.totalSent > 0 ? ((messageStats.delivered / messageStats.totalSent) * 100).toFixed(2) : 0
    }];

    // Campaign Stats Sheet
    const campaignStatsData = [{
      'Total Campaigns': campaignStats.total || 0,
      'Completed Campaigns': campaignStats.completed || 0,
      'Running Campaigns': campaignStats.running || 0,
      'Failed Campaigns': campaignStats.failed || 0,
      'Total Recipients': campaignStats.totalRecipients || 0,
      'Total Cost (INR)': campaignStats.totalCost || 0
    }];

    // All Campaigns Sheet
    const campaignsData = campaigns.map((c, idx) => ({
      'S.No': idx + 1,
      'Campaign Name': c.name || 'N/A',
      'Message Type': c.type || 'N/A',
      'Status': c.status || 'N/A',
      'Total Recipients': c.recipients || 0,
      'Messages Sent': c.sent || 0,
      'Successfully Delivered': c.delivered || 0,
      'Messages Read': c.read || 0,
      'Messages Replied': c.replied || 0,
      'Failed Messages': c.failed || 0,
      'Success Rate (%)': c.recipients > 0 ? ((c.delivered / c.recipients) * 100).toFixed(2) : 0,
      'Created Date': formatDate(c.createdAt)
    }));

    // All Transactions Sheet
    const transactionsData = (wallet.transactions || []).map((t, idx) => ({
      'S.No': idx + 1,
      'Transaction Type': t.type?.toUpperCase() || 'N/A',
      'Amount (INR)': t.amount || 0,
      'Balance After (INR)': t.balanceAfter || 0,
      'Description': t.description || 'N/A',
      'Date & Time': formatDateTime(t.createdAt)
    }));

    // User Statistics Sheet
    const userStatsData = [{
      'Total Campaigns Created': userStats?.totalCampaigns || 0,
      'Total Messages Sent': userStats?.totalMessagesSent || 0,
      'Total Messages Delivered': userStats?.totalMessagesDelivered || 0,
      'Total Amount Spent (INR)': userStats?.totalSpent || 0,
      'Overall Success Rate (%)': userStats?.successRate || 0,
      'Last Campaign Date': formatDate(userStats?.lastCampaignAt)
    }];

    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(userInfo), 'User Info');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(walletInfo), 'Wallet Summary');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(messageStatsData), 'Message Statistics');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(campaignStatsData), 'Campaign Statistics');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(userStatsData), 'User Statistics');
    
    if (campaignsData.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(campaignsData), 'All Campaigns');
    }
    
    if (transactionsData.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionsData), 'All Transactions');
    }

    XLSX.writeFile(workbook, `user-report-${user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported complete report with ${campaignsData.length} campaigns and ${transactionsData.length} transactions`);
  };

  const StatCard = ({ icon: IconComponent, title, value, color, suffix }) => (
    <Card
      style={{
        borderRadius: THEME_CONSTANTS.radius.lg,
        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
        boxShadow: THEME_CONSTANTS.shadow.base,
        height: '100%',
        transition: THEME_CONSTANTS.transition.normal,
      }}
      bodyStyle={{ padding: '20px' }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: THEME_CONSTANTS.radius.lg,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: 24,
          flexShrink: 0
        }}>
          <IconComponent />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '11px',
            color: THEME_CONSTANTS.colors.textSecondary,
            marginBottom: '4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: THEME_CONSTANTS.colors.text,
            lineHeight: 1
          }}>
            {value}{suffix}
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ padding: THEME_CONSTANTS.spacing.xxl }}>
        <Empty description="User report not found" />
      </div>
    );
  }

  const { user, wallet, messageStats, campaignStats, campaigns = [], campaignPagination, userStats } = reportData;
  const successRate = messageStats.totalSent > 0 ? ((messageStats.delivered / messageStats.totalSent) * 100).toFixed(2) : 0;

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: THEME_CONSTANTS.spacing.xxxl,
          paddingBottom: THEME_CONSTANTS.spacing.xxl,
          borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
        }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
            <Breadcrumb.Item>
              <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: THEME_CONSTANTS.typography.caption.size }}>Admin</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
              <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: THEME_CONSTANTS.typography.caption.size }}>Users</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <span style={{ color: THEME_CONSTANTS.colors.primary, fontSize: THEME_CONSTANTS.typography.caption.size, fontWeight: 600 }}>User Report</span>
            </Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: THEME_CONSTANTS.spacing.lg, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
              <Avatar
                size={72}
                style={{
                  background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                  fontSize: '32px',
                  fontWeight: 700,
                  boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.primary}40`,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <h1 style={{
                  fontSize: THEME_CONSTANTS.typography.h1.size,
                  fontWeight: THEME_CONSTANTS.typography.h1.weight,
                  color: THEME_CONSTANTS.colors.text,
                  marginBottom: THEME_CONSTANTS.spacing.xs,
                  lineHeight: 1.2,
                }}>
                  {user.name}
                  <Tag
                    color={user.isActive ? THEME_CONSTANTS.colors.successLight : THEME_CONSTANTS.colors.dangerLight}
                    style={{
                      marginLeft: '12px',
                      color: user.isActive ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.danger,
                      border: `1px solid ${user.isActive ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.danger}`,
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </h1>
                <Space size="large" style={{ fontSize: THEME_CONSTANTS.typography.body.size, color: THEME_CONSTANTS.colors.textSecondary }}>
                  <span><MailOutlined /> {user.email}</span>
                  <span><PhoneOutlined /> {user.phone}</span>
                  {user.companyname && <span><BankOutlined /> {user.companyname}</span>}
                </Space>
              </div>
            </div>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin/users')}
                style={{ borderRadius: THEME_CONSTANTS.radius.md, height: '44px' }}
              >
                Back
              </Button>
             
            </Space>
          </div>
        </div>

        {/* Wallet Stats */}
        <Row gutter={[20, 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={DollarOutlined}
              title="Current Balance"
              value={`${wallet.balance.toLocaleString('en-IN')} Credits`}
              color={THEME_CONSTANTS.colors.success}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={DollarOutlined}
              title="Available Balance"
              value={`${wallet.availableBalance.toLocaleString('en-IN')} Credits`}
              color={THEME_CONSTANTS.colors.primary}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={DollarOutlined}
              title="Blocked Balance"
              value={`${wallet.blockedBalance.toLocaleString('en-IN')} Credits`}
              color={THEME_CONSTANTS.colors.warning}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={BarChartOutlined}
              title="Transactions"
              value={wallet.totalTransactions}
              color={THEME_CONSTANTS.colors.primary}
            />
          </Col>
        </Row>

        {/* Message & Campaign Stats */}
        <Row gutter={[20, 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={SendOutlined}
              title="Total Sent"
              value={messageStats.totalSent.toLocaleString('en-IN')}
              color={THEME_CONSTANTS.colors.primary}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={CheckCircleOutlined}
              title="Delivered"
              value={messageStats.delivered.toLocaleString('en-IN')}
              color={THEME_CONSTANTS.colors.success}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={CloseCircleOutlined}
              title="Failed"
              value={messageStats.failed.toLocaleString('en-IN')}
              color={THEME_CONSTANTS.colors.danger}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={BarChartOutlined}
              title="Success Rate"
              value={successRate}
              suffix="%"
              color={successRate >= 80 ? THEME_CONSTANTS.colors.success : successRate >= 50 ? THEME_CONSTANTS.colors.warning : THEME_CONSTANTS.colors.danger}
            />
          </Col>
        </Row>

        {/* Campaign Stats */}
        <Row gutter={[20, 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={BarChartOutlined}
              title="Total Campaigns"
              value={campaignStats.total}
              color={THEME_CONSTANTS.colors.primary}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={CheckCircleOutlined}
              title="Completed"
              value={campaignStats.completed}
              color={THEME_CONSTANTS.colors.success}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={SendOutlined}
              title="Running"
              value={campaignStats.running}
              color={THEME_CONSTANTS.colors.warning}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={DollarOutlined}
              title="Total Spent"
              value={`${campaignStats.totalCost.toLocaleString('en-IN')} Credits`}
              color={THEME_CONSTANTS.colors.primary}
            />
          </Col>
        </Row>

        {/* Campaigns */}
        <Card
          title={<Space size={8}><BarChartOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} /><span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight }}>Campaigns</span></Space>}
          style={{ borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.border}`, boxShadow: THEME_CONSTANTS.shadow.base, marginBottom: THEME_CONSTANTS.spacing.xxxl }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            dataSource={campaigns}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: campaignPage,
              pageSize: 5,
              total: campaignPagination?.total || 0,
              onChange: (page) => setCampaignPage(page),
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
            }}
            columns={[
              { title: 'Campaign', dataIndex: 'name', key: 'name', render: (text, record) => (<div><div style={{ fontWeight: 600, fontSize: '13px' }}>{text}</div><div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>{new Date(record.createdAt).toLocaleDateString()}</div></div>) },
              { title: 'Type', dataIndex: 'type', key: 'type', render: (type) => <Tag style={{ fontSize: '12px' }}>{type}</Tag> },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => { const colors = { completed: THEME_CONSTANTS.colors.success, running: THEME_CONSTANTS.colors.warning, failed: THEME_CONSTANTS.colors.danger }; return <Tag color={colors[status] || THEME_CONSTANTS.colors.primary} style={{ fontWeight: 600 }}>{status.toUpperCase()}</Tag>; } },
              { title: 'Recipients', dataIndex: 'recipients', key: 'recipients', align: 'center', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
              { title: 'RCS Capable', dataIndex: 'rcsCapable', key: 'rcsCapable', align: 'center', render: (val) => <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>{val || 0}</span> },
              { title: 'Delivered', dataIndex: 'delivered', key: 'delivered', align: 'center', render: (val) => <span style={{ color: THEME_CONSTANTS.colors.success, fontWeight: 600 }}>{val}</span> },
              { title: 'Read', dataIndex: 'read', key: 'read', align: 'center', render: (val) => <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{val || 0}</span> },
              { title: 'Replied', dataIndex: 'replied', key: 'replied', align: 'center', render: (val) => <span style={{ color: THEME_CONSTANTS.colors.primary, fontWeight: 600 }}>{val || 0}</span> },
              { title: 'Failed', dataIndex: 'failed', key: 'failed', align: 'center', render: (val) => <span style={{ color: THEME_CONSTANTS.colors.danger, fontWeight: 600 }}>{val}</span> }
            ]}
          />
        </Card>

        {/* Transactions */}
        <Card
          title={<Space size={8}><DollarOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '18px' }} /><span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight }}>Transactions</span></Space>}
          style={{ borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.border}`, boxShadow: THEME_CONSTANTS.shadow.base }}
          bodyStyle={{ padding: 0 }}
        >
          {wallet.totalTransactions > 0 ? (
            <Table
              dataSource={wallet.transactions}
              rowKey={(record, index) => record._id || index}
              loading={loading}
              pagination={{
                current: transactionPage,
                pageSize: 5,
                total: wallet.transactionPagination?.total || 0,
                onChange: (page) => setTransactionPage(page),
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
              }}
              columns={[
                { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (date) => (<div><div style={{ fontWeight: 500, fontSize: '13px' }}>{new Date(date).toLocaleDateString('en-IN')}</div><div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>{new Date(date).toLocaleTimeString('en-IN')}</div></div>) },
                { title: 'Type', dataIndex: 'type', key: 'type', render: (type) => <Tag icon={type === 'credit' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} color={type === 'credit' ? 'green' : 'red'} style={{ fontWeight: 600 }}>{type.toUpperCase()}</Tag> },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount, record) => <span style={{ color: record.type === 'credit' ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.danger, fontWeight: 600, fontSize: '14px' }}>{record.type === 'credit' ? '+' : '-'}{amount.toLocaleString('en-IN')} Credits</span> },
                { title: 'Description', dataIndex: 'description', key: 'description', render: (desc) => <span style={{ fontSize: '13px' }}>{desc}</span> },
                { title: 'Balance After', dataIndex: 'balanceAfter', key: 'balanceAfter', render: (balance) => <span style={{ fontWeight: 600 }}>{balance.toLocaleString('en-IN')} Credits</span> }
              ]}
            />
          ) : (
            <Empty description="No transactions found" style={{ padding: '40px 0' }} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserReports;
