import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Button,
  Table,
  Space,
  Tooltip,
  Row,
  Col,
  Tag,
  Grid,
  Breadcrumb,
  Popconfirm,
  Spin,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { getMessageTypeLabel } from '../../utils/messageTypes';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import { getAllTemplates, deleteTemplate } from '../../redux/slices/templateSlice';

const { useBreakpoint } = Grid;

export default function TemplatePage() {
  const { user, token } = useSelector(state => state.auth);
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const { templates, loading: templatesLoading, error: templatesError } = useSelector(state => state.templates);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllTemplates());
    }
  }, [user, dispatch]);

  const loadTemplates = async () => {
    try {
      await dispatch(getAllTemplates()).unwrap();
      toast.success('Templates refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh templates');
      console.error(err);
    }
  };



  const handleEdit = (template) => {
    navigate('/create-template', { state: { editingTemplate: template } });
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteTemplate({ id })).unwrap();
      toast.success('Template deleted successfully');
    } catch (err) {
      toast.error('Failed to delete template: ' + err);
    }
  };

  const typeColors = {
    plainText: THEME_CONSTANTS.colors.success,
    textWithAction: '#faad14',
    richCard: THEME_CONSTANTS.colors.primary,
    carousel: '#13c2c2',
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              background: '#e8f4fd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#000', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              ID: {record._id?.slice(-8) || 'N/A'}
            </div>
          </div>
        </div>
      ),
      width: '35%',
    },
    {
      title: 'Type',
      dataIndex: 'templateType',
      key: 'type',
      render: (type) => (
        <Tag
          style={{
            background: `${typeColors[type] || '#1890ff'}15`,
            color: typeColors[type] || '#1890ff',
            border: `1px solid ${typeColors[type] || '#1890ff'}`,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.01em'
          }}
        >
          {getMessageTypeLabel ? getMessageTypeLabel(type) : type}
        </Tag>
      ),
      width: '20%',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => {
        const createdDate = new Date(record.createdAt);
        const now = new Date();
        const secondsDiff = (now - createdDate) / 1000;
        return secondsDiff < 3 ? (
          <Tag color="processing">Processing</Tag>
        ) : (
          <Tag color="success">Active</Tag>
        );
      },
      width: '15%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="View Template">
            <Button
              type="text"
              size="medium"
              icon={<EyeOutlined style={{ fontSize: 20 }} />}
              onClick={() => handlePreview(record)}
              style={{ color: THEME_CONSTANTS.colors.primary }}
            />
          </Tooltip>
          <Tooltip title="Edit Template">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 20 }} />}
              onClick={() => handleEdit(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Delete Template">
            <Popconfirm
              title="Delete Template"
              description="Are you sure you want to delete this template?"
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ fontSize: 20 }} />}
                danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
      width: '20%',
    },
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{
        maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
        margin: '0 auto',
        padding: THEME_CONSTANTS.spacing.xl
      }}>
        {/* Enhanced Header Section */}
        <div style={{
          marginBottom: THEME_CONSTANTS.spacing.xxxl,
          paddingBottom: THEME_CONSTANTS.spacing.xl,
          borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`
        }}>
          <Breadcrumb style={{
            marginBottom: THEME_CONSTANTS.spacing.md,
            fontSize: '13px',
            fontFamily: THEME_CONSTANTS.typography.fontFamily,
            fontWeight: 500
          }}>
            <Breadcrumb.Item>
              <HomeOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
              <span style={{ color: THEME_CONSTANTS.colors.textMuted, letterSpacing: '-0.01em' }}>Home</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <span style={{
                color: THEME_CONSTANTS.colors.primary,
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}>
                Templates
              </span>
            </Breadcrumb.Item>
          </Breadcrumb>

          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={18}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={4} md={3} lg={3}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: THEME_CONSTANTS.colors.primaryLight,
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: THEME_CONSTANTS.shadow.md,
                    margin: '0 auto'
                  }}>
                    <FileTextOutlined style={{
                      color: THEME_CONSTANTS.colors.primary,
                      fontSize: '32px'
                    }} />
                  </div>
                </Col>
                <Col xs={24} sm={20} md={21} lg={21}>
                  <div>
                    <h1 style={{
                      fontSize: '34px',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: '10px',
                      lineHeight: 1.2,
                      fontFamily: THEME_CONSTANTS.typography.fontFamily,
                      letterSpacing: '-0.03em'
                    }}>
                      Message Templates 📝
                    </h1>
                    <p style={{
                      color: '#64748b',
                      fontSize: '15px',
                      fontWeight: 450,
                      lineHeight: 1.6,
                      margin: 0,
                      fontFamily: THEME_CONSTANTS.typography.fontFamily,
                      letterSpacing: '-0.01em'
                    }}>
                      Create, manage and organize your message templates for quick campaign creation.
                    </p>
                  </div>
                </Col>
              </Row>
            </Col>
            <Col xs={24} lg={6}>
              <div style={{ textAlign: screens.lg ? 'right' : 'left' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/create-template')}
                    style={{
                      background: THEME_CONSTANTS.colors.primary,
                      border: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      height: '44px',
                      padding: '0 24px',
                      fontSize: '15px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Create Template
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadTemplates}
                    loading={templatesLoading}
                    style={{
                      height: '44px',
                      padding: '0 20px',
                      fontSize: '15px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                  >
                    Refresh
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        {/* Templates Table */}
        <Card
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            border: 'none',
            boxShadow: THEME_CONSTANTS.shadow.base,
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: THEME_CONSTANTS.spacing.lg,
              flexWrap: 'wrap',
              gap: THEME_CONSTANTS.spacing.md
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: THEME_CONSTANTS.typography.h5.size,
                fontWeight: THEME_CONSTANTS.typography.h5.weight,
                color: THEME_CONSTANTS.colors.text,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: '-0.01em'
              }}
            >
              All Templates ({templates.length})
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {templatesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Loading templates...
                </p>
              </div>
            ) : templates.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: `${THEME_CONSTANTS.colors.textSecondary}40`, marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
                  No templates found
                </p>
                <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Create your first template to get started
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/create-template')}
                  style={{
                    marginTop: '16px',
                    background: THEME_CONSTANTS.colors.primary,
                    border: 'none',
                  }}
                >
                  Create Template
                </Button>
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={templates}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} templates`,
                }}
                style={{ borderCollapse: 'collapse' }}
                scroll={{ x: 800 }}
              />
            )}
          </div>
        </Card>

        {/* Preview Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
              <EyeOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
              <span>Template Preview - {previewTemplate?.name}</span>
            </div>
          }
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          footer={null}
          width={480}
          bodyStyle={{ padding: '24px', background: '#f5f7fa' }}
          centered
        >
          {previewTemplate && <RCSMessagePreview data={previewTemplate} />}
        </Modal>
      </div>
    </div>
  );
}