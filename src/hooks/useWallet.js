import { useSelector, useDispatch } from 'react-redux';
import { updateWalletBalance } from '../redux/slices/authSlice';
import { message } from 'antd';

export const useWallet = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const walletBalance = user?.wallet?.balance || 0;
  const blockedBalance = user?.wallet?.blockedBalance || 0;
  const availableBalance = walletBalance - blockedBalance;
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
        `Total: ₹${walletBalance.toLocaleString()} | Blocked: ₹${blockedBalance.toLocaleString()} | Available: ₹${availableBalance.toLocaleString()}`,
        5
      );
    } else {
      message.info(`Wallet Balance: ₹${walletBalance.toLocaleString()}`);
    }
  };
  
  return {
    balance: walletBalance,
    blockedBalance,
    availableBalance,
    currency,
    updateBalance,
    checkBalance,
    showBalanceInfo,
    formattedBalance: `₹${walletBalance.toLocaleString()}`,
    formattedAvailableBalance: `₹${availableBalance.toLocaleString()}`,
    formattedBlockedBalance: `₹${blockedBalance.toLocaleString()}`,
    hasBlockedBalance: blockedBalance > 0,
  };
};