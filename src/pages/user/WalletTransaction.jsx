import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiService from '../../helper/apiClient';
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
  Input,
} from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  HistoryOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import {
  getUserProfile,
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
} from '../../redux/slices/walletSlice';

const WalletTransaction = () => {
  const dispatch = useDispatch();

  // Redux state
  const { paymentHistory, userProfile, perMessageCharge, loading } = useSelector(state => state.wallet);
  console.log(perMessageCharge)
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [calculatedCredits, setCalculatedCredits] = useState(0);

  useEffect(() => {
    dispatch(getUserProfile());
    dispatch(getPaymentHistory());
  }, [dispatch]);




  const baseAmount = Number(addAmount || 0);
  const gstAmount = baseAmount * 0.18;
  const totalPayable = baseAmount + gstAmount;

  // Calculate credits based on perMessageCharge
  const creditsToReceive = perMessageCharge && perMessageCharge > 0
    ? Math.floor(baseAmount / perMessageCharge)
    : baseAmount === 3000 ? 10000
      : baseAmount === 14000 ? 50000
        : baseAmount === 25000 ? 100000
          : baseAmount;



  // Load Razorpay script
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    if (!addAmount) {
      message.error('Please select a package');
      return;
    }

    setProcessingPayment(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        message.error('Failed to load payment gateway. Please try again.');
        setProcessingPayment(false);
        return;
      }

      // Determine package type or custom amount
      let payload;
      if (!perMessageCharge) {
        // Standard pricing - send package type only
        const packageType = addAmount === 3000 ? 'starter'
          : addAmount === 14000 ? 'growth'
            : addAmount === 25000 ? 'enterprise'
              : null;

        if (!packageType) {
          message.error('Invalid package selected');
          setProcessingPayment(false);
          return;
        }

        payload = { packageType };
      } else {
        // Custom pricing - send custom amount
        if (addAmount < 100000) {
          message.error('Minimum amount is ₹1,00,000');
          setProcessingPayment(false);
          return;
        }
        payload = { customAmount: Number(addAmount) };
      }

      // Create order
      const orderResponse = await dispatch(createPaymentOrder(payload)).unwrap();

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId, prefill, creditsToAdd } = orderResponse.data;

      // Store calculated credits from backend
      setCalculatedCredits(creditsToAdd || creditsToReceive);

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'RCS Sender',
        description: 'Wallet Recharge',
        order_id: orderId,
        prefill: prefill,
        theme: {
          color: THEME_CONSTANTS.colors.primary,
        },
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await dispatch(verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();

            console.log("===========Verify response:", verifyResponse);

            if (verifyResponse.success) {
              message.success(`Payment successful! ₹${verifyResponse.data.credits} credits added to your wallet.`);
              setShowAddMoney(false);
              setAddAmount('');
              // Refresh data
              dispatch(getUserProfile());
              dispatch(getPaymentHistory());
            } else {
              message.error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            message.error(error?.message || 'Payment verification failed. Please contact support.');
          }
          setProcessingPayment(false);
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
            message.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        message.error(`Payment failed: ${response.error.description}`);
        setProcessingPayment(false);
      });
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      message.error(error?.message || 'Failed to initiate payment');
      setProcessingPayment(false);
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

  const handleDownloadInvoice = async (orderId) => {
    try {
      const hideMsg = message.loading('Downloading Invoice...', 0);
      const response = await apiService.downloadInvoice(orderId);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
      hideMsg();
      message.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      message.error('Failed to download invoice');
    }
  };



  const CreditCard = ({ title, price, credits, rate, popular, selected, onClick }) => (
    <div
      onClick={onClick}
      style={{
        width: 300,
        borderRadius: 22,
        padding: '36px 28px',
        background: '#fff',
        border: selected
          ? `2px solid ${THEME_CONSTANTS.colors.primary}`
          : '1px solid #eef1f6',
        boxShadow: popular
          ? '0 28px 70px rgba(24,144,255,0.25)'
          : '0 12px 40px rgba(0,0,0,0.06)',
        transform: popular ? 'scale(1.05)' : 'scale(1)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
    >
      {popular && (
        <div
          style={{
            position: 'absolute',
            top: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: THEME_CONSTANTS.colors.primary,
            color: '#fff',
            padding: '6px 18px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          MOST POPULAR
        </div>
      )}

      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#8c95a6',
        marginBottom: 18,
        letterSpacing: 0.6,
      }}>
        {title.toUpperCase()}
      </div>

      {/* PRICE – LOCKED */}
      <div
        style={{
          fontSize: 44,
          fontWeight: 900,
          color: '#111827',
          whiteSpace: 'nowrap',
          lineHeight: 1,
          marginBottom: 10,
        }}
      >
        ₹{price.toLocaleString('en-IN')}
      </div>

      <div style={{
        fontSize: 16,
        fontWeight: 600,
        color: '#4b5563',
        marginBottom: 22,
      }}>
        {credits.toLocaleString('en-IN')} Credits
      </div>

      <div style={{
        height: 1,
        background: '#edf0f5',
        marginBottom: 18,
      }} />

      <div style={{
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 10,
      }}>
        Effective rate: ₹{rate}/message
      </div>

      {/* <div style={{
      fontSize: 12,
      lineHeight: 1.7,
      color: '#6b7280',
    }}>
      ✓ GST invoice (18%)<br />
      ✓ Credits never expire<br />
      ✓ No hidden fees
    </div> */}
    </div>
  );



  // Payment history columns
  const paymentColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
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
      dataIndex: 'displayStatus',
      key: 'status',
      width: '15%',
      render: (displayStatus, record) => {
        let color, icon;
        const status = record.status;
        switch (status) {
          case 'captured':
            color = 'green';
            icon = <CheckCircleOutlined />;
            break;
          case 'created':
            color = 'orange';
            icon = <ClockCircleOutlined />;
            break;
          case 'failed':
            color = 'red';
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = 'default';
            icon = null;
        }
        return (
          <Tag icon={icon} color={color} style={{ fontWeight: 500 }}>
            {displayStatus || status?.toUpperCase()}
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
          ₹{Number(amount || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'creditsToAdd',
      key: 'credits',
      width: '15%',
      render: (credits) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          +{formatCurrency(credits)}
        </span>
      ),
    },
    {
      title: 'Payment Method',
      dataIndex: 'method',
      key: 'method',
      width: '15%',
      render: (method) => (
        <Tag color="blue">{method?.toUpperCase() || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'razorpayOrderId',
      key: 'orderId',
      width: '20%',
      render: (orderId) => (
        <span style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textMuted, fontFamily: 'monospace' }}>
          {orderId ? `...${orderId.slice(-12)}` : '-'}
        </span>
      ),
    },
    {
      title: 'Invoice',
      key: 'invoice',
      width: '10%',
      render: (_, record) => (
        record.status === 'captured' && (
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInvoice(record.razorpayOrderId)}
            title="Download Invoice"
          />
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
                Payment History
              </div>
            }
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              boxShadow: THEME_CONSTANTS.shadow.sm,
            }}
          >
            <Spin spinning={loading.paymentHistory}>
              {paymentHistory.length === 0 ? (
                <Empty
                  description="No payment history found"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Table
                  columns={paymentColumns}
                  dataSource={paymentHistory}
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

      {/* Add Credits Modal with Razorpay */}
      <Modal
        open={showAddMoney}
        onCancel={() => !processingPayment && setShowAddMoney(false)}
        footer={null}
        closable={!processingPayment}
        maskClosable={!processingPayment}
        // width={window.innerWidth <= 768 ? '96vw' : 720}
        width={1100}
        bodyStyle={{
          padding: '32px 40px',
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* ================= HEADER ================= */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight}, #f5f7ff)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCardOutlined
              style={{ fontSize: 22, color: THEME_CONSTANTS.colors.primary }}
            />
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              Add Credits to Wallet
            </div>
            <div
              style={{
                fontSize: 13,
                color: THEME_CONSTANTS.colors.textMuted,
                marginTop: 4,
              }}
            >
              Prepaid wallet · GST compliant · Secure Razorpay checkout
            </div>
          </div>
        </div>

        {/* ================= PRICING MODE ================= */}
        {perMessageCharge === null ? (
          <>
            <div style={{ padding: '8px 4px 24px' }}>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 24,
                color: THEME_CONSTANTS.colors.textPrimary,
              }}>
                Choose a credit package
              </div>

              <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
                <CreditCard
                  title="Starter"
                  price={3000}
                  credits={10000}
                  rate={0.30}
                  selected={addAmount === 3000}
                  onClick={() => setAddAmount(3000)}
                />

                <CreditCard
                  title="Growth"
                  price={14000}
                  credits={50000}
                  rate={0.28}
                  popular
                  selected={addAmount === 14000}
                  onClick={() => setAddAmount(14000)}
                />

                <CreditCard
                  title="Enterprise"
                  price={25000}
                  credits={100000}
                  rate={0.25}
                  selected={addAmount === 25000}
                  onClick={() => setAddAmount(25000)}
                />
              </div>

            </div>

          </>
        ) : (
          <>
            {/* ===== CUSTOM ENTERPRISE PRICING ===== */}
            <div
              style={{
                marginBottom: 28,
                padding: '24px 28px',
                borderRadius: 16,
                background: 'linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)',
                border: '1px solid #e6efff',
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: THEME_CONSTANTS.colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  Enter Recharge Amount
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: THEME_CONSTANTS.colors.textMuted,
                  }}
                >
                  Enterprise pricing · Custom rate applied · Minimum top-up ₹1,00,000
                </div>
              </div>

              {/* Amount Input */}
              <Input
                value={addAmount}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '');
                  setAddAmount(onlyDigits);
                }}
                onKeyDown={(e) => {
                  const allowed = [
                    'Backspace',
                    'Delete',
                    'ArrowLeft',
                    'ArrowRight',
                    'Tab',
                  ];

                  if (!/[0-9]/.test(e.key) && !allowed.includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                prefix="₹"
                placeholder="1,00,000"
                size="large"
                disabled={processingPayment}
                style={{
                  height: 56,
                  fontSize: 18,
                  fontWeight: 800,
                  borderRadius: 14,
                  padding: '8px 16px',
                }}
              />


              {/* Presets */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: THEME_CONSTANTS.colors.textSecondary,
                    marginBottom: 12,
                  }}
                >
                  Quick Select
                </div>

                <Row gutter={[16, 16]}>
                  {[100000, 250000, 500000, 1000000].map((amt) => {
                    const selected = addAmount === amt;

                    return (
                      <Col xs={12} sm={6} key={amt}>
                        <div
                          onClick={() => setAddAmount(amt)}
                          style={{
                            cursor: 'pointer',
                            padding: '16px 12px',
                            borderRadius: 14,
                            textAlign: 'center',
                            background: selected
                              ? 'linear-gradient(135deg, #eef4ff, #ffffff)'
                              : '#ffffff',
                            border: selected
                              ? `2px solid ${THEME_CONSTANTS.colors.primary}`
                              : '1px solid #e5e7eb',
                            boxShadow: selected
                              ? '0 10px 30px rgba(24,144,255,0.18)'
                              : '0 4px 14px rgba(0,0,0,0.05)',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: selected
                                ? THEME_CONSTANTS.colors.primary
                                : '#111827',
                            }}
                          >
                            ₹{amt.toLocaleString('en-IN')}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              marginTop: 4,
                              color: '#6b7280',
                            }}
                          >
                            + GST
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>

          </>
        )}

        {/* ================= PAYMENT SUMMARY ================= */}
        {addAmount > 0 && (
          <div
            style={{
              marginTop: 28,
              padding: '22px 28px',
              borderRadius: 16,
              background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
              border: '1px solid #e6efff',
              boxShadow: '0 8px 24px rgba(24,144,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* LEFT */}
            <div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
                Base Amount
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                ₹{baseAmount.toLocaleString('en-IN')}
              </div>

              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 10 }}>
                GST (18%)
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                ₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
                Total Payable
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: THEME_CONSTANTS.colors.primary,
                  whiteSpace: 'nowrap',
                }}
              >
                ₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#52c41a',
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                +{creditsToReceive.toLocaleString('en-IN')} Credits
              </div>
            </div>
          </div>
        )}


        {/* ================= ACTIONS ================= */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid #eef1f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* TRUST LEFT */}
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            <strong>GST invoice provided</strong> · No hidden fees ·
            <span style={{ marginLeft: 4 }}>Secured by Razorpay</span>
          </div>

          {/* ACTION RIGHT */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              size="large"
              style={{
                height: 48,
                padding: '0 28px',
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<CreditCardOutlined />}
              onClick={handleRazorpayPayment}
              disabled={processingPayment}
              style={{
                height: 52,
                padding: '0 28px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary}, ${THEME_CONSTANTS.colors.primaryDark})`,
                boxShadow: '0 12px 30px rgba(24,144,255,0.35)',
              }}
            >
              Pay ₹{totalPayable.toLocaleString('en-IN')}
            </Button>


          </div>
        </div>



      </Modal>




    </>
  );
};

export default WalletTransaction;