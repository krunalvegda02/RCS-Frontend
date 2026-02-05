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
  MessageOutlined,
  FileImageOutlined,
  AppstoreOutlined,
  MailOutlined,
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
  const { templates, loading: templatesLoading, pagination: templatesPagination } = useSelector(state => state.templates);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllTemplates({ page: currentPage, limit: pageSize }));
    }
  }, [user, dispatch, currentPage, pageSize]);

  const loadTemplates = async () => {
    try {
      await dispatch(getAllTemplates({ page: currentPage, limit: pageSize })).unwrap();
      toast.success('Templates refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh templates');
      console.error(err);
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'plainText':
        return <MessageOutlined />;
      case 'textWithAction':
        return <MailOutlined />;
      case 'richCard':
        return <FileImageOutlined />;
      case 'carousel':
        return <AppstoreOutlined />;
      default:
        return <MessageOutlined />;
    }
  };



  const handleEdit = (template) => {
    navigate('/dashboard/create-template', { state: { editingTemplate: template } });
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

  const MESSAGE_TYPES = {
    plainText: 'Plain Text',
    textWithAction: 'Text with Actions',
    richCard: 'Rich Card',
    carousel: 'Carousel',
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: THEME_CONSTANTS.colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {React.cloneElement(getMessageTypeIcon(record.templateType), {
              style: { fontSize: '18px', color: THEME_CONSTANTS.colors.primary }
            })}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text, fontSize: '14px', lineHeight: '20px' }}>{text}</div>
            <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '2px', lineHeight: '16px' }}>
              {MESSAGE_TYPES[record.templateType] || record.templateType}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Content Preview',
      key: 'content',
      render: (_, record) => {
        let preview = '';
        let fullContent = '';
        let cardCount = 0;
        
        if (record.templateType === 'plainText') {
          preview = record.content?.body || record.content?.text || record.description || 'No content';
          fullContent = preview;
        } else if (record.templateType === 'richCard') {
          const title = record.content?.title || '';
          const desc = record.content?.description || record.content?.subtitle || '';
          preview = title;
          fullContent = `${title}${desc ? ' - ' + desc : ''}`;
        } else if (record.templateType === 'carousel') {
          const cards = record.content?.cards || [];
          cardCount = cards.length;
          if (cards.length > 0) {
            const cardPreviews = cards.map((card, idx) => 
              `Card ${idx + 1}: ${card.title || 'Untitled'}${card.description || card.subtitle ? ' - ' + (card.description || card.subtitle) : ''}` 
            ).join(' | ');
            preview = cards.map(c => c.title).filter(Boolean).join(', ');
            fullContent = cardPreviews;
          } else {
            preview = 'No cards';
            fullContent = preview;
          }
        } else if (record.templateType === 'textWithAction') {
          preview = record.content?.body || record.content?.text || record.description || 'No content';
          fullContent = preview;
        }
        
        return (
          <Tooltip title={<div style={{ whiteSpace: 'pre-wrap', maxWidth: '400px' }}>{fullContent}</div>}>
            <div style={{ 
              fontSize: '13px', 
              color: THEME_CONSTANTS.colors.textSecondary, 
              lineHeight: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {record.templateType === 'carousel' && cardCount > 0 && (
                <span style={{
                  background: THEME_CONSTANTS.colors.primaryLight,
                  color: THEME_CONSTANTS.colors.primary,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  border: `1px solid ${THEME_CONSTANTS.colors.primary}`
                }}>
                  {cardCount} Cards
                </span>
              )}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview?.substring(0, 50) || 'No content'}
                {preview?.length > 50 && '...'}
              </span>
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'templateType',
      key: 'type',
      width: 160,
      align: 'center',
      render: (type) => (
        <Tag 
          icon={getMessageTypeIcon(type)}
          style={{ 
            padding: '6px 16px', 
            fontSize: '12px', 
            fontWeight: 600, 
            borderRadius: '8px', 
            width: '145px',
            textAlign: 'center', 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: THEME_CONSTANTS.colors.primaryLight,
            color: THEME_CONSTANTS.colors.primary,
            border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
            letterSpacing: '-0.01em'
          }}
        >
          {MESSAGE_TYPES[type] || type}
        </Tag>
      )
    },
    // {
    //   title: 'Usage',
    //   dataIndex: 'usageCount',
    //   key: 'usage',
    //   width: 90,
    //   align: 'center',
    //   render: (count) => (
    //     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
    //       <span style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>
    //         {count || 0}
    //       </span>
    //       <span style={{ fontSize: '10px', color: THEME_CONSTANTS.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    //         times
    //       </span>
    //     </div>
    //   )
    // },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      align: 'center',
      render: (date) => {
        const dateObj = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - dateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return (
          <Tooltip title={dateObj.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>
                {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
                {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`}
              </span>
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: '18px' }} />}
              onClick={() => handlePreview(record)}
              style={{ color: THEME_CONSTANTS.colors.primary, padding: '4px 8px' }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: '18px' }} />}
              onClick={() => handleEdit(record)}
              style={{ color: '#1890ff', padding: '4px 8px' }}
            />
          </Tooltip>
          <Tooltip title="Delete">
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
                icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
                danger
                style={{ padding: '4px 8px' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: THEME_CONSTANTS.colors.primaryLight,
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: THEME_CONSTANTS.shadow.md,
                  flexShrink: 0
                }}>
                  <FileTextOutlined style={{
                    color: THEME_CONSTANTS.colors.primary,
                    fontSize: '32px'
                  }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: THEME_CONSTANTS.typography.h1.size,
                    fontWeight: THEME_CONSTANTS.typography.h1.weight,
                    color: THEME_CONSTANTS.colors.text,
                    marginBottom: THEME_CONSTANTS.spacing.sm,
                    lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                  }}>
                    Message Templates
                  </h1>
                  <p style={{
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontSize: THEME_CONSTANTS.typography.body.size,
                    fontWeight: 500,
                    lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                    margin: 0
                  }}>
                    Create, manage and organize your message templates for quick campaign creation.
                  </p>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={6}>
              <div style={{ textAlign: screens.lg ? 'right' : 'left' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/dashboard/create-template')}
                    style={{
                      background: THEME_CONSTANTS.colors.primary,
                      borderColor: THEME_CONSTANTS.colors.primary,
                      height: '44px',
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
                fontFamily: THEME_CONSTANTS.typography.fontFamily,
                letterSpacing: '-0.01em'
              }}
            >
              All Templates ({templatesPagination?.total || 0})
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
                <p style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, margin: 0, fontFamily: THEME_CONSTANTS.typography.fontFamily, letterSpacing: '-0.01em' }}>
                  No templates found
                </p>
                <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0', fontFamily: THEME_CONSTANTS.typography.fontFamily }}>
                  Create your first template to get started
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/dashboard/create-template')}
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
                loading={templatesLoading}
                pagination={{
                  current: templatesPagination?.page || 1,
                  pageSize: templatesPagination?.limit || 10,
                  total: templatesPagination?.total || 0,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} templates`,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                    dispatch(getAllTemplates({ page, limit: size }));
                  },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600, fontFamily: THEME_CONSTANTS.typography.fontFamily, letterSpacing: '-0.01em' }}>
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