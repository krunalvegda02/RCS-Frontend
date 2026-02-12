import React from 'react';
import { Card, Button, Tag, Empty } from 'antd';
import {
  MessageOutlined,
  PhoneOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

/**
 * RCSMessagePreview Component
 * Displays a preview of message templates in a realistic mobile UI
 * Compatible with backend template structure
 */
export default function RCSMessagePreview({ data }) {
  if (!data) {
    return (
      <Empty
        description="No template data"
        style={{ color: THEME_CONSTANTS.colors.textSecondary }}
      />
    );
  }

  const templateType = data?.templateType || 'plainText';
  const content = data?.content || {};

  const phoneStyle = {
    width: 'min(320px, 90vw)',
    minHeight: '500px',
    height: 'auto',
    background: '#000',
    borderRadius: '20px',
    padding: '6px',
    margin: '0 auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  };

  const screenStyle = {
    width: '100%',
    flex: 1, // Fill the phone container
    background: '#fff',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: '#fff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
  };

  const chatAreaStyle = {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    // overflowY: 'auto', // Removed for auto-height
    background: '#f5f5f5',
    minHeight: 0,
    paddingBottom: '40px',
  };

  const messageBubbleStyle = {
    minWidth: 'min(160px, 50vw)',
    maxWidth: '90%',
    alignSelf: 'flex-end',
    background: '#e3f2fd',
    borderRadius: '18px 18px 4px 18px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    boxSizing: 'border-box'
  };

  // Render text message
  const renderTextMessage = () => {
    const text = content?.body || '';
    if (!text) return null;

    return (
      <div style={messageBubbleStyle}>
        <div style={{ padding: '12px 16px' }}>
          <p
            style={{
              color: '#000',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </p>
        </div>
      </div>
    );
  };

  // Render text with action buttons
  const renderTextWithAction = () => {
    const text = content?.text || '';
    const buttons = content?.buttons || [];

    return (
      <div style={messageBubbleStyle}>
        <div style={{ padding: '12px 16px' }}>
          <p
            style={{
              color: '#000',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </p>
        </div>
        {buttons.length > 0 && (
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {buttons
                .filter((b) => b.label && b.label.trim())
                .slice(0, 4)
                .map((button, idx) => (
                  <button
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '20px',
                      color: '#1a73e8',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                    }}
                  >
                    {button.actionType === 'dialPhone' && <PhoneOutlined />}
                    {button.actionType === 'openUri' && <LinkOutlined />}
                    {button.actionType === 'postback' && <MessageOutlined />}
                    <span>{button.label}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render rich card
  const renderRichCard = () => {
    const { title, subtitle, description, imageUrl, actions = [] } = content;
    if (!title) return null;

    return (
      <div style={{...messageBubbleStyle, maxWidth: '100%'}}>
        {imageUrl && (
          <div style={{ 
            width: '100%', 
            position: 'relative',
            paddingBottom: '50%',
            overflow: 'hidden', 
            background: '#000' 
          }}>
            <img
              src={imageUrl}
              alt="RCS Card"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}
        <div style={{ padding: '12px' }}>
          <h4
            style={{
              color: '#000',
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 4px 0',
            }}
          >
            {title}
          </h4>
          {(subtitle || description) && (
            <p
              style={{
                color: '#333',
                fontSize: '12px',
                margin: '0 0 12px 0',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {description || subtitle}
            </p>
          )}
          {actions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {actions
                .filter((a) => a.label && a.label.trim())
                .slice(0, 4)
                .map((action, idx) => (
                  <button
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '20px',
                      color: '#1a73e8',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                    }}
                  >
                    {action.actionType === 'dialPhone' && <PhoneOutlined />}
                    {action.actionType === 'openUri' && <LinkOutlined />}
                    {action.actionType === 'postback' && <MessageOutlined />}
                    <span>{action.label}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render carousel
  const renderCarousel = () => {
    const cards = content?.cards || [];
    if (!cards || cards.length === 0) return null;

    return (
      <div
        style={{
          ...messageBubbleStyle,
          background: 'transparent',
          boxShadow: 'none',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '0 4px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {cards.slice(0, 10).map((card, idx) => (
            <div
              key={idx}
              style={{
                minWidth: '160px',
                maxWidth: '160px',
                background: '#e3f2fd',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              {card.imageUrl && (
                <div style={{ 
                  width: '100%', 
                  position: 'relative',
                  paddingBottom: '50%',
                  overflow: 'hidden', 
                  background: '#000' 
                }}>
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    onError={(e) => {
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div style={{ padding: '10px' }}>
                <h5
                  style={{
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                  }}
                >
                  {card.title}
                </h5>
                {(card.subtitle || card.description) && (
                  <p
                    style={{
                      color: '#333',
                      fontSize: '10px',
                      margin: '0 0 8px 0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: '1.3',
                    }}
                  >
                    {card.description || card.subtitle}
                  </p>
                )}
                {card.actions && card.actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {card.actions
                      .filter((a) => a.label && a.label.trim())
                      .slice(0, 4)
                      .map((action, actionIdx) => (
                        <button
                          key={actionIdx}
                          style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '20px',
                            color: '#1a73e8',
                            padding: '6px 12px',
                            fontSize: '10px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            justifyContent: 'center',
                          }}
                        >
                          {action.actionType === 'dialPhone' && <PhoneOutlined />}
                          {action.actionType === 'openUri' && <LinkOutlined />}
                          {action.actionType === 'postback' && <MessageOutlined />}
                          <span>{action.label}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: 'clamp(8px, 2vw, 20px)',
      background: '#f5f7fa',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '100%',
      overflow: 'visible',
      boxSizing: 'border-box'
    }}>
      <div style={phoneStyle}>
        <div style={screenStyle}>
          {/* Phone Header */}
          <div style={headerStyle}>
            <div
              style={{
                width: 'clamp(28px, 6vw, 32px)',
                height: 'clamp(28px, 6vw, 32px)',
                borderRadius: '50%',
                background: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: '600' }}>
                B
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600' }}>
                Business
              </h4>
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 11px)', color: '#666' }}>
                RCS Online
              </p>
            </div>
            <div
              style={{
                width: 'clamp(16px, 4vw, 20px)',
                height: 'clamp(16px, 4vw, 20px)',
                borderRadius: '50%',
                background: '#e0e0e0',
              }}
            />
          </div>

          {/* Chat Area */}
          <div style={chatAreaStyle}>
            {/* Render based on template type */}
            {templateType === 'plainText' && renderTextMessage()}
            {templateType === 'textWithAction' && renderTextWithAction()}
            {templateType === 'richCard' && renderRichCard()}
            {templateType === 'carousel' && renderCarousel()}

            {/* Delivery status */}
            <div style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>
                ✓✓ Delivered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}