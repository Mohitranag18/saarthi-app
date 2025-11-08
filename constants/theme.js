// Saarthi App Theme Configuration
export const theme = {
  colors: {
    // Main colors matching your design
    background: '#0F172A',      // Dark navy background
    surface: '#1E293B',           // Card background (slightly lighter)
    surfaceHover: '#334155',      // Card hover state
    
    // Accent colors
    primary: '#FCD34D',         // Yellow/Gold accent
    primaryDark: '#F59E0B',     // Darker yellow for pressed state
    secondary: '#3B82F6',       // Blue accent
    
    // Text colors
    text: {
      primary: '#F8FAFC',      // White text
      secondary: '#94A3B8',    // Gray text
      muted: '#64748B',        // Muted text
    },
    
    // Status colors
    success: '#10B981',        // Green
    error: '#EF4444',          // Red
    warning: '#F59E0B',        // Orange
    info: '#3B82F6',           // Blue
    
    // Emergency colors
    emergency: '#DC2626',      // Bright red for emergency button
    
    // Icon colors
    icon: {
      active: '#FCD34D',       // Active icon (yellow)
      inactive: '#64748B',     // Inactive icon (gray)
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    }
  }
};

// Backward compatibility - keep the old exports
export const COLORS = theme.colors;
export const SPACING = theme.spacing;
export const RADIUS = theme.radius;
export const FONTS = theme.fonts;
