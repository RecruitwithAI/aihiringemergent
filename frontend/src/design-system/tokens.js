/**
 * Design Tokens for AI Tools Application
 * Single source of truth for colors, typography, spacing
 * 
 * Usage:
 * import { toolColors, themeClasses, typography } from '@/design-system/tokens';
 */

// ==================== TOOL-SPECIFIC COLORS ====================
// These use Tailwind classes for gradients and tool-specific branding
// Keep as-is for visual distinction between tools

export const toolColors = {
  'jd-builder': {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    hover: 'hover:border-blue-500/30'
  },
  'search-strategy': {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    hover: 'hover:border-cyan-500/30'
  },
  'talent-scout': {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    hover: 'hover:border-purple-500/30'
  },
  'candidate-research': {
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    hover: 'hover:border-violet-500/30'
  },
  'dossier': {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hover: 'hover:border-amber-500/30'
  },
  'client-research': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hover: 'hover:border-emerald-500/30'
  }
};

// ==================== THEME-AWARE COMPONENT CLASSES ====================
// These use CSS variables that adapt to light/dark mode
// Replace hardcoded colors with these classes

export const themeClasses = {
  // ===== LAYOUTS =====
  page: 'min-h-screen bg-background text-foreground transition-colors duration-200',
  container: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  
  // ===== CARDS & SURFACES =====
  card: 'bg-card text-card-foreground border border-border rounded-2xl',
  cardHover: 'hover:border-primary/30 hover:bg-card/80 transition-all duration-300',
  cardInteractive: 'bg-card text-card-foreground border border-border rounded-2xl hover:border-primary/30 hover:bg-card/80 transition-all duration-300 cursor-pointer',
  
  surface: 'bg-muted text-muted-foreground rounded-xl',
  surfaceHover: 'hover:bg-muted/80 transition-colors',
  
  // ===== INTERACTIVE ELEMENTS =====
  button: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-full px-4 py-2 transition-all font-medium',
  buttonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 transition-all font-medium shadow-sm',
  buttonGhost: 'hover:bg-secondary/50 text-foreground rounded-full px-4 py-2 transition-all',
  buttonDestructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-4 py-2 transition-all',
  
  // ===== INPUTS =====
  input: 'bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
  textarea: 'bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none',
  
  // ===== TEXT =====
  heading: 'text-foreground font-semibold font-[Lexend]',
  headingLarge: 'text-foreground font-semibold font-[Lexend] text-2xl sm:text-3xl',
  subtext: 'text-muted-foreground',
  textMuted: 'text-muted-foreground',
  textAccent: 'text-primary',
  
  // ===== LINKS =====
  link: 'text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline',
  
  // ===== BADGES =====
  badge: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
  badgePrimary: 'bg-primary/10 text-primary border-primary/20',
  badgeSecondary: 'bg-secondary text-secondary-foreground border-border',
  badgeMuted: 'bg-muted text-muted-foreground border-border',
  
  // ===== SEPARATORS =====
  divider: 'border-t border-border',
  
  // ===== STATES =====
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'opacity-60 cursor-wait',
};

// ==================== TYPOGRAPHY ====================
// Font families and sizes using Tailwind classes

export const typography = {
  // Font Families
  fontFamily: {
    primary: "'Lexend', sans-serif",        // Headings
    body: "'Atkinson Hyperlegible', sans-serif",  // Body text
    mono: "'JetBrains Mono', monospace"     // Code
  },
  
  // Font Sizes (Tailwind classes)
  fontSize: {
    xs: 'text-xs',      // 0.75rem - 12px
    sm: 'text-sm',      // 0.875rem - 14px
    base: 'text-base',  // 1rem - 16px
    lg: 'text-lg',      // 1.125rem - 18px
    xl: 'text-xl',      // 1.25rem - 20px
    '2xl': 'text-2xl',  // 1.5rem - 24px
    '3xl': 'text-3xl',  // 1.875rem - 30px
    '4xl': 'text-4xl',  // 2.25rem - 36px
  },
  
  // Font Weights
  fontWeight: {
    normal: 'font-normal',      // 400
    medium: 'font-medium',      // 500
    semibold: 'font-semibold',  // 600
    bold: 'font-bold'           // 700
  }
};

// ==================== SPACING ====================
// Consistent spacing scale using Tailwind classes

export const spacing = {
  // Gap spacing
  gap: {
    xs: 'gap-2',   // 0.5rem - 8px
    sm: 'gap-4',   // 1rem - 16px
    md: 'gap-6',   // 1.5rem - 24px
    lg: 'gap-8',   // 2rem - 32px
    xl: 'gap-12'   // 3rem - 48px
  },
  
  // Padding
  padding: {
    xs: 'p-2',     // 0.5rem - 8px
    sm: 'p-4',     // 1rem - 16px
    md: 'p-6',     // 1.5rem - 24px
    lg: 'p-8',     // 2rem - 32px
    xl: 'p-12'     // 3rem - 48px
  },
  
  // Margin
  margin: {
    xs: 'm-2',     // 0.5rem - 8px
    sm: 'm-4',     // 1rem - 16px
    md: 'm-6',     // 1.5rem - 24px
    lg: 'm-8',     // 2rem - 32px
    xl: 'm-12'     // 3rem - 48px
  }
};

// ==================== ANIMATION ====================
// Consistent animation durations

export const animation = {
  duration: {
    fast: 'duration-150',      // 150ms
    normal: 'duration-200',    // 200ms
    slow: 'duration-300',      // 300ms
    slower: 'duration-500'     // 500ms
  },
  
  transition: {
    all: 'transition-all',
    colors: 'transition-colors',
    transform: 'transition-transform',
    opacity: 'transition-opacity'
  }
};

// ==================== BORDER RADIUS ====================
// Consistent border radius scale

export const borderRadius = {
  sm: 'rounded-lg',      // 0.5rem - 8px
  md: 'rounded-xl',      // 0.75rem - 12px
  lg: 'rounded-2xl',     // 1rem - 16px
  full: 'rounded-full'   // 9999px
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Combine multiple class strings
 * @param {...string} classes - Class strings to combine
 * @returns {string} Combined class string
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get tool configuration by ID
 * @param {string} toolId - Tool identifier
 * @returns {Object} Tool color configuration
 */
export const getToolColors = (toolId) => {
  return toolColors[toolId] || toolColors['jd-builder'];
};
