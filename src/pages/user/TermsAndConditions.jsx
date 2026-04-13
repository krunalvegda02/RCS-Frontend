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
              Rich Communication Services (RCS) messaging platform integrated with authorized telecom
              provider infrastructure.
            </Paragraph>
            <Text style={{ color: THEME_CONSTANTS.colors.primaryLight, fontSize: 14 }}>
              Last updated: 13 April 2026
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
                  By accessing or using the RCS Sender Platform, you agree to be bound by these Terms & Conditions,
                  applicable Indian laws, TRAI regulations, and telecom operator policies. If you do not agree,
                  you must discontinue use immediately.
                </Paragraph>

                <Divider />

                <Title level={3}>2. Platform Description</Title>
                <Paragraph>
                  RCS Sender Platform is a software-based communication platform that enables businesses to send
                  RCS messages using APIs provided by authorized telecom operators (such as Jio).
                </Paragraph>
                <Paragraph>
                  We are a <Text strong>technology platform provider</Text> and do not operate as a telecom service provider.
                </Paragraph>

                <Divider />

                <Title level={3}>3. Service Model (IMPORTANT CLARIFICATION)</Title>
                <Paragraph>
                  The platform operates on a <Text strong>prepaid service usage model</Text>:
                </Paragraph>
                <ul>
                  <li>Users purchase predefined service packages</li>
                  <li>Each package provides a fixed number of messaging credits</li>
                  <li>Credits are consumed only when services (message delivery) are used</li>
                </ul>
                <Paragraph>
                  <Text strong>Important:</Text>
                </Paragraph>
                <ul>
                  <li>Credits are <Text strong>not a stored monetary value</Text></li>
                  <li>Credits are <Text strong>non-withdrawable and non-transferable</Text></li>
                  <li>Credits can only be used within the platform for messaging services</li>
                </ul>
                <Paragraph>
                  This model does <Text strong>not constitute a wallet, payment system, or financial instrument</Text>.
                </Paragraph>

                <Divider />

                <Title level={3}>4. TRAI & Telecom Compliance</Title>
                <Paragraph>
                  All messaging activities must comply with:
                </Paragraph>
                <ul>
                  <li>TRAI regulations</li>
                  <li>DLT (Distributed Ledger Technology) requirements</li>
                  <li>Telecom operator policies (including Jio RCS guidelines)</li>
                </ul>
                <Paragraph>
                  Users are responsible for:
                </Paragraph>
                <ul>
                  <li>Registering sender IDs and templates on DLT platforms</li>
                  <li>Obtaining explicit end-user consent</li>
                  <li>Ensuring lawful communication practices</li>
                </ul>

                <Divider />

                <Title level={3}>5. User Responsibilities</Title>
                <Paragraph>
                  Users agree to:
                </Paragraph>
                <ul>
                  <li>Use the platform only for lawful business communication</li>
                  <li>Maintain accurate account and business details</li>
                  <li>Ensure all campaigns comply with telecom and regulatory guidelines</li>
                  <li>Protect login credentials and API keys</li>
                </ul>

                <Divider />

                <Title level={3}>6. Prohibited Activities</Title>
                <Paragraph>
                  Users must not:
                </Paragraph>
                <ul>
                  <li>Send spam, unsolicited, or misleading messages</li>
                  <li>Violate TRAI or telecom operator policies</li>
                  <li>Use the platform for fraudulent, abusive, or illegal activities</li>
                  <li>Attempt to misuse platform infrastructure</li>
                </ul>

                <Divider />

                <Title level={3}>7. Payments & Billing</Title>
                <ul>
                  <li>Payments are made towards <Text strong>prepaid service packages</Text></li>
                  <li>Pricing is fixed based on selected plans</li>
                  <li>GST and applicable taxes are charged as per Indian law</li>
                </ul>
                <Paragraph>
                  <Text strong>Important:</Text>
                </Paragraph>
                <ul>
                  <li>Payments are for service usage only</li>
                  <li>No monetary value is stored or maintained on behalf of users</li>
                  <li>The platform does not function as a wallet or financial intermediary</li>
                </ul>

                <Divider />

                <Title level={3}>8. Refund & Cancellation Policy</Title>
                <Paragraph>
                  Due to the nature of telecom and digital service delivery:
                </Paragraph>
                <ul>
                  <li>Payments are generally <Text strong>non-refundable</Text> once services are consumed or credits are allocated</li>
                  <li>In case of verified technical failure from our platform, adjustments or credits may be provided at our discretion</li>
                </ul>

                <Divider />

                <Title level={3}>9. Data Protection & Privacy</Title>
                <Paragraph>
                  We comply with:
                </Paragraph>
                <ul>
                  <li>Information Technology Act, 2000</li>
                  <li>Digital Personal Data Protection (DPDP) Act, 2023</li>
                </ul>
                <Paragraph>
                  Data is processed only for:
                </Paragraph>
                <ul>
                  <li>Message delivery</li>
                  <li>Analytics and reporting</li>
                  <li>Regulatory compliance</li>
                </ul>
                <Paragraph>
                  We implement appropriate security measures to protect user data.
                </Paragraph>

                <Divider />

                <Title level={3}>10. Limitation of Liability</Title>
                <Paragraph>
                  We are not responsible for:
                </Paragraph>
                <ul>
                  <li>Telecom operator delays or failures</li>
                  <li>Delivery issues caused by DLT rejection or operator filtering</li>
                  <li>User misuse or regulatory violations</li>
                </ul>

                <Divider />

                <Title level={3}>11. Governing Law</Title>
                <Paragraph>
                  These Terms are governed by the laws of India. Any disputes shall be subject to the
                  jurisdiction of Indian courts.
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
