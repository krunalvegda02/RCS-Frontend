import { useState, useEffect } from 'react';
import { Alert, Card, Button, Space } from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined, SendOutlined } from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

// Export time check functions for use in other components
export const isAfter10PM = (time = new Date()) => {
  const hour = time.getHours();
  return hour >= 22; // 10 PM (22:00) onwards
};

export default function RCSCampaignTimeWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if current time is after 10 PM (22:00) - DISABLE CAMPAIGN CREATION
  const isAfter10PM = (time) => {
    const hour = time.getHours();
    return hour >= 22; // 10 PM (22:00) onwards
  };

  // Check if current time is in restricted hours (9 PM to 9 AM) - MESSAGING RESTRICTION
  const isRestrictedTime = (time) => {
    const hour = time.getHours();
    return hour >= 21 || hour < 9; // 9 PM (21:00) to 9 AM (09:00)
  };

  // Get next allowed time for campaign creation
  const getNextCampaignTime = (time) => {
    const hour = time.getHours();
    const nextAllowed = new Date(time);
    
    if (hour >= 22) {
      // After 10 PM, next allowed is 9 AM tomorrow
      nextAllowed.setDate(nextAllowed.getDate() + 1);
      nextAllowed.setHours(9, 0, 0, 0);
    }
    
    return nextAllowed;
  };

  // Get next allowed time for messaging
  const getNextAllowedTime = (time) => {
    const hour = time.getHours();
    const nextAllowed = new Date(time);
    
    if (hour >= 21) {
      // After 9 PM, next allowed is 9 AM tomorrow
      nextAllowed.setDate(nextAllowed.getDate() + 1);
      nextAllowed.setHours(9, 0, 0, 0);
    } else if (hour < 9) {
      // Before 9 AM, next allowed is 9 AM today
      nextAllowed.setHours(9, 0, 0, 0);
    }
    
    return nextAllowed;
  };

  // Format time for display
  const formatTime = (time) => {
    return time.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  // Format date for display
  const formatDateTime = (time) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (time.toDateString() === today.toDateString()) {
      return `Today at ${formatTime(time)}`;
    } else if (time.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${formatTime(time)}`;
    } else {
      return time.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    }
  };

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Initial check
    setCurrentTime(new Date());

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show warning during messaging restriction (9 PM-9 AM) OR campaign creation disabled (after 10 PM)
    const showForMessaging = isRestrictedTime(currentTime) && !isAfter10PM(currentTime);
    const showForCampaign = isAfter10PM(currentTime);
    setIsVisible((showForMessaging || showForCampaign) && !isDismissed);
  }, [currentTime, isDismissed]);

  useEffect(() => {
    // Reset dismissal when time restriction changes
    if (!isRestrictedTime(currentTime) && !isAfter10PM(currentTime)) {
      setIsDismissed(false);
    }
  }, [currentTime]);

  if (!isVisible) return null;

  const nextAllowedTime = getNextAllowedTime(currentTime);
  const nextCampaignTime = getNextCampaignTime(currentTime);
  const isCampaignRestricted = isAfter10PM(currentTime);
  const isMessagingRestricted = isRestrictedTime(currentTime);

  return (
    <Card
      style={{
        marginBottom: THEME_CONSTANTS.spacing.xl,
        borderRadius: THEME_CONSTANTS.radius.lg,
        border: `2px solid #f39c12`,
        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        boxShadow: THEME_CONSTANTS.shadow.lg,
      }}
    >
      <div style={{ display: 'flex', gap: THEME_CONSTANTS.spacing.lg }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: THEME_CONSTANTS.radius.xl,
            background: 'linear-gradient(135deg, #f39c12 0%, #d68910 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: THEME_CONSTANTS.shadow.md,
          }}
        >
          <ClockCircleOutlined 
            style={{ 
              fontSize: '28px', 
              color: 'white',
              animation: 'pulse 2s infinite'
            }} 
          />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            marginBottom: THEME_CONSTANTS.spacing.md
          }}>
            <div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                color: '#8b4513',
                margin: 0,
                marginBottom: '4px'
              }}>
                {isCampaignRestricted ? '🚫 Campaign Creation Disabled' : '⚠️ RCS Messaging Restricted (9 PM - 9 AM)'}
              </h3>
              <p style={{ 
                fontSize: '14px',
                color: '#a0522d',
                margin: 0,
                lineHeight: 1.4
              }}>
                {isCampaignRestricted 
                  ? 'Campaign creation is disabled after 10:00 PM. You can still create campaigns between 9:00 AM - 10:00 PM.' 
                  : 'You can create campaigns now, but messages will only be sent between 9:00 AM - 9:00 PM'
                }
              </p>
            </div>
            
            <Button
              type="text"
              size="small"
              onClick={() => setIsDismissed(true)}
              style={{
                color: '#8b4513',
                padding: '4px 8px',
                height: 'auto',
                minWidth: 'auto'
              }}
            >
              ✕
            </Button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: THEME_CONSTANTS.radius.md,
            padding: THEME_CONSTANTS.spacing.lg,
            marginBottom: THEME_CONSTANTS.spacing.lg,
            border: '1px solid rgba(243, 156, 18, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.md, marginBottom: THEME_CONSTANTS.spacing.sm }}>
              <InfoCircleOutlined style={{ color: '#d68910', fontSize: '16px' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#8b4513' }}>
                Regulatory Guidelines
              </span>
            </div>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#a0522d',
              lineHeight: 1.5
            }}>
              {isCampaignRestricted ? (
                <>
                  <li><strong>Campaign creation:</strong> Disabled after 10:00 PM</li>
                  <li><strong>Message sending:</strong> Only between 9:00 AM - 9:00 PM</li>
                  <li>This ensures compliance with regulatory guidelines</li>
                  <li>Next campaign creation window: <strong>{formatDateTime(nextCampaignTime)}</strong></li>
                </>
              ) : (
                <>
                  <li><strong>Message sending:</strong> Only between 9:00 AM - 9:00 PM</li>
                  <li><strong>Campaign creation:</strong> Available until 10:00 PM</li>
                  <li>You can create campaigns now - messages will be queued and sent automatically</li>
                  <li>Next sending window opens: <strong>{formatDateTime(nextAllowedTime)}</strong></li>
                </>
              )}
            </ul>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: THEME_CONSTANTS.spacing.lg,
            padding: THEME_CONSTANTS.spacing.md,
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: THEME_CONSTANTS.radius.md,
            border: '1px solid rgba(243, 156, 18, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.sm }}>
              <SendOutlined style={{ color: '#d68910', fontSize: '16px' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b4513' }}>
                {isCampaignRestricted ? 'Campaign creation disabled:' : 'Current status:'}
              </span>
            </div>
            <Space size="small" wrap>
              {isCampaignRestricted ? (
                <>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#a0522d',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '4px 8px',
                    borderRadius: THEME_CONSTANTS.radius.sm,
                    border: '1px solid rgba(243, 156, 18, 0.3)'
                  }}>
                    ⚠️ Campaign creation disabled (After 10 PM)
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#a0522d',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '4px 8px',
                    borderRadius: THEME_CONSTANTS.radius.sm,
                    border: '1px solid rgba(243, 156, 18, 0.3)'
                  }}>
                    ⚠️ Message sending restricted (9 PM - 9 AM)
                  </span>
                </>
              ) : (
                <>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#a0522d',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '4px 8px',
                    borderRadius: THEME_CONSTANTS.radius.sm,
                    border: '1px solid rgba(243, 156, 18, 0.3)'
                  }}>
                    ✓ Create campaigns (Until 10 PM)
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#a0522d',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '4px 8px',
                    borderRadius: THEME_CONSTANTS.radius.sm,
                    border: '1px solid rgba(243, 156, 18, 0.3)'
                  }}>
                    ⚠️ Messages queued (Send 9 AM - 9 PM)
                  </span>
                </>
              )}
            </Space>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </Card>
  );
}