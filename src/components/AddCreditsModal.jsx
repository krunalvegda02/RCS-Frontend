import React from 'react';
import { Modal, Button, Input, Row, Col } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

const CreditCard = ({ title, price, credits, rate, popular, selected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      width: 300,
      borderRadius: 22,
      padding: '36px 28px',
      background: '#fff',
      border: selected
        ? `2px solid ${THEME_CONSTANTS.colors.primary}`
        : '1px solid #eef1f6',
      boxShadow: popular
        ? '0 28px 70px rgba(24,144,255,0.25)'
        : '0 12px 40px rgba(0,0,0,0.06)',
      transform: popular ? 'scale(1.05)' : 'scale(1)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
    }}
  >
    {popular && (
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: THEME_CONSTANTS.colors.primary,
          color: '#fff',
          padding: '6px 18px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        MOST POPULAR
      </div>
    )}

    <div style={{
      fontSize: 13,
      fontWeight: 700,
      color: '#8c95a6',
      marginBottom: 18,
      letterSpacing: 0.6,
    }}>
      {title.toUpperCase()}
    </div>

    <div
      style={{
        fontSize: 44,
        fontWeight: 900,
        color: '#111827',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        marginBottom: 10,
      }}
    >
      ₹{price.toLocaleString('en-IN')}
    </div>

    <div style={{
      fontSize: 16,
      fontWeight: 600,
      color: '#4b5563',
      marginBottom: 22,
    }}>
      {credits.toLocaleString('en-IN')} Credits
    </div>

    <div style={{
      height: 1,
      background: '#edf0f5',
      marginBottom: 18,
    }} />

    <div style={{
      fontSize: 13,
      color: '#6b7280',
      marginBottom: 10,
    }}>
      Effective rate: ₹{rate}/message
    </div>
  </div>
);

export default function AddCreditsModal({
  open,
  onCancel,
  onPay,
  addAmount,
  setAddAmount,
  perMessageCharge,
  processingPayment,
  baseAmount,
  gstAmount,
  totalPayable,
  creditsToReceive
}) {
  return (
    <Modal
      open={open}
      onCancel={() => !processingPayment && onCancel()}
      footer={null}
      closable={!processingPayment}
      maskClosable={!processingPayment}
      width={1100}
      bodyStyle={{
        padding: '32px 40px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 36 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight}, #f5f7ff)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CreditCardOutlined
            style={{ fontSize: 22, color: THEME_CONSTANTS.colors.primary }}
          />
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Add Credits to Wallet
          </div>
          <div
            style={{
              fontSize: 13,
              color: THEME_CONSTANTS.colors.textMuted,
              marginTop: 4,
            }}
          >
            Prepaid wallet · GST compliant · Secure Razorpay checkout
          </div>
        </div>
      </div>

      {!perMessageCharge ? (
        <div style={{ padding: '8px 4px 24px' }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 24,
            color: THEME_CONSTANTS.colors.textPrimary,
          }}>
            Choose a credit package
          </div>

          <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
            <CreditCard
              title="Starter"
              price={3000}
              credits={10000}
              rate={0.3}
              selected={addAmount === 3000}
              onClick={() => setAddAmount(3000)}
            />

            <CreditCard
              title="Growth"
              price={14000}
              credits={50000}
              rate={0.28}
              popular
              selected={addAmount === 14000}
              onClick={() => setAddAmount(14000)}
            />

            <CreditCard
              title="Enterprise"
              price={25000}
              credits={100000}
              rate={0.25}
              selected={addAmount === 25000}
              onClick={() => setAddAmount(25000)}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            marginBottom: 28,
            padding: '24px 28px',
            borderRadius: 16,
            background: 'linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)',
            border: '1px solid #e6efff',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: THEME_CONSTANTS.colors.textPrimary,
                marginBottom: 6,
              }}
            >
              Enter Recharge Amount
            </div>
            <div
              style={{
                fontSize: 13,
                color: THEME_CONSTANTS.colors.textMuted,
              }}
            >
              Enterprise pricing · Custom rate applied · Minimum top-up ₹1,00,000
            </div>
          </div>

          <Input
            value={addAmount}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, '');
              setAddAmount(onlyDigits);
            }}
            onKeyDown={(e) => {
              const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
              if (!/[0-9]/.test(e.key) && !allowed.includes(e.key)) {
                e.preventDefault();
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            prefix="₹"
            placeholder="1,00,000"
            size="large"
            disabled={processingPayment}
            style={{
              height: 56,
              fontSize: 18,
              fontWeight: 800,
              borderRadius: 14,
              padding: '8px 16px',
            }}
          />

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: THEME_CONSTANTS.colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Quick Select
            </div>

            <Row gutter={[16, 16]}>
              {[100000, 250000, 500000, 1000000].map((amt) => {
                const selected = addAmount === amt;
                return (
                  <Col xs={12} sm={6} key={amt}>
                    <div
                      onClick={() => setAddAmount(amt)}
                      style={{
                        cursor: 'pointer',
                        padding: '16px 12px',
                        borderRadius: 14,
                        textAlign: 'center',
                        background: selected ? 'linear-gradient(135deg, #eef4ff, #ffffff)' : '#ffffff',
                        border: selected ? `2px solid ${THEME_CONSTANTS.colors.primary}` : '1px solid #e5e7eb',
                        boxShadow: selected ? '0 10px 30px rgba(24,144,255,0.18)' : '0 4px 14px rgba(0,0,0,0.05)',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: selected ? THEME_CONSTANTS.colors.primary : '#111827',
                        }}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>
                        + GST
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>
      )}

      {addAmount > 0 && (
        <div
          style={{
            marginTop: 28,
            padding: '22px 28px',
            borderRadius: 16,
            background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
            border: '1px solid #e6efff',
            boxShadow: '0 8px 24px rgba(24,144,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
              Base Amount
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              ₹{baseAmount.toLocaleString('en-IN')}
            </div>

            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 10 }}>
              GST (18%)
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              ₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
              Total Payable
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: THEME_CONSTANTS.colors.primary,
                whiteSpace: 'nowrap',
              }}
            >
              ₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#52c41a',
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              +{creditsToReceive.toLocaleString('en-IN')} Credits
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid #eef1f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          <strong>GST invoice provided</strong> · No hidden fees ·
          <span style={{ marginLeft: 4 }}>Secured by Razorpay</span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            size="large"
            onClick={onCancel}
            disabled={processingPayment}
            style={{
              height: 48,
              padding: '0 28px',
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<CreditCardOutlined />}
            onClick={onPay}
            disabled={processingPayment || !addAmount}
            loading={processingPayment}
            style={{
              height: 52,
              padding: '0 28px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary}, ${THEME_CONSTANTS.colors.primaryDark})`,
              boxShadow: '0 12px 30px rgba(24,144,255,0.35)',
            }}
          >
            Pay ₹{totalPayable.toLocaleString('en-IN')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
