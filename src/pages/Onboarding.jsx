import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Steps, 
  Row, 
  Col, 
  Grid, 
  Select, 
  Upload, 
  message, 
  Progress,
  Divider,
  Alert,
  Space,
  Modal,
  Badge
} from 'antd';
import { 
  UserOutlined, 
  SafetyOutlined, 
  CheckCircleOutlined, 
  GlobalOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  BankOutlined, 
  FileTextOutlined, 
  UploadOutlined, 
  RocketOutlined,
  IdcardOutlined,
  BuildOutlined,
  DollarOutlined,
  TeamOutlined,
  ClockCircleOutlined,

  FileDoneOutlined,
  PercentageOutlined,
  DockerOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../theme';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;
const { Step } = Steps;
const { Dragger } = Upload;

export default function Onboarding() {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [progress, setProgress] = useState(33);
  const [uploadedFiles, setUploadedFiles] = useState({
    registrationCertificate: null,
    brandLogo: null
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const screens = useBreakpoint();
  const navigate = useNavigate();

  const steps = [
    { 
      title: 'Business Details', 
      icon: <BankOutlined />,
      description: 'Company Information'
    },
    { 
      title: 'Platform Setup', 
      icon: <BuildOutlined />,
      description: 'Technical Configuration'
    },
    { 
      title: 'Verification', 
      icon: <SafetyOutlined />,
      description: 'Document Submission'
    },
    { 
      title: 'Review', 
      icon: <FileDoneOutlined />,
      description: 'Final Confirmation'
    }
  ];

  const industries = [
    { value: 'ecommerce', label: 'E-commerce & Retail' },
    { value: 'banking', label: 'Banking & Financial Services' },
    { value: 'healthcare', label: 'Healthcare & Pharma' },
    { value: 'education', label: 'Education & EdTech' },
    { value: 'travel', label: 'Travel & Hospitality' },
    { value: 'logistics', label: 'Logistics & Delivery' },
    { value: 'telecom', label: 'Telecommunications' },
    { value: 'technology', label: 'Technology & SaaS' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'government', label: 'Government & Public Sector' },
    { value: 'other', label: 'Other' }
  ];

  const useCases = [
    { value: 'order_updates', label: 'Order Updates & Tracking' },
    { value: 'transaction_alerts', label: 'Transaction Alerts & OTP' },
    { value: 'promotional', label: 'Promotional Campaigns' },
    { value: 'appointment', label: 'Appointment Reminders' },
    { value: 'customer_support', label: 'Customer Support' },
    { value: 'marketing', label: 'Marketing & Lead Generation' },
    { value: 'service_updates', label: 'Service Updates' },
    { value: 'emergency_alerts', label: 'Emergency Alerts' },
    { value: 'newsletter', label: 'Newsletter & Updates' },
    { value: 'custom', label: 'Custom Use Case' }
  ];

  const onNext = async () => {
    try {
      const values = await form.validateFields();
      const updatedData = { ...formData, ...values };
      setFormData(updatedData);
      
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setProgress(((newStep + 1) / steps.length) * 100);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const onPrev = () => {
    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    setProgress(((newStep + 1) / steps.length) * 100);
  };

  const handleFileUpload = (file, fileType) => {
    const isValidFile = file.type === 'application/pdf' || 
                        file.type.startsWith('image/');
    
    if (!isValidFile) {
      message.error('Please upload only PDF or image files');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('File size must be less than 5MB');
      return false;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));

    message.success(`${fileType === 'registrationCertificate' ? 'Certificate' : 'Logo'} uploaded successfully`);
    return false;
  };

  const validateGST = (rule, value) => {
    if (!value) return Promise.reject('GST Number is required');
    
    // Basic GST validation regex
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (!gstRegex.test(value)) {
      return Promise.reject('Please enter a valid GST number');
    }
    
    return Promise.resolve();
  };

  const onFinish = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const finalData = { 
        ...formData, 
        ...values,
        uploadedFiles 
      };
      
      // Simulate API call
      console.log('Onboarding data:', finalData);
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      message.error('Please fill all required fields correctly');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
              <BankOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
              Business Information
            </Title>
            
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item 
                  name="companyName" 
                  label="Legal Company Name"
                  rules={[{ required: true, message: 'Legal company name is required' }]}
                  tooltip="As per business registration"
                >
                  <Input 
                    prefix={<BankOutlined />} 
                    placeholder="ABC Enterprises Private Limited"
                    size="large"
                    allowClear
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item 
                  name="brandName" 
                  label="Brand/Trading Name"
                  rules={[{ required: true, message: 'Brand name is required for verification' }]}
                  tooltip="This will appear in messages"
                >
                  <Input 
                    prefix={<IdcardOutlined />} 
                    placeholder="Your Brand"
                    size="large"
                    allowClear
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item 
                  name="businessEmail" 
                  label="Official Business Email"
                  rules={[
                    { required: true, message: 'Business email is required' },
                    { type: 'email', message: 'Valid email required' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder="contact@company.com"
                    size="large"
                    allowClear
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item 
                  name="businessPhone" 
                  label="Business Phone"
                  rules={[
                    { required: true, message: 'Business phone is required' },
                    { pattern: /^[0-9+\s()-]{10,}$/, message: 'Valid phone number required' }
                  ]}
                >
                  <Input 
                    prefix={<PhoneOutlined />} 
                    placeholder="+91 1234567890"
                    size="large"
                    allowClear
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item 
                  name="industry" 
                  label="Primary Industry"
                  rules={[{ required: true, message: 'Please select your industry' }]}
                >
                  <Select
                    placeholder="Select your primary industry"
                    size="large"
                    options={industries}
                    showSearch
                    filterOption={(input, option) =>
                      option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item 
                  name="companyAddress" 
                  label="Registered Business Address"
                  rules={[{ required: true, message: 'Business address is required' }]}
                >
                  <TextArea 
                    rows={3}
                    placeholder="Full registered address as per business documents"
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        );
      case 1:
        return (
          <>
            <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
              <BuildOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
              Platform & Volume Details
            </Title>
            
            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Form.Item 
                  name="website" 
                  label="Official Website"
                  rules={[
                    { required: true, message: 'Website URL is required' },
                    { type: 'url', message: 'Please enter a valid URL (https://)' }
                  ]}
                >
                  <Input 
                    prefix={<GlobalOutlined />} 
                    placeholder="https://yourcompany.com"
                    size="large"
                    allowClear
                    addonBefore="https://"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item 
                  name="platformType" 
                  label="Primary Platform"
                  rules={[{ required: true, message: 'Please select platform type' }]}
                >
                  <Select
                    placeholder="Select primary platform"
                    size="large"
                  >
                    <Select.Option value="website">Website Only</Select.Option>
                    <Select.Option value="mobile_app">Mobile App Only</Select.Option>
                    <Select.Option value="both">Both Website & App</Select.Option>
                    <Select.Option value="api_only">API Integration Only</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item 
                  name="monthlyVolume" 
                  label="Expected Monthly Volume"
                  rules={[{ required: true, message: 'Please select expected volume' }]}
                >
                  <Select
                    placeholder="Select expected message volume"
                    size="large"
                  >
                    <Select.Option value="0-10k">0 - 10,000 messages</Select.Option>
                    <Select.Option value="10k-50k">10,000 - 50,000 messages</Select.Option>
                    <Select.Option value="50k-100k">50,000 - 100,000 messages</Select.Option>
                    <Select.Option value="100k-500k">100,000 - 500,000 messages</Select.Option>
                    <Select.Option value="500k-1m">500,000 - 1 Million messages</Select.Option>
                    <Select.Option value="1m+">1 Million+ messages</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item 
                  name="useCase" 
                  label="Primary Use Case"
                  rules={[{ required: true, message: 'Please select primary use case' }]}
                >
                  <Select
                    placeholder="How will you use RCS messaging?"
                    size="large"
                    options={useCases}
                    showSearch
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item 
                  name="useCaseDetails" 
                  label="Use Case Details"
                  rules={[{ required: true, message: 'Please describe your use case' }]}
                >
                  <TextArea 
                    rows={4}
                    placeholder="Describe your specific messaging needs, target audience, and message content..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        );
      case 2:
        return (
          <>
            <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
              <DockerOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
              Document Verification
            </Title>
            
            <Alert
              message="Document Requirements"
              description="All documents must be clear, readable, and match your business information"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Form.Item 
                  name="gstNumber" 
                  label="GST Registration Number"
                  rules={[
                    { required: true, message: 'GST number is required' },
                    { validator: validateGST }
                  ]}
                  tooltip="15-digit GSTIN format"
                >
                  <Input 
                    prefix={<FileTextOutlined />} 
                    placeholder="22AAAAA0000A1Z5"
                    size="large"
                    allowClear
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Card 
                  title={
                    <span>
                      <FileTextOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.primary }} />
                      Business Registration Certificate
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Form.Item 
                    name="registrationCertificate"
                    rules={[{ required: true, message: 'Registration certificate is required' }]}
                  >
                    <Dragger
                      beforeUpload={(file) => handleFileUpload(file, 'registrationCertificate')}
                      maxCount={1}
                      accept=".pdf,.jpg,.jpeg,.png"
                      showUploadList={false}
                    >
                      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <UploadOutlined style={{ fontSize: 48, color: THEME_CONSTANTS.colors.primary, marginBottom: 16 }} />
                        <Paragraph style={{ marginBottom: 8 }}>
                          <Text strong>Click or drag to upload</Text>
                        </Paragraph>
                        <Paragraph type="secondary">
                          PDF, JPG, PNG up to 5MB
                        </Paragraph>
                      </div>
                    </Dragger>
                  </Form.Item>
                  
                  {uploadedFiles.registrationCertificate && (
                    <Alert
                      message={`Uploaded: ${uploadedFiles.registrationCertificate.name}`}
                      type="success"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                </Card>
              </Col>
              
              <Col xs={24}>
                <Card 
                  title={
                    <span>
                      <IdcardOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.primary }} />
                      Brand Logo (For Verified Badge)
                    </span>
                  }
                  bodyStyle={{ padding: 24 }}
                >
                  <Form.Item 
                    name="brandLogo"
                    rules={[{ required: true, message: 'Brand logo is required for verification' }]}
                  >
                    <Dragger
                      beforeUpload={(file) => handleFileUpload(file, 'brandLogo')}
                      maxCount={1}
                      accept=".jpg,.jpeg,.png"
                      showUploadList={false}
                    >
                      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <UploadOutlined style={{ fontSize: 48, color: THEME_CONSTANTS.colors.primary, marginBottom: 16 }} />
                        <Paragraph style={{ marginBottom: 8 }}>
                          <Text strong>Upload High-Quality Logo</Text>
                        </Paragraph>
                        <Paragraph type="secondary">
                          JPG, PNG up to 5MB • Min. 400×400px
                        </Paragraph>
                      </div>
                    </Dragger>
                  </Form.Item>
                  
                  {uploadedFiles.brandLogo && (
                    <Alert
                      message={`Uploaded: ${uploadedFiles.brandLogo.name}`}
                      type="success"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        );
      case 3:
        return (
          <>
            <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
              <FileDoneOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
              Review & Submit
            </Title>
            
            <Card 
              title="Onboarding Summary"
              style={{ marginBottom: 24 }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Business Information</Text>
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={8}>
                      <div>
                        <Text type="secondary">Company:</Text>{' '}
                        <Text strong>{formData.companyName || 'Not provided'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Brand:</Text>{' '}
                        <Text strong>{formData.brandName || 'Not provided'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Industry:</Text>{' '}
                        <Text strong>{industries.find(i => i.value === formData.industry)?.label || 'Not provided'}</Text>
                      </div>
                    </Space>
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Contact Details</Text>
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={8}>
                      <div>
                        <Text type="secondary">Email:</Text>{' '}
                        <Text strong>{formData.businessEmail || 'Not provided'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Phone:</Text>{' '}
                        <Text strong>{formData.businessPhone || 'Not provided'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Website:</Text>{' '}
                        <Text strong>{formData.website || 'Not provided'}</Text>
                      </div>
                    </Space>
                  </div>
                </Col>
                
                <Col xs={24}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Document Status</Text>
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={8}>
                      <div>
                        <Badge 
                          status={formData.gstNumber ? "success" : "error"} 
                          text={`GST Number: ${formData.gstNumber ? '✓ Provided' : '✗ Missing'}`}
                        />
                      </div>
                      <div>
                        <Badge 
                          status={uploadedFiles.registrationCertificate ? "success" : "error"} 
                          text={`Registration Certificate: ${uploadedFiles.registrationCertificate ? '✓ Uploaded' : '✗ Pending'}`}
                        />
                      </div>
                      <div>
                        <Badge 
                          status={uploadedFiles.brandLogo ? "success" : "error"} 
                          text={`Brand Logo: ${uploadedFiles.brandLogo ? '✓ Uploaded' : '✗ Pending'}`}
                        />
                      </div>
                    </Space>
                  </div>
                </Col>
                
                <Col xs={24}>
                  <Alert
                    message="Verification Timeline"
                    description="Your application will be reviewed within 24-48 business hours. You'll receive an email once verified."
                    type="info"
                    showIcon
                  />
                </Col>
              </Row>
            </Card>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight}08 0%, ${THEME_CONSTANTS.colors.background} 100%)`,
      padding: screens.xs ? '16px' : '32px'
    }}>
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 8 
          }}>
            <Text strong style={{ fontSize: '14px' }}>Onboarding Progress</Text>
            <Text strong style={{ color: THEME_CONSTANTS.colors.primary }}>{Math.round(progress)}%</Text>
          </div>
          <Progress 
            percent={progress} 
            strokeColor={{
              '0%': THEME_CONSTANTS.colors.primaryLight,
              '100%': THEME_CONSTANTS.colors.primary,
            }}
            strokeWidth={6}
            showInfo={false}
          />
        </div>

        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 40,
          padding: screens.xs ? '0' : '0 20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: `0 12px 32px ${THEME_CONSTANTS.colors.primary}30`
          }}>
            <RocketOutlined style={{ fontSize: '40px', color: 'white' }} />
          </div>
          
          <Title level={2} style={{ 
            marginBottom: '12px', 
            fontSize: screens.xs ? '28px' : '36px',
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.text} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Get Verified on RCS Platform
          </Title>
          
          <Paragraph style={{ 
            fontSize: '16px', 
            color: THEME_CONSTANTS.colors.textSecondary, 
            maxWidth: '600px', 
            margin: '0 auto 8px' 
          }}>
            Complete your business verification to unlock verified RCS messaging capabilities
          </Paragraph>
          
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Average approval time: 24-48 hours
          </Text>
        </div>

        {/* Steps */}
        <Card style={{
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
          marginBottom: '32px',
          background: THEME_CONSTANTS.colors.surface
        }}>
          <Steps 
            current={currentStep} 
            items={steps}
            responsive={false}
            style={{ padding: screens.xs ? '16px' : '24px' }}
          />
        </Card>

        {/* Main Form Card */}
        <Card style={{
          borderRadius: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
          background: THEME_CONSTANTS.colors.surface,
          marginBottom: '24px'
        }}>
          <Form form={form} layout="vertical" size="large">
            <div style={{ padding: screens.xs ? '24px 16px' : '32px' }}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <Divider style={{ margin: '32px 0' }} />
            
            <Row gutter={16} style={{ padding: screens.xs ? '0 16px 24px' : '0 32px 32px' }}>
              <Col xs={24} md={12}>
                {currentStep > 0 && (
                  <Button 
                    size="large" 
                    block 
                    onClick={onPrev}
                    style={{ height: '52px' }}
                  >
                    ← Previous Step
                  </Button>
                )}
              </Col>
              <Col xs={24} md={12}>
                {currentStep < steps.length - 1 ? (
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    onClick={onNext}
                    style={{ height: '52px' }}
                  >
                    Next Step →
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    onClick={onFinish} 
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    style={{ 
                      height: '52px',
                      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                      border: 'none'
                    }}
                  >
                    Submit for Verification
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Info Cards */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={8}>
            <Card style={{ 
              borderRadius: '16px', 
              height: '100%',
              background: `${THEME_CONSTANTS.colors.success}08`,
              border: `1px solid ${THEME_CONSTANTS.colors.success}20`
            }}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <SafetyOutlined style={{ 
                  fontSize: '36px', 
                  color: THEME_CONSTANTS.colors.success,
                  marginBottom: '12px' 
                }} />
                <Text strong style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Secure & Encrypted</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  All data is encrypted and secured
                </Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card style={{ 
              borderRadius: '16px', 
              height: '100%',
              background: `${THEME_CONSTANTS.colors.info}08`,
              border: `1px solid ${THEME_CONSTANTS.colors.info}20`
            }}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <ClockCircleOutlined style={{ 
                  fontSize: '36px', 
                  color: THEME_CONSTANTS.colors.info,
                  marginBottom: '12px' 
                }} />
                <Text strong style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Fast Approval</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Typically approved in 24-48 hours
                </Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card style={{ 
              borderRadius: '16px', 
              height: '100%',
              background: `${THEME_CONSTANTS.colors.warning}08`,
              border: `1px solid ${THEME_CONSTANTS.colors.warning}20`
            }}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <TeamOutlined style={{ 
                  fontSize: '36px', 
                  color: THEME_CONSTANTS.colors.warning,
                  marginBottom: '12px' 
                }} />
                <Text strong style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '16px'
                }}>Dedicated Support</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Get assistance throughout the process
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Success Modal */}
        <Modal
          open={showSuccessModal}
          onCancel={handleSuccessModalClose}
          footer={[
            <Button key="done" type="primary" onClick={handleSuccessModalClose}>
              Go to Login
            </Button>
          ]}
          centered
          width={500}
        >
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CheckCircleOutlined style={{ 
              fontSize: '64px', 
              color: THEME_CONSTANTS.colors.success,
              marginBottom: '24px'
            }} />
            
            <Title level={3} style={{ marginBottom: '16px' }}>
              Application Submitted!
            </Title>
            
            <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '8px' }}>
              Your business verification request has been submitted successfully.
            </Paragraph>
            
            <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
              Our team will review your application and contact you within 24-48 business hours.
            </Paragraph>
            
            <Alert
              message="Next Steps"
              description="Check your email for confirmation and updates. You can login once verified."
              type="info"
              showIcon
              style={{ marginTop: '24px' }}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}