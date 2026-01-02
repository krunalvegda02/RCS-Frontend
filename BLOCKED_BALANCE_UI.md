# Frontend Blocked Balance Implementation

## Updated Files

### 1. useWallet.js Hook
Enhanced with blocked balance functionality:

```javascript
const {
  balance,              // Total balance
  blockedBalance,       // Amount blocked in campaigns
  availableBalance,     // balance - blockedBalance
  checkBalance,         // Check if sufficient available balance
  showBalanceInfo,      // Show detailed balance breakdown
  hasBlockedBalance,    // Boolean flag
  formattedAvailableBalance,
  formattedBlockedBalance
} = useWallet();
```

**New Functions:**
- `checkBalance(amount, showMessage)` - Validates available balance and shows error if insufficient
- `showBalanceInfo()` - Displays detailed balance breakdown modal

### 2. CreateCampaign.jsx
Updated to use new wallet features:

**Balance Check:**
```javascript
// Old
if (balance < estimatedCost) {
  message.error(`Insufficient credits!`);
}

// New
if (!checkBalance(estimatedCost)) {
  setShowAddMoney(true);
  return;
}
```

**Display Available Balance:**
```javascript
<div>
  {formattedAvailableBalance}
  {hasBlockedBalance && (
    <div>₹{blockedBalance.toLocaleString()} blocked</div>
  )}
</div>
```

**Error Handling:**
Shows detailed modal when blocked balance prevents campaign creation:
- Lists active campaigns using blocked balance
- Shows total/blocked/available breakdown
- Provides "Add Balance" button

## User Experience

### Scenario 1: Sufficient Balance
```
User: ₹60K total, ₹0 blocked
Campaign: ₹10K required
✅ Campaign created successfully
```

### Scenario 2: Blocked Balance
```
User: ₹60K total, ₹50K blocked
Campaign: ₹20K required
❌ Error Modal Shows:

"Insufficient Available Balance"

₹50,000 is currently blocked in active campaigns:

Active Campaigns:
📊 Summer Sale - ₹30,000 blocked
📊 Product Launch - ₹20,000 blocked

Total Balance: ₹60,000
Blocked: ₹50,000
Available: ₹10,000
Required: ₹20,000

Please wait for campaigns to complete or add balance.

[Add Balance] [Cancel]
```

### Scenario 3: Balance Check Before Send
```
User clicks "Send Campaign"
↓
checkBalance(estimatedCost) called
↓
If insufficient:
  Shows error: "Insufficient available balance. 
  ₹50,000 is currently blocked in active campaigns.
  Available: ₹10,000, Required: ₹20,000"
  Duration: 5 seconds
```

## Messages Shown

### 1. Insufficient with Blocked Balance
```
"Insufficient available balance. ₹50,000 is currently 
blocked in active campaigns. Available: ₹10,000, 
Required: ₹20,000"
```

### 2. Insufficient without Blocked Balance
```
"Insufficient wallet balance. Available: ₹10,000, 
Required: ₹20,000"
```

### 3. Balance Info (when user clicks info)
```
Total Balance: ₹60,000
Blocked: ₹50,000 (in active campaigns)
Available: ₹10,000
```

## API Error Response Handling

Backend returns:
```json
{
  "success": false,
  "message": "Insufficient available balance...",
  "required": 20000,
  "available": 10000,
  "totalBalance": 60000,
  "blockedBalance": 50000,
  "activeCampaigns": [
    { "name": "Summer Sale", "blockedAmount": 30000 },
    { "name": "Product Launch", "blockedAmount": 20000 }
  ]
}
```

Frontend shows detailed modal with all this information.

## Benefits
✅ User always knows why they can't create campaign
✅ Shows which campaigns are using blocked balance
✅ Clear breakdown of total/blocked/available
✅ Easy "Add Balance" action
✅ Consistent messaging across app
