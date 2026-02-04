import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    Space,
    Progress,
    Divider,
    Badge,
    Spin,
    Grid
} from 'antd';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    MailOutlined,
    PhoneOutlined,
    ReloadOutlined,
    SafetyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { THEME_CONSTANTS } from '../theme';
import { _get } from '../helper/apiClient';
import { logout } from '../redux/slices/authSlice';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function PendingApproval() {
    const [loading, setLoading] = useState(true);
    const [onboardingData, setOnboardingData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const screens = useBreakpoint();
    const { user, onboardingStatus } = useSelector(state => state.auth);

    useEffect(() => {
        fetchOnboardingStatus();
    }, []);

    const fetchOnboardingStatus = async () => {
        try {
            setLoading(true);
            const response = await _get('onboarding/status');
            setOnboardingData(response.data?.data);

            // If user is now verified, redirect to dashboard
            if (response.data?.data?.onboardingStatus === 'VERIFIED') {
                navigate('/dashboard', { replace: true });
            }
            // If user hasn't submitted onboarding yet, redirect to onboarding
            if (response.data?.data?.onboardingStatus === 'PENDING_ONBOARDING') {
                navigate('/onboarding', { replace: true });
            }
        } catch (error) {
            console.error('Error fetching onboarding status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOnboardingStatus();
        setRefreshing(false);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: THEME_CONSTANTS.colors.background
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight}08 0%, ${THEME_CONSTANTS.colors.background} 100%)`,
            padding: screens.xs ? '16px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ maxWidth: '700px', width: '100%' }}>
                {/* Header Card */}
                <Card style={{
                    borderRadius: '24px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    overflow: 'hidden',
                    marginBottom: '24px'
                }}>
                    {/* Status Banner */}
                    <div style={{
                        background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.warning} 0%, #f6ad55 100%)`,
                        padding: '40px 30px',
                        textAlign: 'center',
                        margin: '-24px -24px 24px -24px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <ClockCircleOutlined style={{ fontSize: '40px', color: 'white' }} />
                        </div>
                        <Title level={2} style={{ color: 'white', margin: 0, marginBottom: '8px' }}>
                            Application Under Review
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                            Thank you for completing your onboarding!
                        </Text>
                    </div>

                    {/* Content */}
                    <div style={{ padding: screens.xs ? '0' : '20px' }}>
                        <div style={{
                            background: '#f0f9ff',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px',
                            border: '1px solid #bae6fd'
                        }}>
                            <Space direction="vertical" size={8}>
                                <Text strong style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>
                                    <SafetyOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />
                                    What happens next?
                                </Text>
                                <ul style={{ margin: '8px 0 0', paddingLeft: '24px', color: THEME_CONSTANTS.colors.textSecondary }}>
                                    <li>Our team is reviewing your business documents</li>
                                    <li>We'll set up your RCS messaging account</li>
                                    <li>You'll receive an email once your account is activated</li>
                                </ul>
                            </Space>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: THEME_CONSTANTS.colors.surface,
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '24px',
                            border: `1px solid ${THEME_CONSTANTS.colors.border}`
                        }}>
                            <div>
                                <Text type="secondary">Estimated approval time</Text>
                                <Title level={4} style={{ margin: 0, color: THEME_CONSTANTS.colors.primary }}>
                                    24-48 Hours
                                </Title>
                            </div>
                            <Button
                                icon={<ReloadOutlined spin={refreshing} />}
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                Check Status
                            </Button>
                        </div>

                        {/* Application Summary */}
                        {onboardingData?.onboardingData && (
                            <>
                                <Divider>Your Application</Divider>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: screens.xs ? '1fr' : '1fr 1fr',
                                    gap: '16px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        background: THEME_CONSTANTS.colors.surface,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: `1px solid ${THEME_CONSTANTS.colors.border}`
                                    }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Company</Text>
                                        <div style={{ fontWeight: 600, marginTop: '4px' }}>
                                            {onboardingData.onboardingData.companyName || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: THEME_CONSTANTS.colors.surface,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: `1px solid ${THEME_CONSTANTS.colors.border}`
                                    }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Brand</Text>
                                        <div style={{ fontWeight: 600, marginTop: '4px' }}>
                                            {onboardingData.onboardingData.brandName || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: THEME_CONSTANTS.colors.surface,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: `1px solid ${THEME_CONSTANTS.colors.border}`
                                    }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Industry</Text>
                                        <div style={{ fontWeight: 600, marginTop: '4px' }}>
                                            {onboardingData.onboardingData.industry || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: THEME_CONSTANTS.colors.surface,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: `1px solid ${THEME_CONSTANTS.colors.border}`
                                    }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Submitted</Text>
                                        <div style={{ fontWeight: 600, marginTop: '4px' }}>
                                            {onboardingData.onboardingData.submittedAt
                                                ? new Date(onboardingData.onboardingData.submittedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Contact Support */}
                        <div style={{
                            background: `${THEME_CONSTANTS.colors.primary}08`,
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px',
                            border: `1px solid ${THEME_CONSTANTS.colors.primary}20`
                        }}>
                            <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                                Need assistance?
                            </Text>
                            <Space direction="vertical" size={8}>
                                <div>
                                    <MailOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />
                                    <Text>support@rcsplatform.com</Text>
                                </div>
                                <div>
                                    <PhoneOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />
                                    <Text>+91 1800-XXX-XXXX</Text>
                                </div>
                            </Space>
                        </div>

                        <Button
                            type="default"
                            block
                            onClick={handleLogout}
                            style={{ height: '48px' }}
                        >
                            Logout & Return Later
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
