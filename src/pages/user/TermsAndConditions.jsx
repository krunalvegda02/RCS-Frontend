import React, { useEffect } from 'react';
import { Layout, Card, Typography, Divider, Row, Col } from 'antd';
import { THEME_CONSTANTS } from '../../theme';
import { Footer } from 'antd/es/layout/layout';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const containerStyle = {
  maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
  margin: '0 auto',
  padding: `${THEME_CONSTANTS.spacing.xxxl} ${THEME_CONSTANTS.spacing.lg}`,
};

const TermsAndConditions = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions | RCS Sender Platform';
  }, []);

  return (
    <Layout style={{ background: THEME_CONSTANTS.colors.background }}>
      <Content>
        {/* Header Section */}
        <section
          style={{
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
            padding: `${THEME_CONSTANTS.spacing.xxxl} 0`,
          }}
        >
          <div style={containerStyle}>
            <Title
              level={1}
              style={{
                color: THEME_CONSTANTS.colors.surface,
                fontSize: '40px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: THEME_CONSTANTS.spacing.sm,
              }}
            >
              Terms & Conditions
            </Title>
            <Paragraph
              style={{
                color: THEME_CONSTANTS.colors.primaryLight,
                fontSize: 18,
                maxWidth: 720,
                lineHeight: 1.6,
                marginBottom: THEME_CONSTANTS.spacing.md,
              }}
            >
              These Terms & Conditions govern the use of the RCS Sender Platform, an enterprise-grade
              Rich Communication Services (RCS) messaging solution built on Jio RCS infrastructure.
              Please read them carefully before using our services.
            </Paragraph>
            <Text style={{ color: THEME_CONSTANTS.colors.primaryLight, fontSize: 14 }}>
              Last updated: {new Date().toLocaleDateString()}
            </Text>
          </div>
        </section>

        {/* Content Section */}
        <section style={containerStyle}>
          <Row justify="center">
            <Col xs={24} lg={18}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  boxShadow: THEME_CONSTANTS.shadow.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                }}
                bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxxl }}
              >
                <Title level={3}>1. Acceptance of Terms</Title>
                <Paragraph>
                  By accessing, registering for, or using the <Text strong>RCS Sender Platform</Text>, you
                  acknowledge that you have read, understood, and agree to be legally bound by these
                  Terms & Conditions, along with all applicable laws, telecom regulations, and industry
                  guidelines. If you do not agree to these terms, you must immediately discontinue use
                  of the platform.
                </Paragraph>
                <Divider />
                <Title level={3}>2. Platform Description</Title>
                <Paragraph>
                  RCS Sender Platform is a high-performance, enterprise messaging platform that enables
                  businesses to deliver large-scale Rich Communication Services (RCS) campaigns using
                  Jio-approved RCS APIs. The platform provides advanced features including real-time
                  delivery analytics, campaign lifecycle tracking, automated retries, detailed logs,
                  and downloadable reports for operational and compliance needs.
                </Paragraph>
                <Divider />
                <Title level={3}>3. User Responsibilities</Title>
                <Paragraph>
                  As a user of the RCS Sender Platform, you agree and undertake to:
                </Paragraph>
                <ul>
                  <li>Use the platform strictly for legitimate, lawful, and business-approved communication.</li>
                  <li>Comply with all applicable TRAI regulations, Jio RCS policies, and telecom laws.</li>
                  <li>Ensure explicit end-user consent is obtained prior to sending any RCS messages.</li>
                  <li>Maintain the security of your account credentials and access keys.</li>
                  <li>Avoid any activity that may degrade, disrupt, or misuse the platform infrastructure.</li>
                </ul>
                <Divider />
                <Title level={3}>4. Prohibited Use</Title>
                <Paragraph>
                  You are strictly prohibited from using the platform for activities that are unlawful,
                  unethical, or harmful.
                </Paragraph>
                <Divider />
                <Title level={3}>5. Data Protection & Privacy (India – IT Act & DPDP)</Title>
                <Paragraph>
                  We comply with the Information Technology Act, 2000 and the Digital Personal Data Protection (DPDP) Act, 2023.
                  Customer and end-user data is processed strictly for message delivery, analytics, compliance, and reporting.
                  We implement industry-standard security measures to protect personal data against unauthorized access,
                  disclosure, or misuse.
                </Paragraph>
                <Divider />
                <Title level={3}>6. TRAI & Jio RCS Compliance</Title>
                <Paragraph>
                  All messaging activities conducted through the RCS Sender Platform must comply with TRAI regulations,
                  Jio RCS policies, and approved business messaging guidelines. Message throughput, templates,
                  sender identities, and content moderation are subject to telecom operator approval.
                </Paragraph>
                <Divider />
                <Title level={3}>7. Refund & Cancellation Policy</Title>
                <Paragraph>
                  Due to the nature of telecom services, all payments made for messaging credits or platform usage
                  are non-refundable once messages are submitted to the telecom network. In cases of verified
                  platform-level failure, refunds or credit adjustments may be issued at our sole discretion.
                </Paragraph>
                <Divider />
                <Title level={3}>8. Governing Law</Title>
                <Paragraph>
                  These terms shall be governed by and construed in accordance with the laws of India. Any disputes
                  shall be subject to the exclusive jurisdiction of courts located in India.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </section>

        {/* ================= CONTACT US SECTION ================= */}
        <section
          style={{
            padding: `${THEME_CONSTANTS.spacing.xxxl} ${THEME_CONSTANTS.spacing.lg}`,
            background: THEME_CONSTANTS.colors.surface,
            borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
            borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
          }}
        >
          <div style={containerStyle}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 26px',
                  background: `${THEME_CONSTANTS.colors.primary}15`,
                  borderRadius: 999,
                  border: `1px solid ${THEME_CONSTANTS.colors.primary}30`,
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: THEME_CONSTANTS.colors.primary,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                  }}
                >
                  Contact Us
                </Text>
              </div>

              <Title level={2} style={{ fontWeight: 800 }}>
                Talk to Our RCS Experts
              </Title>

              <Paragraph
                style={{
                  fontSize: 17,
                  color: THEME_CONSTANTS.colors.textSecondary,
                  maxWidth: 720,
                  margin: '0 auto',
                  lineHeight: 1.7,
                }}
              >
                Have questions about onboarding, pricing, compliance, or enterprise integrations?
                Our team is here to support your RCS messaging journey.
              </Paragraph>
            </div>

            {/* Contact Cards */}
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} md={12}>
                <Card
                  hoverable
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    textAlign: 'center',
                    height: '100%',
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                  }}
                  bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxl }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 20,
                      background: `${THEME_CONSTANTS.colors.primary}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      border: `2px solid ${THEME_CONSTANTS.colors.primary}30`,
                      fontSize: 32,
                      fontWeight: 800,
                      color: THEME_CONSTANTS.colors.primary,
                    }}
                  >
                    @
                  </div>

                  <Title level={4} style={{ fontWeight: 700 }}>
                    Email Support
                  </Title>

                  <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
                    Enterprise onboarding, integrations, and technical queries
                  </Paragraph>

                  <Text strong style={{ color: THEME_CONSTANTS.colors.primary, fontSize: 16 }}>
                    info@rcssender.com
                  </Text>

                  <div style={{ marginTop: 12, fontSize: 13, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Typical response time: under 2 business hours
                  </div>
                </Card>
              </Col>

              {/* <Col xs={24} md={12}>
                <Card
                  hoverable
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    textAlign: 'center',
                    height: '100%',
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                  }}
                  bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxl }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 20,
                      background: `${THEME_CONSTANTS.colors.success}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      border: `2px solid ${THEME_CONSTANTS.colors.success}30`,
                      fontSize: 28,
                      fontWeight: 800,
                      color: THEME_CONSTANTS.colors.success,
                    }}
                  >
                    ☎
                  </div>

                  <Title level={4} style={{ fontWeight: 700 }}>
                    Phone Support
                  </Title>

                  <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
                    Speak directly with our RCS specialists
                  </Paragraph>

                  <Text strong style={{ color: THEME_CONSTANTS.colors.success, fontSize: 18 }}>
                    +91 94628 10993
                  </Text>

                  <div style={{ marginTop: 12, fontSize: 13, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Available Mon–Sat • 10:00 AM – 7:00 PM IST
                  </div>
                </Card>
              </Col> */}
            </Row>

            {/* Trust Footer */}
            <div
              style={{
                marginTop: THEME_CONSTANTS.spacing.xxxl,
                padding: THEME_CONSTANTS.spacing.xl,
                background: THEME_CONSTANTS.colors.background,
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                textAlign: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                Trusted by growing businesses and enterprises for secure, compliant RCS messaging.
              </Text>
            </div>
          </div>
        </section>
      </Content>
        <Footer style={{
        textAlign: 'center',
        background: THEME_CONSTANTS.colors.surface,
        borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
        padding: `${THEME_CONSTANTS.spacing.lg} ${THEME_CONSTANTS.spacing.md}`,
        fontSize: THEME_CONSTANTS.typography.caption.size,
        color: THEME_CONSTANTS.colors.textSecondary,
      }}>
        © {new Date().getFullYear()} RCSsender. All rights reserved.<br />
        A product of <strong>LMS</strong> ·
        <a
          href="/terms"
          style={{
            marginLeft: 8,
            color: THEME_CONSTANTS.colors.primary,
            fontWeight: 500,
          }}
        >
          Terms & Conditions
        </a>
      </Footer>
    {/* </Layout> */}
    </Layout>
    
  );
};

    
//   );
// };

export default TermsAndConditions;
