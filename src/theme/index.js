export const antdTheme = {
  token: {
    colorPrimary: '#1890FF',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorInfo: '#1890FF',
    colorTextBase: '#262626',
    colorBgBase: '#FAFAFA',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif',
    colorBorder: '#D9D9D9',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  },
  components: {
    Button: {
      colorPrimary: '#1890FF',
      controlHeight: 36,
      borderRadius: 6,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 8,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    },
    Input: {
      controlHeight: 36,
      borderRadius: 6,
      fontSize: 14,
    },
    Select: {
      controlHeight: 36,
      borderRadius: 6,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerTextColor: '#262626',
      headerBorderRadius: 6,
    },
    Layout: {
      colorBgHeader: '#FFFFFF',
      colorBgBody: '#FAFAFA',
      colorBgTrigger: '#FFFFFF',
    },
  },
};


export const THEME_CONSTANTS = {
  // ============================================================================
  // COLORS
  // ============================================================================
  colors: {
    // Primary Colors
    primary: '#2563eb',           // Main blue
    primaryLight: '#dbeafe',      // Light blue for backgrounds
    primaryDark: '#1e40af',       // Dark blue for hover states
    
    // Status Colors
    success: '#10b981',           // Green for success
    warning: '#f59e0b',           // Amber for warnings
    danger: '#ef4444',            // Red for errors
    
    // Neutral Colors
    text: '#1e293b',              // Dark text
    textSecondary: '#64748b',     // Medium text
    textMuted: '#94a3b8',         // Light text
    
    // Background Colors
    background: '#f8fafc',        // Light page background
    surface: '#ffffff',           // White surface
    border: '#e2e8f0',            // Light border
    borderDark: '#cbd5e1',        // Medium border
    
    // Specific Backgrounds
    // primaryLight: '#dbeafe',      // Light blue tint
    successLight: '#d1fae5',      // Light green tint
    warningLight: '#fef3c7',      // Light amber tint
    dangerLight: '#fee2e2',       // Light red tint
  },

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      size: '32px',
      weight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      size: '28px',
      weight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h3: {
      size: '24px',
      weight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      size: '20px',
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h5: {
      size: '16px',
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      size: '14px',
      weight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    body: {
      size: '14px',
      weight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    bodySmall: {
      size: '13px',
      weight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    label: {
      size: '13px',
      weight: 500,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    caption: {
      size: '12px',
      weight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
  },

  // ============================================================================
  // SPACING
  // ============================================================================
  spacing: {
    xs: '4px',       // Micro spacing
    sm: '8px',       // Small spacing
    md: '12px',      // Medium spacing
    lg: '16px',      // Large spacing
    xl: '20px',      // Extra large spacing
    xxl: '24px',     // 2X large spacing
    xxxl: '32px',    // 3X large spacing
  },

  // ============================================================================
  // BORDER RADIUS
  // ============================================================================
  radius: {
    sm: '6px',       // Small radius
    md: '8px',       // Medium radius
    lg: '12px',      // Large radius
    xl: '16px',      // Extra large radius
    full: '9999px',  // Fully rounded
  },

  // ============================================================================
  // SHADOWS
  // ============================================================================
  shadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // ============================================================================
  // TRANSITIONS
  // ============================================================================
  transition: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },

  // ============================================================================
  // BREAKPOINTS (Responsive)
  // ============================================================================
  breakpoints: {
    xs: 0,      // Mobile: 0px
    sm: 480,    // Tablet: 480px
    md: 768,    // Laptop: 768px
    lg: 1024,   // Desktop: 1024px
    xl: 1280,   // Large: 1280px
    xxl: 1536,  // Extra large: 1536px
  },

  // ============================================================================
  // LAYOUT
  // ============================================================================
  layout: {
    sidebarWidth: '280px',      // Desktop sidebar width
    headerHeight: '80px',       // Header height
    footerHeight: '60px',      // Footer height
    maxContentWidth: '1400px',  // Max content width
    contentPadding: '24px',     // Content padding
    contentPaddingMobile: '16px', // Mobile content padding
  },

  // ============================================================================
  // Z-INDEX
  // ============================================================================
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // ============================================================================
  // ANIMATION
  // ============================================================================
  animation: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      linear: 'linear',
    },
  },

  // ============================================================================
  // BUTTONS
  // ============================================================================
  buttons: {
    height: {
      small: '32px',
      medium: '40px',
      large: '44px',
    },
    fontSize: {
      small: '12px',
      medium: '14px',
      large: '16px',
    },
    // Standard button style
    standard: {
      height: '44px',
      padding: '0 24px',
      fontSize: '15px',
      fontWeight: 500,
      borderRadius: '8px',
    },
  },

  // ============================================================================
  // FORMS
  // ============================================================================
  forms: {
    inputHeight: '40px',
    inputBorderRadius: '8px',
    inputPadding: '8px 12px',
    labelFontSize: '13px',
    labelFontWeight: 500,
    borderColor: '#e2e8f0',
    borderWidth: '1px',
  },

  // ============================================================================
  // CARDS
  // ============================================================================
  cards: {
    padding: '20px',
    borderRadius: '12px',
    borderColor: '#e2e8f0',
    borderWidth: '1px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },

  // ============================================================================
  // TABLE
  // ============================================================================
  table: {
    padding: '12px 16px',
    headerBackground: '#f8fafc',
    borderColor: '#e2e8f0',
    rowHoverBackground: '#f1f5f9',
  },
};