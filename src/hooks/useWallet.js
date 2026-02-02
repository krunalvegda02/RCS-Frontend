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
            content: `Insufficient available balance. ${blockedBalance.toLocaleString()} Credits is blocked in active campaigns. Available: ${availableBalance.toLocaleString()} Credits, Required: ${requiredAmount.toLocaleString()} Credits`,
            duration: 5,
          });
        } else {
          message.error({
            content: `Insufficient wallet balance. Available: ${availableBalance.toLocaleString()} Credits, Required: ${requiredAmount.toLocaleString()} Credits`,
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
        `Total: ${totalBalance.toLocaleString()} Credits | Blocked: ${blockedBalance.toLocaleString()} Credits | Available: ${availableBalance.toLocaleString()} Credits | Used: ${creditsUsed.toLocaleString()} Credits`,
        5
      );
    } else {
      message.info(`Total: ${totalBalance.toLocaleString()} Credits | Available: ${availableBalance.toLocaleString()} Credits | Used: ${creditsUsed.toLocaleString()} Credits`);
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
    formattedBalance: `${totalBalance.toLocaleString()} Credits`,
    formattedTotalBalance: `${totalBalance.toLocaleString()} Credits`,
    formattedAvailableBalance: `${availableBalance.toLocaleString()} Credits`,
    formattedRemainingBalance: `${availableBalance.toLocaleString()} Credits`,
    formattedBlockedBalance: `${Math.abs(blockedBalance).toLocaleString()} Credits`,
    formattedCreditsUsed: `${creditsUsed.toLocaleString()} Credits`,
    hasBlockedBalance: blockedBalance > 0,
  };
};