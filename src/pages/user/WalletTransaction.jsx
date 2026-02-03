import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Modal,
  InputNumber,
  Row,
  Col,
  Space,
  Tag,
  Empty,
  message,
  Breadcrumb,
  Spin,
} from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { createWalletRequest, getUserWalletRequests, getUserProfile } from '../../redux/slices/walletSlice';

const WalletTransaction = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { walletRequests, userProfile, loading } = useSelector(state => state.wallet);
  
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    dispatch(getUserProfile());
    dispatch(getUserWalletRequests());
  }, [dispatch]);

  const handleAddMoney = async () => {
    if (!addAmount || addAmount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    try {
      await dispatch(createWalletRequest({ amount: addAmount })).unwrap();
      message.success('Wallet request submitted successfully!');
      setShowAddMoney(false);
      setAddAmount('');
    } catch (error) {
      message.error(error || 'Failed to submit wallet request');
    }
  };

  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('en-IN')} Credits`;
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'requestedAt',
      key: 'date',
      width: '20%',
      render: (date) => (
        <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => {
        let color, icon;
        switch (status) {
          case 'pending':
            color = 'orange';
            icon = <ArrowUpOutlined />;
            break;
          case 'approved':
            color = 'green';
            icon = <ArrowUpOutlined />;
            break;
          case 'rejected':
            color = 'red';
            icon = <ArrowDownOutlined />;
            break;
          default:
            color = 'default';
            icon = null;
        }
        return (
          <Tag icon={icon} color={color} style={{ fontWeight: 500 }}>
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '15%',
      render: (amount) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: 'Processed At',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: '15%',
      render: (date) => (
        <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
          {date ? formatDate(date) : '-'}
        </span>
      ),
    },
    {
      title: 'Admin Note',
      dataIndex: 'adminNote',
      key: 'adminNote',
      width: '25%',
      render: (note) => (
        <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text }}>
          {note || '-'}
        </span>
      ),
    },
    {
      title: 'Rejection Reason',
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      width: '25%',
      render: (reason, record) => (
        record.status === 'rejected' ? (
          <span style={{ fontSize: '13px', color: '#ff4d4f' }}>
            {reason || '-'}
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>-</span>
        )
      ),
    },
  ];

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
        <div style={{ 
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
          margin: '0 auto',
          padding: THEME_CONSTANTS.spacing.xl
        }}>
          {/* Header Section */}
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
                <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>User</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight
                }}>
                  Wallet & Transactions
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: THEME_CONSTANTS.colors.primaryLight,
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: THEME_CONSTANTS.shadow.md,
                  flexShrink: 0
                }}>
                  <WalletOutlined style={{
                    color: THEME_CONSTANTS.colors.primary,
                    fontSize: '32px'
                  }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: 'clamp(24px, 4vw, 32px)',
                    fontWeight: THEME_CONSTANTS.typography.h1.weight,
                    color: THEME_CONSTANTS.colors.text,
                    marginBottom: THEME_CONSTANTS.spacing.sm,
                    lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                    fontFamily: THEME_CONSTANTS.typography.fontFamily,
                    letterSpacing: '-0.02em'
                  }}>
                    Wallet & Transactions
                  </h1>
                  <p style={{
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontSize: 'clamp(13px, 2.5vw, 14px)',
                    fontWeight: 500,
                    lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                    margin: 0,
                    fontFamily: THEME_CONSTANTS.typography.fontFamily,
                    letterSpacing: '-0.01em'
                  }}>
                    Manage your wallet balance and view transaction history
                  </p>
                </div>
              </div>
              {/* <div>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddMoney(true)}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    fontWeight: 600,
                    height: '44px',
                    padding: '0 24px',
                    fontSize: '15px'
                  }}
                >
                  Request Wallet Amount
                </Button>
              </div> */}
            </div>
          </div>

          {/* Wallet Balance Card */}
          <Card
            style={{
              marginBottom: THEME_CONSTANTS.spacing.xxxl,
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: 'none',
              boxShadow: THEME_CONSTANTS.shadow.base,
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, #f5f3ff 50%, #eef2ff 100%)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -120,
                right: -80,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)',
                opacity: 0.6,
              }}
            />
            <Row gutter={[32, 24]} align="middle">
              <Col xs={24} sm={24} md={12}>
                <div>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      color: THEME_CONSTANTS.colors.textMuted,
                      fontSize: THEME_CONSTANTS.typography.caption.size,
                      fontWeight: THEME_CONSTANTS.typography.label.weight,
                      textTransform: 'uppercase',
                    }}
                  >
                    Wallet Balance
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      fontSize: '44px',
                      fontWeight: THEME_CONSTANTS.typography.h1.weight,
                      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, #4f46e5 50%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatCurrency(userProfile?.wallet?.balance || 0)}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size
                    }}
                  >
                    Ready to use for your campaigns. No hidden charges.
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Row gutter={[16, 16]} justify={{ xs: 'center', md: 'end' }}>
                  <Col xs={24} sm={12} md={24} lg={12}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddMoney(true)}
                      block
                      style={{
                        height: '48px',
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        background: THEME_CONSTANTS.colors.primary,
                        border: 'none',
                        borderRadius: THEME_CONSTANTS.radius.md,
                      }}
                    >
                      Add Credits
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Transaction History */}
          <Card
            title={
              <div style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 600 }}>
                <HistoryOutlined
                  style={{
                    marginRight: 8,
                    color: THEME_CONSTANTS.colors.primary,
                  }}
                />
                Wallet Requests History
              </div>
            }
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              boxShadow: THEME_CONSTANTS.shadow.sm,
            }}
          >
            <Spin spinning={loading.requests}>
              {walletRequests.length === 0 ? (
                <Empty
                  description="No wallet requests found"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Table
                  columns={transactionColumns}
                  dataSource={walletRequests}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: window.innerWidth > 768,
                    showQuickJumper: window.innerWidth > 768,
                    size: window.innerWidth <= 768 ? 'small' : 'default'
                  }}
                  scroll={{ x: 800 }}
                  size={window.innerWidth <= 768 ? 'small' : 'default'}
                />
              )}
            </Spin>
          </Card>
        </div>
      </div>

      {/* Add Credits Modal */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary }}>
            Add Credits to Wallet
          </div>
        }
        open={showAddMoney}
        onCancel={() => setShowAddMoney(false)}
        footer={null}
        bodyStyle={{ padding: '24px' }}
        width={window.innerWidth <= 768 ? '95vw' : 500}
      >
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, marginBottom: '8px', display: 'block' }}>
            Amount (₹)
          </label>
          <InputNumber
            value={addAmount}
            onChange={setAddAmount}
            placeholder="Enter amount"
            style={{ width: '100%' }}
            min={1}
            prefix="₹"
            size="large"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, marginBottom: '12px' }}>
            Quick Select
          </p>
          <Row gutter={[12, 12]}>
            {[100000, 250000, 500000].map((amount) => (
              <Col xs={8} sm={6} key={amount}>
                <Button
                  block
                  onClick={() => setAddAmount(amount)}
                  style={{
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    color: THEME_CONSTANTS.colors.primary,
                  }}
                >
                  ₹{amount}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setShowAddMoney(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleAddMoney}
            disabled={!addAmount || Number.parseFloat(addAmount) <= 0}
            loading={loading.createRequest}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            Submit Request
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default WalletTransaction;