const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Static template IDs mapping - UPDATE THESE WITH YOUR ACTUAL TEMPLATE IDs FROM DATABASE
const TEMPLATE_IDS = {
  plainText: '696a4cc00d59dce3c88c480f',     // Replace with actual plainText template ID
  richCard: '69833c303669bcef064628ad',      // Replace with actual richCard template ID
  carousel: '69834561f9162a0e6d34a806',      // Replace with actual carousel template ID
  textWithAction: '696a4ce20d59dce3c88c4814' // Replace with actual textWithAction template ID
};


export const sendLandingMessage = async (phoneNumber, messageType) => {
  const templateId = TEMPLATE_IDS[messageType];
  
  const response = await fetch(`${API_URL}/landing-message/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber,
      templateId
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send message');
  }

  return data;
};
