import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Drawer,
  Dropdown,
  Avatar,
  Button,
  Space,
  Input,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CreditCardOutlined,
 BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  SearchOutlined,
  SettingOutlined,
  MailOutlined,
  FileTextOutlined,
  FundOutlined,
  WalletOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { THEME_CONSTANTS } from '../theme';
import RCSTimeWarning from '../components/RCSTimeWarning';

const { Sider, Header, Content, Footer } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Sync selected menu with route
  useEffect(() => {
    setSelectedKey(location.pathname);
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
        font-weight: ${THEME_CONSTANTS.typography.h5.weight} !important;
        font-size: ${isMobile ? THEME_CONSTANTS.typography.body.size : THEME_CONSTANTS.typography.h5.size} !important;
        padding: 0 ${THEME_CONSTANTS.spacing.xl} !important;
        transition: ${THEME_CONSTANTS.transition.normal} !important;
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
        font-weight: ${THEME_CONSTANTS.typography.h4.weight} !important;
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

  // Admin menu items
  const menuItems = [
  {
    key: '/admin',
    icon: <DashboardOutlined className="text-xl" />,
    label: 'Dashboard',
    onClick: () => navigate('/admin'),
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined className="text-xl" />,
    label: 'User Management',
    onClick: () => navigate('/admin/users'),
  },
  {
    key: '/admin/wallet-requests',
    icon: <WalletOutlined className="text-xl" />,
    label: 'Wallet Requests',
    onClick: () => navigate('/admin/wallet-requests'),
  },
  {
    key: '/admin/all-campaigns',
    icon: <FundOutlined className="text-xl" />,
    label: 'All Campaigns',
    onClick: () => navigate('/admin/all-campaigns'),
  },
  // {
  //   key: '/admin/reports',
  //   icon: <FileTextOutlined className="text-xl" />,
  //   label: 'Reports',
  //   onClick: () => navigate('/admin/reports'),
  // },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/admin/profile'),
    },
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
        gap: THEME_CONSTANTS.spacing.lg,
        padding: `${THEME_CONSTANTS.spacing.lg} ${THEME_CONSTANTS.spacing.xl}`,
        height: '72px',
        borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
        background: THEME_CONSTANTS.colors.surface,
      }}
    >
      <div 
        style={{
          width: isMobile ? '40px' : '48px',
          height: isMobile ? '40px' : '48px',
          background: THEME_CONSTANTS.colors.primaryLight,
          border: `1px solid ${THEME_CONSTANTS.colors.primary}20`,
          borderRadius: THEME_CONSTANTS.radius.xl,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: THEME_CONSTANTS.shadow.sm,
          flexShrink: 0,
        }}
      >
        <MailOutlined 
          style={{
            color: THEME_CONSTANTS.colors.primary,
            fontSize: isMobile ? '20px' : '24px'
          }} 
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 
          style={{
            color: THEME_CONSTANTS.colors.text,
            fontWeight: THEME_CONSTANTS.typography.h4.weight,
            fontSize: isMobile ? THEME_CONSTANTS.typography.h5.size : THEME_CONSTANTS.typography.h4.size,
            lineHeight: THEME_CONSTANTS.typography.h4.lineHeight,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Admin Panel
        </h1>
        <p 
          style={{
            fontSize: THEME_CONSTANTS.typography.caption.size,
            color: THEME_CONSTANTS.colors.textSecondary,
            fontWeight: THEME_CONSTANTS.typography.label.weight,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Management Portal
        </p>
      </div>
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
            transition: THEME_CONSTANTS.transition.normal,
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
                background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary}, ${THEME_CONSTANTS.colors.primaryDark})`,
                color: THEME_CONSTANTS.colors.surface,
                boxShadow: THEME_CONSTANTS.shadow.md,
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 
                style={{
                  color: THEME_CONSTANTS.colors.text,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight,
                  fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Admin'}
              </h4>
              <p 
                style={{
                  color: THEME_CONSTANTS.colors.primary,
                  fontSize: THEME_CONSTANTS.typography.caption.size,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Administrator
              </p>
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  );

  return (
    <>
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
              selectedKeys={[selectedKey]}
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
        zIndex={1050}
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
              selectedKeys={[selectedKey]}
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
          marginLeft: isDesktop ? 280 : 0,
          transition: `margin-left ${THEME_CONSTANTS.transition.normal}`,
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
            height: '72px',
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
                  transition: THEME_CONSTANTS.transition.normal,
                }}
                className="hover:text-blue-600 hover:bg-blue-50"
              />
            )}

            {/* Search */}
            {/* {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  placeholder="Search users, requests, reports..."
                  prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textMuted }} />}
                  style={{
                    width: isDesktop ? '320px' : '240px',
                    height: '40px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    borderColor: THEME_CONSTANTS.colors.border,
                    backgroundColor: THEME_CONSTANTS.colors.background,
                    fontSize: THEME_CONSTANTS.typography.body.size,
                    transition: THEME_CONSTANTS.transition.normal,
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
                  transition: THEME_CONSTANTS.transition.normal,
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
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
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
                        fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                        fontWeight: THEME_CONSTANTS.typography.h6.weight,
                        color: THEME_CONSTANTS.colors.text,
                        lineHeight: 1,
                        marginBottom: '2px',
                      }}
                    >
                      {user?.name || 'Admin'}
                    </span>
                    <span 
                      style={{
                        fontSize: THEME_CONSTANTS.typography.caption.size,
                        color: THEME_CONSTANTS.colors.primary,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        lineHeight: 1,
                      }}
                    >
                      Administrator
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
            padding: isMobile ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxxl,
            background: THEME_CONSTANTS.colors.background,
            minHeight: 'calc(100vh - 144px)',
          }}
        >
          <Outlet />
        </Content>

        {/* Footer */}
        <Footer 
          style={{
            background: THEME_CONSTANTS.colors.surface,
            borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
            textAlign: 'center',
            padding: `${THEME_CONSTANTS.spacing.xl} ${isMobile ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxxl}`,
            height: '72px',
          }}
        >
          <p 
            style={{
              fontSize: THEME_CONSTANTS.typography.bodySmall.size,
              fontWeight: THEME_CONSTANTS.typography.label.weight,
              color: THEME_CONSTANTS.colors.text,
              margin: 0,
            }}
          >
            © 2025 RCS Admin Panel. All rights reserved.
          </p>
        </Footer>
      </Layout>
    </>
  );
}
