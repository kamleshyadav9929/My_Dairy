/**
 * Share Utilities for Customer Portal
 * Provides WhatsApp and native share functionality
 */

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Share via WhatsApp
 * @param message - Message to share
 * @param phone - Optional phone number (without country code)
 */
export const shareViaWhatsApp = (message: string, phone?: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const url = phone 
    ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  window.open(url, '_blank');
};

/**
 * Share using native share API (mobile) or fallback to WhatsApp
 * @param title - Share title
 * @param message - Share message
 */
export const shareNative = async (title: string, message: string): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text: message });
    } catch (err) {
      // User cancelled or error - fallback to WhatsApp
      if ((err as Error).name !== 'AbortError') {
        shareViaWhatsApp(message);
      }
    }
  } else {
    shareViaWhatsApp(message);
  }
};

/**
 * Generate passbook share message
 */
export const generatePassbookShareMessage = (data: {
  customerName: string;
  customerId: string;
  fromDate: string;
  toDate: string;
  totalMilk: number;
  totalAmount: number;
  totalPayments: number;
  totalAdvances?: number;
  balance: number;
}): string => {
  const fromFormatted = new Date(data.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const toFormatted = new Date(data.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  return `🥛 *My Dairy - Passbook*
━━━━━━━━━━━━━━━━
👤 *${data.customerName}*
📋 ID: #${data.customerId}

📅 *Period:* ${fromFormatted} - ${toFormatted}

📊 *Summary*
├ Total Milk: ${data.totalMilk.toFixed(1)} L
├ Total Amount: ${formatCurrency(data.totalAmount)}
├ Payments: ${formatCurrency(data.totalPayments)}
${data.totalAdvances ? `├ Advances: ${formatCurrency(data.totalAdvances)}\n` : ''}└ *Balance: ${formatCurrency(data.balance)}*
━━━━━━━━━━━━━━━━
${data.balance >= 0 ? '✅ Credit' : '⚠️ Due'}

Thank you for your business! 🙏`;
};

/**
 * Generate dashboard share message
 */
export const generateDashboardShareMessage = (data: {
  customerName: string;
  customerId: string;
  todayMorning?: { qty: number; fat: number; snf: number; amount: number };
  todayEvening?: { qty: number; fat: number; snf: number; amount: number };
  monthlyTotal: number;
  monthlyAmount: number;
  pouringDays: number;
}): string => {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  let message = `🥛 *My Dairy - Daily Summary*
━━━━━━━━━━━━━━━━
👤 *${data.customerName}*
📋 ID: #${data.customerId}
📅 ${today}

`;

  if (data.todayMorning && data.todayMorning.qty > 0) {
    message += `🌅 *Morning*
   ${data.todayMorning.qty}L | Fat: ${data.todayMorning.fat}% | SNF: ${data.todayMorning.snf}%
   Amount: ${formatCurrency(data.todayMorning.amount)}

`;
  }

  if (data.todayEvening && data.todayEvening.qty > 0) {
    message += `🌆 *Evening*
   ${data.todayEvening.qty}L | Fat: ${data.todayEvening.fat}% | SNF: ${data.todayEvening.snf}%
   Amount: ${formatCurrency(data.todayEvening.amount)}

`;
  }

  if ((!data.todayMorning || data.todayMorning.qty === 0) && (!data.todayEvening || data.todayEvening.qty === 0)) {
    message += `📭 No entries today

`;
  }

  message += `📊 *This Month*
├ Total Milk: ${data.monthlyTotal.toFixed(1)} L
├ Total Amount: ${formatCurrency(data.monthlyAmount)}
└ Pouring Days: ${data.pouringDays}
━━━━━━━━━━━━━━━━
Thank you! 🙏`;

  return message;
};
