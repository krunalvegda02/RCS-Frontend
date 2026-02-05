// import React, { useState } from 'react';
// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   Typography,
//   Steps,
//   Row,
//   Col,
//   Grid,
//   Select,
//   Upload,
//   message,
//   Progress,
//   Divider,
//   Alert,
//   Space,
//   Modal,
//   Badge
// } from 'antd';
// import {
//   UserOutlined,
//   SafetyOutlined,
//   CheckCircleOutlined,
//   GlobalOutlined,
//   PhoneOutlined,
//   MailOutlined,
//   BankOutlined,
//   FileTextOutlined,
//   UploadOutlined,
//   RocketOutlined,
//   IdcardOutlined,
//   BuildOutlined,
//   DollarOutlined,
//   TeamOutlined,
//   ClockCircleOutlined,

//   FileDoneOutlined,
//   PercentageOutlined,
//   DockerOutlined
// } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import { THEME_CONSTANTS } from '../theme';
// import { _post, _get } from '../helper/apiClient';

// const { Title, Text, Paragraph } = Typography;
// const { useBreakpoint } = Grid;
// const { TextArea } = Input;
// const { Step } = Steps;
// const { Dragger } = Upload;

// export default function Onboarding() {
//   const [form] = Form.useForm();
//   const [currentStep, setCurrentStep] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({});
//   const [progress, setProgress] = useState(33);
//   const [uploadedFiles, setUploadedFiles] = useState({
//     registrationCertificate: null,
//     brandLogo: null
//   });
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const screens = useBreakpoint();
//   const navigate = useNavigate();

//   const steps = [
//     {
//       title: 'Business Details',
//       icon: <BankOutlined />,
//       description: 'Company Information'
//     },
//     {
//       title: 'Platform Setup',
//       icon: <BuildOutlined />,
//       description: 'Technical Configuration'
//     },
//     {
//       title: 'Verification',
//       icon: <SafetyOutlined />,
//       description: 'Document Submission'
//     },
//     {
//       title: 'Review',
//       icon: <FileDoneOutlined />,
//       description: 'Final Confirmation'
//     }
//   ];

//   const industries = [
//     { value: 'ecommerce', label: 'E-commerce & Retail' },
//     { value: 'banking', label: 'Banking & Financial Services' },
//     { value: 'healthcare', label: 'Healthcare & Pharma' },
//     { value: 'education', label: 'Education & EdTech' },
//     { value: 'travel', label: 'Travel & Hospitality' },
//     { value: 'logistics', label: 'Logistics & Delivery' },
//     { value: 'telecom', label: 'Telecommunications' },
//     { value: 'technology', label: 'Technology & SaaS' },
//     { value: 'automotive', label: 'Automotive' },
//     { value: 'real_estate', label: 'Real Estate' },
//     { value: 'media', label: 'Media & Entertainment' },
//     { value: 'government', label: 'Government & Public Sector' },
//     { value: 'other', label: 'Other' }
//   ];

//   const useCases = [
//     { value: 'order_updates', label: 'Order Updates & Tracking' },
//     { value: 'transaction_alerts', label: 'Transaction Alerts & OTP' },
//     { value: 'promotional', label: 'Promotional Campaigns' },
//     { value: 'appointment', label: 'Appointment Reminders' },
//     { value: 'customer_support', label: 'Customer Support' },
//     { value: 'marketing', label: 'Marketing & Lead Generation' },
//     { value: 'service_updates', label: 'Service Updates' },
//     { value: 'emergency_alerts', label: 'Emergency Alerts' },
//     { value: 'newsletter', label: 'Newsletter & Updates' },
//     { value: 'custom', label: 'Custom Use Case' }
//   ];

//   const onNext = async () => {
//     try {
//       const values = await form.validateFields();
//       const updatedData = { ...formData, ...values };
//       setFormData(updatedData);

//       const newStep = currentStep + 1;
//       setCurrentStep(newStep);
//       setProgress(((newStep + 1) / steps.length) * 100);
//     } catch (error) {
//       console.log('Validation failed:', error);
//     }
//   };

//   const onPrev = () => {
//     const newStep = currentStep - 1;
//     setCurrentStep(newStep);
//     setProgress(((newStep + 1) / steps.length) * 100);
//   };



//   const handleFileUpload = async (file, fileType) => {
//     const isValidFile = file.type === 'application/pdf' ||
//       file.type.startsWith('image/');

//     if (!isValidFile) {
//       message.error('Please upload only PDF or image files');
//       return Upload.LIST_IGNORE;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       message.error('File size must be less than 5MB');
//       return Upload.LIST_IGNORE;
//     }

//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       message.loading({ content: `Uploading ${fileType === 'registrationCertificate' ? 'certificate' : 'logo'}...`, key: fileType });

//       const response = await _post('/uploads/uploadFile', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });

//       if (response.success && response.data?.url) {
//         setUploadedFiles(prev => ({
//           ...prev,
//           [fileType]: {
//             file,
//             url: response.data.url
//           }
//         }));
//         message.success({ content: 'Upload successful!', key: fileType });
//       } else {
//         throw new Error(response.message || 'Upload failed');
//       }
//     } catch (error) {
//       console.error('Upload error:', error);
//       message.error({ content: 'Upload failed. Please try again.', key: fileType });
//     }

//     return false; // Prevent auto upload by antd
//   };

//   const validateGST = (rule, value) => {
//     if (!value) return Promise.reject('GST Number is required');

//     // Basic GST validation regex
//     const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

//     if (!gstRegex.test(value)) {
//       return Promise.reject('Please enter a valid GST number');
//     }

//     return Promise.resolve();
//   };

//   const onFinish = async () => {
//     try {
//       setLoading(true);
//       const values = await form.validateFields();

//       if (!uploadedFiles.registrationCertificate?.url || !uploadedFiles.brandLogo?.url) {
//         message.error('Please upload all required documents (Certificate and Logo)');
//         setLoading(false);
//         return;
//       }

//       const finalData = {
//         ...formData,
//         ...values,
//         registrationCertificateUrl: uploadedFiles.registrationCertificate.url,
//         brandLogoUrl: uploadedFiles.brandLogo.url
//       };

//       // Submit to backend
//       const response = await _post('/onboarding/submit', finalData);

//       if (response.success) {
//         // Show success modal
//         setShowSuccessModal(true);
//       } else {
//         message.error(response.message || 'Submission failed');
//       }

//     } catch (error) {
//       console.error('Submission error:', error);
//       message.error(error.message || 'Please fill all required fields correctly');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSuccessModalClose = () => {
//     setShowSuccessModal(false);
//     navigate('/login');
//   };

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <>
//             <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
//               <BankOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
//               Business Information
//             </Title>

//             <Row gutter={[24, 16]}>
//               <Col xs={24} md={12}>
//                 <Form.Item
//                   name="companyName"
//                   label="Legal Company Name"
//                   rules={[{ required: true, message: 'Legal company name is required' }]}
//                   tooltip="As per business registration"
//                 >
//                   <Input
//                     prefix={<BankOutlined />}
//                     placeholder="ABC Enterprises Private Limited"
//                     size="large"
//                     allowClear
//                   />
//                 </Form.Item>
//               </Col>

//               <Col xs={24} md={12}>
//                 <Form.Item
//                   name="brandName"
//                   label="Brand/Trading Name"
//                   rules={[{ required: true, message: 'Brand name is required for verification' }]}
//                   tooltip="This will appear in messages"
//                 >
//                   <Input
//                     prefix={<IdcardOutlined />}
//                     placeholder="Your Brand"
//                     size="large"
//                     allowClear
//                   />
//                 </Form.Item>
//               </Col>

//               <Col xs={24} md={12}>
//                 <Form.Item
//                   name="businessEmail"
//                   label="Official Business Email"
//                   rules={[
//                     { required: true, message: 'Business email is required' },
//                     { type: 'email', message: 'Valid email required' }
//                   ]}
//                 >
//                   <Input
//                     prefix={<MailOutlined />}
//                     placeholder="contact@company.com"
//                     size="large"
//                     allowClear
//                   />
//                 </Form.Item>
//               </Col>

//               <Col xs={24} md={12}>
//                 <Form.Item
//                   name="businessPhone"
//                   label="Business Phone"
//                   rules={[
//                     { required: true, message: 'Business phone is required' },
//                     { pattern: /^[0-9+\s()-]{10,}$/, message: 'Valid phone number required' }
//                   ]}
//                 >
//                   <Input
//                     prefix={<PhoneOutlined />}
//                     placeholder="+91 1234567890"
//                     size="large"
//                     allowClear
//                   />
//                 </Form.Item>
//               </Col>

//               <Col xs={24}>
//                 <Form.Item
//                   name="industry"
//                   label="Primary Industry"
//                   rules={[{ required: true, message: 'Please select your industry' }]}
//                 >
//                   <Select
//                     placeholder="Select your primary industry"
//                     size="large"
//                     options={industries}
//                     showSearch
//                     filterOption={(input, option) =>
//                       option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                     }
//                   />
//                 </Form.Item>
//               </Col>

//               <Col xs={24}>
//                 <Form.Item
//                   name="companyAddress"
//                   label="Registered Business Address"
//                   rules={[{ required: true, message: 'Business address is required' }]}
//                 >
//                   <TextArea
//                     rows={3}
//                     placeholder="Full registered address as per business documents"
//                     maxLength={200}
//                     showCount
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>
//           </>
//         );
//       case 1:
//         return (
//           <>
//             <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
//               <BuildOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
//               Platform & Volume Details
//             </Title>

//             <Row gutter={[24, 16]}>
//               <Col xs={24}>
//                 <Form.Item
//                   name="website"
//                   label="Official Website"
//                   rules={[
//                     { required: true, message: 'Website URL is required' },
//                     { type: 'url', message: 'Please enter a valid URL (https://)' }
//                   ]}
//                 >
//                   <Input
//                     prefix={<GlobalOutlined />}
//                     placeholder="https://yourcompany.com"
//                     size="large"
//                     allowClear
//                     addonBefore="https://"
//                   />
//                 </Form.Item>
//               </Col>




//             </Row>
//           </>
//         );
//       case 2:
//         return (
//           <>
//             <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
//               <DockerOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
//               Document Verification
//             </Title>

//             <Alert
//               message="Document Requirements"
//               description="All documents must be clear, readable, and match your business information"
//               type="info"
//               showIcon
//               style={{ marginBottom: 24 }}
//             />

//             <Row gutter={[24, 24]}>
//               <Col xs={24}>
//                 <Form.Item
//                   name="gstNumber"
//                   label="GST Registration Number"
//                   rules={[
//                     { required: true, message: 'GST number is required' },
//                     { validator: validateGST }
//                   ]}
//                   tooltip="15-digit GSTIN format"
//                 >
//                   <Input
//                     prefix={<FileTextOutlined />}
//                     placeholder="22AAAAA0000A1Z5"
//                     size="large"
//                     allowClear
//                   />
//                 </Form.Item>
//               </Col>

//               <Col xs={24}>
//                 <Card
//                   title={
//                     <span>
//                       <FileTextOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.primary }} />
//                       Business Registration Certificate
//                     </span>
//                   }
//                   style={{ marginBottom: 16 }}
//                   bodyStyle={{ padding: 24 }}
//                 >
//                   <Form.Item
//                     name="registrationCertificate"
//                     rules={[{ required: true, message: 'Registration certificate is required' }]}
//                   >
//                     <Dragger
//                       beforeUpload={(file) => handleFileUpload(file, 'registrationCertificate')}
//                       maxCount={1}
//                       accept=".pdf,.jpg,.jpeg,.png"
//                       showUploadList={false}
//                     >
//                       <div style={{ padding: '40px 20px', textAlign: 'center' }}>
//                         <UploadOutlined style={{ fontSize: 48, color: THEME_CONSTANTS.colors.primary, marginBottom: 16 }} />
//                         <Paragraph style={{ marginBottom: 8 }}>
//                           <Text strong>Click or drag to upload</Text>
//                         </Paragraph>
//                         <Paragraph type="secondary">
//                           PDF, JPG, PNG up to 5MB
//                         </Paragraph>
//                       </div>
//                     </Dragger>
//                   </Form.Item>

//                   {uploadedFiles.registrationCertificate && (
//                     <Alert
//                       message={`Uploaded: ${uploadedFiles.registrationCertificate.name}`}
//                       type="success"
//                       showIcon
//                       style={{ marginTop: 16 }}
//                     />
//                   )}
//                 </Card>
//               </Col>

//               <Col xs={24}>
//                 <Card
//                   title={
//                     <span>
//                       <IdcardOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.primary }} />
//                       Brand Logo (For Verified Badge)
//                     </span>
//                   }
//                   bodyStyle={{ padding: 24 }}
//                 >
//                   <Form.Item
//                     name="brandLogo"
//                     rules={[{ required: true, message: 'Brand logo is required for verification' }]}
//                   >
//                     <Dragger
//                       beforeUpload={(file) => handleFileUpload(file, 'brandLogo')}
//                       maxCount={1}
//                       accept=".jpg,.jpeg,.png"
//                       showUploadList={false}
//                     >
//                       <div style={{ padding: '40px 20px', textAlign: 'center' }}>
//                         <UploadOutlined style={{ fontSize: 48, color: THEME_CONSTANTS.colors.primary, marginBottom: 16 }} />
//                         <Paragraph style={{ marginBottom: 8 }}>
//                           <Text strong>Upload High-Quality Logo</Text>
//                         </Paragraph>
//                         <Paragraph type="secondary">
//                           JPG, PNG up to 5MB • Min. 400×400px
//                         </Paragraph>
//                       </div>
//                     </Dragger>
//                   </Form.Item>

//                   {uploadedFiles.brandLogo && (
//                     <Alert
//                       message={`Uploaded: ${uploadedFiles.brandLogo.name}`}
//                       type="success"
//                       showIcon
//                       style={{ marginTop: 16 }}
//                     />
//                   )}
//                 </Card>
//               </Col>
//             </Row>
//           </>
//         );
//       case 3:
//         return (
//           <>
//             <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
//               <FileDoneOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
//               Review & Submit
//             </Title>

//             <Card
//               title="Onboarding Summary"
//               style={{ marginBottom: 24 }}
//               bodyStyle={{ padding: 24 }}
//             >
//               <Row gutter={[24, 16]}>
//                 <Col xs={24} md={12}>
//                   <div style={{ marginBottom: 16 }}>
//                     <Text strong>Business Information</Text>
//                     <Divider style={{ margin: '12px 0' }} />
//                     <Space direction="vertical" size={8}>
//                       <div>
//                         <Text type="secondary">Company:</Text>{' '}
//                         <Text strong>{formData.companyName || 'Not provided'}</Text>
//                       </div>
//                       <div>
//                         <Text type="secondary">Brand:</Text>{' '}
//                         <Text strong>{formData.brandName || 'Not provided'}</Text>
//                       </div>
//                       <div>
//                         <Text type="secondary">Industry:</Text>{' '}
//                         <Text strong>{industries.find(i => i.value === formData.industry)?.label || 'Not provided'}</Text>
//                       </div>
//                     </Space>
//                   </div>
//                 </Col>

//                 <Col xs={24} md={12}>
//                   <div style={{ marginBottom: 16 }}>
//                     <Text strong>Contact Details</Text>
//                     <Divider style={{ margin: '12px 0' }} />
//                     <Space direction="vertical" size={8}>
//                       <div>
//                         <Text type="secondary">Email:</Text>{' '}
//                         <Text strong>{formData.businessEmail || 'Not provided'}</Text>
//                       </div>
//                       <div>
//                         <Text type="secondary">Phone:</Text>{' '}
//                         <Text strong>{formData.businessPhone || 'Not provided'}</Text>
//                       </div>
//                       <div>
//                         <Text type="secondary">Website:</Text>{' '}
//                         <Text strong>{formData.website || 'Not provided'}</Text>
//                       </div>
//                     </Space>
//                   </div>
//                 </Col>

//                 <Col xs={24}>
//                   <div style={{ marginBottom: 16 }}>
//                     <Text strong>Document Status</Text>
//                     <Divider style={{ margin: '12px 0' }} />
//                     <Space direction="vertical" size={8}>
//                       <div>
//                         <Badge
//                           status={formData.gstNumber ? "success" : "error"}
//                           text={`GST Number: ${formData.gstNumber ? '✓ Provided' : '✗ Missing'}`}
//                         />
//                       </div>
//                       <div>
//                         <Badge
//                           status={uploadedFiles.registrationCertificate ? "success" : "error"}
//                           text={`Registration Certificate: ${uploadedFiles.registrationCertificate ? '✓ Uploaded' : '✗ Pending'}`}
//                         />
//                       </div>
//                       <div>
//                         <Badge
//                           status={uploadedFiles.brandLogo ? "success" : "error"}
//                           text={`Brand Logo: ${uploadedFiles.brandLogo ? '✓ Uploaded' : '✗ Pending'}`}
//                         />
//                       </div>
//                     </Space>
//                   </div>
//                 </Col>

//                 <Col xs={24}>
//                   <Alert
//                     message="Verification Timeline"
//                     description="Your application will be reviewed within 24-48 business hours. You'll receive an email once verified."
//                     type="info"
//                     showIcon
//                   />
//                 </Col>
//               </Row>
//             </Card>
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight}08 0%, ${THEME_CONSTANTS.colors.background} 100%)`,
//       padding: screens.xs ? '16px' : '32px'
//     }}>
//       <div style={{
//         maxWidth: '1000px',
//         margin: '0 auto',
//         position: 'relative'
//       }}>
//         {/* Progress Bar */}
//         <div style={{ marginBottom: 32 }}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             marginBottom: 8
//           }}>
//             <Text strong style={{ fontSize: '14px' }}>Onboarding Progress</Text>
//             <Text strong style={{ color: THEME_CONSTANTS.colors.primary }}>{Math.round(progress)}%</Text>
//           </div>
//           <Progress
//             percent={progress}
//             strokeColor={{
//               '0%': THEME_CONSTANTS.colors.primaryLight,
//               '100%': THEME_CONSTANTS.colors.primary,
//             }}
//             strokeWidth={6}
//             showInfo={false}
//           />
//         </div>

//         {/* Header */}
//         <div style={{
//           textAlign: 'center',
//           marginBottom: 40,
//           padding: screens.xs ? '0' : '0 20px'
//         }}>
//           <div style={{
//             width: '80px',
//             height: '80px',
//             background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
//             borderRadius: '24px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             margin: '0 auto 24px',
//             boxShadow: `0 12px 32px ${THEME_CONSTANTS.colors.primary}30`
//           }}>
//             <RocketOutlined style={{ fontSize: '40px', color: 'white' }} />
//           </div>

//           <Title level={2} style={{
//             marginBottom: '12px',
//             fontSize: screens.xs ? '28px' : '36px',
//             background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.text} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent'
//           }}>
//             Get Verified on RCS Platform
//           </Title>

//           <Paragraph style={{
//             fontSize: '16px',
//             color: THEME_CONSTANTS.colors.textSecondary,
//             maxWidth: '600px',
//             margin: '0 auto 8px'
//           }}>
//             Complete your business verification to unlock verified RCS messaging capabilities
//           </Paragraph>

//           <Text type="secondary" style={{ fontSize: '14px' }}>
//             Average approval time: 24-48 hours
//           </Text>
//         </div>

//         {/* Steps */}
//         <Card style={{
//           borderRadius: '20px',
//           boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
//           border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//           marginBottom: '32px',
//           background: THEME_CONSTANTS.colors.surface
//         }}>
//           <Steps
//             current={currentStep}
//             items={steps}
//             responsive={false}
//             style={{ padding: screens.xs ? '16px' : '24px' }}
//           />
//         </Card>

//         {/* Main Form Card */}
//         <Card style={{
//           borderRadius: '20px',
//           boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
//           border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//           background: THEME_CONSTANTS.colors.surface,
//           marginBottom: '24px'
//         }}>
//           <Form form={form} layout="vertical" size="large">
//             <div style={{ padding: screens.xs ? '24px 16px' : '32px' }}>
//               {renderStepContent()}
//             </div>

//             {/* Navigation Buttons */}
//             <Divider style={{ margin: '32px 0' }} />

//             <Row gutter={16} style={{ padding: screens.xs ? '0 16px 24px' : '0 32px 32px' }}>
//               <Col xs={24} md={12}>
//                 {currentStep > 0 && (
//                   <Button
//                     size="large"
//                     block
//                     onClick={onPrev}
//                     style={{ height: '52px' }}
//                   >
//                     ← Previous Step
//                   </Button>
//                 )}
//               </Col>
//               <Col xs={24} md={12}>
//                 {currentStep < steps.length - 1 ? (
//                   <Button
//                     type="primary"
//                     size="large"
//                     block
//                     onClick={onNext}
//                     style={{ height: '52px' }}
//                   >
//                     Next Step →
//                   </Button>
//                 ) : (
//                   <Button
//                     type="primary"
//                     size="large"
//                     block
//                     onClick={onFinish}
//                     loading={loading}
//                     icon={<CheckCircleOutlined />}
//                     style={{
//                       height: '52px',
//                       background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
//                       border: 'none'
//                     }}
//                   >
//                     Submit for Verification
//                   </Button>
//                 )}
//               </Col>
//             </Row>
//           </Form>
//         </Card>

//         {/* Info Cards */}
//         <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
//           <Col xs={24} md={8}>
//             <Card style={{
//               borderRadius: '16px',
//               height: '100%',
//               background: `${THEME_CONSTANTS.colors.success}08`,
//               border: `1px solid ${THEME_CONSTANTS.colors.success}20`
//             }}>
//               <div style={{ textAlign: 'center', padding: '16px' }}>
//                 <SafetyOutlined style={{
//                   fontSize: '36px',
//                   color: THEME_CONSTANTS.colors.success,
//                   marginBottom: '12px'
//                 }} />
//                 <Text strong style={{
//                   display: 'block',
//                   marginBottom: '8px',
//                   fontSize: '16px'
//                 }}>Secure & Encrypted</Text>
//                 <Text type="secondary" style={{ fontSize: '14px' }}>
//                   All data is encrypted and secured
//                 </Text>
//               </div>
//             </Card>
//           </Col>

//           <Col xs={24} md={8}>
//             <Card style={{
//               borderRadius: '16px',
//               height: '100%',
//               background: `${THEME_CONSTANTS.colors.info}08`,
//               border: `1px solid ${THEME_CONSTANTS.colors.info}20`
//             }}>
//               <div style={{ textAlign: 'center', padding: '16px' }}>
//                 <ClockCircleOutlined style={{
//                   fontSize: '36px',
//                   color: THEME_CONSTANTS.colors.info,
//                   marginBottom: '12px'
//                 }} />
//                 <Text strong style={{
//                   display: 'block',
//                   marginBottom: '8px',
//                   fontSize: '16px'
//                 }}>Fast Approval</Text>
//                 <Text type="secondary" style={{ fontSize: '14px' }}>
//                   Typically approved in 24-48 hours
//                 </Text>
//               </div>
//             </Card>
//           </Col>

//           <Col xs={24} md={8}>
//             <Card style={{
//               borderRadius: '16px',
//               height: '100%',
//               background: `${THEME_CONSTANTS.colors.warning}08`,
//               border: `1px solid ${THEME_CONSTANTS.colors.warning}20`
//             }}>
//               <div style={{ textAlign: 'center', padding: '16px' }}>
//                 <TeamOutlined style={{
//                   fontSize: '36px',
//                   color: THEME_CONSTANTS.colors.warning,
//                   marginBottom: '12px'
//                 }} />
//                 <Text strong style={{
//                   display: 'block',
//                   marginBottom: '8px',
//                   fontSize: '16px'
//                 }}>Dedicated Support</Text>
//                 <Text type="secondary" style={{ fontSize: '14px' }}>
//                   Get assistance throughout the process
//                 </Text>
//               </div>
//             </Card>
//           </Col>
//         </Row>

//         {/* Success Modal */}
//         <Modal
//           open={showSuccessModal}
//           onCancel={handleSuccessModalClose}
//           footer={[
//             <Button key="done" type="primary" onClick={handleSuccessModalClose}>
//               Go to Login
//             </Button>
//           ]}
//           centered
//           width={500}
//         >
//           <div style={{ textAlign: 'center', padding: '32px 0' }}>
//             <CheckCircleOutlined style={{
//               fontSize: '64px',
//               color: THEME_CONSTANTS.colors.success,
//               marginBottom: '24px'
//             }} />

//             <Title level={3} style={{ marginBottom: '16px' }}>
//               Application Submitted!
//             </Title>

//             <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '8px' }}>
//               Your business verification request has been submitted successfully.
//             </Paragraph>

//             <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
//               Our team will review your application and contact you within 24-48 business hours.
//             </Paragraph>

//             <Alert
//               message="Next Steps"
//               description="Check your email for confirmation and updates. You can login once verified."
//               type="info"
//               showIcon
//               style={{ marginTop: '24px' }}
//             />
//           </div>
//         </Modal>
//       </div>
//     </div>
//   );
// }

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
  FileDoneOutlined,
  PercentageOutlined,
  FileProtectOutlined,
  VerifiedOutlined,
  CloudServerOutlined,
  SecurityScanOutlined,
  LogoutOutlined,
  EyeOutlined,
  ScissorOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { THEME_CONSTANTS } from '../theme';
import { _post, _get } from '../helper/apiClient';
import { logout } from '../redux/slices/authSlice';
import RCSImageCropper from '../components/ImageCropper';

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
    brandLogo: null,
    companyBanner: null
  });
  const [certificateType, setCertificateType] = useState('gst');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cropperState, setCropperState] = useState({
    open: false,
    imageUrl: null,
    fileType: null,
    targetDimensions: null
  });
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const steps = [
    {
      title: 'Business Details',
      icon: <BankOutlined />,
      description: 'Company Information'
    },
    {
      title: 'Document Verification',
      icon: <FileProtectOutlined />,
      description: 'Document Submission'
    },
    {
      title: 'Review & Submit',
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

  const handleFileUpload = async (file, fileType) => {
    const isValidFile = file.type === 'application/pdf' ||
      file.type.startsWith('image/');

    if (!isValidFile) {
      message.error('Please upload only PDF or image files');
      return Upload.LIST_IGNORE;
    }

    // For logo and banner, open cropper
    if (file.type.startsWith('image/') && (fileType === 'brandLogo' || fileType === 'companyBanner')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const targetDimensions = fileType === 'brandLogo' 
          ? { width: 224, height: 224 }
          : { width: 1440, height: 448 };
        
        setCropperState({
          open: true,
          imageUrl: e.target.result,
          fileType,
          targetDimensions
        });
      };
      reader.readAsDataURL(file);
      return Upload.LIST_IGNORE;
    }

    // For PDF files, proceed directly
    await uploadFile(file, fileType);
    return false;
  };

  const handleCropComplete = async (croppedFile, cropData) => {
    setCropperState({ open: false, imageUrl: null, fileType: null, targetDimensions: null });
    await uploadFile(croppedFile, cropperState.fileType);
  };

  const handleCropperCancel = () => {
    setCropperState({ open: false, imageUrl: null, fileType: null, targetDimensions: null });
  };

  const uploadFile = async (file, fileType) => {
    try {
      // Delete old file from Cloudinary if exists
      if (uploadedFiles[fileType]?.url) {
        try {
          await _post('/uploads/deleteFile', { url: uploadedFiles[fileType].url });
        } catch (deleteError) {
          console.warn('Failed to delete old file:', deleteError);
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'kyc');

      const uploadLabel = fileType === 'registrationCertificate' ? 'certificate' : fileType === 'brandLogo' ? 'logo' : 'banner';
      message.loading({ content: `Uploading ${uploadLabel}...`, key: fileType });

      const response = await _post('/uploads/uploadFile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Upload response:', response);

      if ((response.data?.success || response.status === 200) && response.data?.data?.url) {
        setUploadedFiles(prev => ({
          ...prev,
          [fileType]: {
            file,
            url: response.data.data.url
          }
        }));
        message.success({ content: 'Upload successful!', key: fileType });
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error({ content: error.message || 'Upload failed. Please try again.', key: fileType });
    }
  };

  const validateGST = (rule, value) => {
    if (certificateType !== 'gst') return Promise.resolve();
    if (!value) return Promise.reject('GST Number is required');

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(value)) {
      return Promise.reject('Please enter a valid GST number');
    }

    return Promise.resolve();
  };

  const validateMSME = (rule, value) => {
    if (certificateType !== 'msme') return Promise.resolve();
    if (!value) return Promise.reject('MSME/Udyam Number is required');
    return Promise.resolve();
  };

  const validateWebsite = (rule, value) => {
    if (!value) return Promise.reject('Website URL is required');

    try {
      // Ensure URL starts with http:// or https://
      const url = value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`;

      new URL(url);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject('Please enter a valid website URL (e.g., yourcompany.com)');
    }
  };

  const onFinish = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!uploadedFiles.registrationCertificate?.url || !uploadedFiles.brandLogo?.url || !uploadedFiles.companyBanner?.url) {
        message.error('Please upload all required documents (Certificate, Logo, and Banner)');
        setLoading(false);
        return;
      }

      const finalData = {
        ...formData,
        ...values,
        registrationCertificateUrl: uploadedFiles.registrationCertificate.url,
        brandLogoUrl: uploadedFiles.brandLogo.url,
        companyBannerUrl: uploadedFiles.companyBanner.url
      };

      // Submit to backend
      const response = await _post('/onboarding/submit', finalData);

      if (response.success || response.data?.success) {
        message.success('Application submitted successfully!');
        setShowSuccessModal(true);
      } else {
        message.error(response.message || response.data?.message || 'Unable to submit application. Please try again.');
        setLoading(false);
      }

    } catch (error) {
      console.error('Submission error:', error);
      message.error('An error occurred while submitting. Please check your information and try again.');
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/pending-approval');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
              <BankOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
              Business Information & Digital Presence
            </Title>

            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="companyName"
                  label="Legal Company Name"
                  rules={[{ required: true, message: 'Legal company name is required' }]}
                  tooltip="As per business registration documents"
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
                  tooltip="This will appear in RCS messages"
                >
                  <Input
                    prefix={<IdcardOutlined />}
                    placeholder="Your Brand Name"
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
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                  tooltip="Will be used for verification communication"
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
                  label="Business Phone Number"
                  rules={[
                    { required: true, message: 'Business phone number is required' },
                    { pattern: /^[0-9+\s()-]{10,}$/, message: 'Please enter a valid phone number' }
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
                  name="website"
                  label="Official Website URL"
                  rules={[
                    { required: true, message: 'Website URL is required' },
                    { validator: validateWebsite }
                  ]}
                  tooltip="Must be a valid, accessible website"
                >
                  <Input
                    prefix={<GlobalOutlined />}
                    placeholder="yourcompany.com"
                    size="large"
                    allowClear
                    suffix=".com"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="industry"
                  label="Primary Industry"
                  rules={[{ required: true, message: 'Please select your primary industry' }]}
                  tooltip="Select the industry that best describes your business"
                >
                  <Select
                    placeholder="Select your primary industry"
                    size="large"
                    options={industries}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="companyAddress"
                  label="Registered Business Address"
                  rules={[{ required: true, message: 'Business address is required' }]}
                  tooltip="Full address as per business registration documents"
                >
                  <TextArea
                    rows={3}
                    placeholder="Complete registered address including city, state, and PIN code"
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
            <div style={{ marginBottom: 32 }}>
              <Title level={3} style={{ marginBottom: 8, color: THEME_CONSTANTS.colors.text, fontSize: '24px' }}>
                📄 Upload Required Documents
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                Please upload the following 3 documents to verify your business
              </Text>
            </div>

            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              {/* Step 1: Registration Type */}
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '2px solid #e9ecef' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>Step 1: Select Registration Type</Text>
                </div>
                <Select
                  value={certificateType}
                  onChange={(value) => {
                    setCertificateType(value);
                    form.setFieldsValue({ gstNumber: undefined, msmeNumber: undefined });
                  }}
                  size="large"
                  style={{ width: '100%' }}
                  options={[
                    { value: 'gst', label: '🏢 GST Registered Business' },
                    { value: 'msme', label: '🏭 MSME/Udyam Registered Business' }
                  ]}
                />
              </div>

              {/* Step 2: Registration Number */}
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '2px solid #e9ecef' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>
                    Step 2: Enter {certificateType === 'gst' ? 'GST' : 'MSME'} Number
                  </Text>
                </div>
                {certificateType === 'gst' ? (
                  <Form.Item
                    name="gstNumber"
                    rules={[{ validator: validateGST }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      prefix={<VerifiedOutlined />}
                      placeholder="Example: 22AAAAA0000A1Z5"
                      size="large"
                      allowClear
                      maxLength={15}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="msmeNumber"
                    rules={[{ validator: validateMSME }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      prefix={<VerifiedOutlined />}
                      placeholder="Example: UDYAM-XX-00-0000000"
                      size="large"
                      allowClear
                    />
                  </Form.Item>
                )}
              </div>

              {/* Step 3: Upload Certificate */}
              <div style={{ background: '#fff7e6', padding: '20px', borderRadius: '12px', border: '2px solid #ffd591' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>
                    Step 3: Upload {certificateType === 'gst' ? 'GST' : 'MSME'} Certificate (PDF/Image)
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Accepted: PDF, JPG, PNG • Max size: 5MB</Text>
                  </div>
                </div>
                <Form.Item
                  name="registrationCertificate"
                  rules={[{ required: true, message: 'Certificate is required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Dragger
                    beforeUpload={(file) => handleFileUpload(file, 'registrationCertificate')}
                    maxCount={1}
                    accept=".pdf,.jpg,.jpeg,.png"
                    showUploadList={false}
                    style={{ background: '#fff', borderColor: '#ffa940' }}
                  >
                    <div style={{ padding: '30px 20px' }}>
                      <FileTextOutlined style={{ fontSize: 48, color: '#fa8c16', marginBottom: 12 }} />
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 8 }}>Click or Drag Certificate Here</div>
                      <Text type="secondary">Upload your business registration certificate</Text>
                    </div>
                  </Dragger>
                </Form.Item>
                {uploadedFiles.registrationCertificate && (
                  <Alert
                    message="✓ Certificate Uploaded Successfully"
                    description={uploadedFiles.registrationCertificate.file.name}
                    type="success"
                    showIcon
                    closable
                    onClose={() => setUploadedFiles(prev => ({ ...prev, registrationCertificate: null }))}
                    style={{ marginTop: 16 }}
                  />
                )}
              </div>

              {/* Step 4: Upload Logo */}
              <div style={{ background: '#e6f7ff', padding: '20px', borderRadius: '12px', border: '2px solid #91d5ff' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>
                    Step 4: Upload Brand Logo (Square Image)
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Required size: 224×224 pixels • Format: JPG or PNG</Text>
                  </div>
                </div>
                <Form.Item
                  name="brandLogo"
                  rules={[{ required: true, message: 'Logo is required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Dragger
                    beforeUpload={(file) => handleFileUpload(file, 'brandLogo')}
                    maxCount={1}
                    accept=".jpg,.jpeg,.png"
                    showUploadList={false}
                    style={{ background: '#fff', borderColor: '#40a9ff' }}
                  >
                    <div style={{ padding: '30px 20px' }}>
                      <IdcardOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 8 }}>Click or Drag Logo Here</div>
                      <Text type="secondary">You'll be able to crop after upload</Text>
                    </div>
                  </Dragger>
                </Form.Item>
                {uploadedFiles.brandLogo && (
                  <div style={{ marginTop: 16, textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                    <img src={uploadedFiles.brandLogo.url} alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 8, marginBottom: 12 }} />
                    <div>
                      <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, marginRight: 8, fontSize: '16px' }} />
                      <Text strong style={{ color: THEME_CONSTANTS.colors.success }}>Logo Uploaded (224×224px)</Text>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 5: Upload Banner */}
              <div style={{ background: '#f9f0ff', padding: '20px', borderRadius: '12px', border: '2px solid #d3adf7' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>
                    Step 5: Upload Company Banner (Wide Image)
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Required size: 1440×448 pixels • Format: JPG or PNG</Text>
                  </div>
                </div>
                <Form.Item
                  name="companyBanner"
                  rules={[{ required: true, message: 'Banner is required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Dragger
                    beforeUpload={(file) => handleFileUpload(file, 'companyBanner')}
                    maxCount={1}
                    accept=".jpg,.jpeg,.png"
                    showUploadList={false}
                    style={{ background: '#fff', borderColor: '#b37feb' }}
                  >
                    <div style={{ padding: '30px 20px' }}>
                      <GlobalOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 12 }} />
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 8 }}>Click or Drag Banner Here</div>
                      <Text type="secondary">You'll be able to crop after upload</Text>
                    </div>
                  </Dragger>
                </Form.Item>
                {uploadedFiles.companyBanner && (
                  <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '1440/448',
                      overflow: 'hidden', 
                      borderRadius: 8, 
                      marginBottom: 12,
                      background: '#f0f0f0'
                    }}>
                      <img 
                        src={uploadedFiles.companyBanner.url} 
                        alt="Banner" 
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }} 
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, marginRight: 8, fontSize: '16px' }} />
                      <Text strong style={{ color: THEME_CONSTANTS.colors.success }}>Banner Uploaded (1440×448px)</Text>
                    </div>
                  </div>
                )}
              </div>
            </Space>
          </>
        );
      case 2:
        return (
          <>
            <Title level={4} style={{ marginBottom: 24, color: THEME_CONSTANTS.colors.text }}>
              <FileDoneOutlined style={{ marginRight: 12, color: THEME_CONSTANTS.colors.primary }} />
              Review & Submit Application
            </Title>

            <Card
              title="Onboarding Summary"
              style={{ marginBottom: 24 }}
              bodyStyle={{ padding: 24 }}
              extra={<Badge status="processing" text="Ready for Submission" />}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Card
                    title="Business Information"
                    size="small"
                    style={{ marginBottom: 16 }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Legal Company Name</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{formData.companyName || 'Not provided'}</Text>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Brand/Trading Name</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{formData.brandName || 'Not provided'}</Text>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Industry</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{industries.find(i => i.value === formData.industry)?.label || 'Not provided'}</Text>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Website</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>
                            <GlobalOutlined style={{ marginRight: 8, fontSize: '12px' }} />
                            {formData.website || 'Not provided'}
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title="Contact Details"
                    size="small"
                    style={{ marginBottom: 16 }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Business Email</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>
                            <MailOutlined style={{ marginRight: 8, fontSize: '12px' }} />
                            {formData.businessEmail || 'Not provided'}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Business Phone</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>
                            <PhoneOutlined style={{ marginRight: 8, fontSize: '12px' }} />
                            {formData.businessPhone || 'Not provided'}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Business Address</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>
                            <BankOutlined style={{ marginRight: 8, fontSize: '12px' }} />
                            {formData.companyAddress ? `${formData.companyAddress.substring(0, 60)}...` : 'Not provided'}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{certificateType === 'gst' ? 'GST Number' : 'MSME Number'}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Badge
                            status={formData.gstNumber || formData.msmeNumber ? "success" : "error"}
                            text={
                              <Text strong style={{ color: (formData.gstNumber || formData.msmeNumber) ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.error }}>
                                {formData.gstNumber || formData.msmeNumber || 'Not provided'}
                              </Text>
                            }
                          />
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24}>
                  <Card
                    title="Document Verification Status"
                    size="small"
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          <div>
                            <Badge
                              status={uploadedFiles.registrationCertificate ? "success" : "error"}
                              text={
                                <Text strong>
                                  Registration Certificate: {uploadedFiles.registrationCertificate ? '✓ Uploaded' : '✗ Pending'}
                                </Text>
                              }
                            />
                            {uploadedFiles.registrationCertificate && (
                              <div style={{ marginLeft: 24, marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  File: {uploadedFiles.registrationCertificate.file.name}
                                </Text>
                              </div>
                            )}
                          </div>

                          <div>
                            <Badge
                              status={uploadedFiles.brandLogo ? "success" : "error"}
                              text={
                                <Text strong>
                                  Brand Logo: {uploadedFiles.brandLogo ? '✓ Uploaded' : '✗ Pending'}
                                </Text>
                              }
                            />
                            {uploadedFiles.brandLogo && (
                              <div style={{ marginLeft: 24, marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  File: {uploadedFiles.brandLogo.file.name}
                                </Text>
                              </div>
                            )}
                          </div>

                          <div>
                            <Badge
                              status={uploadedFiles.companyBanner ? "success" : "error"}
                              text={
                                <Text strong>
                                  Company Banner: {uploadedFiles.companyBanner ? '✓ Uploaded' : '✗ Pending'}
                                </Text>
                              }
                            />
                            {uploadedFiles.companyBanner && (
                              <div style={{ marginLeft: 24, marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  File: {uploadedFiles.companyBanner.file.name}
                                </Text>
                              </div>
                            )}
                          </div>
                        </Space>
                      </Col>

                      <Col xs={24} md={12}>
                        <Alert
                          message="Verification Timeline"
                          description="Your application will undergo verification within 24-48 business hours. You will receive email notifications at each stage of the process."
                          type="info"
                          showIcon
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Card>

            <Alert
              message="Terms & Conditions"
              description="By submitting this application, you confirm that all information provided is accurate and complete. You authorize us to verify the submitted documents and contact you for any clarification if required."
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
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
      padding: screens.xs ? '12px' : screens.sm ? '16px' : screens.md ? '24px' : '32px'
    }}>
      <div style={{
        maxWidth: screens.xs ? '100%' : screens.sm ? '95%' : screens.md ? '900px' : '1000px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: screens.xs ? 20 : screens.sm ? 24 : 32 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <Text strong style={{ fontSize: screens.xs ? '12px' : '14px' }}>Onboarding Progress</Text>
            <Text strong style={{ color: THEME_CONSTANTS.colors.primary, fontSize: screens.xs ? '12px' : '14px' }}>{Math.round(progress)}%</Text>
          </div>
          <Progress
            percent={progress}
            strokeColor={{
              '0%': THEME_CONSTANTS.colors.primaryLight,
              '100%': THEME_CONSTANTS.colors.primary,
            }}
            strokeWidth={screens.xs ? 4 : 6}
            showInfo={false}
          />
        </div>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: screens.xs ? 24 : screens.sm ? 32 : 40,
          padding: screens.xs ? '0 8px' : screens.sm ? '0 12px' : '0 20px',
          position: 'relative'
        }}>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            size={screens.xs ? 'small' : screens.sm ? 'middle' : 'large'}
            style={{
              position: 'absolute',
              top: 0,
              right: screens.xs ? 8 : screens.sm ? 12 : 20,
              fontWeight: 600,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.2)',
              fontSize: screens.xs ? '12px' : '14px'
            }}
          >
            {screens.xs ? '' : screens.sm ? 'Logout' : 'Logout'}
          </Button>
          <div style={{
            width: screens.xs ? '60px' : screens.sm ? '70px' : '80px',
            height: screens.xs ? '60px' : screens.sm ? '70px' : '80px',
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
            borderRadius: screens.xs ? '16px' : screens.sm ? '20px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 12px 32px ${THEME_CONSTANTS.colors.primary}30`
          }}>
            <RocketOutlined style={{ fontSize: screens.xs ? '28px' : screens.sm ? '34px' : '40px', color: 'white' }} />
          </div>

          <Title level={2} style={{
            marginBottom: '12px',
            fontSize: screens.xs ? '20px' : screens.sm ? '24px' : screens.md ? '30px' : '36px',
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.text} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2
          }}>
            Business Verification Portal
          </Title>

          <Paragraph style={{
            fontSize: screens.xs ? '13px' : screens.sm ? '14px' : '16px',
            color: THEME_CONSTANTS.colors.textSecondary,
            maxWidth: '600px',
            margin: '0 auto 8px',
            padding: screens.xs ? '0 8px' : '0'
          }}>
            Complete your business verification to unlock RCS messaging capabilities with verified sender status
          </Paragraph>

          <Text type="secondary" style={{ fontSize: screens.xs ? '11px' : screens.sm ? '12px' : '14px' }}>
            Secure • Professional • Fast Approval Process
          </Text>
        </div>

        {/* Steps */}
        <Card style={{
          borderRadius: screens.xs ? '12px' : screens.sm ? '16px' : '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
          marginBottom: screens.xs ? 20 : screens.sm ? 24 : 32,
          background: THEME_CONSTANTS.colors.surface
        }}>
          <Steps
            current={currentStep}
            items={steps}
            responsive={true}
            direction={screens.xs ? 'vertical' : 'horizontal'}
            size={screens.xs ? 'small' : 'default'}
            style={{ padding: screens.xs ? '12px' : screens.sm ? '16px' : '24px' }}
          />
        </Card>

        {/* Main Form Card */}
        <Card style={{
          borderRadius: screens.xs ? '12px' : screens.sm ? '16px' : '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
          background: THEME_CONSTANTS.colors.surface,
          marginBottom: screens.xs ? 16 : screens.sm ? 20 : 24
        }}>
          <Form form={form} layout="vertical" size={screens.xs ? 'middle' : 'large'}>
            <div style={{ padding: screens.xs ? '16px 12px' : screens.sm ? '20px 16px' : screens.md ? '28px 24px' : '32px' }}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <Divider style={{ margin: screens.xs ? '20px 0' : screens.sm ? '24px 0' : '32px 0' }} />

            <Row gutter={[12, 12]} style={{ padding: screens.xs ? '0 12px 16px' : screens.sm ? '0 16px 20px' : '0 32px 32px' }}>
              <Col xs={24} md={12}>
                {currentStep > 0 && (
                  <Button
                    size={screens.xs ? 'middle' : 'large'}
                    block
                    onClick={onPrev}
                    style={{ height: screens.xs ? '44px' : screens.sm ? '48px' : '52px', fontSize: screens.xs ? '14px' : '16px' }}
                    icon={<CloudServerOutlined />}
                  >
                    {screens.xs ? 'Previous' : 'Previous Step'}
                  </Button>
                )}
              </Col>
              <Col xs={24} md={12}>
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="primary"
                    size={screens.xs ? 'middle' : 'large'}
                    block
                    onClick={onNext}
                    style={{ height: screens.xs ? '44px' : screens.sm ? '48px' : '52px', fontSize: screens.xs ? '14px' : '16px' }}
                    icon={<SecurityScanOutlined />}
                  >
                    {screens.xs ? 'Continue' : 'Continue Verification'}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={screens.xs ? 'middle' : 'large'}
                    block
                    onClick={onFinish}
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    style={{
                      height: screens.xs ? '44px' : screens.sm ? '48px' : '52px',
                      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                      border: 'none',
                      fontSize: screens.xs ? '14px' : '16px'
                    }}
                  >
                    {screens.xs ? 'Submit' : 'Submit for Verification'}
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Info Cards */}
        <Row gutter={[12, 12]} style={{ marginTop: screens.xs ? 16 : screens.sm ? 20 : 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Card style={{
              borderRadius: screens.xs ? '12px' : '16px',
              height: '100%',
              background: `${THEME_CONSTANTS.colors.success}08`,
              border: `1px solid ${THEME_CONSTANTS.colors.success}20`
            }}>
              <div style={{ textAlign: 'center', padding: screens.xs ? '12px' : '16px' }}>
                <SafetyOutlined style={{
                  fontSize: screens.xs ? '28px' : screens.sm ? '32px' : '36px',
                  color: THEME_CONSTANTS.colors.success,
                  marginBottom: screens.xs ? '8px' : '12px'
                }} />
                <Text strong style={{
                  display: 'block',
                  marginBottom: screens.xs ? '6px' : '8px',
                  fontSize: screens.xs ? '14px' : '16px'
                }}>Bank-Level Security</Text>
                <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                  Enterprise-grade encryption for all documents and data
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card style={{
              borderRadius: screens.xs ? '12px' : '16px',
              height: '100%',
              background: `${THEME_CONSTANTS.colors.info}08`,
              border: `1px solid ${THEME_CONSTANTS.colors.info}20`
            }}>
              <div style={{ textAlign: 'center', padding: screens.xs ? '12px' : '16px' }}>
                <VerifiedOutlined style={{
                  fontSize: screens.xs ? '28px' : screens.sm ? '32px' : '36px',
                  color: THEME_CONSTANTS.colors.info,
                  marginBottom: screens.xs ? '8px' : '12px'
                }} />
                <Text strong style={{
                  display: 'block',
                  marginBottom: screens.xs ? '6px' : '8px',
                  fontSize: screens.xs ? '14px' : '16px'
                }}>Rapid Approval</Text>
                <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                  Typically verified within 24-48 business hours
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card style={{
              borderRadius: screens.xs ? '12px' : '16px',
              height: '100%',
              background: `${THEME_CONSTANTS.colors.warning}08`,
              border: `1px solid ${THEME_CONSTANTS.colors.warning}20`
            }}>
              <div style={{ textAlign: 'center', padding: screens.xs ? '12px' : '16px' }}>
                <PercentageOutlined style={{
                  fontSize: screens.xs ? '28px' : screens.sm ? '32px' : '36px',
                  color: THEME_CONSTANTS.colors.warning,
                  marginBottom: screens.xs ? '8px' : '12px'
                }} />
                <Text strong style={{
                  display: 'block',
                  marginBottom: screens.xs ? '6px' : '8px',
                  fontSize: screens.xs ? '14px' : '16px'
                }}>High Delivery Rates</Text>
                <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                  Verified sender status ensures 95%+ message delivery
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
            <Button key="done" type="primary" onClick={handleSuccessModalClose} block={screens.xs}>
              Go to Login Portal
            </Button>
          ]}
          centered
          width={screens.xs ? '90%' : screens.sm ? 450 : 500}
          closable={false}
        >
          <div style={{ textAlign: 'center', padding: screens.xs ? '24px 0' : '32px 0' }}>
            <div style={{
              width: screens.xs ? '64px' : '80px',
              height: screens.xs ? '64px' : '80px',
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.success} 0%, ${THEME_CONSTANTS.colors.success}80 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircleOutlined style={{
                fontSize: screens.xs ? '32px' : '40px',
                color: 'white'
              }} />
            </div>

            <Title level={3} style={{ marginBottom: '16px', fontSize: screens.xs ? '18px' : screens.sm ? '20px' : '24px' }}>
              Application Submitted Successfully!
            </Title>

            <Paragraph style={{ color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '16px', fontSize: screens.xs ? '13px' : '15px' }}>
              Your business verification request has been received and is now in processing queue.
            </Paragraph>

            <Alert
              message="Next Steps"
              description={
                <Space direction="vertical" size={4} style={{ fontSize: screens.xs ? '12px' : '13px' }}>
                  <div>1. Check your email for confirmation receipt</div>
                  <div>2. Our team will review your application</div>
                  <div>3. You'll receive verification status within 24-48 hours</div>
                  <div>4. Login credentials will be sent upon approval</div>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginTop: '24px', textAlign: 'left' }}
            />

            <div style={{ marginTop: '24px', padding: screens.xs ? '12px' : '16px', background: THEME_CONSTANTS.colors.background, borderRadius: '8px' }}>
              <Text type="secondary" style={{ fontSize: screens.xs ? '11px' : '12px' }}>
                Reference ID: {`ONB-${Date.now().toString().slice(-8)}`}
              </Text>
            </div>
          </div>
        </Modal>

        {/* Image Cropper Modal */}
        <RCSImageCropper
          open={cropperState.open}
          onCancel={handleCropperCancel}
          onCropComplete={handleCropComplete}
          imageUrl={cropperState.imageUrl}
          messageType={cropperState.fileType === 'brandLogo' ? 'logo' : 'banner'}
        />
      </div>
    </div>
  );
}