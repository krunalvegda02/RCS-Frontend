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
    <>
      <Spin spinning={loading.createUser}>
        <Row gutter={[24, 24]} justify="center" style={{ marginTop: 24 }}>
          <Col xs={24} sm={22} md={20} lg={16} xl={14}>
            {/* CARD HEADER */}
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                boxShadow: THEME_CONSTANTS.shadow.md,
                marginBottom: 24,
                borderTop: `4px solid ${THEME_CONSTANTS.colors.primary}`,
              }}
            >
              {/* TITLE SECTION */}
              <div style={{ marginBottom: 24 }}>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: THEME_CONSTANTS.colors.primary,
                    margin: '0 0 8px 0',
                  }}
                >
                  Create New User
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    color: '#666',
                    margin: 0,
                  }}
                >
                  Add a new user to the platform with complete information
                </p>
              </div>

              <Divider style={{ margin: '24px 0' }} />

              {/* FORM */}
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
              >
                {/* SECTION 1: BASIC INFORMATION */}
                <div style={{ marginBottom: 32 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <UserOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                    Basic Information
                  </h3>

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
                <div style={{ marginBottom: 32 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <LockOutlined style={{ color: THEME_CONSTANTS.colors.warning }} />
                    Security & Access
                  </h3>

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
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      backgroundColor: `${THEME_CONSTANTS.colors.primary}10`,
                      border: `1px solid ${THEME_CONSTANTS.colors.primary}30`,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      padding: 16,
                      marginBottom: 16,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: THEME_CONSTANTS.colors.primary,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        margin: 0,
                      }}
                    >
                      <KeyOutlined />
                      Jio RCS Configuration
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: '#666',
                        margin: '8px 0 0 0',
                      }}
                    >
                      Optional: Add Jio RCS API credentials for messaging capabilities
                    </p>
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

                {/* SECTION 4: INITIAL WALLET BALANCE (OPTIONAL) */}
                <div style={{ marginBottom: 32 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: THEME_CONSTANTS.colors.success }}>💰</span>
                    Initial Wallet Setup
                  </h3>

                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Form.Item
                        label={
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Initial Wallet Balance (₹)
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
                          formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
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
                <Divider style={{ margin: '24px 0' }} />

                <Row gutter={[12, 12]} justify="flex-end">
                  <Col>
                    <Button
                      size="large"
                      icon={<ReloadOutlined />}
                      onClick={() => form.resetFields()}
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.base,
                      }}
                    >
                      Clear Form
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={loading.createUser}
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.base,
                        fontWeight: 600,
                      }}
                    >
                      Create User
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* HELPFUL INFO CARD */}
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                backgroundColor: `${THEME_CONSTANTS.colors.success}05`,
                border: `1px solid ${THEME_CONSTANTS.colors.success}20`,
              }}
            >
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.success,
                  marginBottom: 12,
                  margin: 0,
                }}
              >
                ℹ️ Tips for User Creation
              </h4>
              <ul
                style={{
                  fontSize: 13,
                  color: '#666',
                  margin: '12px 0 0 0',
                  paddingLeft: 20,
                }}
              >
                <li style={{ marginBottom: 8 }}>
                  Use a strong password with at least 6 characters
                </li>
                <li style={{ marginBottom: 8 }}>
                  Jio credentials are optional but required for RCS messaging
                </li>
                <li style={{ marginBottom: 8 }}>
                  Users start with the initial wallet balance you set here
                </li>
                <li>
                  Admin users have full access to platform management features
                </li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Spin>
    </>
  );
}

export default CreateUser;