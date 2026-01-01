import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Layout,
  Form,
  Input,
  Select,
  Card,
  Button,
  Upload,
  Table,
  Modal,
  Space,
  Tooltip,
  Empty,
  Divider,
  Row,
  Col,
  Tag,
  Grid,
  Breadcrumb,
  Tabs,
  Popconfirm,
  Spin,
  Progress,
  Slider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CloudUploadOutlined,
  HomeOutlined,
  FileTextOutlined,
  FormOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PhoneOutlined,
  LinkOutlined,
  MessageOutlined,
  MobileOutlined,
  DownloadOutlined,
  ClearOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  BorderOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';
import { getMessageTypeLabel } from '../../utils/messageTypes';
import toast from 'react-hot-toast';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import ImageCropper from '../../components/ImageCropper';
import { createTemplate, updateTemplate, fetchUserTemplates } from '../../redux/slices/templateSlice';
import { uploadFile } from '../../redux/slices/uploadSlice';

const { useBreakpoint } = Grid;

export default function CreateTemplatePage() {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Redux state
  const { loading: templateLoading, error: templateError } = useSelector(state => state.templates);
  const { loading: uploadLoading, currentUpload } = useSelector(state => state.upload);

  // Get editing template from location state if coming from edit
  const editingTemplateFromState = location.state?.editingTemplate;

  // Form states
  const [editingTemplate, setEditingTemplate] = useState(editingTemplateFromState || null);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    imageUrl: '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [messageType, setMessageType] = useState('text');
  const [actions, setActions] = useState([{ type: 'reply', title: '', payload: '' }]);
  const [richCard, setRichCard] = useState({ 
    title: '', 
    subtitle: '', 
    imageUrl: '', 
    actions: [],
    mediaFile: null 
  });
  const [carouselItems, setCarouselItems] = useState([
    { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }
  ]);
  const [carouselSuggestions, setCarouselSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');
  // Initialize form data when editing template changes
  React.useEffect(() => {
    if (editingTemplateFromState) {
      setEditingTemplate(editingTemplateFromState);
      setFormData({
        name: editingTemplateFromState.name || '',
        text: editingTemplateFromState.text || editingTemplateFromState.content?.body || editingTemplateFromState.content?.text || '',
        imageUrl: editingTemplateFromState.imageUrl || editingTemplateFromState.content?.imageUrl || '',
      });
      setMessageType(editingTemplateFromState.templateType === 'plainText' ? 'text' :
                    editingTemplateFromState.templateType === 'textWithAction' ? 'text-with-action' :
                    editingTemplateFromState.templateType === 'richCard' ? 'rcs' : 'carousel');
      
      // Set actions for text-with-action
      if (editingTemplateFromState.templateType === 'textWithAction' && editingTemplateFromState.content?.buttons) {
        setActions(editingTemplateFromState.content.buttons.map(btn => ({
          type: btn.actionType === 'openUri' ? 'url' : btn.actionType === 'dialPhone' ? 'call' : 'reply',
          title: btn.label || '',
          payload: btn.value || btn.uri || ''
        })));
      }
      
      // Set rich card data
      if (editingTemplateFromState.templateType === 'richCard' && editingTemplateFromState.content) {
        setRichCard({
          title: editingTemplateFromState.content.title || '',
          subtitle: editingTemplateFromState.content.subtitle || editingTemplateFromState.content.description || '',
          imageUrl: editingTemplateFromState.content.imageUrl || '',
          actions: editingTemplateFromState.content.actions?.map(action => ({
            type: action.actionType === 'openUri' ? 'url' : action.actionType === 'dialPhone' ? 'call' : 'reply',
            title: action.label || '',
            payload: action.uri || ''
          })) || [],
          mediaFile: null
        });
      }
      
      // Set carousel data
      if (editingTemplateFromState.templateType === 'carousel' && editingTemplateFromState.content?.cards) {
        setCarouselItems(editingTemplateFromState.content.cards.map(card => ({
          title: card.title || '',
          subtitle: card.subtitle || card.description || '',
          imageUrl: card.imageUrl || '',
          actions: card.actions?.map(action => ({
            type: action.actionType === 'openUri' ? 'url' : action.actionType === 'dialPhone' ? 'call' : 'reply',
            title: action.label || '',
            payload: action.uri || ''
          })) || [],
          mediaFile: null
        })));
      }
    }
  }, [editingTemplateFromState]);

  // Upload states
  const [uploadingIndexes, setUploadingIndexes] = useState(new Set());
  
  // Image cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState(null);
  const [cropperTarget, setCropperTarget] = useState({ type: 'main', index: null });
  const [cropperLoading, setCropperLoading] = useState(false);

  // Preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Handle image selection for cropping
  const handleImageSelect = (file, targetType = 'main', index = null) => {
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCropperImageUrl(imageUrl);
      setCropperTarget({ type: targetType, index, file });
      setCropperOpen(true);
      return false; // Prevent default upload
    }
  };

  // Handle crop completion
  const handleCropComplete = async (croppedFile, cropData) => {
    if (!croppedFile) return;
    
    setCropperLoading(true);
    try {
      const url = await uploadFileToServer(croppedFile);
      
      if (url) {
        const { type, index } = cropperTarget;
        
        if (type === 'main') {
          setFormData(prev => ({ ...prev, imageUrl: url }));
        } else if (type === 'rich_card') {
          setRichCard(prev => ({ ...prev, imageUrl: url }));
        } else if (type === 'carousel' && index !== null) {
          setCarouselItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], imageUrl: url };
            return updated;
          });
        }
        
        toast.success('✅ Image cropped and uploaded successfully!');
        setCropperOpen(false);
        setCropperImageUrl(null);
        if (cropperImageUrl) {
          URL.revokeObjectURL(cropperImageUrl);
        }
      }
    } catch (error) {
      toast.error('❌ Failed to upload image: ' + error.message);
    } finally {
      setCropperLoading(false);
    }
  };

  // Handle cropper cancel
  const handleCropperCancel = () => {
    setCropperOpen(false);
    setCropperImageUrl(null);
    if (cropperImageUrl) {
      URL.revokeObjectURL(cropperImageUrl);
    }
  };

  const uploadFileToServer = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await dispatch(uploadFile(formData)).unwrap();
      
      if (result.success && result.data?.url) {
        return result.data.url;
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.includes('Session expired')) {
        toast.error('Session expired. Please login again.');
        return null;
      }
      
      toast.error('File upload failed: ' + error);
      return null;
    }
  };

  const handleSaveTemplate = async () => {
    try {
      // Check authentication first
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      if (!formData.name.trim()) {
        toast.error('Please enter template name');
        return;
      }

      // Validate actions have titles for text-with-action
      const validActions = messageType === 'text-with-action' 
        ? actions.filter(action => action.title && action.title.trim())
        : [];
      
      if (messageType === 'text-with-action' && validActions.length === 0) {
        toast.error('At least one action button is required for text with actions');
        return;
      }
      
      // Validate carousel items
      let validCarouselItems = [];
      if (messageType === 'carousel') {
        validCarouselItems = carouselItems.map(item => ({
          ...item,
          actions: item.actions.filter(action => action.title && action.title.trim())
        })).filter(item => item.title && item.title.trim() && item.actions.length > 0);
        
        if (validCarouselItems.length === 0) {
          toast.error('At least one carousel item with title and actions is required');
          return;
        }
      }

      // Validate rich card actions
      let validRichCard = null;
      if (messageType === 'rcs') {
        if (!richCard.title || !richCard.title.trim()) {
          toast.error('Rich card title is required');
          return;
        }
        validRichCard = {
          ...richCard,
          actions: richCard.actions.filter(action => action.title && action.title.trim())
        };
      }

      // Build content object based on template type
      let content = {};
      
      if (messageType === 'text') {
        content = { body: formData.text };
      } else if (messageType === 'text-with-action') {
        content = {
          text: formData.text,
          buttons: validActions.map(a => ({
            label: a.title,
            value: a.payload,
            actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
          }))
        };
      } else if (messageType === 'rcs') {
        content = {
          title: richCard.title,
          subtitle: richCard.subtitle,
          description: richCard.subtitle,
          imageUrl: richCard.imageUrl,
          actions: validRichCard?.actions?.map(a => ({
            label: a.title,
            uri: a.payload,
            actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
          })) || []
        };
      } else if (messageType === 'carousel') {
        content = {
          cards: validCarouselItems.map(item => ({
            title: item.title,
            subtitle: item.subtitle,
            description: item.subtitle,
            imageUrl: item.imageUrl,
            actions: item.actions.map(a => ({
              label: a.title,
              uri: a.payload,
              actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
            }))
          }))
        };
      }

      const templateData = {
        name: formData.name,
        description: formData.text || richCard.subtitle || '',
        templateType: messageType === 'text' ? 'plainText' : 
                     messageType === 'text-with-action' ? 'textWithAction' :
                     messageType === 'rcs' ? 'richCard' : 'carousel',
        content
      };

      let result;
      if (editingTemplate) {
        console.log('Updating template with data:', templateData);
        result = await dispatch(updateTemplate({ 
          id: editingTemplate._id, 
          ...templateData 
        })).unwrap();
        console.log('Update result:', result);
        toast.success('Template updated successfully');
      } else {
        console.log('Creating template with data:', templateData);
        result = await dispatch(createTemplate(templateData)).unwrap();
        console.log('Create result:', result);
        toast.success('Template created successfully');
      }

      // Reset form
      setFormData({ name: '', text: '', imageUrl: '' });
      setMessageType('text');
      setActions([{ type: 'reply', title: '', payload: '' }]);
      setRichCard({ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null });
      setCarouselItems([{ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
      setEditingTemplate(null);
      form.resetFields();

      // Navigate back to templates list
      setTimeout(() => {
        navigate('/templates');
      }, 1500);
    } catch (error) {
      console.error('Template save error:', error);
      toast.error('Failed to save template: ' + (error?.message || error));
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, text: e.target.value });
  };

  const handleNameChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };

 


  const handleActionChange = (index, field, value) => {
    const updated = [...actions];
    updated[index][field] = value;
    setActions(updated);
  };

  const handleAddAction = () => {
    setActions([...actions, { type: 'reply', title: '', payload: '' }]);
  };

  const handleRemoveAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleRichCardActionChange = (index, field, value) => {
    const updated = [...richCard.actions];
    updated[index][field] = value;
    setRichCard({ ...richCard, actions: updated });
  };

  const handleAddRichCardAction = () => {
    setRichCard({
      ...richCard,
      actions: [...richCard.actions, { type: 'reply', title: '', payload: '' }]
    });
  };

  const handleRemoveRichCardAction = (index) => {
    setRichCard({
      ...richCard,
      actions: richCard.actions.filter((_, i) => i !== index)
    });
  };

  const handleCarouselItemChange = (index, field, value) => {
    const updated = [...carouselItems];
    updated[index][field] = value;
    setCarouselItems(updated);
  };

  const handleAddCarouselItem = () => {
    setCarouselItems([
      ...carouselItems,
      { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }
    ]);
  };

  const handleRemoveCarouselItem = (index) => {
    setCarouselItems(carouselItems.filter((_, i) => i !== index));
  };

  const handleCarouselActionChange = (itemIndex, actionIndex, field, value) => {
    const updated = [...carouselItems];
    updated[itemIndex].actions[actionIndex][field] = value;
    setCarouselItems(updated);
  };

  const handleAddCarouselAction = (index) => {
    const updated = [...carouselItems];
    updated[index].actions.push({ type: 'reply', title: '', payload: '' });
    setCarouselItems(updated);
  };

  const handleRemoveCarouselAction = (itemIndex, actionIndex) => {
    const updated = [...carouselItems];
    updated[itemIndex].actions = updated[itemIndex].actions.filter((_, i) => i !== actionIndex);
    setCarouselItems(updated);
  };

  const handleCarouselSuggestionChange = (index, value) => {
    const updated = [...carouselSuggestions];
    updated[index] = value;
    setCarouselSuggestions(updated);
  };

  const handleAddCarouselSuggestion = () => {
    setCarouselSuggestions([...carouselSuggestions, '']);
  };

  const handleRemoveCarouselSuggestion = (index) => {
    setCarouselSuggestions(carouselSuggestions.filter((_, i) => i !== index));
  };

  const handleShowPreview = () => {
    const previewTemplateData = {
      _id: editingTemplate?._id,
      name: formData.name,
      messageType,
      text: formData.text,
      actions: messageType === 'text-with-action' ? actions : [],
      richCard: messageType === 'rcs' ? richCard : null,
      carouselItems: messageType === 'carousel' ? carouselItems : null,
      carouselSuggestions: messageType === 'carousel' ? carouselSuggestions : null,
    };
    setPreviewData(previewTemplateData);
    setPreviewOpen(true);
  };

  const renderTextTemplateForm = () => (
    <Card style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
      <Form layout="vertical">
        <Form.Item label="Template Name" required>
          <Input
            placeholder="e.g., Welcome Message"
            value={formData.name}
            onChange={handleNameChange}
            style={{
              borderRadius: THEME_CONSTANTS.radius.md,
              padding: '8px 12px',
            }}
          />
        </Form.Item>

        <Form.Item label="Message Text" required>
          <Input.TextArea
            rows={6}
            placeholder="Enter your message text here..."
            value={formData.text}
            onChange={handleTextChange}
            style={{ borderRadius: THEME_CONSTANTS.radius.md }}
          />
        </Form.Item>


      </Form>
    </Card>
  );

  const renderTextWithActionForm = () => (
    <Card style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
      <Form layout="vertical">
        <Form.Item label="Template Name" required>
          <Input
            placeholder="e.g., Welcome with Actions"
            value={formData.name}
            onChange={handleNameChange}
            style={{
              borderRadius: THEME_CONSTANTS.radius.md,
              padding: '8px 12px',
            }}
          />
        </Form.Item>

        <Form.Item label="Message Text" required>
          <Input.TextArea
            rows={6}
            placeholder="Enter your message text here..."
            value={formData.text}
            onChange={handleTextChange}
            style={{ borderRadius: THEME_CONSTANTS.radius.md }}
          />
        </Form.Item>

        <Form.Item label="Action Buttons" required>
          <Space direction="vertical" style={{ width: '100%' }}>
            {actions.map((action, index) => (
              <div key={index} style={{
                padding: THEME_CONSTANTS.spacing.md,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                borderRadius: THEME_CONSTANTS.radius.md,
                display: 'flex',
                gap: THEME_CONSTANTS.spacing.md,
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 0.5, minWidth: '120px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Action Type
                  </label>
                  <Select
                    value={action.type}
                    onChange={(value) => handleActionChange(index, 'type', value)}
                    style={{ marginTop: '4px', width: '100%' }}
                    options={[
                      { label: 'Reply', value: 'reply' },
                      { label: 'URL', value: 'url' },
                      { label: 'Call', value: 'call' },
                    ]}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Button Title
                  </label>
                  <Input
                    placeholder="e.g., Learn More"
                    value={action.title}
                    onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    {action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone Number' : 'Payload'}
                  </label>
                  <Input
                    placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                    value={action.payload}
                    onChange={(e) => handleActionChange(index, 'payload', e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                {actions.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAction(index)}
                  />
                )}
              </div>
            ))}
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={handleAddAction}
            >
              Add Action Button
            </Button>
          </Space>
        </Form.Item>

        <Form.Item label="Suggestions">
          <Space direction="vertical" style={{ width: '100%' }}>
            {actions.map((action, index) => (
              <Input
                key={index}
                placeholder={`Suggestion ${index + 1}`}
                value={action.suggestion || ''}
                onChange={(e) => handleActionChange(index, 'suggestion', e.target.value)}
              />
            ))}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );


  const renderRichCardForm = () => (
    <Card style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
      <Form layout="vertical">
        <Form.Item label="Template Name" required>
          <Input
            placeholder="e.g., Rich Card"
            value={formData.name}
            onChange={handleNameChange}
            style={{
              borderRadius: THEME_CONSTANTS.radius.md,
              padding: '8px 12px',
            }}
          />
        </Form.Item>

        <Form.Item label="Card Title" required>
          <Input
            placeholder="e.g., Product Details"
            value={richCard.title}
            onChange={(e) => setRichCard({ ...richCard, title: e.target.value })}
            style={{
              borderRadius: THEME_CONSTANTS.radius.md,
              padding: '8px 12px',
            }}
          />
        </Form.Item>

        <Form.Item label="Card Subtitle">
          <Input
            placeholder="e.g., Limited Time Offer"
            value={richCard.subtitle}
            onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
            style={{
              borderRadius: THEME_CONSTANTS.radius.md,
              padding: '8px 12px',
            }}
          />
        </Form.Item>

        <Form.Item label="Card Image">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => handleImageSelect(file, 'rich_card')}
              listType="picture-card"
              showUploadList={false}
            >
              <div style={{ textAlign: 'center' }}>
                <CloudUploadOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div>📸 Upload & Crop Image</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Click to select and crop</div>
              </div>
            </Upload>
            {richCard.imageUrl && (
              <div style={{ position: 'relative' }}>
                <img
                  src={richCard.imageUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    marginTop: '12px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: '2px solid #e9ecef',
                  }}
                />
                <Button
                  size="small"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) handleImageSelect(file, 'rich_card');
                    };
                    input.click();
                  }}
                >
                  ✂️ Re-crop
                </Button>
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item label="Card Actions">
          <Space direction="vertical" style={{ width: '100%' }}>
            {richCard.actions.map((action, index) => (
              <div key={index} style={{
                padding: THEME_CONSTANTS.spacing.md,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                borderRadius: THEME_CONSTANTS.radius.md,
                display: 'flex',
                gap: THEME_CONSTANTS.spacing.md,
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 0.5, minWidth: '120px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Action Type
                  </label>
                  <Select
                    value={action.type}
                    onChange={(value) => handleRichCardActionChange(index, 'type', value)}
                    style={{ marginTop: '4px', width: '100%' }}
                    options={[
                      { label: 'Reply', value: 'reply' },
                      { label: 'URL', value: 'url' },
                      { label: 'Call', value: 'call' },
                    ]}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Action Title
                  </label>
                  <Input
                    placeholder="e.g., View Details"
                    value={action.title}
                    onChange={(e) => handleRichCardActionChange(index, 'title', e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    {action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone Number' : 'Payload'}
                  </label>
                  <Input
                    placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                    value={action.payload}
                    onChange={(e) => handleRichCardActionChange(index, 'payload', e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                {richCard.actions.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveRichCardAction(index)}
                  />
                )}
              </div>
            ))}
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={handleAddRichCardAction}
            >
              Add Action
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderCarouselForm = () => (
    <Card style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
      <Form layout="vertical">
        <Form.Item label="Template Name" required>
          <Input
            placeholder="e.g., Product Carousel"
            value={formData.name}
            onChange={handleNameChange}
            style={{
              borderRadius: THEME_CONSTANTS.radius.md,
              padding: '8px 12px',
            }}
          />
        </Form.Item>

        <Divider orientation="left">Carousel Items</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          {carouselItems.map((item, itemIndex) => (
            <Card
              key={itemIndex}
              style={{
                border: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`,
                borderRadius: THEME_CONSTANTS.radius.md,
              }}
              title={`Item ${itemIndex + 1}`}
              extra={
                carouselItems.length > 1 && (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveCarouselItem(itemIndex)}
                  >
                    Remove
                  </Button>
                )
              }
            >
              <Form layout="vertical">
                <Form.Item label="Item Title">
                  <Input
                    placeholder="e.g., Product 1"
                    value={item.title}
                    onChange={(e) => handleCarouselItemChange(itemIndex, 'title', e.target.value)}
                  />
                </Form.Item>

                <Form.Item label="Item Subtitle">
                  <Input
                    placeholder="e.g., Description"
                    value={item.subtitle}
                    onChange={(e) => handleCarouselItemChange(itemIndex, 'subtitle', e.target.value)}
                  />
                </Form.Item>

                <Form.Item label="Item Image">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Upload
                      accept="image/*"
                      maxCount={1}
                      beforeUpload={(file) => handleImageSelect(file, 'carousel', itemIndex)}
                      listType="picture-card"
                      showUploadList={false}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <CloudUploadOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                        <div>📸 Upload & Crop Image</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Click to select and crop</div>
                      </div>
                    </Upload>
                    {item.imageUrl && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={item.imageUrl}
                          alt="Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            marginTop: '12px',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            border: '2px solid #e9ecef',
                          }}
                        />
                        <Button
                          size="small"
                          style={{
                            position: 'absolute',
                            top: '16px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none'
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) handleImageSelect(file, 'carousel', itemIndex);
                            };
                            input.click();
                          }}
                        >
                          ✂️ Re-crop
                        </Button>
                      </div>
                    )}
                  </div>
                </Form.Item>

                <Form.Item label="Item Actions">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {item.actions.map((action, actionIndex) => (
                      <div key={actionIndex} style={{
                        padding: THEME_CONSTANTS.spacing.md,
                        border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        gap: THEME_CONSTANTS.spacing.md,
                        flexWrap: 'wrap',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{ flex: 0.5, minWidth: '120px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                            Action Type
                          </label>
                          <Select
                            value={action.type}
                            onChange={(value) => handleCarouselActionChange(itemIndex, actionIndex, 'type', value)}
                            style={{ marginTop: '4px', width: '100%' }}
                            options={[
                              { label: 'Reply', value: 'reply' },
                              { label: 'URL', value: 'url' },
                              { label: 'Call', value: 'call' },
                            ]}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                            Action Title
                          </label>
                          <Input
                            placeholder="e.g., Buy"
                            value={action.title}
                            onChange={(e) => handleCarouselActionChange(itemIndex, actionIndex, 'title', e.target.value)}
                            style={{ marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                            {action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone Number' : 'Payload'}
                          </label>
                          <Input
                            placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                            value={action.payload}
                            onChange={(e) => handleCarouselActionChange(itemIndex, actionIndex, 'payload', e.target.value)}
                            style={{ marginTop: '4px' }}
                          />
                        </div>
                        {item.actions.length > 1 && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveCarouselAction(itemIndex, actionIndex)}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => handleAddCarouselAction(itemIndex)}
                    >
                      Add Action
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          ))}

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddCarouselItem}
          >
            Add Carousel Item
          </Button>
        </Space>

        <Divider orientation="left">Carousel Suggestions</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          {carouselSuggestions.map((suggestion, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: THEME_CONSTANTS.spacing.md,
              flexWrap: 'wrap',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Input
                  placeholder="e.g., View All Products"
                  value={suggestion}
                  onChange={(e) => handleCarouselSuggestionChange(index, e.target.value)}
                />
              </div>
              {carouselSuggestions.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveCarouselSuggestion(index)}
                />
              )}
            </div>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddCarouselSuggestion}
          >
            Add Suggestion
          </Button>
        </Space>
      </Form>
    </Card>
  );

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
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
            fontSize: THEME_CONSTANTS.typography.caption.size
          }}>
            <Breadcrumb.Item>
              <HomeOutlined style={{ marginRight: '6px' }} />
              <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Home</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <span 
                onClick={() => navigate('/templates')}
                style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight,
                  cursor: 'pointer'
                }}
              >
                Templates
              </span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <span style={{ 
                color: THEME_CONSTANTS.colors.primary,
                fontWeight: THEME_CONSTANTS.typography.h6.weight
              }}>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
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
                    <FormOutlined style={{
                      color: THEME_CONSTANTS.colors.primary,
                      fontSize: '32px'
                    }} />
                  </div>
                </Col>
                <Col xs={24} sm={20} md={21} lg={21}>
                  <div>
                    <h1 style={{
                      fontSize: THEME_CONSTANTS.typography.h1.size,
                      fontWeight: THEME_CONSTANTS.typography.h1.weight,
                      color: THEME_CONSTANTS.colors.text,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                    }}>
                      {editingTemplate ? '✏️ Edit Template' : '➕ Create New Template'}
                    </h1>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size,
                      fontWeight: 500,
                      lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                      margin: 0
                    }}>
                      {editingTemplate 
                        ? 'Modify your message template settings' 
                        : 'Create a new message template for your campaigns'}
                    </p>
                  </div>
                </Col>
              </Row>
            </Col>
            <Col xs={24} lg={6}>
              <div style={{ textAlign: screens.lg ? 'right' : 'left' }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/templates')}
                >
                  Back to Templates
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Main Form Area */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* Message Type Selection */}
            <Card style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
              <Form.Item label="Select Message Type" required>
                <Select
                  value={messageType}
                  onChange={setMessageType}
                  options={[
                    { label: 'Text Message', value: 'text' },
                    { label: 'Text with Actions', value: 'text-with-action' },
                    { label: 'Rich Card', value: 'rcs' },
                    { label: 'Carousel', value: 'carousel' },
                  ]}
                  style={{ height: '40px' }}
                />
              </Form.Item>
            </Card>

            {/* Conditional Forms */}
            {messageType === 'text' && renderTextTemplateForm()}
            {messageType === 'text-with-action' && renderTextWithActionForm()}
            {messageType === 'rcs' && renderRichCardForm()}
            {messageType === 'carousel' && renderCarouselForm()}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: THEME_CONSTANTS.spacing.md, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                size="large"
                loading={templateLoading}
                onClick={handleSaveTemplate}
                style={{
                  background: THEME_CONSTANTS.colors.primary,
                  border: 'none',
                  fontWeight: THEME_CONSTANTS.typography.label.weight,
                  borderRadius: THEME_CONSTANTS.radius.md,
                }}
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </Button>
              <Button
                size="large"
                onClick={handleShowPreview}
                style={{
                  border: `2px solid ${THEME_CONSTANTS.colors.primary}`,
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.label.weight,
                  borderRadius: THEME_CONSTANTS.radius.md,
                }}
              >
                Preview Template
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/templates')}
                style={{
                  fontWeight: THEME_CONSTANTS.typography.label.weight,
                  borderRadius: THEME_CONSTANTS.radius.md,
                }}
              >
                Cancel
              </Button>
            </div>
          </Col>

          {/* Preview Column */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: 'none',
                boxShadow: THEME_CONSTANTS.shadow.base,
                position: 'sticky',
                top: '20px'
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EyeOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                  <span>Live Preview</span>
                </div>
              }
            >
              <div style={{ 
                minHeight: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden',
                width: '100%'
              }}>
                <div style={{ width: '100%', maxWidth: '100%' }}>
                  <RCSMessagePreview 
                    data={{
                      _id: editingTemplate?._id,
                      name: formData.name,
                      messageType,
                      text: formData.text,
                      actions: messageType === 'text-with-action' ? actions : [],
                      richCard: messageType === 'rcs' ? richCard : null,
                      carouselItems: messageType === 'carousel' ? carouselItems : null,
                      carouselSuggestions: messageType === 'carousel' ? carouselSuggestions : null,
                    }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        open={cropperOpen}
        onCancel={handleCropperCancel}
        onCropComplete={handleCropComplete}
        imageUrl={cropperImageUrl}
        loading={cropperLoading}
        messageType={messageType === 'rcs' ? 'richCard' : messageType === 'carousel' ? 'carousel' : 'richCard'}
      />

      {/* Full Preview Modal */}
      {previewOpen && previewData && (
        <Modal
          title={
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                Full Template Preview
              </div>
              <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                {getMessageTypeLabel ? getMessageTypeLabel(previewData.messageType) : previewData.messageType}
              </div>
            </div>
          }
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          width={800}
          footer={null}
          bodyStyle={{ padding: '24px' }}
          style={{ maxWidth: '90vw' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            maxHeight: '600px',
            overflowY: 'auto',
            width: '100%'
          }}>
            <div style={{ width: '100%', maxWidth: '100%' }}>
              <RCSMessagePreview data={previewData} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}