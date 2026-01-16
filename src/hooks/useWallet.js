import { useSelector, useDispatch } from 'react-redux';
import { updateWalletBalance } from '../redux/slices/authSlice';
import { message } from 'antd';

export const useWallet = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const totalBalance = user?.wallet?.balance || 0;
  const blockedBalance = Math.abs(user?.wallet?.blockedBalance || 0);
  const availableBalance = totalBalance;
  const creditsUsed = user?.stats?.totalSpent || 0;
  const currency = user?.wallet?.currency || 'INR';
  
  const updateBalance = (newBalance) => {
    dispatch(updateWalletBalance(newBalance));
  };
  
  // Check if user has sufficient available balance
  const checkBalance = (requiredAmount, showMessage = true) => {
    if (availableBalance < requiredAmount) {
      if (showMessage) {
        if (blockedBalance > 0) {
          message.error({
            content: `Insufficient available balance. ₹${blockedBalance.toLocaleString()} is blocked in active campaigns. Available: ₹${availableBalance.toLocaleString()}, Required: ₹${requiredAmount.toLocaleString()}`,
            duration: 5,
          });
        } else {
          message.error({
            content: `Insufficient wallet balance. Available: ₹${availableBalance.toLocaleString()}, Required: ₹${requiredAmount.toLocaleString()}`,
            duration: 4,
          });
        }
      }
      return false;
    }
    return true;
  };
  
  // Show detailed balance info
  const showBalanceInfo = () => {
    if (blockedBalance > 0) {
      message.info(
        `Total: ₹${totalBalance.toLocaleString()} | Blocked: ₹${blockedBalance.toLocaleString()} | Available: ₹${availableBalance.toLocaleString()} | Used: ₹${creditsUsed.toLocaleString()}`,
        5
      );
    } else {
      message.info(`Total: ₹${totalBalance.toLocaleString()} | Available: ₹${availableBalance.toLocaleString()} | Used: ₹${creditsUsed.toLocaleString()}`);
    }
  };
  
  return {
    balance: totalBalance,
    totalBalance,
    blockedBalance,
    availableBalance,
    creditsUsed,
    remainingBalance: availableBalance,
    currency,
    updateBalance,
    checkBalance,
    showBalanceInfo,
    formattedBalance: `₹${totalBalance.toLocaleString()}`,
    formattedTotalBalance: `₹${totalBalance.toLocaleString()}`,
    formattedAvailableBalance: `₹${availableBalance.toLocaleString()}`,
    formattedRemainingBalance: `₹${availableBalance.toLocaleString()}`,
    formattedBlockedBalance: `₹${Math.abs(blockedBalance).toLocaleString()}`,
    formattedCreditsUsed: `₹${creditsUsed.toLocaleString()}`,
    hasBlockedBalance: blockedBalance > 0,
  };
};