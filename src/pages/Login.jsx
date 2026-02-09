import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Input, Button, Typography, Checkbox, Alert, Row, Col, Grid } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, MailOutlined, CheckCircleOutlined, MessageOutlined, BarChartOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { THEME_CONSTANTS } from '../theme';
import { loginUser, clearError, resetLoading, loginStart, loginSuccess, verifyLoginTwoFactor } from '../redux/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../helper/apiClient';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function Login() {
  const [form] = Form.useForm();
  const [mfaForm] = Form.useForm();
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);

  const { login } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const hasRedirected = useRef(false);

  const { loading, isAuthenticated, user } = useSelector(state => state.auth);

  // Get redirect reason from URL or location state
  const redirectReason = new URLSearchParams(location.search).get('reason') || location.state?.reason;

  // Show redirect message
  useEffect(() => {
    if (redirectReason) {
      const messages = {
        'session_expired': 'Your session has expired. Please login again.',
        'unauthorized': 'Please login to access this page.',
        'token_invalid': 'Your session is invalid. Please login again.',
        'logged_out': 'You have been logged out successfully.',
        'deactivated': 'Your account has been deactivated by admin. Please contact administrator.'
      };

      const message = messages[redirectReason] || 'Please login to continue.';
      const toastType = 'error';
      toast[toastType](message, { duration: 5000 });

      // Clear URL params
      if (redirectReason) {
        window.history.replaceState({}, document.title, '/login');
      }
    }
  }, [redirectReason]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading && !hasRedirected.current) {
      hasRedirected.current = true;
      const targetPath = user.role?.toLowerCase() === 'admin' ? '/admin' : '/dashboard';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
    dispatch(resetLoading());
  }, [dispatch]);

  const onFinish = async (values) => {
    if (loading) return;

    try {
      setError('');
      dispatch(clearError());

      const credentials = {
        emailorphone: values.email,
        password: values.password
      };

      const result = await dispatch(loginUser(credentials)).unwrap();

      if (result.mfaRequired) {
        setMfaRequired(true);
        setMfaUserId(result.userId);
        toast.success('Login successful, please enter 2FA code');
        return;
      }

      if (result.success && result.user) {
        login(result.user, result.access_token || result.token);
        toast.success('Login successful!');
        const targetPath = result.user.role?.toLowerCase() === 'admin' ? '/admin' : '/dashboard';
        navigate(targetPath, { replace: true });
      }
    } catch (error) {
      const errorMsg = error || 'Login failed. Please try again.';
      const isDeactivated = typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('deactivated');

      if (isDeactivated) {
        toast.error('Your account has been deactivated. Please contact administrator.', { duration: 5000 });
        setError('Your account has been deactivated. Please contact administrator.');
      } else {
        toast.error(errorMsg);
        setError(errorMsg);
      }
    }
  };

  const onMfaFinish = async (values) => {
    try {
      setError('');
      const result = await dispatch(verifyLoginTwoFactor({
        userId: mfaUserId,
        token: values.token
      })).unwrap();

      if (result.success) {
        const { user, token, access_token } = result;
        login(user, token || access_token);
        toast.success('Login successful!');
        const targetPath = user.role?.toLowerCase() === 'admin' ? '/admin' : '/dashboard';
        navigate(targetPath, { replace: true });
      }
    } catch (error) {
      const errorMsg = error || 'Verification failed';
      toast.error(errorMsg);
      setError(errorMsg);
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
              background: THEME_CONSTANTS.colors.primary,
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
              Welcome Back
            </Title>
            <Text style={{
              color: THEME_CONSTANTS.colors.textSecondary,
              fontSize: '14px'
            }}>
              Sign in to RCS Platform
            </Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: THEME_CONSTANTS.spacing.md, borderRadius: THEME_CONSTANTS.radius.md }} />
          )}

          {!mfaRequired ? (
            <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="middle">
              <Form.Item name="email" label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600 }}>Email Address</span>} rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}>
                <Input prefix={<MailOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />} placeholder="you@example.com" style={{ borderRadius: THEME_CONSTANTS.radius.md, border: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '10px 14px' }} />
              </Form.Item>
              <Form.Item name="password" label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600 }}>Password</span>} rules={[{ required: true, message: 'Please input your password!' }, { min: 6, message: 'Password must be at least 6 characters!' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />} placeholder="Enter your password" iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} style={{ borderRadius: THEME_CONSTANTS.radius.md, border: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '10px 14px' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '44px', borderRadius: THEME_CONSTANTS.radius.md, background: THEME_CONSTANTS.colors.primary, border: 'none', fontSize: '16px', fontWeight: 600 }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form form={mfaForm} name="mfa" onFinish={onMfaFinish} layout="vertical" size="middle">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Title level={4} style={{ marginBottom: '4px' }}>2FA Required</Title>
                <Text type="secondary">Enter the 6-digit code</Text>
              </div>
              <Form.Item name="token" rules={[{ required: true, message: 'Code is required' }, { len: 6, message: 'Must be 6 digits' }]}>
                <Input prefix={<LockOutlined />} placeholder="000000" style={{ borderRadius: THEME_CONSTANTS.radius.md, padding: '10px', textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '44px', borderRadius: THEME_CONSTANTS.radius.md, fontWeight: 600 }}>
                  Verify
                </Button>
              </Form.Item>
              <div style={{ textAlign: 'center' }}>
                <Button type="link" onClick={() => setMfaRequired(false)}>Back to Login</Button>
              </div>
            </Form>
          )}

          <div style={{ textAlign: 'center', marginTop: THEME_CONSTANTS.spacing.md }}>
            <Text style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '14px' }}>
              Don't have an account?{' '}
              <a href="/register" style={{ color: THEME_CONSTANTS.colors.primary, textDecoration: 'none', fontWeight: 600 }}>Sign Up</a>
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
            Access your dashboard and manage customer communications with enterprise-grade security.
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
                    <Text style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'block' }}>Secure Dashboard</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Enterprise-grade security and encryption</Text>
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
                    <Text style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'block' }}>Campaign Management</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Create and manage RCS campaigns effortlessly</Text>
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
                    <Text style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'block' }}>Performance Analytics</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Monitor delivery and engagement metrics</Text>
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
                Welcome Back
              </Title>
              <Text style={{
                color: THEME_CONSTANTS.colors.textSecondary,
                fontSize: '16px'
              }}>
                Sign in to access your RCS dashboard
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

            {!mfaRequired ? (
              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
              >
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
                  name="password"
                  label={<span style={{ color: THEME_CONSTANTS.colors.text, fontWeight: 600, fontSize: '14px' }}>Password</span>}
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                    placeholder="Enter your password"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    style={{
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      padding: '12px 16px',
                      fontSize: '16px'
                    }}
                  />
                </Form.Item>

                <Form.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Remember me</Checkbox>
                    </Form.Item>
                  </div>
                </Form.Item>

                <Form.Item>
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
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Form
                form={mfaForm}
                name="mfa"
                onFinish={onMfaFinish}
                layout="vertical"
                size="large"
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Title level={3}>Two-Factor Authentication</Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>Enter the 6-digit verification code from your authenticator app.</Text>
                </div>
                <Form.Item
                  name="token"
                  rules={[
                    { required: true, message: 'Verification code is required' },
                    { len: 6, message: 'Code must be 6 digits' }
                  ]}
                >
                  <Input
                    prefix={<LockOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                    placeholder="000 000"
                    autoFocus
                    style={{
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      padding: '12px 16px',
                      fontSize: '28px',
                      textAlign: 'center',
                      letterSpacing: '12px',
                      fontWeight: '700'
                    }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{
                      height: '52px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.primary,
                      fontSize: '18px',
                      fontWeight: 700
                    }}
                  >
                    Verify & Sign In
                  </Button>
                </Form.Item>
                <div style={{ textAlign: 'center' }}>
                  <Button type="link" onClick={() => setMfaRequired(false)} style={{ fontSize: '15px' }}>
                    Back to password login
                  </Button>
                </div>
              </Form>
            )}

            <div style={{ textAlign: 'center', marginTop: THEME_CONSTANTS.spacing.xl }}>
              <Text style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '15px' }}>
                Don't have an account?{' '}
                <a href="/register" style={{ color: THEME_CONSTANTS.colors.primary, textDecoration: 'none', fontWeight: 600 }}>
                  Sign Up
                </a>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}