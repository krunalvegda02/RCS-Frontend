// This file contains the updated modal progress logic
// Replace lines 476-650 in CreateCampaignNew.jsx with this onOk function

onOk: async () => {
  setShowProgress(true);
  setSendingProgress(0);
  
  const updateModalContent = (progress) => {
    const isComplete = progress === 100;
    modalInstance.update({
      content: (
        <div style={{ padding: '24px 0' }}>
          <div style={{ background: THEME_CONSTANTS.colors.background, borderRadius: THEME_CONSTANTS.radius.lg, padding: '20px', marginBottom: '20px', border: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>📋</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaign Name</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, marginTop: '4px' }}>{campaignName}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: THEME_CONSTANTS.colors.success, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', color: 'white' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>RCS READY</div>
              <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{batchStats.rcsCapable}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Contacts verified</div>
            </div>
            
            <div style={{ background: THEME_CONSTANTS.colors.warning, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', color: 'white' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>ESTIMATED COST</div>
              <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>₹{estimatedCost}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>₹1 per RCS message</div>
            </div>
          </div>

          <div style={{ background: isComplete ? THEME_CONSTANTS.colors.successLight : THEME_CONSTANTS.colors.primaryLight, border: `2px solid ${isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary}`, borderRadius: THEME_CONSTANTS.radius.lg, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px',
                background: THEME_CONSTANTS.colors.surface,
                borderRadius: THEME_CONSTANTS.radius.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary}`
              }}>
                <SendOutlined style={{ fontSize: '24px', color: isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                  {isComplete ? '✓ Campaign Created!' : 'Creating Campaign...'}
                </div>
                <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                  {progress < 90 ? 'Processing bulk entries' : isComplete ? 'Completed successfully' : 'Finalizing'}
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary }}>
                {Math.round(progress)}%
              </div>
            </div>
            <Progress 
              percent={progress} 
              status={isComplete ? 'success' : 'active'}
              strokeColor={isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary}
              strokeWidth={10}
              showInfo={false}
            />
          </div>
        </div>
      ),
      okButtonProps: { style: { display: 'none' } },
      cancelButtonProps: { style: { display: 'none' } }
    });
  };
  
  updateModalContent(0);
  
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / 60000) * 90, 90);
    setSendingProgress(progress);
    updateModalContent(progress);
    
    if (progress >= 90) {
      clearInterval(progressInterval);
    }
  }, 100);

  try {
    const rcsContacts = capabilityResponse?.data?.filter(contact => contact.isCapable) || [];

    if (rcsContacts.length === 0) {
      clearInterval(progressInterval);
      setShowProgress(false);
      setSendingProgress(0);
      modalInstance.destroy();
      message.error('No RCS-capable contacts found');
      return;
    }

    const campaignRes = await dispatch(createCampaign({
      name: campaignName,
      templateId: selectedTemplate._id,
      userId: user._id,
      status: 'processing'
    })).unwrap();
    
    const newCampaignId = campaignRes.data._id;
    const rcsNumbers = rcsContacts.map(contact => contact.phoneNumber);

    await dispatch(createCampaignEntries({
      campaignId: newCampaignId,
      templateId: selectedTemplate._id,
      phoneNumbers: rcsNumbers
    })).unwrap();

    clearInterval(progressInterval);
    
    // Animate to 100% quickly
    let currentProgress = sendingProgress;
    const completeInterval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(completeInterval);
      }
      setSendingProgress(currentProgress);
      updateModalContent(currentProgress);
    }, 50);
    
    setTimeout(() => {
      setShowProgress(false);
      setSendingProgress(0);
      modalInstance.destroy();
      message.success(`Campaign created with ${rcsContacts.length} RCS contacts!`);
      navigate('/reports');
    }, 1500);
  } catch (error) {
    clearInterval(progressInterval);
    setShowProgress(false);
    setSendingProgress(0);
    modalInstance.destroy();
    message.error('Failed to create campaign: ' + (error.message || error));
  }
}
