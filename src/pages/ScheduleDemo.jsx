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
  message,
  Space
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
  CheckCircleOutlined,
  GoogleOutlined
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
  const [scheduledData, setScheduledData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate next 5 business days with time slots
  const getAvailableSlots = () => {
    const slots = [];
    let date = dayjs();
    const times = ['10:00 AM', '2:00 PM', '4:00 PM'];
    
    for (let i = 0; i < 5; i++) {
      date = date.add(1, 'day');
      if (date.day() !== 0 && date.day() !== 6) { // Skip weekends
        times.forEach(time => {
          slots.push({
            date: date.format('YYYY-MM-DD'),
            time: time,
            display: `${date.format('ddd, MMM D')} at ${time}`
          });
        });
      }
    }
    return slots.slice(0, 9); // Show 9 slots
  };

  const disabledDate = (current) =>
    current && current < dayjs().startOf('day');

  const onFinish = async (values) => {
    if (!selectedSlot) {
      message.error('Please select a time slot');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...values,
        date: selectedSlot.date,
        time: selectedSlot.time,
        company: values.company || 'Not provided',
        companySize: 'Not specified',
        message: 'Quick demo request'
      };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit');

      message.success('Demo scheduled! Check your email for confirmation and calendar invite.');
      setScheduledData(payload);
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
          padding: screens.xs ? '0 12px' : screens.sm ? '0 16px' : '0 24px',
          height: screens.xs ? '56px' : '64px'
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
            style={{ height: screens.xs ? 150 : screens.sm ? 200 : 230, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size={screens.xs ? 'small' : 'middle'}
            style={{ fontSize: screens.xs ? '12px' : '14px' }}
          >
            {screens.xs ? '' : 'Back'}
          </Button>
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Content style={{ padding: screens.xs ? '24px 12px' : screens.sm ? '40px 16px' : screens.md ? '56px 20px' : '72px 24px' }}>
        <div style={{ maxWidth: screens.xs ? '100%' : screens.sm ? 600 : 820, margin: '0 auto' }}>
          {/* ===== Page Header ===== */}
          <div style={{ textAlign: 'center', marginBottom: screens.xs ? 32 : screens.sm ? 40 : 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: screens.xs ? 6 : 8,
                padding: screens.xs ? '6px 14px' : '8px 20px',
                background: `${colors.primary}12`,
                borderRadius: 999,
                border: `1px solid ${colors.primary}30`,
                marginBottom: screens.xs ? 16 : screens.sm ? 20 : 24,
                fontSize: screens.xs ? '12px' : '14px'
              }}
            >
              <CalendarOutlined style={{ color: colors.primary, fontSize: screens.xs ? '14px' : '16px' }} />
              <span style={{ fontWeight: 700, color: colors.primary }}>
                Schedule a Demo
              </span>
            </div>

            <Title level={1} style={{ fontWeight: 900, fontSize: screens.xs ? '24px' : screens.sm ? '32px' : screens.md ? '40px' : '48px', marginBottom: screens.xs ? '12px' : '16px' }}>
              See RCSsender in Action
            </Title>

            <Paragraph
              style={{
                maxWidth: 600,
                margin: '0 auto',
                fontSize: screens.xs ? 14 : screens.sm ? 15 : 16,
                color: colors.textSecondary,
                padding: screens.xs ? '0 8px' : '0'
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
              borderRadius: screens.xs ? 16 : screens.sm ? 20 : 24,
              padding: screens.xs ? '20px 16px' : screens.sm ? '32px 24px' : '48px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size={screens.xs ? 'middle' : 'large'}
            >
              {/* Name */}
              <Form.Item
                label={<span style={{ fontSize: screens.xs ? '13px' : '14px' }}>Full Name</span>}
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input
                  size={screens.xs ? 'middle' : 'large'}
                  prefix={<UserOutlined />}
                  placeholder="John Doe"
                  style={{ fontSize: screens.xs ? '14px' : '16px' }}
                />
              </Form.Item>

              {/* Email */}
              <Form.Item
                label={<span style={{ fontSize: screens.xs ? '13px' : '14px' }}>Work Email</span>}
                name="email"
                rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input
                  size={screens.xs ? 'middle' : 'large'}
                  prefix={<MailOutlined />}
                  placeholder="john@company.com"
                  style={{ fontSize: screens.xs ? '14px' : '16px' }}
                />
              </Form.Item>

              {/* Phone */}
              <Form.Item
                label={<span style={{ fontSize: screens.xs ? '13px' : '14px' }}>Phone Number</span>}
                name="phone"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input
                  size={screens.xs ? 'middle' : 'large'}
                  prefix={<PhoneOutlined />}
                  placeholder="+91 98765 43210"
                  style={{ fontSize: screens.xs ? '14px' : '16px' }}
                />
              </Form.Item>

              {/* Company */}
              <Form.Item
                label={<span style={{ fontSize: screens.xs ? '13px' : '14px' }}>Company Name</span>}
                name="company"
              >
                <Input
                  size={screens.xs ? 'middle' : 'large'}
                  prefix={<TeamOutlined />}
                  placeholder="Your Company (Optional)"
                  style={{ fontSize: screens.xs ? '14px' : '16px' }}
                />
              </Form.Item>

              {/* Quick Time Slots */}
              <div style={{ marginBottom: screens.xs ? 20 : 24 }}>
                <Paragraph strong style={{ marginBottom: 12, fontSize: screens.xs ? '13px' : '14px' }}>Pick a Time Slot</Paragraph>
                <Row gutter={[screens.xs ? 8 : 12, screens.xs ? 8 : 12]}>
                  {getAvailableSlots().map((slot, idx) => (
                    <Col xs={24} sm={12} md={8} key={idx}>
                      <Button
                        size={screens.xs ? 'middle' : 'large'}
                        block
                        type={selectedSlot?.display === slot.display ? 'primary' : 'default'}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          height: 'auto',
                          padding: screens.xs ? '10px' : '12px',
                          textAlign: 'left',
                          whiteSpace: 'normal',
                          borderRadius: screens.xs ? 8 : 12,
                          fontSize: screens.xs ? '12px' : '14px'
                        }}
                      >
                        <CalendarOutlined style={{ fontSize: screens.xs ? '12px' : '14px' }} /> {slot.display}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Submit */}
              {!scheduledData ? (
                <Button
                  type="primary"
                  htmlType="submit"
                  size={screens.xs ? 'middle' : 'large'}
                  loading={loading}
                  block
                  icon={<CheckCircleOutlined />}
                  style={{
                    height: screens.xs ? 48 : 56,
                    fontWeight: 700,
                    borderRadius: screens.xs ? 10 : 14,
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                    fontSize: screens.xs ? '14px' : '16px'
                  }}
                >
                  Schedule Demo
                </Button>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={screens.xs ? 'small' : 'middle'}>
                  <Button
                    type="primary"
                    size={screens.xs ? 'middle' : 'large'}
                    block
                    icon={<GoogleOutlined />}
                    onClick={() => {
                      const timeIn24 = dayjs(scheduledData.time, 'hh:mm A').format('HH:mm');
                      const startDateTime = `${scheduledData.date}T${timeIn24}:00`;
                      const endDateTime = dayjs(startDateTime).add(30, 'minute').format('YYYY-MM-DDTHH:mm:ss');
                      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('RCSsender Demo')}&dates=${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}&details=${encodeURIComponent(`Demo with ${scheduledData.name} from ${scheduledData.company}. ${scheduledData.message || ''}`)}&location=${encodeURIComponent('Online Meeting')}&remind=1440,60,10`;
                      window.open(googleCalendarUrl, '_blank');
                    }}
                    style={{
                      height: screens.xs ? 48 : 56,
                      fontWeight: 700,
                      borderRadius: screens.xs ? 10 : 14,
                      background: '#4285F4',
                      fontSize: screens.xs ? '14px' : '16px'
                    }}
                  >
                    Add to Google Calendar
                  </Button>
                  <Button
                    size={screens.xs ? 'middle' : 'large'}
                    block
                    onClick={() => {
                      form.resetFields();
                      setScheduledData(null);
                      navigate('/');
                    }}
                    style={{ height: screens.xs ? 44 : 48, borderRadius: screens.xs ? 10 : 14, fontSize: screens.xs ? '14px' : '16px' }}
                  >
                    Back to Home
                  </Button>
                </Space>
              )}
            </Form>

            {/* Footer Info */}
            <div
              style={{
                marginTop: screens.xs ? 24 : 32,
                padding: screens.xs ? 16 : 20,
                background: `${colors.primary}08`,
                borderRadius: screens.xs ? 10 : 14,
                border: `1px solid ${colors.primary}20`,
                fontSize: screens.xs ? '13px' : '14px'
              }}
            >
              <ClockCircleOutlined
                style={{ color: colors.primary, marginRight: 8, fontSize: screens.xs ? '14px' : '16px' }}
              />
              <strong>What to expect:</strong>
              <ul style={{ marginTop: 8, paddingLeft: screens.xs ? 16 : 20, marginBottom: 0 }}>
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
