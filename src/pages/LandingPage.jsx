import React, { useEffect } from 'react';
import { Layout, Button, Row, Col, Card, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../theme';
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
  LockOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

const sectionStyle = {
  padding: '80px 24px',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto',
};

const sectionTitleStyle = {
  fontSize: 36,
  fontWeight: 800,
  marginBottom: 16,
  letterSpacing: '-0.5px',
  textAlign: 'center'
};

const sectionSubtitleStyle = {
  fontSize: 17,
  lineHeight: 1.6,
  textAlign: 'center',
  maxWidth: 600,
  margin: '0 auto'
};

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Enterprise RCS Messaging Platform | High-Speed Jio RCS';
  }, []);

  return (
    <Layout style={{ background: THEME_CONSTANTS.colors.background, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <Header style={{ background: THEME_CONSTANTS.colors.surface, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`, padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ ...containerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', color: THEME_CONSTANTS.colors.primary }}>RCS Sender Platform</h1>
          <Button type="primary" size="large" onClick={() => navigate('/login')}>Get Started</Button>
        </div>
      </Header>

      <Content>
        {/* Hero */}
        <section style={{ background: THEME_CONSTANTS.colors.background, padding: '100px 24px 80px' }}>
          <div style={containerStyle}>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} md={12}>
                <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', color: THEME_CONSTANTS.colors.text }}>
                  Enterprise‑Grade RCS Messaging
                </h1>
                <p style={{ fontSize: 18, color: THEME_CONSTANTS.colors.textSecondary, marginTop: 24, lineHeight: 1.7 }}>
                  Deliver 1,00,000+ RCS messages in under 20 minutes with 99% success rate.
                  Built on Jio RCS APIs with real‑time analytics, retries, and downloadable reports.
                </p>
                <div style={{ marginTop: 40 }}>
                  <Button type="primary" size="large" style={{ height: 48, fontSize: 16, fontWeight: 600, paddingLeft: 32, paddingRight: 32 }} onClick={() => navigate('/login')}>Get Started</Button>
                  <Button size="large" style={{ marginLeft: 16, height: 48, fontSize: 16, fontWeight: 600 }} onClick={() => navigate('/login')}>Request Demo</Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ height: 400, borderRadius: 20, boxShadow: THEME_CONSTANTS.shadow.xl, background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.surface} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${THEME_CONSTANTS.colors.primary}20` }}>
                  <BarChartOutlined style={{ fontSize: 140, color: THEME_CONSTANTS.colors.primary }} />
                </Card>
              </Col>
            </Row>
          </div>
        </section>

        {/* Trust Metrics */}
        <section style={{ 
          background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`, 
          padding: '80px 24px' 
        }}>
          <div style={containerStyle}>
            <h2 style={{ 
              ...sectionTitleStyle,
              color: THEME_CONSTANTS.colors.surface, 
              marginBottom: 56
            }}>Trusted by Enterprises</h2>
            <Row gutter={[24, 24]} justify="center">
              {[
                { Icon: BarChartOutlined, title: '1L+', label: 'Messages/Campaign' },
                { Icon: CheckCircleOutlined, title: '99%', label: 'Delivery Success' },
                { Icon: ThunderboltOutlined, title: 'Real-Time', label: 'Analytics' },
                { Icon: FileExcelOutlined, title: 'Excel', label: 'Exports' },
                { Icon: RocketOutlined, title: 'Jio', label: 'RCS APIs' }
              ].map(({ Icon, title, label }) => (
                <Col xs={12} sm={8} md={4} key={label} style={{ display: 'flex' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    padding: '28px 20px',
                    textAlign: 'center',
                    boxShadow: THEME_CONSTANTS.shadow.xl,
                    transition: THEME_CONSTANTS.transition.normal,
                    cursor: 'pointer',
                    border: `2px solid rgba(255,255,255,0.3)`,
                    backdropFilter: 'blur(10px)',
                    height: '200px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.xl;
                  }}>
                    <Icon style={{
                      fontSize: 40,
                      marginBottom: 12,
                      color: THEME_CONSTANTS.colors.primary
                    }} />
                    <h3 style={{
                      fontSize: 28,
                      fontWeight: 800,
                      marginBottom: 6,
                      color: THEME_CONSTANTS.colors.primary,
                      letterSpacing: '-0.5px'
                    }}>{title}</h3>
                    <p style={{ 
                      color: THEME_CONSTANTS.colors.textSecondary, 
                      fontSize: 13, 
                      fontWeight: 600, 
                      margin: 0 
                    }}>{label}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* Features */}
        <section style={{ background: THEME_CONSTANTS.colors.background, ...sectionStyle }}>
          <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ ...sectionTitleStyle, color: THEME_CONSTANTS.colors.text }}>Why Teams Choose Our Platform</h2>
              <p style={{ ...sectionSubtitleStyle, color: THEME_CONSTANTS.colors.textSecondary }}>Enterprise-grade features built for scale, reliability, and performance</p>
            </div>
            <Row gutter={[24, 24]}>
            {[
              { Icon: ThunderboltOutlined, title: 'High-Throughput Engine', desc: 'Kafka-based messaging for 1L+ messages' },
              { Icon: AimOutlined, title: 'Smart TPS Control', desc: 'Guaranteed delivery with retry queues' },
              { Icon: DashboardOutlined, title: 'Real-Time Analytics', desc: 'Track sent, delivered & read status' },
              { Icon: SearchOutlined, title: 'Campaign Insights', desc: 'Detailed logs & failure analysis' },
              { Icon: DownloadOutlined, title: 'One-Click Reports', desc: 'Export to Excel & CSV instantly' },
              { Icon: LockOutlined, title: 'Secure Integration', desc: 'Authenticated Jio RCS APIs' }
            ].map(({ Icon, title, desc }) => (
              <Col xs={24} sm={12} md={8} key={title} style={{ display: 'flex' }}>
                <div style={{
                  background: THEME_CONSTANTS.colors.surface,
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  padding: 28,
                  height: '240px',
                  width: '100%',
                  boxShadow: THEME_CONSTANTS.shadow.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  transition: THEME_CONSTANTS.transition.normal,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.xl;
                  e.currentTarget.style.borderColor = THEME_CONSTANTS.colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.lg;
                  e.currentTarget.style.borderColor = THEME_CONSTANTS.colors.border;
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: THEME_CONSTANTS.colors.primaryLight,
                    opacity: 0.5,
                    borderRadius: `0 ${THEME_CONSTANTS.radius.xl} 0 100%`
                  }} />
                  <div style={{
                    width: 56,
                    height: 56,
                    background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    boxShadow: THEME_CONSTANTS.shadow.md,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <Icon style={{ fontSize: 28, color: THEME_CONSTANTS.colors.surface }} />
                  </div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 10,
                    color: THEME_CONSTANTS.colors.text,
                    position: 'relative',
                    zIndex: 1,
                    letterSpacing: '-0.3px'
                  }}>{title}</h3>
                  <p style={{
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                    position: 'relative',
                    zIndex: 1
                  }}>{desc}</p>
                </div>
              </Col>
            ))}
            </Row>
          </div>
        </section>

        {/* Analytics Preview */}
        <section style={{ background: THEME_CONSTANTS.colors.surface, ...sectionStyle }}>
          <div style={containerStyle}>
            <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={12}>
              <div style={{
                background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                padding: 40,
                borderRadius: THEME_CONSTANTS.radius.xl,
                color: THEME_CONSTANTS.colors.surface
              }}>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 20 }}>Real‑Time Analytics & Reports</h2>
                <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 28, opacity: 0.95 }}>
                  Track every message lifecycle with millisecond accuracy. Get instant insights into campaign performance and export detailed reports.
                </p>
                <div style={{ display: 'grid', gap: 16 }}>
                  {[
                    { icon: <DashboardOutlined />, text: 'Live campaign dashboards' },
                    { icon: <SearchOutlined />, text: 'Failure reason breakdown' },
                    { icon: <BarChartOutlined />, text: 'User interaction tracking' },
                    { icon: <FileExcelOutlined />, text: 'Excel & CSV exports' }
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        {icon}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Card style={{ height: 360, borderRadius: 16, boxShadow: THEME_CONSTANTS.shadow.lg, background: THEME_CONSTANTS.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <DashboardOutlined style={{ fontSize: 120, color: THEME_CONSTANTS.colors.primary }} />
              </Card>
            </Col>
            </Row>
          </div>
        </section>

        {/* Pricing */}
        <section style={{ 
          background: THEME_CONSTANTS.colors.background,
          ...sectionStyle
        }}>
          <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ ...sectionTitleStyle, color: THEME_CONSTANTS.colors.text }}>Simple, Transparent Pricing</h2>
              <p style={{ ...sectionSubtitleStyle, color: THEME_CONSTANTS.colors.textSecondary }}>Pay only for what you use. No hidden fees, no surprises.</p>
            </div>
            
            <Card style={{ 
              maxWidth: 700, 
              margin: '0 auto', 
              borderRadius: 20, 
              boxShadow: THEME_CONSTANTS.shadow.xl, 
              border: `2px solid ${THEME_CONSTANTS.colors.primary}`,
              background: THEME_CONSTANTS.colors.surface
            }}>
              <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: THEME_CONSTANTS.colors.primary, letterSpacing: '-2px', lineHeight: 1 }}>
                    ₹1
                  </div>
                  <div style={{ fontSize: 18, color: THEME_CONSTANTS.colors.textSecondary, marginTop: 12, fontWeight: 600 }}>
                    per delivered message
                  </div>
                </div>
                
                <Divider />
                
                <div style={{ textAlign: 'left', padding: '0 24px' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>What's Included:</h3>
                  <Row gutter={[24, 16]}>
                    {[
                      'Pay only for delivered messages',
                      'Failed messages refunded automatically',
                      'Real-time analytics & reports',
                      'Unlimited campaigns',
                      'Excel & CSV exports',
                      '24/7 support'
                    ].map((item) => (
                      <Col xs={24} sm={12} key={item}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: 18, marginTop: 2 }} />
                          <span style={{ fontSize: 15, color: THEME_CONSTANTS.colors.text }}>{item}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
                
                <div style={{ marginTop: 40, padding: '0 24px' }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    style={{ height: 56, fontSize: 16, fontWeight: 600 }} 
                    onClick={() => navigate('/login')}
                  >
                    Get Started Now
                  </Button>
                  <p style={{ marginTop: 16, fontSize: 13, color: THEME_CONSTANTS.colors.textSecondary }}>
                    No credit card required • Start with free credits
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`, color: THEME_CONSTANTS.colors.surface, padding: '80px 24px', textAlign: 'center' }}>
          <div style={containerStyle}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>Start Sending RCS Messages at Scale</h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.95 }}>
              Launch enterprise‑grade RCS campaigns in minutes.
            </p>
            <Button size="large" style={{ marginTop: 40, height: 56, fontSize: 16, background: THEME_CONSTANTS.colors.surface, color: THEME_CONSTANTS.colors.primary, fontWeight: 700, paddingLeft: 40, paddingRight: 40, border: 'none' }} onClick={() => navigate('/login')}>
              Get Started Now
            </Button>
          </div>
        </section>
      </Content>

      <Footer style={{ textAlign: 'center', background: THEME_CONSTANTS.colors.surface, padding: '40px 24px', borderTop: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
        <p style={{ margin: 0, color: THEME_CONSTANTS.colors.textSecondary, fontSize: 14 }}>
          © {new Date().getFullYear()} RCS Sender Platform · Built for Enterprise Messaging
        </p>
      </Footer>
    </Layout>
  );
};

export default LandingPage;
