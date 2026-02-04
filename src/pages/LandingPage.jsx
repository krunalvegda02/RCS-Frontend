import React, { useEffect, useState } from 'react';
import { Layout, Button, Row, Col, Card, Typography, Grid, Statistic, Select, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../theme';
import { useAuth } from '../context/AuthContext';
import RCSLogo from '../assets/RCS.png';
import { sendLandingMessage } from '../services/landingMessage.service';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FileExcelOutlined,
  RocketOutlined,
  AimOutlined,
  BarChartOutlined,
  SearchOutlined,
  DownloadOutlined,
  LockOutlined,
  CreditCardOutlined,
  SyncOutlined,
  LineChartOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ArrowRightOutlined,
  MessageOutlined,
  SafetyOutlined,
  TeamOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  PictureOutlined,
  LayoutOutlined,
  CheckCircleFilled,
  FileImageFilled,
  PlayCircleOutlined,
  ArrowUpOutlined,
  MailOutlined,
  SettingOutlined,
  ApiOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;
const { CountUp } = Statistic;

// Professional color palette using theme constants
const professionalColors = {
  primary: THEME_CONSTANTS.colors.primary,
  primaryLight: THEME_CONSTANTS.colors.primaryLight,
  primaryDark: THEME_CONSTANTS.colors.primaryDark,
  surface: THEME_CONSTANTS.colors.surface,
  background: THEME_CONSTANTS.colors.background,
  text: THEME_CONSTANTS.colors.text,
  textSecondary: THEME_CONSTANTS.colors.textSecondary,
  border: THEME_CONSTANTS.colors.border,
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
};

// Counter Animation Component with trigger
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '', decimals = 0, start = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let current = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(decimals > 0 ? current : Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, decimals, start]);

  return (
    <span style={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
      {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const screens = useBreakpoint();
  const [activeIndex, setActiveIndex] = useState(1);

  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = React.useRef(null);

  const [messageType, setMessageType] = useState('richCard');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);


  const plans = [
    {
      credits: '1,00,000',
      price: '₹0.50',
      total: '₹50,000',
      color: professionalColors.info,
    },
    {
      credits: '2,50,000',
      price: '₹0.40',
      total: '₹1,00,000',
      color: professionalColors.primary,
      tag: 'MOST POPULAR',
    },
    {
      credits: '5,00,000',
      price: '₹0.30',
      total: '₹1,50,000',
      color: professionalColors.success,
    },
  ];


  const next = () =>
    setActiveIndex((prev) => (prev + 1) % plans.length);

  const prev = () =>
    setActiveIndex((prev) =>
      prev === 0 ? plans.length - 1 : prev - 1
    );


  useEffect(() => {
    document.title = 'RCSsender - Enterprise RCS Messaging Platform | Verified Business Messaging';
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsVisible]);

  // Responsive styles
  const containerStyle = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: screens.xs ? '0 16px' : screens.sm ? '0 20px' : '0 24px'
  };

  const sectionStyle = {
    padding: screens.xs ? '60px 16px' : screens.sm ? '80px 20px' : '100px 24px'
  };

  const headingStyle = (level) => ({
    fontSize: screens.xs
      ? level === 1 ? '32px' : level === 2 ? '28px' : '24px'
      : screens.sm
        ? level === 1 ? '40px' : level === 2 ? '32px' : '26px'
        : level === 1 ? '56px' : level === 2 ? '42px' : '30px',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: screens.xs ? '16px' : '24px'
  });

  // Common section header style
  const sectionHeaderStyle = {
    textAlign: 'center',
    marginBottom: screens.xs ? '48px' : '64px'
  };

  // Common card style for all sections
  const cardStyle = {
    height: '100%',
    border: `1px solid ${professionalColors.border}`,
    borderRadius: '20px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    overflow: 'hidden',
    background: professionalColors.surface,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer'
  };

  // Common hover effect for cards
  const handleCardHover = (e, color = professionalColors.primary) => {
    e.currentTarget.style.transform = 'translateY(-8px)';
    e.currentTarget.style.boxShadow = `0 20px 40px ${color}25`;
    e.currentTarget.style.borderColor = color;
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.08)';
    e.currentTarget.style.borderColor = professionalColors.border;
  };

  return (
    <Layout style={{
      background: professionalColors.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      minHeight: '100vh'
    }}>
      {/* Header - Responsive & Professional */}
      <Header style={{
        background: professionalColors.surface,
        borderBottom: `1px solid ${professionalColors.border}`,
        padding: screens.xs ? '0 16px' : '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        height: screens.xs ? '64px' : '72px'
      }}>
        <div style={{
          ...containerStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: screens.xs ? '8px' : '12px' }}>
            <img
              src={RCSLogo}
              alt="RCSsender Logo"
              style={{
                height: screens.xs ? '130px' : screens.sm ? '200px' : '100px',
                // width: 'auto'
              }}
            />

          </div>

          <div style={{ display: 'flex', gap: screens.xs ? '12px' : '24px', alignItems: 'center' }}>
            {screens.sm && (
              <>
              </>
            )}
            <Button
              size={screens.xs ? 'middle' : 'large'}
              style={{
                padding: screens.xs ? '8px 16px' : '12px 24px',
                fontWeight: 600,
                border: `2px solid ${professionalColors.primary}`,
                color: professionalColors.primary,
                background: 'transparent',
                fontSize: screens.xs ? '14px' : '16px'
              }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              type="primary"
              size={screens.xs ? 'middle' : 'large'}
              style={{
                padding: screens.xs ? '8px 16px' : '12px 24px',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${professionalColors.primary} 0%, ${professionalColors.primaryDark} 100%)`,
                border: 'none',
                fontSize: screens.xs ? '14px' : '16px'
              }}
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </Header>

      <Content>
        {/* Hero Section */}
        <section style={{
          ...sectionStyle,
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${professionalColors.primaryLight}08 0%, ${professionalColors.background} 100%)`
        }}>
          {/* Background Elements */}
          <div style={{
            position: 'absolute',
            top: screens.xs ? '-100px' : '-200px',
            left: screens.xs ? '-100px' : '-200px',
            width: screens.xs ? '300px' : '500px',
            height: screens.xs ? '300px' : '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${professionalColors.primaryLight}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
            zIndex: 0
          }} />

          <div style={{ ...containerStyle, position: 'relative', zIndex: 1 }}>
            <Row
              gutter={screens.xs ? [32, 32] : screens.sm ? [40, 40] : [60, 40]}
              align="middle"
              justify="center"
              style={{ flexDirection: screens.lg ? 'row' : 'column' }}
            >
              <Col xs={24} lg={12}>
                {/* Hero Content */}
                <div style={{ marginBottom: screens.xs ? '20px' : '32px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: screens.xs ? '6px 12px' : '8px 16px',
                    background: `${professionalColors.primary}12`,
                    backdropFilter: 'blur(10px)',
                    borderRadius: '50px',
                    border: `1px solid ${professionalColors.primary}30`,
                    marginBottom: screens.xs ? '16px' : '24px'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: professionalColors.primary,
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{
                      fontSize: screens.xs ? '12px' : '14px',
                      fontWeight: 700,
                      color: professionalColors.primary,
                      textTransform: 'uppercase'
                    }}>
                      <RocketOutlined style={{ marginRight: '6px' }} />
                      Enterprise RCS Platform
                    </span>
                  </div>
                </div>

                <Title style={headingStyle(1)}>
                  <span style={{ display: 'block' }}>
                    Send Verified
                  </span>
                  <span style={{
                    background: `linear-gradient(135deg, ${professionalColors.primary} 0%, ${professionalColors.primaryDark} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}>
                    Business Messages
                  </span>
                </Title>

                <Paragraph style={{
                  fontSize: screens.xs ? '16px' : '18px',
                  color: professionalColors.textSecondary,
                  lineHeight: 1.6,
                  marginBottom: screens.xs ? '24px' : '32px',
                  maxWidth: '600px'
                }}>
                  Deliver <strong style={{ color: professionalColors.primary }}>4 types of rich RCS messages</strong>
                  {' '}with verified identity. Send 100,000+ messages in under 20 minutes with{' '}
                  <strong style={{ color: professionalColors.success }}>99.2% delivery success</strong>.
                </Paragraph>

                {/* Feature Badges */}
                <div style={{

                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: screens.xs ? '24px' : '32px'
                }}>
                  {[
                    { text: 'Blue Tick Verified', icon: <SafetyOutlined />, color: professionalColors.primary },
                    { text: 'Carousel Cards', icon: <PictureOutlined />, color: professionalColors.success },
                    { text: 'Action Buttons', icon: <ThunderboltOutlined />, color: professionalColors.warning },
                    { text: 'Rich Media', icon: <FileImageFilled />, color: professionalColors.info }
                  ].map((feature, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: screens.xs ? '6px 12px' : '8px 16px',
                      background: `${feature.color}10`,
                      borderRadius: '30px',
                      border: `1px solid ${feature.color}30`,
                      flex: screens.xs ? '1 1 calc(50% - 8px)' : 'none'
                    }}>
                      <div style={{ color: feature.color, fontSize: screens.xs ? '14px' : '16px' }}>
                        {feature.icon}
                      </div>
                      <span style={{
                        fontSize: screens.xs ? '12px' : '14px',
                        fontWeight: 600,
                        color: professionalColors.text
                      }}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div style={{
                  display: 'flex',
                  gap: screens.xs ? '8px' : '10px',
                  flexWrap: 'wrap',
                  marginBottom: screens.xs ? '32px' : '48px',
                  maxWidth: screens.lg ? '650px' : '100%'
                }}>
                  <Button
                    type="primary"
                    size={screens.xs ? 'middle' : 'large'}
                    style={{
                      height: screens.xs ? '44px' : '56px',
                      fontSize: screens.xs ? '13px' : screens.md ? '14px' : '16px',
                      fontWeight: 700,
                      padding: screens.xs ? '0 16px' : screens.md ? '0 20px' : '0 28px',
                      background: `linear-gradient(135deg, ${professionalColors.primary} 0%, ${professionalColors.primaryDark} 100%)`,
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: `0 8px 32px ${professionalColors.primary}40`,
                      flex: screens.xs ? '1 1 100%' : '1 1 auto',
                      minWidth: screens.xs ? 'auto' : '180px'
                    }}
                    onClick={() => navigate('/register')}
                  >
                    Start Messaging
                    <ArrowRightOutlined style={{ marginLeft: '6px' }} />
                  </Button>

                  <Button
                    size={screens.xs ? 'middle' : 'large'}
                    style={{
                      height: screens.xs ? '44px' : '56px',
                      fontSize: screens.xs ? '13px' : screens.md ? '14px' : '16px',
                      fontWeight: 600,
                      padding: screens.xs ? '0 14px' : screens.md ? '0 18px' : '0 24px',
                      borderRadius: '12px',
                      border: `2px solid ${professionalColors.border}`,
                      background: 'transparent',
                      color: professionalColors.text,
                      flex: screens.xs ? '1 1 calc(50% - 4px)' : '1 1 auto',
                      minWidth: screens.xs ? 'auto' : '160px'
                    }}
                    onClick={() => navigate('/schedule-demo')}
                  >
                    <CalendarOutlined style={{ marginRight: '6px' }} />
                    {screens.md ? 'Schedule' : 'Schedule Demo'}
                  </Button>

                  <Button
                    size={screens.xs ? 'middle' : 'large'}
                    style={{
                      height: screens.xs ? '44px' : '56px',
                      fontSize: screens.xs ? '13px' : screens.md ? '14px' : '16px',
                      fontWeight: 600,
                      padding: screens.xs ? '0 14px' : screens.md ? '0 18px' : '0 24px',
                      borderRadius: '12px',
                      border: `2px solid ${professionalColors.border}`,
                      background: 'transparent',
                      color: professionalColors.text,
                      flex: screens.xs ? '1 1 calc(50% - 4px)' : '1 1 auto',
                      minWidth: screens.xs ? 'auto' : '160px'
                    }}
                    onClick={() => window.open('https://www.youtube.com/watch?v=demo', '_blank')}
                  >
                    <PlayCircleOutlined style={{ marginRight: '6px' }} />
                    {screens.md ? 'Watch' : 'Watch Demo'}
                  </Button>
                </div>

                {/* Trust Indicators with Counters */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: screens.xs ? '16px' : '24px',
                  paddingTop: screens.xs ? '16px' : '24px',
                  borderTop: `1px solid ${professionalColors.border}`
                }}>
                  {[
                    { icon: <CheckCircleOutlined />, value: '99.2%', label: 'Delivery Rate' },
                    { icon: <ClockCircleOutlined />, value: '5-min', label: 'Setup Time' },
                    { icon: <ThunderboltOutlined />, value: '3.5L+/hr', label: 'Capacity' }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: screens.xs ? '1 1 100%' : 'none'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: screens.xs ? '32px' : '36px',
                        height: screens.xs ? '32px' : '36px',
                        borderRadius: '50%',
                        background: `${professionalColors.primary}15`,
                        color: professionalColors.primary
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{
                          fontSize: screens.xs ? '16px' : '18px',
                          fontWeight: 700,
                          color: professionalColors.text
                        }}>
                          {item.value}
                        </div>
                        <div style={{
                          fontSize: screens.xs ? '12px' : '14px',
                          color: professionalColors.textSecondary
                        }}>
                          {item.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>

              {/* Dashboard Preview */}
              <Col xs={24} lg={12}>
                <div style={{
                  position: 'relative',
                  padding: '0',
                  margin: screens.xs ? '0' : '0'
                }}>
                  <div style={{
                    width: '100%',
                    minHeight: screens.xs ? '260px' : '400px',
                    background: professionalColors.surface,
                    borderRadius: screens.xs ? '0' : '24px',
                    border: screens.xs ? 'none' : `1px solid ${professionalColors.border}`,
                    boxShadow: screens.xs ? 'none' : '0 32px 80px rgba(0, 0, 0, 0.12)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>


                    {/* Dashboard Header */}
                    <div style={{
                      padding: screens.xs ? '12px' : '24px',
                      gap: screens.xs ? '6px' : '12px',
                      borderBottom: `1px solid ${professionalColors.border}`,
                      display: 'flex',
                      flexDirection: screens.xs ? 'column' : 'row',
                      justifyContent: 'space-between',
                      alignItems: screens.xs ? 'flex-start' : 'center',
                      gap: screens.xs ? '8px' : '0',
                      background: 'rgba(255, 255, 255, 0.8)'
                    }}>
                      <div>
                        <div style={{
                          fontSize: screens.xs ? '10px' : '12px',
                          color: professionalColors.textSecondary,
                          marginBottom: '2px'
                        }}>
                          Active RCS Campaign
                        </div>
                        <div style={{
                          fontSize: screens.xs ? '20px' : '28px',
                          fontWeight: 800,
                          color: professionalColors.text
                        }}>
                          98,432
                        </div>
                        <div style={{
                          fontSize: screens.xs ? '10px' : '12px',
                          color: professionalColors.success
                        }}>
                          <ArrowUpOutlined /> 2.4% increase
                        </div>
                      </div>

                      <div style={{
                        padding: screens.xs ? '4px 8px' : '6px 12px',
                        background: `${professionalColors.primary}15`,
                        borderRadius: '20px',
                        fontSize: screens.xs ? '11px' : '12px',
                        fontWeight: 600,
                        color: professionalColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <SafetyOutlined />
                        Verified
                      </div>
                    </div>

                    {/* Message Types Grid */}
                    <div style={{ padding: screens.xs ? '12px 16px' : '24px' }}>
                      <div style={{
                        fontSize: screens.xs ? '12px' : '14px',
                        fontWeight: 600,
                        color: professionalColors.text,
                        marginBottom: screens.xs ? '10px' : '16px'
                      }}>
                        Message Types Performance
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: screens.xs ? '1fr' : 'repeat(2, 1fr)',
                        gap: screens.xs ? '10px' : '16px'
                      }}>
                        {[
                          { type: 'Rich Card', delivered: 24832, rate: 98.7, color: professionalColors.primary },
                          { type: 'Carousel', delivered: 18941, rate: 99.1, color: professionalColors.success },
                          { type: 'Action', delivered: 32761, rate: 97.9, color: professionalColors.warning },
                          { type: 'Text', delivered: 21898, rate: 99.5, color: professionalColors.info }
                        ].map((item, index) => (
                          <div key={index} style={{
                            padding: screens.xs ? '10px 12px' : '16px',
                            background: professionalColors.background,
                            borderRadius: '12px',
                            border: `1px solid ${professionalColors.border}`,
                            transition: 'all 0.3s ease'
                          }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                              e.currentTarget.style.borderColor = item.color;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = professionalColors.border;
                            }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <span style={{
                                fontSize: screens.xs ? '13px' : '14px',
                                fontWeight: 600,
                                color: professionalColors.text
                              }}>
                                {item.type}
                              </span>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: item.color
                              }} />
                            </div>
                            <div style={{
                              fontSize: screens.xs ? '16px' : '20px',

                              fontWeight: 800,
                              color: professionalColors.text
                            }}>
                              {item.delivered.toLocaleString()}
                            </div>
                            <div style={{
                              fontSize: screens.xs ? '11px' : '12px',
                              color: professionalColors.textSecondary
                            }}>
                              Delivered • {item.rate}% success
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Try RCS Message Section */}
                  <div style={{
                    marginTop: screens.xs ? '24px' : '32px',
                    padding: screens.xs ? '24px' : '32px',
                    background: professionalColors.surface,
                    borderRadius: '20px',
                    border: `1px solid ${professionalColors.border}`,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      marginBottom: screens.xs ? '20px' : '24px'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: `${professionalColors.primary}12`,
                        borderRadius: '30px',
                        border: `1px solid ${professionalColors.primary}30`,
                        marginBottom: '12px'
                      }}>
                        <SendOutlined style={{ color: professionalColors.primary, fontSize: '14px' }} />
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: professionalColors.primary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Try RCS Now
                        </span>
                      </div>
                      <div style={{
                        fontSize: screens.xs ? '18px' : '20px',
                        fontWeight: 700,
                        color: professionalColors.text,
                        marginBottom: '8px'
                      }}>
                        Send a Test Message
                      </div>
                      <div style={{
                        fontSize: screens.xs ? '13px' : '14px',
                        color: professionalColors.textSecondary
                      }}>
                        Experience RCS messaging in action
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      alignItems: 'stretch'
                    }}>
                      <Select
                        value={messageType}
                        onChange={setMessageType}
                        style={{ flex: '1 1 200px' }}
                        size="large"
                        placeholder="Select Type"
                        options={[
                          {
                            value: 'plainText',
                            label: (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileTextOutlined style={{ color: professionalColors.info }} />
                                Plain Text
                              </span>
                            )
                          },
                          {
                            value: 'richCard',
                            label: (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LayoutOutlined style={{ color: professionalColors.primary }} />
                                Rich Card
                              </span>
                            )
                          },
                          {
                            value: 'carousel',
                            label: (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PictureOutlined style={{ color: professionalColors.success }} />
                                Carousel
                              </span>
                            )
                          },
                          {
                            value: 'textWithAction',
                            label: (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ThunderboltOutlined style={{ color: professionalColors.warning }} />
                                Action Button
                              </span>
                            )
                          }
                        ]}
                      />

                      <Input
                        size="large"
                        placeholder="Enter 10-digit number"
                        prefix={<PhoneOutlined style={{ color: professionalColors.textSecondary }} />}
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setPhoneNumber(val);
                        }}
                        style={{ flex: '1 1 200px' }}
                        maxLength={10}
                      />

                      <Button
                        type="primary"
                        size="large"
                        loading={sending}
                        icon={<SendOutlined />}
                        onClick={async () => {
                          if (!phoneNumber || phoneNumber.length !== 10) {
                            message.error('Please enter a valid 10-digit phone number');
                            return;
                          }
                          setSending(true);
                          try {
                            await sendLandingMessage(phoneNumber, messageType);
                            message.success(`Message sent to ${phoneNumber}!`);
                            setPhoneNumber('');
                          } catch (error) {
                            message.error(error.message || 'Failed to send message. Please try again.');
                          } finally {
                            setSending(false);
                          }
                        }}
                        style={{
                          background: `linear-gradient(135deg, ${professionalColors.primary} 0%, ${professionalColors.primaryDark} 100%)`,
                          border: 'none',
                          flex: screens.xs ? '1 1 100%' : '0 0 auto',
                          minWidth: screens.xs ? '100%' : '100%',
                          fontWeight: 600,
                          boxShadow: `0 4px 12px ${professionalColors.primary}40`
                        }}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </section>

        {/* ================= PRICING SECTION ================= */}
        <section
          style={{
            ...sectionStyle,
            background: professionalColors.surface,
            borderTop: `1px solid ${professionalColors.border}`,
            borderBottom: `1px solid ${professionalColors.border}`,
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* ===== Pricing Header ===== */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: screens.xs ? '48px' : '64px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 26px',
                  background: `${professionalColors.warning}15`,
                  borderRadius: 999,
                  border: `1px solid ${professionalColors.warning}30`,
                  marginBottom: 28,
                }}
              >
                <CreditCardOutlined style={{ color: professionalColors.warning }} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: professionalColors.warning,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                  }}
                >
                  Credits Pricing
                </span>
              </div>

              <Title
                level={2}
                style={{
                  fontSize: screens.xs ? 34 : 46,
                  fontWeight: 900,
                  marginBottom: 16,
                }}
              >
                Simple, predictable pricing
              </Title>

              <Paragraph
                style={{
                  fontSize: screens.xs ? 16 : 19,
                  color: professionalColors.textSecondary,
                  maxWidth: 720,
                  margin: '0 auto',
                  lineHeight: 1.7,
                }}
              >
                Buy RCS credits in bulk and pay <strong>only for delivered messages</strong>.
                No setup fees. No lock-in. Built for scale.
              </Paragraph>
            </div>

            {/* ===== Pricing Cards with Arrow Navigation ===== */}
            <div
              style={{
                position: 'relative',
                height: screens.xs ? 'auto' : 580,
                minHeight: screens.xs ? 600 : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: screens.xs ? '60px 20px' : '0'
              }}
            >
              {/* Left Arrow */}
              <Button
                type="text"
                size="large"
                onClick={prev}
                style={{
                  position: 'absolute',
                  left: screens.xs ? 10 : 20,
                  zIndex: 10,
                  width: screens.xs ? 40 : 48,
                  height: screens.xs ? 40 : 48,
                  borderRadius: '50%',
                  background: professionalColors.surface,
                  border: `2px solid ${professionalColors.border}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowLeftOutlined style={{ fontSize: screens.xs ? 16 : 20, color: professionalColors.primary }} />
              </Button>

              {/* Right Arrow */}
              <Button
                type="text"
                size="large"
                onClick={next}
                style={{
                  position: 'absolute',
                  right: screens.xs ? 10 : 20,
                  zIndex: 10,
                  width: screens.xs ? 40 : 48,
                  height: screens.xs ? 40 : 48,
                  borderRadius: '50%',
                  background: professionalColors.surface,
                  border: `2px solid ${professionalColors.border}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowRightOutlined style={{ fontSize: screens.xs ? 16 : 20, color: professionalColors.primary }} />
              </Button>
              {plans.map((plan, i) => {
                const diff = i - activeIndex;
                const position =
                  diff > plans.length / 2
                    ? diff - plans.length
                    : diff < -plans.length / 2
                      ? diff + plans.length
                      : diff;

                const isCenter = position === 0;

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: screens.xs ? 'calc(100% - 40px)' : 440,
                      maxWidth: screens.xs ? '340px' : '440px',
                      padding: screens.xs ? '36px 28px' : '48px 44px',
                      background: professionalColors.surface,
                      borderRadius: screens.xs ? 24 : 32,
                      border: `1px solid ${plan.color}`,
                      transform: `
                translateX(${position * (screens.xs ? 0 : 460)}px)
                scale(${isCenter ? 1 : screens.xs ? 0.85 : 0.9})
              `,
                      filter: isCenter ? 'none' : 'blur(1px)',
                      opacity: isCenter ? 1 : screens.xs ? 0.3 : 0.75,
                      zIndex: isCenter ? 5 : 2,
                      pointerEvents: isCenter ? 'auto' : 'none',
                      transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {plan.tag && isCenter && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -18,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '6px 22px',
                          background: plan.color,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 800,
                          borderRadius: 999,
                        }}
                      >
                        {plan.tag}
                      </div>
                    )}

                    <div
                      style={{
                        textAlign: 'center',
                        padding: 14,
                        borderRadius: 20,
                        background: `${plan.color}15`,
                        border: `1px solid ${plan.color}30`,
                        fontWeight: 800,
                        color: plan.color,
                        marginBottom: 32,
                      }}
                    >
                      {plan.credits} MESSAGE CREDITS
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 56, fontWeight: 900 }}>
                        {plan.price}
                      </div>
                      <div style={{ color: professionalColors.textSecondary }}>
                        per delivered message
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        padding: 16,
                        borderRadius: 16,
                        background: professionalColors.background,
                        marginBottom: 36,
                        border: `1px solid ${professionalColors.border}`,
                        fontWeight: 800,
                        fontSize: 18,
                        color: professionalColors.primary,
                      }}
                    >
                      Total: {plan.total}
                    </div>

                    {[
                      'Pay only for delivered messages',
                      'Verified RCS branding',
                      'Advanced analytics',
                      'Enterprise-grade security',
                    ].map((f, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 14,
                          fontSize: 14,
                        }}
                      >
                        <CheckCircleFilled style={{ color: plan.color }} />
                        {f}
                      </div>
                    ))}

                    <Button
                      type={isCenter ? 'primary' : 'default'}
                      size="large"
                      style={{
                        width: '100%',
                        marginTop: 40,
                        borderRadius: 14,
                        fontWeight: 700,
                        height: 54,
                        background: isCenter ? plan.color : 'transparent',
                        borderColor: plan.color,
                      }}
                      onClick={() => navigate('/register')}
                    >
                      Get Start with us
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {/* ================= END PRICING SECTION ================= */}
        {/* Message Types Section */}
        <section style={{
          ...sectionStyle,
          background: professionalColors.background
        }}>
          <div style={containerStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: `${professionalColors.success}15`,
                borderRadius: '30px',
                border: `1px solid ${professionalColors.success}30`,
                marginBottom: '24px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: professionalColors.success,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <MessageOutlined style={{ marginRight: '8px' }} />
                  Message Formats
                </span>
              </div>

              <Title level={2} style={headingStyle(2)}>
                4 Types of Interactive Messages
              </Title>
              <Paragraph style={{
                fontSize: screens.xs ? '16px' : '18px',
                color: professionalColors.textSecondary,
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                Engage customers with rich formats beyond plain SMS
              </Paragraph>
            </div>

            <Row gutter={screens.xs ? [16, 16] : screens.sm ? [24, 24] : [32, 32]}>
              {[
                {
                  title: 'Plain Text',
                  desc: 'Simple, reliable delivery for critical alerts and notifications.',
                  icon: <FileTextOutlined />,
                  color: professionalColors.info,
                  stats: '99.5% Success',
                  counter: 99.5
                },
                {
                  title: 'Carousel Cards',
                  desc: 'Showcase multiple products or offers in a swipeable gallery.',
                  icon: <PictureOutlined />,
                  color: professionalColors.success,
                  stats: '↑ 42% CTR',
                  counter: 42
                },
                {
                  title: 'Action Buttons',
                  desc: 'Drive conversions with clickable call-to-action buttons.',
                  icon: <ThunderboltOutlined />,
                  color: professionalColors.warning,
                  stats: '3.2x Engagement',
                  counter: 3.2
                },
                {
                  title: 'Rich Image Cards',
                  desc: 'Deliver visually stunning messages with high-res images & branding.',
                  icon: <LayoutOutlined />,
                  color: professionalColors.error,
                  stats: '89% Open Rate',
                  counter: 89
                }
              ].map((type, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                  <Card
                    hoverable
                    style={cardStyle}
                    onMouseEnter={(e) => handleCardHover(e, type.color)}
                    onMouseLeave={handleCardLeave}
                    bodyStyle={{
                      padding: screens.xs ? '24px 20px' : '32px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{
                      width: screens.xs ? '60px' : '72px',
                      height: screens.xs ? '60px' : '72px',
                      borderRadius: '18px',
                      background: `${type.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      border: `2px solid ${type.color}30`
                    }}>
                      <div style={{
                        fontSize: screens.xs ? '30px' : '34px',
                        color: type.color
                      }}>
                        {type.icon}
                      </div>
                    </div>

                    <Title level={4} style={{
                      fontSize: screens.xs ? '20px' : '22px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      color: professionalColors.text
                    }}>
                      {type.title}
                    </Title>

                    <Paragraph style={{
                      color: professionalColors.textSecondary,
                      lineHeight: 1.7,
                      marginBottom: 'auto',
                      fontSize: screens.xs ? '15px' : '16px',
                      fontWeight: 400
                    }}>
                      {type.desc}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* Features Section */}
        <section style={{
          ...sectionStyle,
          background: professionalColors.surface,
          borderTop: `1px solid ${professionalColors.border}`,
          borderBottom: `1px solid ${professionalColors.border}`
        }}>
          <div style={containerStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: `${professionalColors.primary}15`,
                borderRadius: '30px',
                border: `1px solid ${professionalColors.primary}30`,
                marginBottom: '24px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: professionalColors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <ThunderboltOutlined style={{ marginRight: '8px' }} />
                  Enterprise Platform
                </span>
              </div>

              <Title level={2} style={headingStyle(2)}>
                Professional RCS Platform
              </Title>
              <Paragraph style={{
                fontSize: screens.xs ? '16px' : '18px',
                color: professionalColors.textSecondary,
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                Every feature is engineered for <strong style={{ color: professionalColors.primary, fontWeight: 600 }}>maximum reliability</strong> and enterprise performance.
              </Paragraph>
            </div>

            <Row gutter={screens.xs ? [16, 16] : screens.sm ? [24, 24] : [32, 32]}>
              {[
                {
                  icon: <SafetyOutlined />,
                  title: 'Verified Blue Tick',
                  desc: 'Official verification badge that builds instant trust and credibility with customers.',
                  stats: '↑ 100% Trust',
                  color: professionalColors.primary,
                  counter: 100
                },
                {
                  icon: <CloudServerOutlined />,
                  title: 'High-Throughput Engine',
                  desc: 'Kafka-based architecture delivering messages per hour with 99.9% uptime guarantee.',
                  stats: '3.5L+/hr',
                  color: professionalColors.success,
                  counter: 350000
                },
                {
                  icon: <DashboardOutlined />,
                  title: 'Real-Time Analytics',
                  desc: 'Live tracking of delivery rates, engagement metrics, and campaign performance.',
                  stats: '<100ms Updates',
                  color: professionalColors.info,
                  counter: 100
                },
                {
                  icon: <AimOutlined />,
                  title: 'Smart Rate Control',
                  desc: 'Dynamic TPS adjustment with automatic retry queues ensuring message delivery success.',
                  stats: '99.2% Success',
                  color: professionalColors.warning,
                  counter: 99.2
                },
                {
                  icon: <LockOutlined />,
                  title: 'Enterprise Security',
                  desc: 'End-to-end encryption, authenticated APIs, GDPR compliance, and SOC2 certified.',
                  stats: 'Military Grade',
                  color: professionalColors.error,
                  counter: 100
                },
                {
                  icon: <TeamOutlined />,
                  title: 'Multi-Agent Support',
                  desc: 'Collaborate with unlimited team members from a single, unified dashboard.',
                  stats: 'Unlimited Agents',
                  color: professionalColors.primaryDark,
                  counter: 999
                }
              ].map((feature, index) => (
                <Col xs={24} sm={12} lg={8} key={index}>
                  <Card
                    hoverable
                    style={cardStyle}
                    onMouseEnter={(e) => handleCardHover(e, feature.color)}
                    onMouseLeave={handleCardLeave}
                    bodyStyle={{
                      padding: screens.xs ? '24px 20px' : '32px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{
                      width: screens.xs ? '60px' : '72px',
                      height: screens.xs ? '60px' : '72px',
                      borderRadius: '18px',
                      background: `${feature.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      border: `2px solid ${feature.color}30`
                    }}>
                      <div style={{
                        fontSize: screens.xs ? '30px' : '34px',
                        color: feature.color
                      }}>
                        {feature.icon}
                      </div>
                    </div>

                    <Title level={4} style={{
                      fontSize: screens.xs ? '20px' : '22px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      color: professionalColors.text
                    }}>
                      {feature.title}
                    </Title>

                    <Paragraph style={{
                      color: professionalColors.textSecondary,
                      lineHeight: 1.7,
                      marginBottom: 'auto',
                      fontSize: screens.xs ? '15px' : '16px',
                      fontWeight: 400
                    }}>
                      {feature.desc}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* Analytics Section with Counters */}
        <section ref={statsRef} style={{
          ...sectionStyle,
          background: professionalColors.surface,
          borderTop: `1px solid ${professionalColors.border}`,
          borderBottom: `1px solid ${professionalColors.border}`
        }}>
          <div style={containerStyle}>
            <div style={sectionHeaderStyle}>
              <div style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: `${professionalColors.info}15`,
                borderRadius: '30px',
                border: `1px solid ${professionalColors.info}30`,
                marginBottom: '24px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: professionalColors.info,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <DashboardOutlined style={{ marginRight: '8px' }} />
                  Advanced Analytics
                </span>
              </div>

              <Title level={2} style={headingStyle(2)}>
                Real-Time Analytics Dashboard
              </Title>
              <Paragraph style={{
                fontSize: screens.xs ? '16px' : '18px',
                color: professionalColors.textSecondary,
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                Track every message lifecycle with enterprise-grade insights and real-time counters
              </Paragraph>
            </div>

            {/* Top Stats Row with Counters */}
            <div style={{
              marginBottom: screens.xs ? '48px' : '64px',
              background: professionalColors.background,
              padding: screens.xs ? '12px' : '16px',
              borderRadius: screens.xs ? '10px' : '12px',
              border: `1px solid ${professionalColors.border}`,
              boxShadow: screens.xs ? 'none' : '0 6px 16px rgba(0,0,0,0.06)',

              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.05)'
            }}>
              <Row gutter={screens.xs ? [24, 24] : [32, 32]}>
                {[
                  { label: 'Messages Analyzed Daily', value: 1000000, suffix: '+', color: professionalColors.primary, icon: <BarChartOutlined /> },
                  { label: 'Data Accuracy', value: 99.9, suffix: '%', color: professionalColors.success, icon: <CheckCircleOutlined /> },
                  { label: 'Real-time Updates', value: 100, suffix: 'ms', prefix: '<', color: professionalColors.info, icon: <ThunderboltOutlined /> },
                  { label: 'Active Monitoring', value: 24, suffix: '/7', color: professionalColors.warning, icon: <DashboardOutlined /> }
                ].map((stat, idx) => (
                  <Col xs={12} md={6} key={idx}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 16px',
                        background: `${stat.color}15`,
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ fontSize: '28px', color: stat.color }}>
                          {stat.icon}
                        </div>
                      </div>
                      <div style={{
                        fontSize: screens.xs ? '32px' : '40px',
                        fontWeight: 800,
                        color: stat.color,
                        marginBottom: '8px',
                        lineHeight: 1
                      }}>
                        <AnimatedCounter
                          end={stat.value}
                          prefix={stat.prefix || ''}
                          suffix={stat.suffix}
                          decimals={stat.value % 1 === 0 ? 0 : 1}
                          duration={2000 + idx * 500}
                          start={statsVisible}
                        />
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: professionalColors.textSecondary,
                        fontWeight: 500
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Analytics Cards */}
            <Row gutter={screens.xs ? [24, 24] : [32, 32]}>
              {[
                {
                  icon: <LineChartOutlined />,
                  title: 'Performance Metrics',
                  description: 'Real-time monitoring with customizable widgets and live metrics',
                  metrics: [
                    { label: 'Delivery Rate', value: 99.2, suffix: '%', counter: 99.2 },
                    { label: 'Response Time', value: 180, suffix: 'ms', counter: 180 },
                    { label: 'Cost Per Message', value: 1, prefix: '₹', counter: 1 }
                  ]
                },
                {
                  icon: <BarChartOutlined />,
                  title: 'Engagement Insights',
                  description: 'Track clicks, replies, and interaction patterns with detailed insights',
                  metrics: [
                    { label: 'Click-through Rate', value: 42, suffix: '%', counter: 42 },
                    { label: 'Average Replies', value: 3.2, suffix: '', counter: 3.2 },
                    { label: 'User Segments', value: 25, suffix: '+', counter: 25 }
                  ]
                },
                {
                  icon: <SearchOutlined />,
                  title: 'Failure Analysis',
                  description: 'Detailed breakdown with actionable insights and automated alerts',
                  metrics: [
                    { label: 'Error Resolution', value: 98.5, suffix: '%', counter: 98.5 },
                    { label: 'Retry Success', value: 89.7, suffix: '%', counter: 89.7 },
                    { label: 'Auto Fix Rate', value: 95.2, suffix: '%', counter: 95.2 }
                  ]
                }
              ].map((item, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card
                    hoverable
                    style={cardStyle}
                    onMouseEnter={(e) => handleCardHover(e, professionalColors.primary)}
                    onMouseLeave={handleCardLeave}
                    bodyStyle={{
                      padding: screens.xs ? '24px' : '32px',
                      height: '100%'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: `${professionalColors.primary}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      border: `2px solid ${professionalColors.primary}30`
                    }}>
                      <div style={{ fontSize: '32px', color: professionalColors.primary }}>
                        {item.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <Title level={3} style={{
                      fontSize: screens.xs ? '20px' : '22px',
                      fontWeight: 700,
                      marginBottom: '12px',
                      color: professionalColors.text
                    }}>
                      {item.title}
                    </Title>

                    {/* Description */}
                    <Paragraph style={{
                      color: professionalColors.textSecondary,
                      lineHeight: 1.6,
                      marginBottom: '32px',
                      fontSize: screens.xs ? '15px' : '16px'
                    }}>
                      {item.description}
                    </Paragraph>

                    {/* Metrics with Counters */}
                    <div>
                      {item.metrics.map((metric, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 0',
                          borderTop: idx === 0 ? 'none' : `1px solid ${professionalColors.border}`
                        }}>
                          <span style={{
                            color: professionalColors.textSecondary,
                            fontSize: '14px',
                            fontWeight: 500
                          }}>
                            {metric.label}
                          </span>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: professionalColors.primary
                          }}>
                            <AnimatedCounter
                              end={metric.counter}
                              prefix={metric.prefix || ''}
                              suffix={metric.suffix}
                              decimals={metric.counter % 1 === 0 ? 0 : 1}
                              duration={2000 + idx * 500 + index * 300}
                              start={statsVisible}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>





        {/* CTA Section */}
        <section style={{
          padding: screens.xs ? '60px 16px 60px' : screens.sm ? '80px 20px 80px' : '100px 24px 100px',
          background: `linear-gradient(135deg, ${professionalColors.primaryLight} 0%, ${professionalColors.background} 100%)`,
          textAlign: 'center',
          borderTop: `1px solid ${professionalColors.border}`
        }}>
          <div style={{ ...containerStyle, position: 'relative' }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 24px',
                background: `${professionalColors.primary}15`,
                borderRadius: '30px',
                border: `1px solid ${professionalColors.primary}30`,
                marginBottom: screens.xs ? '24px' : '32px',
                backdropFilter: 'blur(10px)'
              }}>
                <RocketOutlined style={{ marginRight: '8px', color: professionalColors.primary }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: professionalColors.primary,
                  textTransform: 'uppercase'
                }}>
                  READY TO LAUNCH
                </span>
              </div>

              <Title level={2} style={headingStyle(2)}>
                Start Sending Verified RCS Messages Today
              </Title>

              <Paragraph style={{
                fontSize: screens.xs ? '16px' : '18px',
                lineHeight: 1.6,
                color: professionalColors.textSecondary,
                marginBottom: screens.xs ? '32px' : '48px',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Join enterprise teams sending millions of verified messages with 99%+ delivery success.
              </Paragraph>

              <div style={{
                display: 'flex',
                gap: screens.xs ? '12px' : '16px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: screens.xs ? '32px' : '48px',
                marginTop: screens.xs ? '0' : '18px'
              }}>
                <Button
                  type="primary"
                  size={screens.xs ? 'middle' : 'large'}
                  style={{
                    height: screens.xs ? '48px' : '56px',
                    fontSize: screens.xs ? '16px' : '16px',
                    fontWeight: 600,
                    padding: screens.xs ? '0 32px' : '0 48px',
                    background: `linear-gradient(135deg, ${professionalColors.primary} 0%, ${professionalColors.primaryDark} 100%)`,
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(24, 144, 255, 0.4)',
                    borderRadius: '12px',
                    width: screens.xs ? '100%' : 'auto'
                  }}
                  onClick={() => navigate('/register')}
                >
                  Get Started  <ArrowRightOutlined style={{ marginLeft: '8px' }} />
                </Button>

                <Button
                  size={screens.xs ? 'middle' : 'large'}
                  style={{
                    height: screens.xs ? '48px' : '56px',
                    fontSize: screens.xs ? '16px' : '16px',
                    fontWeight: 600,
                    padding: screens.xs ? '0 32px' : '0 48px',
                    border: `2px solid ${professionalColors.primary}`,
                    color: professionalColors.primary,
                    background: 'transparent',
                    borderRadius: '12px',
                    width: screens.xs ? '100%' : 'auto'
                  }}
                  onClick={() => navigate('/schedule-demo')}
                >
                  Schedule Demo
                </Button>
              </div>

              <div style={{
                display: 'flex',
                gap: screens.xs ? '16px' : '32px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {[
                  { icon: <ClockCircleOutlined />, text: '5-minute setup' },
                  { icon: <CreditCardOutlined />, text: 'No credit card' },
                  { icon: <TeamOutlined />, text: '24/7 support' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: screens.xs ? '1 1 100%' : 'none'
                  }}>
                    <div style={{ color: professionalColors.primary }}>
                      {item.icon}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: professionalColors.textSecondary
                    }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Content>

      {/* ===== Footer ===== */}
      <footer
        style={{
          background: professionalColors.surface,
          borderTop: `1px solid ${professionalColors.border}`,
          padding: screens.xs ? '0px 0px 32px' : '0px 0px 40px',
          marginTop: 0
        }}
      >
        <div
          style={{

            paddingTop: 24,
            borderTop: `1px solid ${professionalColors.border}`,
            textAlign: 'center',
            fontSize: 12,
            color: professionalColors.textSecondary,
          }}
        >
          © {new Date().getFullYear()} RCSsender. All rights reserved.
        </div>

      </footer>

    </Layout>
  );
};

export default LandingPage;