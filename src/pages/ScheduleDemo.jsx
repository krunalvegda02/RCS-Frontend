import React, { useState } from 'react';
import {
  Layout,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Typography,
  Grid,
  Row,
  Col,
  message
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import { THEME_CONSTANTS } from '../theme';
import RCSLogo from '../assets/RCS.png';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

const colors = {
  primary: THEME_CONSTANTS.colors.primary,
  primaryDark: THEME_CONSTANTS.colors.primaryDark,
  surface: THEME_CONSTANTS.colors.surface,
  background: THEME_CONSTANTS.colors.background,
  textSecondary: THEME_CONSTANTS.colors.textSecondary,
  border: THEME_CONSTANTS.colors.border
};

const ScheduleDemo = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const disabledDate = (current) =>
    current && current < dayjs().startOf('day');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm')
      };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit');

      message.success('Demo scheduled successfully! We will contact you soon.');
      form.resetFields();
      setTimeout(() => navigate('/'), 1800);
    } catch {
      message.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: colors.background }}>
      {/* ===== Header ===== */}
      <Header
        style={{
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          padding: screens.xs ? '0 16px' : '0 24px'
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <img
            src={RCSLogo}
            alt="RCSsender"
            style={{ height: 206, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size="middle"
          >
            Back
          </Button>
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Content style={{ padding: screens.xs ? '32px 16px' : '72px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {/* ===== Page Header ===== */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                background: `${colors.primary}12`,
                borderRadius: 999,
                border: `1px solid ${colors.primary}30`,
                marginBottom: 24
              }}
            >
              <CalendarOutlined style={{ color: colors.primary }} />
              <span style={{ fontWeight: 700, color: colors.primary }}>
                Schedule a Demo
              </span>
            </div>

            <Title level={1} style={{ fontWeight: 900 }}>
              See RCSsender in Action
            </Title>

            <Paragraph
              style={{
                maxWidth: 600,
                margin: '0 auto',
                fontSize: 16,
                color: colors.textSecondary
              }}
            >
              Book a personalized walkthrough with our team and see how
              RCSsender scales enterprise messaging.
            </Paragraph>
          </div>

          {/* ===== Form Card ===== */}
          <div
            style={{
              background: colors.surface,
              borderRadius: 24,
              padding: screens.xs ? '24px 16px' : '48px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
            >
              {/* Name */}
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="John Doe"
                />
              </Form.Item>

              {/* Email */}
              <Form.Item
                label="Work Email"
                name="email"
                rules={[{ required: true, type: 'email' }]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="john@company.com"
                />
              </Form.Item>

              {/* Phone */}
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  prefix={<PhoneOutlined />}
                  placeholder="+91 98765 43210"
                />
              </Form.Item>

              {/* Company */}
              <Form.Item
                label="Company Name"
                name="company"
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  prefix={<TeamOutlined />}
                  placeholder="Your Company"
                />
              </Form.Item>

              {/* Company Size */}
              <Form.Item
                label="Company Size"
                name="companySize"
                rules={[{ required: true }]}
              >
                <Select size="large" placeholder="Select size">
                  <Select.Option value="1-10">1–10</Select.Option>
                  <Select.Option value="11-50">11–50</Select.Option>
                  <Select.Option value="51-200">51–200</Select.Option>
                  <Select.Option value="201-500">201–500</Select.Option>
                  <Select.Option value="500+">500+</Select.Option>
                </Select>
              </Form.Item>

              {/* ===== Date & Time (PRO LAYOUT) ===== */}
              <div
                style={{
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  marginBottom: 24
                }}
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Preferred Date"
                      name="date"
                      rules={[{ required: true }]}
                    >
                      <DatePicker
                        size="large"
                        style={{ width: '100%' }}
                        disabledDate={disabledDate}
                        format="DD MMM YYYY"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Preferred Time"
                      name="time"
                      rules={[{ required: true }]}
                    >
                      <TimePicker
                        size="large"
                        style={{ width: '100%' }}
                        format="hh:mm A"
                        minuteStep={15}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Message */}
              <Form.Item
                label="What would you like to discuss?"
                name="message"
              >
                <TextArea
                  rows={4}
                  placeholder="Tell us about your messaging goals…"
                />
              </Form.Item>

              {/* Submit */}
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                icon={<CheckCircleOutlined />}
                style={{
                  height: 56,
                  fontWeight: 700,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                }}
              >
                Schedule Demo
              </Button>
            </Form>

            {/* Footer Info */}
            <div
              style={{
                marginTop: 32,
                padding: 20,
                background: `${colors.primary}08`,
                borderRadius: 14,
                border: `1px solid ${colors.primary}20`
              }}
            >
              <ClockCircleOutlined
                style={{ color: colors.primary, marginRight: 8 }}
              />
              <strong>What to expect:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>30-minute personalized demo</li>
                <li>Live RCS platform walkthrough</li>
                <li>Q&A with product experts</li>
              </ul>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ScheduleDemo;
