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
  Modal,
  Space,
  Divider,
  Row,
  Col,
  Grid,
  Breadcrumb,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  HomeOutlined,
  FormOutlined,
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



  const handleShowPreview = () => {
    let content = {};

    if (messageType === 'text') {
      content = { body: formData.text };
    } else if (messageType === 'text-with-action') {
      content = {
        text: formData.text,
        buttons: actions.map(a => ({
          label: a.title,
          value: a.payload,
          actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
        }))
      };
    } else if (messageType === 'rcs') {
      content = {
        title: richCard.title,
        subtitle: richCard.subtitle,
        imageUrl: richCard.imageUrl,
        actions: richCard.actions.map(a => ({
          label: a.title,
          uri: a.payload,
          actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
        }))
      };
    } else if (messageType === 'carousel') {
      content = {
        cards: carouselItems.map(item => ({
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          actions: item.actions.map(a => ({
            label: a.title,
            uri: a.payload,
            actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
          }))
        }))
      };
    }

    const previewTemplateData = {
      _id: editingTemplate?._id,
      name: formData.name,
      templateType: messageType === 'text' ? 'plainText' :
        messageType === 'text-with-action' ? 'textWithAction' :
          messageType === 'rcs' ? 'richCard' : 'carousel',
      content
    };
    setPreviewData(previewTemplateData);
    setPreviewOpen(true);
  };

  const renderTextTemplateForm = () => (
    <Card style={{ marginBottom: '24px', border: '1px solid #e8e8e8', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Template Name <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input
          placeholder="e.g., Welcome Message"
          value={formData.name}
          onChange={handleNameChange}
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Message Text <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input.TextArea
          rows={8}
          placeholder="Enter your message text here..."
          value={formData.text}
          onChange={handleTextChange}
          style={{ fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0', lineHeight: '1.6' }}
        />
      </div>
    </Card>
  );

  const renderTextWithActionForm = () => (
    <Card style={{ marginBottom: '24px', border: '1px solid #e8e8e8', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Template Name <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input
          placeholder="e.g., Welcome with Actions"
          value={formData.name}
          onChange={handleNameChange}
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Message Text <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input.TextArea
          rows={8}
          placeholder="Enter your message text here..."
          value={formData.text}
          onChange={handleTextChange}
          style={{ fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0', lineHeight: '1.6' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '14px', display: 'block' }}>Action Buttons <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Space direction="vertical" style={{ width: '100%', gap: '16px' }}>
          {actions.map((action, index) => (
            <div key={index} style={{ padding: '24px', background: '#fafafa', border: '2px solid #e8e8e8', borderRadius: '12px' }}>
              <Row gutter={[16, 16]}>
                <Col span={24} md={6}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Type</label>
                  <Select
                    value={action.type}
                    onChange={(value) => handleActionChange(index, 'type', value)}
                    style={{ width: '100%', height: '48px' }}
                    options={[
                      { label: '💬 Reply', value: 'reply' },
                      { label: '🔗 URL', value: 'url' },
                      { label: '📞 Call', value: 'call' },
                    ]}
                  />
                </Col>
                <Col span={24} md={9}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Button Label</label>
                  <Input
                    placeholder="e.g., Learn More"
                    value={action.title}
                    onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                    style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </Col>
                <Col span={24} md={7}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>{action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone' : 'Payload'}</label>
                  <Input
                    placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                    value={action.payload}
                    onChange={(e) => handleActionChange(index, 'payload', e.target.value)}
                    style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </Col>
                {actions.length > 1 && (
                  <Col span={24} md={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveAction(index)} style={{ height: '48px', width: '100%' }} />
                  </Col>
                )}
              </Row>
            </div>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddAction}
            style={{ height: '52px', fontSize: '15px', fontWeight: 600, borderWidth: '2px', borderRadius: '10px' }}
          >
            Add Action Button
          </Button>
        </Space>
      </div>
    </Card>
  );


  const renderRichCardForm = () => (
    <Card style={{ marginBottom: '24px', border: '1px solid #e8e8e8', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Template Name <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input
          placeholder="e.g., Rich Card"
          value={formData.name}
          onChange={handleNameChange}
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Card Title <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input
          placeholder="e.g., Product Details"
          value={richCard.title}
          onChange={(e) => setRichCard({ ...richCard, title: e.target.value })}
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Card Subtitle</label>
        <Input
          placeholder="e.g., Limited Time Offer"
          value={richCard.subtitle}
          onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Card Image</label>
        {!richCard.imageUrl ? (
          <Upload
            accept="image/*"
            maxCount={1}
            beforeUpload={(file) => handleImageSelect(file, 'rich_card')}
            listType="picture-card"
            showUploadList={false}
            style={{ width: '100%', height: "140px", border: '1.5px dashed #d9d9d9', borderRadius: '12px', cursor: 'pointer' }}
          >
            <div style={{ padding: '40px 100px', textAlign: 'center' }}>
              <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px', marginTop: '20px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626', marginBottom: '6px' }}> Upload & Crop Image</div>
              <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '20px' }}>Click to select and crop your image</div>
            </div>
          </Upload>
        ) : (
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e8e8e8' }}>
            <img src={richCard.imageUrl} alt="Preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }} />
            <Button
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.75)', color: 'white', border: 'none', height: '40px', padding: '0 20px', fontWeight: 600 }}
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
              ✂️ Re-crop Image
            </Button>
          </div>
        )}
      </div>

      <div>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '14px', display: 'block' }}>Card Actions</label>
        <Space direction="vertical" style={{ width: '100%', gap: '16px' }}>
          {richCard.actions.map((action, index) => (
            <div key={index} style={{ padding: '24px', background: '#fafafa', border: '2px solid #e8e8e8', borderRadius: '12px' }}>
              <Row gutter={[16, 16]}>
                <Col span={24} md={8}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Type</label>
                  <Select
                    value={action.type}
                    onChange={(value) => handleRichCardActionChange(index, 'type', value)}
                    style={{ width: '100%', height: '48px' }}
                    options={[
                      { label: '💬 Reply', value: 'reply' },
                      { label: '🔗 URL', value: 'url' },
                      { label: '📞 Call', value: 'call' },
                    ]}
                  />
                </Col>
                <Col span={24} md={8}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Action Label</label>
                  <Input
                    placeholder="e.g., View Details"
                    value={action.title}
                    onChange={(e) => handleRichCardActionChange(index, 'title', e.target.value)}
                    style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </Col>
                <Col span={24} md={6}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>{action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone' : 'Payload'}</label>
                  <Input
                    placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                    value={action.payload}
                    onChange={(e) => handleRichCardActionChange(index, 'payload', e.target.value)}
                    style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </Col>
                {richCard.actions.length > 1 && (
                  <Col span={24} md={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveRichCardAction(index)} style={{ height: '48px', width: '100%' }} />
                  </Col>
                )}
              </Row>
            </div>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddRichCardAction}
            style={{ height: '52px', fontSize: '15px', fontWeight: 600, borderWidth: '2px', borderRadius: '10px' }}
          >
            Add Action Button
          </Button>
        </Space>
      </div>
    </Card>
  );

  const renderCarouselForm = () => (
    <Card style={{ marginBottom: '24px', border: '1px solid #e8e8e8', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Template Name <span style={{ color: '#ff4d4f' }}>*</span></label>
        <Input
          placeholder="e.g., Product Carousel"
          value={formData.name}
          onChange={handleNameChange}
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <Divider style={{ margin: '32px 0', borderColor: '#e8e8e8' }}>Carousel Items</Divider>

      <Space direction="vertical" style={{ width: '100%', gap: '20px' }}>
        {carouselItems.map((item, itemIndex) => (
          <Card
            key={itemIndex}
            style={{ border: '2px solid #e8e8e8', borderRadius: '12px', background: '#fafafa' }}
            title={<span style={{ fontSize: '15px', fontWeight: 600 }}>Item {itemIndex + 1}</span>}
            extra={
              carouselItems.length > 1 && (
                <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveCarouselItem(itemIndex)} style={{ height: '36px', fontWeight: 600 }}>Remove</Button>
              )
            }
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Item Title</label>
              <Input
                placeholder="e.g., Product 1"
                value={item.title}
                onChange={(e) => handleCarouselItemChange(itemIndex, 'title', e.target.value)}
                style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Item Subtitle</label>
              <Input
                placeholder="e.g., Description"
                value={item.subtitle}
                onChange={(e) => handleCarouselItemChange(itemIndex, 'subtitle', e.target.value)}
                style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Item Image</label>
              {!item.imageUrl ? (
                <Upload
                  accept="image/*"
                  maxCount={1}
                  beforeUpload={(file) => handleImageSelect(file, 'carousel', itemIndex)}
                  listType="picture-card"
                  showUploadList={false}
                  style={{ width: '100%', height: "140px", border: '1.5px dashed #d9d9d9', borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div style={{ padding: '40px 100px', textAlign: 'center' }}>
                    <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px', marginTop: '20px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626', marginBottom: '6px' }}> Upload & Crop Image</div>
                    <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '20px' }}>Click to select and crop your image</div>
                  </div>
                </Upload>
              ) : (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e8e8e8' }}>
                  <img src={item.imageUrl} alt="Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                  <Button
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: 'white', border: 'none', height: '36px', padding: '0 16px', fontWeight: 600 }}
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

            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '12px' }}>Item Actions</label>
              <Space direction="vertical" style={{ width: '100%', gap: '12px' }}>
                {item.actions.map((action, actionIndex) => (
                  <div key={actionIndex} style={{ padding: '16px', background: '#fff', border: '2px solid #e8e8e8', borderRadius: '10px' }}>
                    <Row gutter={[12, 12]}>
                      <Col span={24} md={6}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '6px' }}>Type</label>
                        <Select
                          value={action.type}
                          onChange={(value) => handleCarouselActionChange(itemIndex, actionIndex, 'type', value)}
                          style={{ width: '100%', height: '44px' }}
                          options={[
                            { label: '💬 Reply', value: 'reply' },
                            { label: '🔗 URL', value: 'url' },
                            { label: '📞 Call', value: 'call' },
                          ]}
                        />
                      </Col>
                      <Col span={24} md={9}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '6px' }}>Label</label>
                        <Input
                          placeholder="e.g., Buy Now"
                          value={action.title}
                          onChange={(e) => handleCarouselActionChange(itemIndex, actionIndex, 'title', e.target.value)}
                          style={{ height: '44px', fontSize: '14px', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                        />
                      </Col>
                      <Col span={24} md={7}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '6px' }}>{action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone' : 'Payload'}</label>
                        <Input
                          placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                          value={action.payload}
                          onChange={(e) => handleCarouselActionChange(itemIndex, actionIndex, 'payload', e.target.value)}
                          style={{ height: '44px', fontSize: '14px', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                        />
                      </Col>
                      {item.actions.length > 1 && (
                        <Col span={24} md={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveCarouselAction(itemIndex, actionIndex)} style={{ height: '44px', width: '100%' }} />
                        </Col>
                      )}
                    </Row>
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => handleAddCarouselAction(itemIndex)}
                  style={{ height: '48px', fontSize: '14px', fontWeight: 600, borderWidth: '2px', borderRadius: '8px' }}
                >
                  Add Action Button
                </Button>
              </Space>
            </div>
          </Card>
        ))}

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={handleAddCarouselItem}
          style={{ height: '52px', fontSize: '15px', fontWeight: 600, borderWidth: '2px', borderRadius: '10px' }}
        >
          Add Carousel Item
        </Button>
      </Space>
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
                  <FormOutlined style={{
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
                    fontFamily: THEME_CONSTANTS.typography.fontFamily,
                    letterSpacing: '-0.02em'
                  }}>
                    {editingTemplate ? 'Edit Template' : 'Create  Template'}
                  </h1>
                  <p style={{
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontSize: THEME_CONSTANTS.typography.body.size,
                    fontWeight: 500,
                    lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                    margin: 0,
                    fontFamily: THEME_CONSTANTS.typography.fontFamily,
                    letterSpacing: '-0.01em'
                  }}>
                    {editingTemplate
                      ? 'Modify your message template settings'
                      : 'Create a new message template for your campaigns'}
                  </p>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={6}>
              <div style={{ textAlign: screens.lg ? 'right' : 'left' }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/templates')}
                  style={{
                    height: '44px',
                    padding: '0 24px',
                    fontSize: '15px',
                    fontWeight: 500,
                    borderRadius: '8px'
                  }}
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
            <Card style={{ marginBottom: '24px', border: '1px solid #e8e8e8', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '32px' }}>
              <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '12px', display: 'block' }}>Select Message Type <span style={{ color: '#ff4d4f' }}>*</span></label>
              <Select
                value={messageType}
                onChange={setMessageType}
                options={[
                  { label: 'Text Message', value: 'text' },
                  { label: 'Text with Actions', value: 'text-with-action' },
                  { label: 'Rich Card', value: 'rcs' },
                  { label: 'Carousel', value: 'carousel' },
                ]}
                dropdownStyle={{ fontSize: '16px' }}
               
                style={{ width: '100%', height: '52px', fontSize: '15px' , }}
              />
            </Card>

            {/* Conditional Forms */}
            {messageType === 'text' && renderTextTemplateForm()}
            {messageType === 'text-with-action' && renderTextWithActionForm()}
            {messageType === 'rcs' && renderRichCardForm()}
            {messageType === 'carousel' && renderCarouselForm()}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '32px' }}>
              <Button
                type="primary"
                loading={templateLoading}
                onClick={handleSaveTemplate}
                style={{
                  background: THEME_CONSTANTS.colors.primary,
                  border: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  height: '56px',
                  padding: '0 40px',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(24,144,255,0.3)'
                }}
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </Button>
              <Button
                onClick={handleShowPreview}
                style={{
                  border: `2px solid ${THEME_CONSTANTS.colors.primary}`,
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: 600,
                  borderRadius: '10px',
                  height: '56px',
                  padding: '0 40px',
                  fontSize: '16px',
                  background: '#fff'
                }}
              >
                Preview
              </Button>
              <Button
                onClick={() => navigate('/templates')}
                style={{
                  fontWeight: 600,
                  borderRadius: '10px',
                  height: '56px',
                  padding: '0 40px',
                  fontSize: '16px',
                  border: '2px solid #d9d9d9',
                  background: '#fff'
                }}
              >
                ❌ Cancel
              </Button>
            </div>
          </Col>

          {/* Preview Column */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: '12px',
                border: '1px solid #e8e8e8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                position: 'sticky',
                top: '20px'
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 600 }}>
                  <EyeOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
                  <span>Live Preview</span>
                </div>
              }
              bodyStyle={{ padding: '16px', background: '#f5f7fa' }}
            >
              <RCSMessagePreview
                data={(() => {
                  let content = {};
                  if (messageType === 'text') {
                    content = { body: formData.text };
                  } else if (messageType === 'text-with-action') {
                    content = {
                      text: formData.text,
                      buttons: actions.map(a => ({
                        label: a.title,
                        value: a.payload,
                        actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
                      }))
                    };
                  } else if (messageType === 'rcs') {
                    content = {
                      title: richCard.title,
                      subtitle: richCard.subtitle,
                      imageUrl: richCard.imageUrl,
                      actions: richCard.actions.map(a => ({
                        label: a.title,
                        uri: a.payload,
                        actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
                      }))
                    };
                  } else if (messageType === 'carousel') {
                    content = {
                      cards: carouselItems.map(item => ({
                        title: item.title,
                        subtitle: item.subtitle,
                        imageUrl: item.imageUrl,
                        actions: item.actions.map(a => ({
                          label: a.title,
                          uri: a.payload,
                          actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
                        }))
                      }))
                    };
                  }
                  return {
                    _id: editingTemplate?._id,
                    name: formData.name,
                    templateType: messageType === 'text' ? 'plainText' :
                      messageType === 'text-with-action' ? 'textWithAction' :
                        messageType === 'rcs' ? 'richCard' : 'carousel',
                    content
                  };
                })()}
              />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600 }}>
              <EyeOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
              <span>Template Preview - {previewData.name}</span>
            </div>
          }
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          width={480}
          footer={null}
          bodyStyle={{ padding: '24px', background: '#f5f7fa' }}
          centered
        >
          <RCSMessagePreview data={previewData} />
        </Modal>
      )}
    </div>
  );
}