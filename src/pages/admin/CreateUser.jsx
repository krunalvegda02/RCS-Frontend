// import { useState } from 'react';
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
// import toast from 'react-hot-toast';
// import apiService from '../../services/api';

// const CreateUser = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     phone: '',
//     role: 'user',
//     jioId: '',
//     jioSecret: '',
//     companyname:""
//   });
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const data = await apiService.createUser(formData);
//       if (data.success) {
//         toast.success('User created successfully!');
//         setFormData({
//           name: '',
//           email: '',
//           password: '',
//           phone: '',
//           role: 'user',
//           jioId: '',
//           jioSecret: '',
//           companyname:""
//         });
//       } else {
//         toast.error(data.message || 'Failed to create user' );
//       }
//     } catch (error) {
//       toast.error('Error creating user');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="w-full flex justify-center py-10">
//       <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8 border border-gray-100">

//         <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">
//           Create New User
//         </h1>

//         <form onSubmit={handleSubmit} className="space-y-5">

//           {/* Input Field Wrapper */}
//           {[
//             { label: "Name", name: "name", type: "text" },
//             { label: "Email", name: "email", type: "email" },
//             { label: "Phone", name: "phone", type: "tel" },
//             { label: "companyname", name: "companyname", type: "text" },
//           ].map((field, index) => (
//             <div key={index}>
//               <label className="block mb-1.5 font-medium text-gray-700">
//                 {field.label}
//               </label>
//               <input
//                 type={field.type}
//                 name={field.name}
//                 required
//                 value={formData[field.name]}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
//                            focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
//               />
//             </div>
//           ))}

//           {/* Password Field with Toggle */}
//           <div>
//             <label className="block mb-1.5 font-medium text-gray-700">Password</label>
//             <div className="relative">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 name="password"
//                 required
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg bg-gray-50
//                            focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-purple-600"
//               >
//                 {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
//               </button>
//             </div>
//           </div>

//           {/* Role Dropdown */}
//           <div>
//             <label className="block mb-1.5 font-medium text-gray-700">Role</label>
//             <select
//               name="role"
//               value={formData.role}
//               onChange={handleChange}
//               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
//                          focus:ring-2 focus:ring-purple-500 transition-all"
//             >
//               <option value="user">User</option>
//               <option value="admin">Admin</option>
//             </select>
//           </div>

//           {/* Jio Fields */}
//           <div>
//             <label className="block mb-1.5 font-medium text-gray-700">Jio Client ID</label>
//             <input
//               type="text"
//               name="jioId"
//               value={formData.jioId}
//               onChange={handleChange}
//               placeholder="Enter Jio Client ID (optional)"
//               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
//                          focus:ring-2 focus:ring-purple-500 transition-all"
//             />
//           </div>

//           <div>
//             <label className="block mb-1.5 font-medium text-gray-700">Jio Client Secret</label>
//             <input
//               type="password"
//               name="jioSecret"
//               value={formData.jioSecret}
//               onChange={handleChange}
//               placeholder="Enter Jio Client Secret (optional)"
//               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
//                          focus:ring-2 focus:ring-purple-500 transition-all"
//             />
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-3 text-lg font-semibold bg-purple-600 text-white rounded-lg
//                        hover:bg-purple-700 transition-all disabled:opacity-50"
//           >
//             {loading ? 'Creating…' : 'Create User'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateUser;





import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  message,
  Spin,
  Divider,
  InputNumber,
  Tooltip,
  Grid,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  BuildOutlined,
  KeyOutlined,
  SaveOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { createUser } from '../../redux/slices/adminSlice';

const { useBreakpoint } = Grid;

function CreateUser() {
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  
  const { loading, error } = useSelector(state => state.admin);

  const handleSubmit = async (values) => {
    try {
      // Map form values to backend expected format
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role,
        companyname: values.companyname,
        clientId: values.jioId,
        clientSecret: values.jioSecret,
        walletBalance: values.walletBalance || 0,
      };
      
      const result = await dispatch(createUser(payload)).unwrap();
      if (result.success) {
        message.success('User created successfully!');
        form.resetFields();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      message.error(error || 'Error creating user');
    }
  };

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: screens.xs ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxl }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header Section - Left Aligned */}
        <div style={{
          marginBottom: THEME_CONSTANTS.spacing.xxxl,
          paddingBottom: THEME_CONSTANTS.spacing.xxl,
          borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
            <div style={{
              width: screens.xs ? '56px' : '72px',
              height: screens.xs ? '56px' : '72px',
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
              borderRadius: THEME_CONSTANTS.radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.primary}40`,
              flexShrink: 0
            }}>
              <UserOutlined style={{ color: '#fff', fontSize: screens.xs ? '28px' : '36px' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: screens.xs ? THEME_CONSTANTS.typography.h2.size : THEME_CONSTANTS.typography.h1.size,
                fontWeight: THEME_CONSTANTS.typography.h1.weight,
                color: THEME_CONSTANTS.colors.text,
                marginBottom: THEME_CONSTANTS.spacing.xs,
                lineHeight: 1.2,
                letterSpacing: '-0.02em'
              }}>
                Create New User
              </h1>
              <p style={{
                color: THEME_CONSTANTS.colors.textSecondary,
                fontSize: THEME_CONSTANTS.typography.body.size,
                lineHeight: 1.5,
                margin: 0
              }}>
                Add a new user to the platform with complete information and credentials.
              </p>
            </div>
          </div>
        </div>

        <Spin spinning={loading.createUser}>
          {/* Main Form Card */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
              boxShadow: THEME_CONSTANTS.shadow.base,
              marginBottom: THEME_CONSTANTS.spacing.xxl,
              background: THEME_CONSTANTS.colors.surface
            }}
            bodyStyle={{ padding: screens.xs ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxl }}
          >

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
            >
              {/* SECTION 1: BASIC INFORMATION */}
              <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: THEME_CONSTANTS.spacing.sm,
                  marginBottom: THEME_CONSTANTS.spacing.lg,
                  paddingBottom: THEME_CONSTANTS.spacing.md,
                  borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    background: THEME_CONSTANTS.colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: THEME_CONSTANTS.colors.primary
                  }}>
                    <UserOutlined style={{ fontSize: '16px' }} />
                  </div>
                  <h3 style={{
                    fontSize: THEME_CONSTANTS.typography.h4.size,
                    fontWeight: THEME_CONSTANTS.typography.h4.weight,
                    color: THEME_CONSTANTS.colors.text,
                    margin: 0
                  }}>
                    Basic Information
                  </h3>
                </div>

                  <Row gutter={[16, 16]}>
                    {/* NAME */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Full Name *
                          </span>
                        }
                        name="name"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter user name',
                          },
                          {
                            min: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="e.g., John Doe"
                          size="large"
                          style={{
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* EMAIL */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Email Address *
                          </span>
                        }
                        name="email"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter email',
                          },
                          {
                            type: 'email',
                            message: 'Invalid email format',
                          },
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="e.g., john@example.com"
                          type="email"
                          size="large"
                          style={{
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* PHONE */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Phone Number *
                          </span>
                        }
                        name="phone"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter phone number',
                          },
                          {
                            pattern: /^[0-9]{10}$/,
                            message: 'Phone number must be 10 digits',
                          },
                        ]}
                      >
                        <Input
                          prefix={<PhoneOutlined />}
                          placeholder="e.g., 9876543210"
                          maxLength={10}
                          size="large"
                          style={{
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                        />
                      </Form.Item>
                    </Col>

                    {/* COMPANY NAME */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Company Name
                          </span>
                        }
                        name="companyname"
                      >
                        <Input
                          prefix={<BuildOutlined />}
                          placeholder="e.g., Tech Solutions Inc."
                          size="large"
                          style={{
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

              {/* SECTION 2: SECURITY */}
              <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: THEME_CONSTANTS.spacing.sm,
                  marginBottom: THEME_CONSTANTS.spacing.lg,
                  paddingBottom: THEME_CONSTANTS.spacing.md,
                  borderBottom: `2px solid ${THEME_CONSTANTS.colors.warningLight}`
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    background: THEME_CONSTANTS.colors.warningLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: THEME_CONSTANTS.colors.warning
                  }}>
                    <LockOutlined style={{ fontSize: '16px' }} />
                  </div>
                  <h3 style={{
                    fontSize: THEME_CONSTANTS.typography.h4.size,
                    fontWeight: THEME_CONSTANTS.typography.h4.weight,
                    color: THEME_CONSTANTS.colors.text,
                    margin: 0
                  }}>
                    Security & Access
                  </h3>
                </div>

                  <Row gutter={[16, 16]}>
                    {/* PASSWORD */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Password *
                          </span>
                        }
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter password',
                          },
                          {
                            min: 6,
                            message: 'Password must be at least 6 characters',
                          },
                        ]}
                      >
                        <Input
                          prefix={<LockOutlined />}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter secure password"
                          size="large"
                          style={{
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                          suffix={
                            <Button
                              type="text"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                color: THEME_CONSTANTS.colors.primary,
                                fontSize: 12,
                              }}
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </Button>
                          }
                        />
                      </Form.Item>
                    </Col>

                    {/* ROLE */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            User Role *
                          </span>
                        }
                        name="role"
                        initialValue="user"
                        rules={[
                          {
                            required: true,
                            message: 'Please select a role',
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          style={{
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                        >
                          <Select.Option value="user">
                            <span>👤 Regular User</span>
                          </Select.Option>
                          <Select.Option value="admin">
                            <span>👨‍💼 Admin</span>
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

              {/* SECTION 3: JIO RCS INTEGRATION */}
              <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: THEME_CONSTANTS.spacing.sm,
                  marginBottom: THEME_CONSTANTS.spacing.lg,
                  paddingBottom: THEME_CONSTANTS.spacing.md,
                  borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    background: THEME_CONSTANTS.colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: THEME_CONSTANTS.colors.primary
                  }}>
                    <KeyOutlined style={{ fontSize: '16px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: THEME_CONSTANTS.typography.h4.size,
                      fontWeight: THEME_CONSTANTS.typography.h4.weight,
                      color: THEME_CONSTANTS.colors.text,
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.xs
                    }}>
                      Jio RCS Configuration
                    </h3>
                    <p style={{
                      fontSize: THEME_CONSTANTS.typography.caption.size,
                      color: THEME_CONSTANTS.colors.textSecondary,
                      margin: 0
                    }}>
                      Optional: Add Jio RCS API credentials for messaging capabilities
                    </p>
                  </div>
                </div>

                  <Row gutter={[16, 16]}>
                    {/* JIO CLIENT ID */}
                    <Col xs={24} sm={12}>
                      <Tooltip title="Your Jio Business Messaging API Client ID">
                        <Form.Item
                          label={
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                              Jio Client ID
                            </span>
                          }
                          name="jioId"
                        >
                          <Input
                            prefix={<KeyOutlined />}
                            placeholder="e.g., jio_client_xxxxx"
                            size="large"
                            style={{
                              borderRadius: THEME_CONSTANTS.radius.base,
                            }}
                          />
                        </Form.Item>
                      </Tooltip>
                    </Col>

                    {/* JIO CLIENT SECRET */}
                    <Col xs={24} sm={12}>
                      <Tooltip title="Keep this secure - never share your API secret">
                        <Form.Item
                          label={
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                              Jio Client Secret
                            </span>
                          }
                          name="jioSecret"
                        >
                          <Input
                            prefix={<LockOutlined />}
                            type="password"
                            placeholder="Enter API secret key"
                            size="large"
                            style={{
                              borderRadius: THEME_CONSTANTS.radius.base,
                            }}
                          />
                        </Form.Item>
                      </Tooltip>
                    </Col>
                  </Row>
                </div>

              {/* SECTION 4: INITIAL WALLET BALANCE */}
              <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: THEME_CONSTANTS.spacing.sm,
                  marginBottom: THEME_CONSTANTS.spacing.lg,
                  paddingBottom: THEME_CONSTANTS.spacing.md,
                  borderBottom: `2px solid ${THEME_CONSTANTS.colors.successLight}`
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    background: THEME_CONSTANTS.colors.successLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    💰
                  </div>
                  <h3 style={{
                    fontSize: THEME_CONSTANTS.typography.h4.size,
                    fontWeight: THEME_CONSTANTS.typography.h4.weight,
                    color: THEME_CONSTANTS.colors.text,
                    margin: 0
                  }}>
                    Initial Wallet Setup
                  </h3>
                </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Initial Wallet Balance (credit )
                          </span>
                        }
                        name="walletBalance"
                        initialValue={0}
                      >
                        <InputNumber
                          min={0}
                          step={100}
                          size="large"
                          placeholder="e.g., 5000"
                          formatter={(value) => `credit  ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/credit \s?|(,*)/g, '')}
                          style={{
                            width: '100%',
                            borderRadius: THEME_CONSTANTS.radius.base,
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

              {/* ACTIONS */}
              <div style={{
                marginTop: THEME_CONSTANTS.spacing.xxxl,
                paddingTop: THEME_CONSTANTS.spacing.xxl,
                borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
                display: 'flex',
                gap: THEME_CONSTANTS.spacing.md,
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={() => form.resetFields()}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    height: '44px',
                    padding: '0 24px',
                    fontWeight: 500
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={loading.createUser}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    height: '44px',
                    padding: '0 32px',
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${THEME_CONSTANTS.colors.primary}30`
                  }}
                >
                  Create User
                </Button>
              </div>
            </Form>
          </Card>

          {/* HELPFUL INFO CARD */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
              boxShadow: THEME_CONSTANTS.shadow.sm,
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.surface} 100%)`
            }}
            bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
          >
            <div style={{ display: 'flex', gap: THEME_CONSTANTS.spacing.md }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: THEME_CONSTANTS.radius.md,
                background: THEME_CONSTANTS.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                💡
              </div>
              <div>
                <h4 style={{
                  fontSize: THEME_CONSTANTS.typography.h5.size,
                  fontWeight: THEME_CONSTANTS.typography.h5.weight,
                  color: THEME_CONSTANTS.colors.text,
                  marginBottom: THEME_CONSTANTS.spacing.md,
                  margin: 0
                }}>
                  Tips for User Creation
                </h4>
                <ul style={{
                  fontSize: THEME_CONSTANTS.typography.body.size,
                  color: THEME_CONSTANTS.colors.textSecondary,
                  margin: `${THEME_CONSTANTS.spacing.md} 0 0 0`,
                  paddingLeft: THEME_CONSTANTS.spacing.lg,
                  lineHeight: 1.8
                }}>
                  <li>Use a strong password with at least 6 characters</li>
                  <li>Jio credentials are optional but required for RCS messaging</li>
                  <li>Users start with the initial wallet balance you set here</li>
                  <li>Admin users have full access to platform management features</li>
                </ul>
              </div>
            </div>
          </Card>
        </Spin>
      </div>
    </div>
  );
}

export default CreateUser;