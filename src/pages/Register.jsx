import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Row, Col, Grid } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, MailOutlined, PhoneOutlined, CheckCircleOutlined, MessageOutlined, BarChartOutlined, SendOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { registerUser } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import { THEME_CONSTANTS } from '../theme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function Register() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError('');

      // Normalize phone number: remove +, spaces, and take last 10 digits
      const normalizedPhone = values.phone.replace(/[^0-9]/g, '').slice(-10);

      const userData = {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: normalizedPhone
      };

      const result = await dispatch(registerUser(userData)).unwrap();

      toast.success('Account created successfully! Proceeding to onboarding...');
      form.resetFields();

      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 1500);
    } catch (error) {
      const errorMsg = error?.message || 'Registration failed';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Mobile Layout
  if (!screens.md) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.background} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: THEME_CONSTANTS.spacing.lg
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: THEME_CONSTANTS.radius.xl,
            boxShadow: THEME_CONSTANTS.shadow.lg,
            border: `1px solid ${THEME_CONSTANTS.colors.border}`,
            background: THEME_CONSTANTS.colors.surface
          }}
          bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
        >
          <div style={{ textAlign: 'center', marginBottom: THEME_CONSTANTS.spacing.lg }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: THEME_CONSTANTS.colors.success,
              borderRadius: THEME_CONSTANTS.radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: `0 auto ${THEME_CONSTANTS.spacing.md}`,
              boxShadow: THEME_CONSTANTS.shadow.md
            }}>
              <UserOutlined style={{ fontSize: '28px', color: 'white' }} />
            </div>
            <Title level={3} style={{
              color: THEME_CONSTANTS.colors.text,
              marginBottom: THEME_CONSTANTS.spacing.xs,
              fontSize: '24px'
            }}>
              Create Account
            </Title>
            <Text style={{
              color: THEME_CONSTANTS.colors.textSecondary,
              fontSize: '14px'
            }}>
              Join RCS Platform
            </Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: THEME_CONSTANTS.spacing.md, borderRadius: THEME_CONSTANTS.radius.md }} />
          )}

          <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="middle">
            <Form.Item name="name" label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600 }}>Full Name</span>} rules={[{ required: true, message: 'Please input your name!' }, { min: 3, message: 'Name must be at least 3 characters!' }]}>
              <Input prefix={<UserOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />} placeholder="Enter your full name" style={{ borderRadius: THEME_CONSTANTS.radius.md, border: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '10px 14px' }} />
            </Form.Item>
            <Form.Item name="email" label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600 }}>Email Address</span>} rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}>
              <Input prefix={<MailOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />} placeholder="you@example.com" style={{ borderRadius: THEME_CONSTANTS.radius.md, border: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '10px 14px' }} />
            </Form.Item>
            <Form.Item name="phone" label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600 }}>Phone Number</span>} rules={[{ required: true, message: 'Please input your phone number!' }, { pattern: /^[+]?[0-9]{10,15}$/, message: 'Please enter a valid phone number!' }]}>
              <Input prefix={<PhoneOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />} placeholder="+91 1234567890" style={{ borderRadius: THEME_CONSTANTS.radius.md, border: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '10px 14px' }} />
            </Form.Item>
            <Form.Item name="password" label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600 }}>Password</span>} rules={[{ required: true, message: 'Please input your password!' }, { min: 6, message: 'Password must be at least 6 characters!' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />} placeholder="Create a strong password" iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} style={{ borderRadius: THEME_CONSTANTS.radius.md, border: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '10px 14px' }} />
            </Form.Item>
            <Form.Item style={{ marginTop: THEME_CONSTANTS.spacing.lg }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '44px', borderRadius: THEME_CONSTANTS.radius.md, background: THEME_CONSTANTS.colors.success, border: 'none', fontSize: '16px', fontWeight: 600 }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: THEME_CONSTANTS.spacing.md }}>
            <Text style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '14px' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: THEME_CONSTANTS.colors.primary, textDecoration: 'none', fontWeight: 600 }}>Sign In</a>
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div style={{
      minHeight: '100vh',
      background: THEME_CONSTANTS.colors.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: THEME_CONSTANTS.spacing.lg
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        display: 'flex',
        background: THEME_CONSTANTS.colors.surface,
        borderRadius: THEME_CONSTANTS.radius.lg,
        boxShadow: THEME_CONSTANTS.shadow.xl,
        overflow: 'hidden',
        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
        minHeight: '700px'
      }}>
        {/* Left Side - Branding */}
        <div style={{
          flex: 1,
          background: THEME_CONSTANTS.colors.primary,
          padding: THEME_CONSTANTS.spacing.xxxl,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: THEME_CONSTANTS.radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: THEME_CONSTANTS.spacing.xl
          }}>
            <MessageOutlined style={{ fontSize: '32px', color: 'white' }} />
          </div>

          <Title level={1} style={{
            color: 'white',
            marginBottom: THEME_CONSTANTS.spacing.lg,
            fontSize: '42px',
            fontWeight: 700,
            lineHeight: 1.2
          }}>
            RCS Business Platform
          </Title>

          <Text style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '18px',
            lineHeight: 1.6,
            marginBottom: THEME_CONSTANTS.spacing.xxl,
            display: 'block'
          }}>
            Join thousands of businesses transforming customer communication with rich, interactive messaging.
          </Text>

          <div style={{ marginTop: THEME_CONSTANTS.spacing.xl }}>
            <Row gutter={[0, THEME_CONSTANTS.spacing.lg]}>
              <Col span={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.md }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleOutlined style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div>
                    <Text style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'block' }}>Rich Media Messaging</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Send images, videos, and interactive content</Text>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.md }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SendOutlined style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div>
                    <Text style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'block' }}>Interactive Buttons</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Engage customers with actionable responses</Text>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.md }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BarChartOutlined style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div>
                    <Text style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'block' }}>Advanced Analytics</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Track delivery and engagement metrics</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Right Side - Form */}
        <div style={{
          flex: 1,
          padding: THEME_CONSTANTS.spacing.xxxl,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: THEME_CONSTANTS.colors.surface
        }}>
          <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: THEME_CONSTANTS.spacing.xxl }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: THEME_CONSTANTS.colors.primaryLight,
                borderRadius: THEME_CONSTANTS.radius.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: `0 auto ${THEME_CONSTANTS.spacing.lg}`,
                border: `2px solid ${THEME_CONSTANTS.colors.primary}`
              }}>
                <UserOutlined style={{ fontSize: '28px', color: THEME_CONSTANTS.colors.primary }} />
              </div>
              <Title level={2} style={{
                color: THEME_CONSTANTS.colors.text,
                marginBottom: THEME_CONSTANTS.spacing.sm,
                fontSize: '28px',
                fontWeight: 700
              }}>
                Create Your Account
              </Title>
              <Text style={{
                color: THEME_CONSTANTS.colors.textSecondary,
                fontSize: '16px'
              }}>
                Start your RCS messaging journey today
              </Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{
                  marginBottom: THEME_CONSTANTS.spacing.lg,
                  borderRadius: THEME_CONSTANTS.radius.md
                }}
              />
            )}

            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="name"
                label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600, fontSize: '14px' }}>Full Name</span>}
                rules={[
                  { required: true, message: 'Please input your name!' },
                  { min: 3, message: 'Name must be at least 3 characters!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                  placeholder="Enter your full name"
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    padding: '12px 16px',
                    fontSize: '16px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600, fontSize: '14px' }}>Email Address</span>}
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                  placeholder="you@company.com"
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    padding: '12px 16px',
                    fontSize: '16px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600, fontSize: '14px' }}>Phone Number</span>}
                rules={[
                  { required: true, message: 'Please input your phone number!' },
                  { pattern: /^[+]?[0-9]{10,15}$/, message: 'Please enter a valid phone number!' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                  placeholder="+91 1234567890"
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    padding: '12px 16px',
                    fontSize: '16px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600, fontSize: '14px' }}>Password</span>}
                rules={[
                  { required: true, message: 'Please input your password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                  placeholder="Create a secure password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    padding: '12px 16px',
                    fontSize: '16px'
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: THEME_CONSTANTS.spacing.xl }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: '48px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    background: THEME_CONSTANTS.colors.primary,
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    boxShadow: THEME_CONSTANTS.shadow.sm
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: THEME_CONSTANTS.spacing.xl }}>
              <Text style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '15px' }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: THEME_CONSTANTS.colors.primary, textDecoration: 'none', fontWeight: 600 }}>
                  Sign In
                </a>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}