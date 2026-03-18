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
  VideoCameraOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import ImageCropper from '../../components/ImageCropper';
import { createTemplate, updateTemplate, fetchUserTemplates } from '../../redux/slices/templateSlice';
import { uploadFile } from '../../redux/slices/uploadSlice';

const { useBreakpoint } = Grid;

// Utility functions for URL validation and trimming
const trimAndValidateUrl = (url) => {
  if (!url) return '';
  
  // Trim whitespace from start and end
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) return '';
  
  try {
    // Check if URL has protocol
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      // If it looks like a domain, add https://
      if (trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
        return `https://${trimmedUrl}`;
      }
      return trimmedUrl; // Return as-is if it doesn't look like a URL
    }
    
    // Validate URL format
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch (error) {
    // If URL is invalid, return the trimmed version anyway
    // The user will see validation error later
    return trimmedUrl;
  }
};

const validateUrl = (url) => {
  if (!url || !url.trim()) return true; // Empty URLs are allowed
  
  const trimmedUrl = url.trim();
  
  try {
    const urlObj = new URL(trimmedUrl);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const trimAllFields = (obj) => {
  if (typeof obj === 'string') {
    return obj.trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => trimAllFields(item));
  }
  
  if (obj && typeof obj === 'object') {
    const trimmed = {};
    for (const [key, value] of Object.entries(obj)) {
      trimmed[key] = trimAllFields(value);
    }
    return trimmed;
  }
  
  return obj;
};

const sanitizeActionPayload = (action) => {
  const sanitized = { ...action };
  
  // Trim title
  if (sanitized.title) {
    sanitized.title = sanitized.title.trim();
  }
  
  // Handle payload based on action type
  if (sanitized.payload) {
    if (sanitized.type === 'url') {
      sanitized.payload = trimAndValidateUrl(sanitized.payload);
    } else if (sanitized.type === 'call') {
      // Trim phone numbers and remove extra spaces
      sanitized.payload = sanitized.payload.trim().replace(/\s+/g, '');
    } else {
      // For reply/postback, just trim
      sanitized.payload = sanitized.payload.trim();
    }
  }
  
  return sanitized;
};

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
    mediaType: 'image',
    thumbnailUrl: '',
    actions: [],
    mediaFile: null
  });
  const [carouselItems, setCarouselItems] = useState([
    { title: '', subtitle: '', imageUrl: '', mediaType: 'image', thumbnailUrl: '', actions: [], mediaFile: null }
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
          mediaType: editingTemplateFromState.content.mediaType || 'image',
          thumbnailUrl: editingTemplateFromState.content.thumbnailUrl || '',
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
          mediaType: card.mediaType || 'image',
          thumbnailUrl: card.thumbnailUrl || '',
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
        } else if (type === 'rich_card_thumbnail') {
          setRichCard(prev => ({ ...prev, thumbnailUrl: url }));
        } else if (type === 'carousel' && index !== null) {
          setCarouselItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], imageUrl: url };
            return updated;
          });
        } else if (type === 'carousel_thumbnail' && index !== null) {
          setCarouselItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], thumbnailUrl: url };
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

  // Handle video upload (direct upload, no cropping)
  const handleVideoUpload = async (file, targetType = 'rich_card', index = null) => {
    if (!file) return false;

    const maxSizeMB = 100;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Video file must be under ${maxSizeMB}MB`);
      return false;
    }

    try {
      toast.loading('Uploading video...', { id: 'video-upload' });
      const url = await uploadFileToServer(file);

      if (url) {
        if (targetType === 'rich_card') {
          setRichCard(prev => ({ ...prev, imageUrl: url, mediaType: 'video' }));
        } else if (targetType === 'carousel' && index !== null) {
          setCarouselItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], imageUrl: url, mediaType: 'video' };
            return updated;
          });
        }
        toast.success('✅ Video uploaded successfully!', { id: 'video-upload' });
      } else {
        toast.error('❌ Video upload failed', { id: 'video-upload' });
      }
    } catch (error) {
      toast.error('❌ Failed to upload video: ' + error.message, { id: 'video-upload' });
    }

    return false; // Prevent default upload
  };

  // Handle thumbnail upload for video (REMOVED - now uses handleImageSelect)

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

      // Check if any uploads are in progress
      if (uploadLoading) {
        toast.error('Please wait for uploads to complete');
        return;
      }

      // Validate actions have titles for text-with-action
      const validActions = messageType === 'text-with-action'
        ? actions.map(action => sanitizeActionPayload(action)).filter(action => {
            if (!action.title || !action.title.trim()) return false;
            
            // Validate URL actions
            if (action.type === 'url' && action.payload) {
              if (!validateUrl(action.payload)) {
                toast.error(`Invalid URL in action "${action.title}": ${action.payload}`);
                return false;
              }
            }
            
            // Validate phone actions
            if (action.type === 'call' && action.payload) {
              const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,15}$/;
              if (!phoneRegex.test(action.payload)) {
                toast.error(`Invalid phone number in action "${action.title}": ${action.payload}`);
                return false;
              }
            }
            
            return true;
          })
        : [];

      if (messageType === 'text-with-action' && validActions.length === 0) {
        toast.error('At least one action button is required for text with actions');
        return;
      }

      // Validate carousel items
      let validCarouselItems = [];
      if (messageType === 'carousel') {
        validCarouselItems = carouselItems.map(item => {
          // Sanitize and validate actions for each carousel item
          const sanitizedActions = item.actions.map(action => sanitizeActionPayload(action)).filter(action => {
            if (!action.title || !action.title.trim()) return false;
            
            // Validate URL actions
            if (action.type === 'url' && action.payload) {
              if (!validateUrl(action.payload)) {
                toast.error(`Invalid URL in carousel item "${item.title}" action "${action.title}": ${action.payload}`);
                return false;
              }
            }
            
            // Validate phone actions
            if (action.type === 'call' && action.payload) {
              const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,15}$/;
              if (!phoneRegex.test(action.payload)) {
                toast.error(`Invalid phone number in carousel item "${item.title}" action "${action.title}": ${action.payload}`);
                return false;
              }
            }
            
            return true;
          });
          
          return {
            ...item,
            title: item.title.trim(),
            subtitle: item.subtitle.trim(),
            actions: sanitizedActions
          };
        }).filter(item => item.title && item.title.trim() && item.actions.length > 0);

        if (validCarouselItems.length < 2) {
          toast.error('Carousel templates must have at least 2 cards');
          return;
        }

        // Validate carousel video thumbnails
        for (let i = 0; i < validCarouselItems.length; i++) {
          const item = validCarouselItems[i];
          if (!item.imageUrl) {
            toast.error(`Carousel item ${i + 1}: Please upload media`);
            return;
          }
          if (item.mediaType === 'video' && !item.thumbnailUrl) {
            toast.error(`Carousel item ${i + 1}: Video thumbnail is required`);
            return;
          }
        }
      }

      // Validate rich card actions
      let validRichCard = null;
      if (messageType === 'rcs') {
        if (!richCard.title || !richCard.title.trim()) {
          toast.error('Rich card title is required');
          return;
        }
        if (!richCard.imageUrl) {
          toast.error('Rich card media is required');
          return;
        }
        if (richCard.mediaType === 'video' && !richCard.thumbnailUrl) {
          toast.error('Video thumbnail is required for rich card');
          return;
        }
        
        // Validate and sanitize rich card actions
        const sanitizedActions = richCard.actions.map(action => sanitizeActionPayload(action)).filter(action => {
          if (!action.title || !action.title.trim()) return false;
          
          // Validate URL actions
          if (action.type === 'url' && action.payload) {
            if (!validateUrl(action.payload)) {
              toast.error(`Invalid URL in rich card action "${action.title}": ${action.payload}`);
              return false;
            }
          }
          
          // Validate phone actions
          if (action.type === 'call' && action.payload) {
            const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,15}$/;
            if (!phoneRegex.test(action.payload)) {
              toast.error(`Invalid phone number in rich card action "${action.title}": ${action.payload}`);
              return false;
            }
          }
          
          return true;
        });
        
        validRichCard = {
          ...richCard,
          title: richCard.title.trim(),
          subtitle: richCard.subtitle.trim(),
          actions: sanitizedActions
        };
      }

      // Build content object based on template type
      let content = {};

      if (messageType === 'text') {
        content = { body: formData.text.trim() };
      } else if (messageType === 'text-with-action') {
        content = {
          text: formData.text.trim(),
          buttons: validActions.map(a => ({
            label: a.title.trim(),
            value: a.payload,
            actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
          }))
        };
      } else if (messageType === 'rcs') {
        content = {
          title: validRichCard.title,
          subtitle: validRichCard.subtitle,
          description: validRichCard.subtitle,
          imageUrl: richCard.imageUrl,
          mediaType: richCard.mediaType || 'image',
          thumbnailUrl: richCard.thumbnailUrl || '',
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
            mediaType: item.mediaType || 'image',
            thumbnailUrl: item.thumbnailUrl || '',
            actions: item.actions.map(a => ({
              label: a.title,
              uri: a.payload,
              actionType: a.type === 'url' ? 'openUri' : a.type === 'call' ? 'dialPhone' : 'postback'
            }))
          }))
        };
      }

      const templateData = {
        name: formData.name.trim(),
        description: (formData.text || richCard.subtitle || '').trim(),
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
      setRichCard({ title: '', subtitle: '', imageUrl: '', mediaType: 'image', thumbnailUrl: '', actions: [], mediaFile: null });
      setCarouselItems([{ title: '', subtitle: '', imageUrl: '', mediaType: 'image', thumbnailUrl: '', actions: [], mediaFile: null }]);
      setEditingTemplate(null);
      form.resetFields();

      // Navigate back to templates list
      setTimeout(() => {
        navigate('/dashboard/templates');
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
    setFormData({ ...formData, name: e.target.value.trim() });
  };




  const handleActionChange = (index, field, value) => {
    const updated = [...actions];
    
    if (field === 'payload' && updated[index].type === 'url') {
      // Auto-trim and validate URLs
      updated[index][field] = trimAndValidateUrl(value);
    } else if (field === 'payload' && updated[index].type === 'call') {
      // Clean phone numbers
      updated[index][field] = value.trim().replace(/\s+/g, '');
    } else if (field === 'title') {
      // Trim titles
      updated[index][field] = value.trim();
    } else {
      updated[index][field] = value;
    }
    
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
    
    if (field === 'payload' && updated[index].type === 'url') {
      // Auto-trim and validate URLs
      updated[index][field] = trimAndValidateUrl(value);
    } else if (field === 'payload' && updated[index].type === 'call') {
      // Clean phone numbers
      updated[index][field] = value.trim().replace(/\s+/g, '');
    } else if (field === 'title') {
      // Trim titles
      updated[index][field] = value.trim();
    } else {
      updated[index][field] = value;
    }
    
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
    
    if (field === 'title' || field === 'subtitle') {
      // Trim text fields
      updated[index][field] = value.trim();
    } else {
      updated[index][field] = value;
    }
    
    setCarouselItems(updated);
  };

  const handleAddCarouselItem = () => {
    setCarouselItems([
      ...carouselItems,
      { title: '', subtitle: '', imageUrl: '', mediaType: 'image', actions: [], mediaFile: null }
    ]);
  };

  const handleRemoveCarouselItem = (index) => {
    setCarouselItems(carouselItems.filter((_, i) => i !== index));
  };

  const handleCarouselActionChange = (itemIndex, actionIndex, field, value) => {
    const updated = [...carouselItems];
    
    if (field === 'payload' && updated[itemIndex].actions[actionIndex].type === 'url') {
      // Auto-trim and validate URLs
      updated[itemIndex].actions[actionIndex][field] = trimAndValidateUrl(value);
    } else if (field === 'payload' && updated[itemIndex].actions[actionIndex].type === 'call') {
      // Clean phone numbers
      updated[itemIndex].actions[actionIndex][field] = value.trim().replace(/\s+/g, '');
    } else if (field === 'title') {
      // Trim titles
      updated[itemIndex].actions[actionIndex][field] = value.trim();
    } else {
      updated[itemIndex].actions[actionIndex][field] = value;
    }
    
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
        mediaType: richCard.mediaType || 'image',
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
          mediaType: item.mediaType || 'image',
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
                    maxLength={25}
                    showCount
                    style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </Col>
                <Col span={24} md={7}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>{action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone' : 'Payload'}</label>
                  <Input
                    placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                    value={action.payload}
                    onChange={(e) => handleActionChange(index, 'payload', e.target.value)}
                    onBlur={(e) => {
                      // Validate on blur for immediate feedback
                      if (action.type === 'url' && e.target.value.trim()) {
                        if (!validateUrl(e.target.value.trim())) {
                          toast.error(`Invalid URL format. Please use: https://rcssender.com`);
                        }
                      }
                    }}
                    status={action.type === 'url' && action.payload && !validateUrl(action.payload) ? 'error' : ''}
                    style={{ 
                      height: '48px', 
                      fontSize: '15px', 
                      padding: '12px 16px', 
                      border: action.type === 'url' && action.payload && !validateUrl(action.payload) 
                        ? '2px solid #ff4d4f' 
                        : '2px solid #e0e0e0', 
                      borderRadius: '8px' 
                    }}
                  />
                  {action.type === 'url' && action.payload && !validateUrl(action.payload) && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      ⚠️ Invalid URL format
                    </div>
                  )}
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
          maxLength={200}
          showCount
          style={{ height: '52px', fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Card Subtitle</label>
        <Input.TextArea
          rows={3}
          placeholder="e.g., Limited Time Offer"
          value={richCard.subtitle}
          onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
          maxLength={2000}
          showCount
          style={{ fontSize: '15px', padding: '14px 18px', borderRadius: '10px', border: '2px solid #e0e0e0', lineHeight: '1.6' }}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f', marginBottom: '10px', display: 'block' }}>Card Media</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <Button
            type={richCard.mediaType === 'image' ? 'primary' : 'default'}
            icon={<PictureOutlined />}
            onClick={() => setRichCard({ ...richCard, mediaType: 'image', imageUrl: '', mediaFile: null })}
            style={{
              height: '42px',
              fontWeight: 600,
              borderRadius: '8px',
              fontSize: '14px',
              ...(richCard.mediaType === 'image' ? { background: '#1890ff', border: 'none' } : { border: '2px solid #e0e0e0' })
            }}
          >
            Image
          </Button>
          <Button
            type={richCard.mediaType === 'video' ? 'primary' : 'default'}
            icon={<VideoCameraOutlined />}
            onClick={() => setRichCard({ ...richCard, mediaType: 'video', imageUrl: '', mediaFile: null })}
            style={{
              height: '42px',
              fontWeight: 600,
              borderRadius: '8px',
              fontSize: '14px',
              ...(richCard.mediaType === 'video' ? { background: '#722ed1', border: 'none' } : { border: '2px solid #e0e0e0' })
            }}
          >
            Video
          </Button>
        </div>

        {richCard.mediaType === 'image' ? (
          /* Image upload with cropper */
          !richCard.imageUrl ? (
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
          )
        ) : (
          /* Video upload (direct, no cropping) */
          !richCard.imageUrl ? (
            <Upload
              accept="video/mp4,video/webm,video/quicktime,video/*"
              maxCount={1}
              beforeUpload={(file) => handleVideoUpload(file, 'rich_card')}
              showUploadList={false}
            >
              <div style={{
                padding: '40px',
                textAlign: 'center',
                border: '2px dashed #d9d9d9',
                borderRadius: '12px',
                cursor: 'pointer',
                background: '#fafafa',
                transition: 'border-color 0.3s'
              }}>
                <VideoCameraOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626', marginBottom: '6px' }}>Upload Video</div>
                <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '4px' }}>MP4, WebM, MOV supported</div>
                <div style={{ fontSize: '12px', color: '#bfbfbf' }}>Max 100MB</div>
              </div>
            </Upload>
          ) : (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e8e8e8' }}>
              <video
                src={richCard.imageUrl}
                controls
                style={{ width: '100%', maxHeight: '320px', display: 'block', background: '#000' }}
              />
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                <Button
                  style={{ background: 'rgba(0,0,0,0.75)', color: 'white', border: 'none', height: '40px', padding: '0 20px', fontWeight: 600 }}
                  onClick={() => setRichCard({ ...richCard, imageUrl: '', mediaFile: null, thumbnailUrl: '' })}
                >
                  ✕ Remove Video
                </Button>
              </div>
            </div>
          )
        )}

        {/* Video Thumbnail Upload (shown when video is selected) */}
        {richCard.mediaType === 'video' && richCard.imageUrl && (
          <div style={{ marginTop: '20px', padding: '20px', background: '#f0f5ff', borderRadius: '12px', border: '2px solid #d6e4ff' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#1890ff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <PictureOutlined style={{ fontSize: '18px' }} />
              Video Thumbnail <span style={{ fontWeight: 400, color: '#8c8c8c', fontSize: '13px' }}>(Shows as preview before video plays)</span>
            </label>
            {!richCard.thumbnailUrl ? (
              <Upload
                accept="image/jpeg,image/png,image/webp"
                maxCount={1}
                beforeUpload={(file) => handleImageSelect(file, 'rich_card_thumbnail')}
                showUploadList={false}
              >
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  border: '2px dashed #91d5ff',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: 'white',
                  transition: 'all 0.3s'
                }}>
                  <PictureOutlined style={{ fontSize: '36px', color: '#1890ff', marginBottom: '8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#262626', marginBottom: '4px' }}>Upload & Crop Thumbnail</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>JPEG, PNG, WebP • Max 5MB</div>
                </div>
              </Upload>
            ) : (
              <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #1890ff', display: 'inline-block', background: 'white' }}>
                <img src={richCard.thumbnailUrl} alt="Video Thumbnail" style={{ maxHeight: '120px', maxWidth: '200px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <Button
                    size="small"
                    style={{ background: 'rgba(0,0,0,0.75)', color: 'white', border: 'none', fontSize: '12px', height: '28px', padding: '0 12px', fontWeight: 600 }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) handleImageSelect(file, 'rich_card_thumbnail');
                      };
                      input.click();
                    }}
                  >
                    ✂️ Re-crop
                  </Button>
                  <Button
                    size="small"
                    danger
                    style={{ background: 'rgba(255,77,79,0.9)', color: 'white', border: 'none', fontSize: '12px', height: '28px', padding: '0 12px', fontWeight: 600 }}
                    onClick={() => setRichCard(prev => ({ ...prev, thumbnailUrl: '' }))}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}
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
                    maxLength={25}
                    showCount
                    style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </Col>
                <Col span={24} md={6}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>{action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone' : 'Payload'}</label>
                  <Input
                    placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                    value={action.payload}
                    onChange={(e) => handleRichCardActionChange(index, 'payload', e.target.value)}
                    onBlur={(e) => {
                      // Validate on blur for immediate feedback
                      if (action.type === 'url' && e.target.value.trim()) {
                        if (!validateUrl(e.target.value.trim())) {
                          toast.error(`Invalid URL format. Please use: https://example.com`);
                        }
                      }
                    }}
                    status={action.type === 'url' && action.payload && !validateUrl(action.payload) ? 'error' : ''}
                    style={{ 
                      height: '48px', 
                      fontSize: '15px', 
                      padding: '12px 16px', 
                      border: action.type === 'url' && action.payload && !validateUrl(action.payload) 
                        ? '2px solid #ff4d4f' 
                        : '2px solid #e0e0e0', 
                      borderRadius: '8px' 
                    }}
                  />
                  {action.type === 'url' && action.payload && !validateUrl(action.payload) && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      ⚠️ Invalid URL format
                    </div>
                  )}
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
                maxLength={200}
                showCount
                style={{ height: '48px', fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Item Subtitle</label>
              <Input.TextArea
                rows={3}
                placeholder="e.g., Description"
                value={item.subtitle}
                onChange={(e) => handleCarouselItemChange(itemIndex, 'subtitle', e.target.value)}
                maxLength={2000}
                showCount
                style={{ fontSize: '15px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', lineHeight: '1.6' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '8px' }}>Item Media</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <Button
                  size="small"
                  type={item.mediaType === 'image' || !item.mediaType ? 'primary' : 'default'}
                  icon={<PictureOutlined />}
                  onClick={() => handleCarouselItemChange(itemIndex, 'mediaType', 'image')}
                  style={{
                    height: '36px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    fontSize: '13px',
                    ...((item.mediaType === 'image' || !item.mediaType) ? { background: '#1890ff', border: 'none' } : { border: '2px solid #e0e0e0' })
                  }}
                >
                  Image
                </Button>
                <Button
                  size="small"
                  type={item.mediaType === 'video' ? 'primary' : 'default'}
                  icon={<VideoCameraOutlined />}
                  onClick={() => {
                    const updated = [...carouselItems];
                    updated[itemIndex] = { ...updated[itemIndex], mediaType: 'video', imageUrl: '', mediaFile: null };
                    setCarouselItems(updated);
                  }}
                  style={{
                    height: '36px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    fontSize: '13px',
                    ...(item.mediaType === 'video' ? { background: '#722ed1', border: 'none' } : { border: '2px solid #e0e0e0' })
                  }}
                >
                  Video
                </Button>
              </div>

              {(item.mediaType === 'image' || !item.mediaType) ? (
                /* Image upload with cropper */
                !item.imageUrl ? (
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
                )
              ) : (
                /* Video upload (direct, no cropping) */
                !item.imageUrl ? (
                  <Upload
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    maxCount={1}
                    beforeUpload={(file) => handleVideoUpload(file, 'carousel', itemIndex)}
                    showUploadList={false}
                  >
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      border: '2px dashed #d9d9d9',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: '#fafafa',
                      transition: 'border-color 0.3s'
                    }}>
                      <VideoCameraOutlined style={{ fontSize: '40px', color: '#722ed1', marginBottom: '10px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#262626', marginBottom: '4px' }}>Upload Video</div>
                      <div style={{ fontSize: '13px', color: '#8c8c8c' }}>MP4, WebM, MOV • Max 100MB</div>
                    </div>
                  </Upload>
                ) : (
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e8e8e8' }}>
                    <video
                      src={item.imageUrl}
                      controls
                      style={{ width: '100%', maxHeight: '240px', display: 'block', background: '#000' }}
                    />
                    <Button
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: 'white', border: 'none', height: '36px', padding: '0 16px', fontWeight: 600 }}
                      onClick={() => {
                        const updated = [...carouselItems];
                        updated[itemIndex] = { ...updated[itemIndex], imageUrl: '', mediaFile: null, thumbnailUrl: '' };
                        setCarouselItems(updated);
                      }}
                    >
                      ✕ Remove Video
                    </Button>
                  </div>
                )
              )}

              {/* Video Thumbnail Upload for carousel item */}
              {item.mediaType === 'video' && item.imageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '6px' }}>
                    🖼️ Thumbnail <span style={{ fontWeight: 400, color: '#8c8c8c' }}>(optional)</span>
                  </label>
                  {!item.thumbnailUrl ? (
                    <Upload
                      accept="image/jpeg,image/png,image/webp"
                      maxCount={1}
                      beforeUpload={(file) => handleImageSelect(file, 'carousel_thumbnail', itemIndex)}
                      showUploadList={false}
                    >
                      <div style={{
                        padding: '10px',
                        textAlign: 'center',
                        border: '1.5px dashed #d6d6d6',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: '#fafafa',
                      }}>
                        <PictureOutlined style={{ fontSize: '22px', color: '#8c8c8c', marginBottom: '4px' }} />
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#595959' }}>Upload Thumbnail</div>
                        <div style={{ fontSize: '10px', color: '#bfbfbf' }}>JPEG, PNG • Max 5MB</div>
                      </div>
                    </Upload>
                  ) : (
                    <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #e8e8e8', display: 'inline-block' }}>
                      <img src={item.thumbnailUrl} alt="Thumbnail" style={{ maxHeight: '80px', objectFit: 'cover', display: 'block' }} />
                      <Button
                        size="small"
                        style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '10px', height: '20px', padding: '0 6px' }}
                        onClick={() => {
                          const updated = [...carouselItems];
                          updated[itemIndex] = { ...updated[itemIndex], thumbnailUrl: '' };
                          setCarouselItems(updated);
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
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
                          maxLength={25}
                          showCount
                          style={{ height: '44px', fontSize: '14px', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px' }}
                        />
                      </Col>
                      <Col span={24} md={7}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#595959', display: 'block', marginBottom: '6px' }}>{action.type === 'url' ? 'URL' : action.type === 'call' ? 'Phone' : 'Payload'}</label>
                        <Input
                          placeholder={action.type === 'url' ? 'https://example.com' : action.type === 'call' ? '+1234567890' : 'response_text'}
                          value={action.payload}
                          onChange={(e) => handleCarouselActionChange(itemIndex, actionIndex, 'payload', e.target.value)}
                          onBlur={(e) => {
                            // Validate on blur for immediate feedback
                            if (action.type === 'url' && e.target.value.trim()) {
                              if (!validateUrl(e.target.value.trim())) {
                                toast.error(`Invalid URL format. Please use: https://example.com`);
                              }
                            }
                          }}
                          status={action.type === 'url' && action.payload && !validateUrl(action.payload) ? 'error' : ''}
                          style={{ 
                            height: '44px', 
                            fontSize: '14px', 
                            padding: '10px 14px', 
                            border: action.type === 'url' && action.payload && !validateUrl(action.payload) 
                              ? '2px solid #ff4d4f' 
                              : '2px solid #e0e0e0', 
                            borderRadius: '8px' 
                          }}
                        />
                        {action.type === 'url' && action.payload && !validateUrl(action.payload) && (
                          <div style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '2px' }}>
                            ⚠️ Invalid URL
                          </div>
                        )}
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
                onClick={() => navigate('/dashboard/templates')}
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
                  onClick={() => navigate('/dashboard/templates')}
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

                style={{ width: '100%', height: '52px', fontSize: '15px', }}
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
                onClick={() => navigate('/dashboard/templates')}
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
                      mediaType: richCard.mediaType || 'image',
                      thumbnailUrl: richCard.thumbnailUrl || '',
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
                        mediaType: item.mediaType || 'image',
                        thumbnailUrl: item.thumbnailUrl || '',
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
        messageType={cropperTarget.type === 'rich_card' ? 'richCard' : cropperTarget.type === 'carousel' ? 'carousel' : 'richCard'}
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