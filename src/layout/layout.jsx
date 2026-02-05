import { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Drawer,
  Input,
} from 'antd';
import {
  SendOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  CloseOutlined,
  HomeOutlined,
  MailOutlined,
  WalletOutlined,
  PieChartOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { THEME_CONSTANTS } from '../theme';
import AccountStatusChecker from '../components/AccountStatusChecker';
import RCSTimeWarning from '../components/RCSTimeWarning';

import RCSLogo from '../assets/RCS.png';

const { Sider, Header, Content, Footer } = Layout;

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState(
    location.pathname.slice(1) || 'dashboard'
  );
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Sync selected menu with route
  useEffect(() => {
    const path = location.pathname.slice(1) || 'dashboard';
    setSelectedKey(path);
  }, [location.pathname]);

  // Responsive breakpoint handling
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      const mobile = window.innerWidth < 768;
      setIsDesktop(desktop);
      setIsMobile(mobile);
      if (desktop) setDrawerVisible(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic menu styles with theme constants
  useEffect(() => {
    const menuStyles = `
      .custom-menu .ant-menu {
        background: transparent !important;
        border: none !important;
      }

      .custom-menu .ant-menu-item {
        height: 56px !important;
        line-height: 56px !important;
        margin: ${THEME_CONSTANTS.spacing.sm} 0 !important;
        border-radius: ${THEME_CONSTANTS.radius.lg} !important;
        font-weight: 600 !important;
        font-size: ${isMobile ? '14px' : '16px'} !important;
        padding: 0 ${THEME_CONSTANTS.spacing.xl} !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }

      .custom-menu .ant-menu-item:hover {
        background-color: ${THEME_CONSTANTS.colors.primaryLight} !important;
        color: ${THEME_CONSTANTS.colors.primary} !important;
        box-shadow: ${THEME_CONSTANTS.shadow.md} !important;
      }

      .custom-menu .ant-menu-item-selected {
        background-color: ${THEME_CONSTANTS.colors.primaryLight} !important;
        color: ${THEME_CONSTANTS.colors.primary} !important;
        font-weight: 700 !important;
        box-shadow: ${THEME_CONSTANTS.shadow.lg} !important;
      }

      .custom-menu .ant-menu-item .anticon {
        margin-right: ${THEME_CONSTANTS.spacing.lg} !important;
        font-size: ${isMobile ? '18px' : '20px'} !important;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = menuStyles;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, [isMobile]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined className="text-xl" />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/dashboard/newCampaign',
      icon: <SendOutlined className="text-xl" />,
      label: 'Send Message',
      onClick: () => navigate('/dashboard/newCampaign'),
    },
    {
      key: '/dashboard/templates',
      icon: <FileTextOutlined className="text-xl" />,
      label: 'Templates',
      onClick: () => navigate('/dashboard/templates'),
    },
    {
      key: '/dashboard/reports',
      icon: <BarChartOutlined className="text-xl" />,
      label: 'Campaign Reports',
      onClick: () => navigate('/dashboard/reports'),
    },
      {
      key: '/dashboard/my-reports',
      icon: <FileExcelOutlined className="text-xl" />,
      label: 'My Reports',
      onClick: () => navigate('/dashboard/my-reports'),
    },
    {
      key: '/dashboard/wallet',
      icon: <WalletOutlined className="text-xl" />,
      label: 'Wallet',
      onClick: () => navigate('/dashboard/wallet'),
    },
    
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile Settings',
      onClick: () => navigate('/dashboard/profile'),
    },
    ...(user?.role === 'admin' ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Admin Panel',
      onClick: () => navigate('/admin'),
    }] : []),

    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: logout,
    },
  ];

  // Sidebar Logo Component
  const SidebarLogo = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${THEME_CONSTANTS.spacing.lg} ${THEME_CONSTANTS.spacing.xl}`,
        height: '80px',
        borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
        background: THEME_CONSTANTS.colors.surface,
      }}
    >
      <img
        src={RCSLogo}
        alt="RCS Logo"
        style={{
          height: isMobile ? '180px' : '210px',
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  );

  const SidebarProfile = () => (
    <div
      style={{
        padding: THEME_CONSTANTS.spacing.xl,
        borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
        background: `linear-gradient(to bottom, ${THEME_CONSTANTS.colors.surface}, ${THEME_CONSTANTS.colors.background})`,
      }}
    >
      <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
        <div
          style={{
            background: THEME_CONSTANTS.colors.surface,
            border: `1px solid ${THEME_CONSTANTS.colors.border}`,
            borderRadius: THEME_CONSTANTS.radius.xl,
            padding: isMobile ? THEME_CONSTANTS.spacing.md : THEME_CONSTANTS.spacing.lg,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: THEME_CONSTANTS.shadow.sm,
          }}
          className="hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: THEME_CONSTANTS.spacing.md,
            }}
          >
            <Avatar
              size={isMobile ? 36 : 44}
              style={{
                background: THEME_CONSTANTS.colors.primary,
                color: THEME_CONSTANTS.colors.surface,
                boxShadow: THEME_CONSTANTS.shadow.md,
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  color: THEME_CONSTANTS.colors.text,
                  fontWeight: 600,
                  fontSize: '14px',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </h4>
              <p
                style={{
                  color: THEME_CONSTANTS.colors.primary,
                  fontSize: '12px',
                  fontWeight: 600,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email}

              </p>
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  );

  return (
    <>
      <AccountStatusChecker />
      <RCSTimeWarning />
      <Layout className="min-h-screen bg-gray-50">
        {/* Desktop sidebar */}
        {isDesktop && (
          <Sider
            width={280}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 1000,
              background: THEME_CONSTANTS.colors.surface,
              boxShadow: THEME_CONSTANTS.shadow.lg,
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
            }}
          >
            <SidebarLogo />
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: `${THEME_CONSTANTS.spacing.xxl} 0`,
              }}
            >
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                className="border-0 bg-transparent custom-menu"
                style={{
                  background: 'transparent',
                  padding: `0 ${THEME_CONSTANTS.spacing.lg}`,
                }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <SidebarProfile />
            </div>
          </Sider>
        )}

        {/* Mobile drawer */}
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          closable={false}
          bodyStyle={{ padding: 0 }}
          width={isMobile ? '85vw' : 280}
          style={{ display: isDesktop ? 'none' : 'block' }}
          maskClosable
          zIndex={1001}
        >
          <Layout
            style={{
              minHeight: '100vh',
              background: THEME_CONSTANTS.colors.surface,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <SidebarLogo />
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: `${THEME_CONSTANTS.spacing.xxl} 0`,
                paddingBottom: '120px',
              }}
            >
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={() => setDrawerVisible(false)}
                className="border-0 bg-transparent custom-menu"
                style={{
                  background: 'transparent',
                  padding: `0 ${THEME_CONSTANTS.spacing.lg}`,
                }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <SidebarProfile />
            </div>
          </Layout>
        </Drawer>

        {/* Main layout */}
        <Layout
          style={{
            minHeight: '100vh',
            background: THEME_CONSTANTS.colors.background,
            marginLeft: isDesktop ? '280px' : 0,
            transition: 'margin-left 0.2s ease',
          }}
        >
          {/* Header */}
          <Header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 999,
              background: THEME_CONSTANTS.colors.surface,
              boxShadow: THEME_CONSTANTS.shadow.sm,
              borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
              padding: `0 ${isMobile ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxxl}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '80px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: THEME_CONSTANTS.spacing.lg,
                flex: 1,
              }}
            >
              {/* Mobile menu toggle */}
              {!isDesktop && (
                <>
                  <Button
                    type="text"
                    size={isMobile ? 'middle' : 'large'}
                    icon={
                      drawerVisible ? (
                        <CloseOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
                      ) : (
                        <MenuOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
                      )
                    }
                    onClick={() => setDrawerVisible(!drawerVisible)}
                    style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:text-blue-600 hover:bg-blue-50"
                  />
                  
                </>
              )}

              <div>
                <h2 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.text,
                  margin: 0
                }}>
                  {user?.companyname}
                </h2>
              </div>

              {/* Search */}
              {/* {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', marginRight: THEME_CONSTANTS.spacing.xl }}>
                  <Input
                    placeholder="Search campaigns, templates, contacts..."
                    prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textMuted }} />}
                    style={{
                      width: isDesktop ? '320px' : '240px',
                      height: '40px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      borderColor: THEME_CONSTANTS.colors.border,
                      backgroundColor: THEME_CONSTANTS.colors.background,
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:bg-white focus:bg-white"
                  />
                </div>
              )} */}
            </div>

            <Space size={isMobile ? 'middle' : 'large'} style={{ display: 'flex', alignItems: 'center' }}>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
                arrow
              >
                <Button
                  type="text"
                  size={isMobile ? 'middle' : 'large'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: THEME_CONSTANTS.spacing.md,
                    borderRadius: THEME_CONSTANTS.radius.md,
                    padding: `${THEME_CONSTANTS.spacing.sm} ${THEME_CONSTANTS.spacing.md}`,
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:bg-blue-50"
                >
                  <Avatar
                    size={isMobile ? 32 : 40}
                    style={{
                      background: THEME_CONSTANTS.colors.primary,
                      color: THEME_CONSTANTS.colors.surface,
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  {!isMobile && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        lineHeight: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: THEME_CONSTANTS.colors.text,
                          lineHeight: 1,
                          marginBottom: '2px',
                        }}
                      >
                        {user?.name}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: THEME_CONSTANTS.colors.primary,
                          fontWeight: 500,
                          lineHeight: 1,
                        }}
                      >
                        {user?.email}
                      </span>
                    </div>
                  )}
                </Button>
              </Dropdown>
            </Space>
          </Header>

          {/* Content */}
          <Content
            style={{
              padding: isMobile
                ? THEME_CONSTANTS.spacing.lg
                : THEME_CONSTANTS.spacing.xl,
              background: THEME_CONSTANTS.colors.background,
              minHeight: 'calc(100vh - 160px)',
            }}
          >
            <div
              style={{
                maxWidth: '1400px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              <Outlet />
            </div>
          </Content>

          {/* Footer */}
          <Footer
            style={{
              background: THEME_CONSTANTS.colors.surface,
              borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
              textAlign: 'center',
              padding: `${THEME_CONSTANTS.spacing.xl} ${isMobile ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxxl}`,
              height: '80px',
            }}
          >
            <div
              style={{
                maxWidth: '1400px',
                margin: '0 auto',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: THEME_CONSTANTS.colors.text,
                  margin: 0,
                }}
              >
                © 2025 RCS Messaging Hub. All rights reserved.
              </p>
            </div>
          </Footer>
        </Layout>
      </Layout>
    </>
  );
}
