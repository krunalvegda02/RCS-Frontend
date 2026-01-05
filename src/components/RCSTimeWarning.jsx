import { useState, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { ClockCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

export default function RCSTimeWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if current time is in restricted hours (9 PM to 9 AM)
  const isRestrictedTime = (time) => {
    const hour = time.getHours();
    return hour >= 21 || hour < 9; // 9 PM (21:00) to 9 AM (09:00)
  };

  // Get next allowed time
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
    // Show warning only during restricted hours and if not dismissed
    setIsVisible(isRestrictedTime(currentTime) && !isDismissed);
  }, [currentTime, isDismissed]);

  useEffect(() => {
    // Reset dismissal when time restriction changes
    if (!isRestrictedTime(currentTime)) {
      setIsDismissed(false);
    }
  }, [currentTime]);

  if (!isVisible) return null;

  const nextAllowedTime = getNextAllowedTime(currentTime);

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1001,
        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        borderBottom: `2px solid #f39c12`,
        boxShadow: THEME_CONSTANTS.shadow.md,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `${THEME_CONSTANTS.spacing.md} ${THEME_CONSTANTS.spacing.lg}`,
        }}
      >
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.md }}>
              <ClockCircleOutlined 
                style={{ 
                  fontSize: '20px', 
                  color: '#d68910',
                  animation: 'pulse 2s infinite'
                }} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '15px',
                  color: '#8b4513',
                  marginBottom: '4px'
                }}>
                  RCS Messaging Restricted Hours
                </div>
                <div style={{ 
                  fontSize: '13px',
                  color: '#a0522d',
                  lineHeight: 1.4
                }}>
                  RCS messages cannot be sent between <strong>9:00 PM - 9:00 AM</strong> as per regulatory guidelines. 
                  You can resume sending messages {formatDateTime(nextAllowedTime)}.
                </div>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setIsDismissed(true)}
                style={{
                  color: '#8b4513',
                  borderRadius: THEME_CONSTANTS.radius.md,
                  padding: '4px 8px',
                  height: 'auto',
                  minWidth: 'auto'
                }}
                className="hover:bg-yellow-200"
              />
            </div>
          }
          type="warning"
          showIcon={false}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}