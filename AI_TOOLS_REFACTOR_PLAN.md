# AI Tools Architecture & Refactor Plan
**Last Updated:** December 2024  
**Status:** 🟡 In Progress  
**Owner:** Development Team

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Design System Specification](#design-system-specification)
4. [New Architecture Blueprint](#new-architecture-blueprint)
5. [Step-by-Step Migration Plan](#step-by-step-migration-plan)
6. [Code Patterns & Standards](#code-patterns--standards)
7. [Testing Checklist](#testing-checklist)
8. [Future Maintenance Guide](#future-maintenance-guide)

---

## 🎯 Executive Summary

### Problems We're Solving
1. **Monolithic Architecture**: All tool logic in one 585-line `AITools.js` file
2. **Theme Inconsistency**: Light mode broken due to hardcoded colors across components
3. **Code Duplication**: Download, upload, and generation logic repeated
4. **Hard to Extend**: Adding new tools requires touching existing code
5. **Testing Difficulty**: Cannot test tools in isolation

### Solution Overview
- **Modular Architecture**: Each tool is independent with its own folder
- **Design System**: Single source of truth for colors, typography, spacing
- **Shared Components**: Reusable hooks and components for common functionality
- **Configuration-Driven**: Tool registry defines features declaratively
- **Theme-Aware**: React Context + CSS variables for consistent theming

### Success Metrics
- ✅ Light mode works perfectly across all tools
- ✅ Adding a new tool takes < 30 minutes
- ✅ All tools can be tested independently
- ✅ No hardcoded colors or styles
- ✅ Download functionality works reliably

---

## 🔍 Current State Analysis

### Existing File Structure
```
/app/frontend/src/
├── pages/
│   └── AITools.js                    # 585 lines - ALL TOOL LOGIC
├── components/
│   ├── ai-tools/
│   │   ├── OutputDisplay.js          # Download UI
│   │   ├── ToolForm.js               # Input form
│   │   ├── FileUploader.js           # File upload
│   │   └── HistoryPanel.js           # History sidebar
│   └── ai_tools/
│       └── TalentScoutTool.js        # Special multi-step tool
└── index.css                         # 622 lines with theme overrides
```

### Current Problems Documented

#### 1. Theme System Issues
**File:** `/app/frontend/src/index.css`
- ✅ Has CSS variables for light/dark themes (lines 24-84)
- ✅ Has `[data-theme="light"]` selector
- ❌ 100+ lines of `!important` overrides (lines 104-300)
- ❌ Incomplete coverage - new components break

**Files with Hardcoded Colors:**
- `AITools.js`: Line 433 `bg-[#090914]`
- `Dashboard.js`: Line 79 `bg-[#090914]`
- `Challenges.js`: Line 12 `bg-white/[0.04]`
- `OutputDisplay.js`: Line 10 `bg-white/[0.04]`

#### 2. State Management Chaos
**File:** `/app/frontend/src/pages/AITools.js` (lines 28-59)

State variables in one component:
```javascript
- selectedTool, prompt, context, result, generating
- outputType (search strategy)
- uploadedFiles, uploadProgress, uploading, expandedFileIdx
- outputFormatFile, uploadingFormat, formatUploadProgress
- isEditing, editBuffer, downloading
- history, historyOpen, loadingHistory
```

**Problem:** All tools share state → Race conditions and coupling

#### 3. Download Logic Issues
**File:** `/app/frontend/src/pages/AITools.js` (lines 303-408)
- 100+ lines of download logic mixed with component
- Duplicates browser download code
- Error handling scattered
- Hard to debug when it fails

**Current Bug:** Files don't save to laptop after generation

#### 4. Tool-Specific Logic Scattered
- JD Builder: Standard tool, no custom logic needed
- Search Strategy: Has output type toggle (lines 466-498)
- Talent Scout: Completely custom UI (separate file)
- Dossier: Has format file upload (lines 536-554)

**Problem:** No consistent pattern for tool-specific features

---

## 🎨 Design System Specification

### 1. Theme Architecture

#### CSS Variables (Already Exists - Keep)
**Location:** `/app/frontend/src/index.css`

```css
/* Dark Theme (Default) */
:root {
  --background: 0 0% 10%;           /* #1a1a1a */
  --foreground: 0 0% 98%;           /* White text */
  --card: 0 0% 14%;                 /* Card background */
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 12%;
  --popover-foreground: 0 0% 98%;
  --primary: 217 91% 60%;           /* Blue-500 */
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 18%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 20%;
  --muted-foreground: 0 0% 60%;
  --border: 0 0% 20%;
  --input: 0 0% 20%;
  --ring: 217 91% 60%;
}

/* Light Theme */
[data-theme="light"] {
  --background: 210 100% 97%;       /* #e6f4ff */
  --foreground: 220 40% 10%;        /* Dark text */
  --card: 210 100% 99%;
  --card-foreground: 220 40% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 40% 10%;
  --primary: 217 91% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 50% 92%;
  --secondary-foreground: 220 40% 10%;
  --muted: 210 40% 90%;
  --muted-foreground: 220 20% 40%;
  --border: 214 32% 85%;
  --input: 214 32% 88%;
  --ring: 217 91% 50%;
}
```

#### React Theme Context (NEW - To Create)
**Location:** `/app/frontend/src/contexts/ThemeContext.js`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
    
    // Observe changes from ThemeToggle component
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
      setTheme(currentTheme);
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const applyTheme = (newTheme) => {
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', isLight: theme === 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Design Tokens

#### Color System
**Location:** `/app/frontend/src/design-system/tokens.js` (NEW)

```javascript
// Tool-specific colors (keep existing Tailwind classes for gradients)
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

// Theme-aware component classes (use CSS variables)
export const themeClasses = {
  // Layouts
  page: 'min-h-screen bg-background text-foreground',
  container: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  
  // Cards
  card: 'bg-card text-card-foreground border border-border rounded-2xl',
  cardHover: 'hover:border-primary/30 hover:bg-card/80 transition-all duration-300',
  
  // Interactive elements
  button: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-full px-4 py-2 transition-all',
  buttonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 transition-all',
  
  // Inputs
  input: 'bg-input border-border text-foreground placeholder:text-muted-foreground',
  textarea: 'bg-input border-border text-foreground placeholder:text-muted-foreground resize-none',
  
  // Text
  heading: 'text-foreground font-semibold font-[Lexend]',
  subtext: 'text-muted-foreground',
  
  // Surfaces
  surface: 'bg-muted text-muted-foreground',
  surfaceHover: 'hover:bg-muted/80',
};
```

#### Typography Scale
```javascript
export const typography = {
  // Font families
  fontFamily: {
    primary: "'Lexend', sans-serif",
    body: "'Atkinson Hyperlegible', sans-serif",
    mono: "'JetBrains Mono', monospace"
  },
  
  // Font sizes (keep Tailwind classes)
  fontSize: {
    xs: 'text-xs',      // 0.75rem
    sm: 'text-sm',      // 0.875rem
    base: 'text-base',  // 1rem
    lg: 'text-lg',      // 1.125rem
    xl: 'text-xl',      // 1.25rem
    '2xl': 'text-2xl',  // 1.5rem
    '3xl': 'text-3xl',  // 1.875rem
  }
};
```

#### Spacing System (Keep Tailwind)
```javascript
export const spacing = {
  xs: 'gap-2 p-2',
  sm: 'gap-4 p-4',
  md: 'gap-6 p-6',
  lg: 'gap-8 p-8',
  xl: 'gap-12 p-12'
};
```

---

## 🏗️ New Architecture Blueprint

### Directory Structure

```
/app/frontend/src/
├── contexts/
│   └── ThemeContext.js                 # NEW: Global theme provider
│
├── design-system/
│   └── tokens.js                       # NEW: Design tokens
│
├── features/
│   └── ai-tools/
│       ├── AIToolsLayout.js            # NEW: Main router/layout
│       │
│       ├── components/                 # SHARED COMPONENTS
│       │   ├── ToolShell.js            # NEW: Universal wrapper
│       │   ├── ToolSelector.js         # MOVE: From old AITools.js
│       │   ├── InputSection.js         # NEW: Prompt + context inputs
│       │   ├── FileUploadSection.js    # REFACTOR: From FileUploader.js
│       │   ├── OutputSection.js        # REFACTOR: From OutputDisplay.js
│       │   └── HistoryPanel.js         # MOVE: Keep as-is
│       │
│       ├── hooks/                      # SHARED LOGIC
│       │   ├── useAIGeneration.js      # NEW: Extract from AITools.js
│       │   ├── useFileUpload.js        # NEW: Extract from AITools.js
│       │   ├── useDownload.js          # NEW: Extract from AITools.js
│       │   └── useHistory.js           # NEW: Extract from AITools.js
│       │
│       ├── tools/                      # INDEPENDENT TOOLS
│       │   ├── JDBuilder/
│       │   │   ├── index.js            # Export wrapper
│       │   │   └── JDBuilderTool.js    # Tool component
│       │   │
│       │   ├── SearchStrategy/
│       │   │   ├── index.js
│       │   │   ├── SearchStrategyTool.js
│       │   │   └── OutputTypeSelector.js  # Custom UI
│       │   │
│       │   ├── TalentScout/
│       │   │   ├── index.js
│       │   │   ├── TalentScoutTool.js
│       │   │   ├── CandidateCard.js
│       │   │   ├── FeedbackForm.js
│       │   │   └── CSVExporter.js
│       │   │
│       │   ├── CandidateResearch/
│       │   │   ├── index.js
│       │   │   └── CandidateResearchTool.js
│       │   │
│       │   ├── CandidateDossier/
│       │   │   ├── index.js
│       │   │   ├── CandidateDossierTool.js
│       │   │   └── FormatUploader.js      # Custom: Format sample upload
│       │   │
│       │   └── ClientResearch/
│       │       ├── index.js
│       │       └── ClientResearchTool.js
│       │
│       ├── registry/
│       │   └── toolRegistry.js         # NEW: Configuration hub
│       │
│       └── utils/
│           ├── apiClient.js            # NEW: Axios wrapper
│           └── downloadHelpers.js      # NEW: Download utilities
│
└── App.js                              # UPDATE: Add ThemeProvider
```

### Component Hierarchy

```
<App>
  <ThemeProvider>                      ← NEW: Wrap entire app
    <AuthProvider>
      <Router>
        <Navbar>
          <ThemeToggle />              ← Keep existing
        </Navbar>
        
        <Routes>
          <Route path="/ai-tools">
            <AIToolsLayout>            ← NEW: Replaces AITools.js
              
              {/* No tool selected */}
              <ToolSelector />         ← Keep existing
              
              {/* Tool selected */}
              <ToolShell>              ← NEW: Universal wrapper
                
                {/* Standard tools */}
                <JDBuilderTool />      ← NEW
                <ClientResearchTool /> ← NEW
                
                {/* Custom tools */}
                <SearchStrategyTool>   ← NEW (has OutputTypeSelector)
                  <OutputTypeSelector />
                </SearchStrategyTool>
                
                <TalentScoutTool>      ← REFACTOR (completely custom)
                  <FeedbackForm />
                  <CandidateCard />
                </TalentScoutTool>
                
              </ToolShell>
              
            </AIToolsLayout>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
</App>
```

---

## 🔧 Tool Registry Configuration

### Tool Definition Schema
**Location:** `/app/frontend/src/features/ai-tools/registry/toolRegistry.js`

```javascript
{
  id: string,                    // Unique identifier (e.g., "jd-builder")
  label: string,                 // Display name
  icon: LucideIcon,              // Icon component
  description: string,           // Subtitle text
  placeholder: string,           // Prompt textarea placeholder
  
  features: {
    fileUpload: boolean,         // Enable file upload section
    contextField: boolean,       // Enable additional context textarea
    outputFormats: string[],     // Available download formats ['txt', 'pdf', 'docx', 'csv']
    history: boolean,            // Enable history panel
    customUI: boolean            // Tool provides its own UI (bypasses ToolShell defaults)
  },
  
  fileUploadConfig: {            // Optional: if features.fileUpload = true
    accept: string[],            // File extensions ['.txt', '.pdf', '.docx']
    maxSize: number,             // Max file size in MB
    multiple: boolean,           // Allow multiple files
    label: string                // Section title
  },
  
  component: Component,          // React component to render
  backendType: string           // tool_type for /api/ai/generate
}
```

### Full Tool Registry Example

```javascript
import { FileText, Search, Users, UserSearch, BookUser, Building2 } from "lucide-react";

// Import tool components
import JDBuilderTool from '../tools/JDBuilder';
import SearchStrategyTool from '../tools/SearchStrategy';
import TalentScoutTool from '../tools/TalentScout';
import CandidateResearchTool from '../tools/CandidateResearch';
import CandidateDossierTool from '../tools/CandidateDossier';
import ClientResearchTool from '../tools/ClientResearch';

import { toolColors } from '@/design-system/tokens';

export const toolRegistry = {
  'jd-builder': {
    id: 'jd-builder',
    label: 'JD Builder',
    icon: FileText,
    description: 'Create professional job descriptions',
    placeholder: 'Role title, seniority, key responsibilities...',
    
    // Color scheme
    ...toolColors['jd-builder'],
    
    // Features
    features: {
      fileUpload: true,
      contextField: true,
      outputFormats: ['txt', 'pdf', 'docx'],
      history: true,
      customUI: false          // Uses standard ToolShell layout
    },
    
    // File upload configuration
    fileUploadConfig: {
      accept: ['.txt', '.pdf', '.doc', '.docx'],
      maxSize: 10,
      multiple: true,
      label: 'Upload Context Documents'
    },
    
    component: JDBuilderTool,
    backendType: 'jd-builder'
  },
  
  'search-strategy': {
    id: 'search-strategy',
    label: 'Search Strategy',
    icon: Search,
    description: 'Develop targeted candidate search plans',
    placeholder: 'Target role, industry, location, key skills...',
    
    ...toolColors['search-strategy'],
    
    features: {
      fileUpload: false,
      contextField: true,
      outputFormats: ['txt', 'pdf', 'docx'],
      history: true,
      customUI: true           // Has OutputTypeSelector
    },
    
    component: SearchStrategyTool,
    backendType: 'search-strategy'  // Can become 'search-strategy-targets'
  },
  
  'talent-scout': {
    id: 'talent-scout',
    label: 'Talent Scout',
    icon: Users,
    description: 'Research high-potential candidates with iterative feedback',
    placeholder: 'Research high-potential candidates...',
    
    ...toolColors['talent-scout'],
    
    features: {
      fileUpload: false,
      contextField: false,
      outputFormats: ['csv'],  // Only CSV export
      history: true,
      customUI: true           // Completely custom multi-step flow
    },
    
    component: TalentScoutTool,
    backendType: 'talent-scout'
  },
  
  'candidate-research': {
    id: 'candidate-research',
    label: 'Candidate Research',
    icon: UserSearch,
    description: 'Analyze candidate backgrounds and fit',
    placeholder: 'Candidate name, LinkedIn URL, or background...',
    
    ...toolColors['candidate-research'],
    
    features: {
      fileUpload: false,
      contextField: true,
      outputFormats: ['txt', 'pdf', 'docx'],
      history: true,
      customUI: false
    },
    
    component: CandidateResearchTool,
    backendType: 'candidate-research'
  },
  
  'dossier': {
    id: 'dossier',
    label: 'Candidate Dossier',
    icon: BookUser,
    description: 'Compile candidate profile — upload docs for context',
    placeholder: 'Candidate name, role, company, experience notes...',
    
    ...toolColors['dossier'],
    
    features: {
      fileUpload: true,
      contextField: true,
      outputFormats: ['txt', 'pdf', 'docx'],
      history: true,
      customUI: true           // Has FormatUploader (sample output format)
    },
    
    fileUploadConfig: {
      accept: ['.txt', '.pdf', '.doc', '.docx'],
      maxSize: 10,
      multiple: true,
      label: 'Upload Context Documents'
    },
    
    // Special: Format file upload
    formatUploadConfig: {
      accept: ['.txt', '.pdf', '.doc', '.docx'],
      maxSize: 10,
      multiple: false,
      label: 'Upload Sample Output Format'
    },
    
    component: CandidateDossierTool,
    backendType: 'dossier'
  },
  
  'client-research': {
    id: 'client-research',
    label: 'Client Research',
    icon: Building2,
    description: 'Research companies and stakeholders',
    placeholder: 'Company name, industry, HQ location...',
    
    ...toolColors['client-research'],
    
    features: {
      fileUpload: false,
      contextField: true,
      outputFormats: ['txt', 'pdf', 'docx'],
      history: true,
      customUI: false
    },
    
    component: ClientResearchTool,
    backendType: 'client-research'
  }
};

// Helper functions
export const getToolConfig = (toolId) => toolRegistry[toolId];
export const getAllTools = () => Object.values(toolRegistry);
export const getToolIds = () => Object.keys(toolRegistry);
```

---

## 📝 Step-by-Step Migration Plan

### Phase 0: Preparation (1 day)
**Goal:** Set up foundation without breaking existing functionality

- [ ] **Step 0.1:** Create this reference document (`AI_TOOLS_REFACTOR_PLAN.md`)
- [ ] **Step 0.2:** Create new directory structure (empty files)
  ```bash
  mkdir -p /app/frontend/src/contexts
  mkdir -p /app/frontend/src/design-system
  mkdir -p /app/frontend/src/features/ai-tools/{components,hooks,tools,registry,utils}
  mkdir -p /app/frontend/src/features/ai-tools/tools/{JDBuilder,SearchStrategy,TalentScout,CandidateResearch,CandidateDossier,ClientResearch}
  ```
- [ ] **Step 0.3:** Verify existing app still works (run tests, take screenshots)
- [ ] **Step 0.4:** Commit: "chore: create directory structure for AI Tools refactor"

---

### Phase 1: Theme System Foundation (2 days)
**Goal:** Fix light mode globally, create theme context

#### Step 1.1: Create Theme Context
**Files to create:**
- `/app/frontend/src/contexts/ThemeContext.js`

**Implementation:**
```javascript
// See "Design System Specification" section above for full code
```

**Testing:**
- [ ] Theme context provides `theme`, `toggleTheme`, `isDark`, `isLight`
- [ ] Observer syncs with existing ThemeToggle component
- [ ] localStorage persistence works

#### Step 1.2: Integrate Theme Context into App
**Files to modify:**
- `/app/frontend/src/App.js`

**Changes:**
```javascript
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* existing app structure */}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Testing:**
- [ ] `useTheme()` hook accessible from any component
- [ ] Theme toggle button in Navbar still works
- [ ] No regressions in existing pages

#### Step 1.3: Create Design Tokens
**Files to create:**
- `/app/frontend/src/design-system/tokens.js`

**Implementation:**
```javascript
// See "Design System Specification" section for full code
export const toolColors = { /* ... */ };
export const themeClasses = { /* ... */ };
export const typography = { /* ... */ };
```

**Testing:**
- [ ] Can import tokens in any component
- [ ] All tool colors defined
- [ ] Theme classes use CSS variables

#### Step 1.4: Fix Hardcoded Colors in Index.css
**Files to modify:**
- `/app/frontend/src/index.css`

**Changes:**
1. Keep CSS variables (lines 24-84)
2. Remove all `!important` overrides (lines 104-300)
3. Add global body styles:
```css
@layer base {
  body { 
    @apply bg-background text-foreground transition-colors duration-200;
  }
}
```

**Testing:**
- [ ] Dark mode: background is `#1a1a1a`, text is white
- [ ] Light mode: background is `#e6f4ff`, text is dark
- [ ] Transition is smooth when toggling

#### Step 1.5: Commit Phase 1
```bash
git add .
git commit -m "feat: implement global theme system with React context

- Add ThemeContext with useTheme hook
- Create design tokens (toolColors, themeClasses)
- Integrate ThemeProvider into App.js
- Remove !important CSS overrides
- Add smooth theme transitions"
```

---

### Phase 2: Shared Hooks (3 days)
**Goal:** Extract reusable logic from AITools.js

#### Step 2.1: Create useAIGeneration Hook
**Files to create:**
- `/app/frontend/src/features/ai-tools/hooks/useAIGeneration.js`

**Implementation:**
```javascript
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

/**
 * Hook for AI generation logic
 * Handles prompt state, API calls, and error handling
 */
export const useAIGeneration = (toolConfig) => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const handleGenerate = async (overridePrompt, overrideContext, customToolType) => {
    const actualPrompt = overridePrompt || prompt;
    const actualContext = overrideContext || context;
    const toolType = customToolType || toolConfig.backendType;
    
    if (!actualPrompt?.trim()) {
      toast.error('Please enter a prompt');
      return null;
    }
    
    setGenerating(true);
    setResult('');
    
    try {
      const res = await axios.post(
        `${API}/ai/generate`,
        { tool_type: toolType, prompt: actualPrompt, context: actualContext },
        { withCredentials: true }
      );
      
      setResult(res.data.response);
      toast.success('Generated successfully');
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Generation failed';
      toast.error(errorMsg);
      return null;
    } finally {
      setGenerating(false);
    }
  };
  
  const clearResult = () => setResult('');
  const clearAll = () => {
    setPrompt('');
    setContext('');
    setResult('');
  };
  
  return {
    prompt,
    setPrompt,
    context,
    setContext,
    result,
    setResult,
    generating,
    handleGenerate,
    clearResult,
    clearAll
  };
};
```

**Testing:**
- [ ] Hook manages prompt/context/result state
- [ ] API call works with correct payload
- [ ] Error handling shows toast
- [ ] Success shows toast

#### Step 2.2: Create useFileUpload Hook
**Files to create:**
- `/app/frontend/src/features/ai-tools/hooks/useFileUpload.js`

**Implementation:**
```javascript
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB

/**
 * Hook for chunked file upload logic
 * Handles multiple files, progress tracking, and text extraction
 */
export const useFileUpload = (config = {}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedFileIdx, setExpandedFileIdx] = useState(null);
  
  const {
    accept = ['.txt', '.pdf', '.doc', '.docx'],
    maxSize = 10,
    multiple = true
  } = config;
  
  const processFile = async (file) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('upload_id', uploadId);
        formData.append('chunk_index', i.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('filename', file.name);

        await axios.post(`${API}/ai/upload-chunk`, formData, { withCredentials: true });

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
      }

      // Extract file
      const res = await axios.post(
        `${API}/ai/extract-file`,
        { upload_id: uploadId, filename: file.name },
        { withCredentials: true }
      );

      return {
        name: file.name,
        charCount: res.data.char_count,
        extractedText: res.data.extracted_text,
      };
    } catch (err) {
      toast.error(err.response?.data?.detail || 'File processing failed');
      return null;
    }
  };
  
  const handleFilesDrop = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      
      if (!accept.includes(ext)) {
        toast.error(`Unsupported type: ${ext}`);
        continue;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max ${maxSize} MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    
    // If not multiple, only process first file
    const filesToProcess = multiple ? validFiles : [validFiles[0]];

    setUploading(true);
    setUploadProgress(0);

    for (const file of filesToProcess) {
      const processed = await processFile(file);
      if (processed) {
        setUploadedFiles((prev) => multiple ? [...prev, processed] : [processed]);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    toast.success(`${filesToProcess.length} file(s) uploaded successfully`);
  };
  
  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (expandedFileIdx === index) setExpandedFileIdx(null);
    else if (expandedFileIdx > index) setExpandedFileIdx(expandedFileIdx - 1);
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setExpandedFileIdx(null);
  };

  const toggleFileExpand = (idx) => {
    setExpandedFileIdx(expandedFileIdx === idx ? null : idx);
  };
  
  // Get combined context from all files
  const getCombinedContext = () => {
    return uploadedFiles
      .map((f, i) => `--- Context File ${i + 1}: ${f.name} ---\n${f.extractedText}`)
      .join('\n\n');
  };
  
  return {
    uploadedFiles,
    uploading,
    uploadProgress,
    expandedFileIdx,
    handleFilesDrop,
    removeFile,
    clearAllFiles,
    toggleFileExpand,
    getCombinedContext
  };
};
```

**Testing:**
- [ ] Chunked upload works for large files
- [ ] Progress tracking updates correctly
- [ ] Text extraction works for PDF, DOCX, TXT
- [ ] Multiple file handling
- [ ] File size validation

#### Step 2.3: Create useDownload Hook
**Files to create:**
- `/app/frontend/src/features/ai-tools/hooks/useDownload.js`

**Implementation:**
```javascript
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

/**
 * Hook for file download logic
 * Handles TXT (client-side) and PDF/DOCX/CSV (server-side)
 */
export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  
  const triggerBrowserDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };
  
  const handleDownload = async (content, format, filename) => {
    if (!content || !content.trim()) {
      toast.error('No content to download');
      return false;
    }
    
    setDownloading(true);
    
    try {
      const safeFilename = filename || 'document';
      
      if (format === 'txt') {
        // Client-side TXT download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        triggerBrowserDownload(blob, `${safeFilename}.txt`);
      } else {
        // Server-side PDF/DOCX/CSV generation
        const res = await axios.post(
          `${API}/ai/download`,
          { content, format, filename: safeFilename },
          { responseType: 'blob', withCredentials: true }
        );
        
        if (!(res.data instanceof Blob)) {
          throw new Error('Invalid response format from server');
        }
        
        triggerBrowserDownload(res.data, `${safeFilename}.${format}`);
      }
      
      toast.success(`Downloaded as ${format.toUpperCase()}`);
      return true;
    } catch (err) {
      console.error('[Download Error]', err);
      
      let errorMsg = 'Download failed. Please try again.';
      if (err.response?.data instanceof Blob) {
        errorMsg = await err.response.data.text();
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setDownloading(false);
    }
  };
  
  return { downloading, handleDownload };
};
```

**Testing:**
- [ ] TXT download works (client-side)
- [ ] PDF download works (server-side)
- [ ] DOCX download works (server-side)
- [ ] CSV download works (server-side)
- [ ] Error handling shows user-friendly message
- [ ] Files actually save to disk

#### Step 2.4: Create useHistory Hook
**Files to create:**
- `/app/frontend/src/features/ai-tools/hooks/useHistory.js`

**Implementation:**
```javascript
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/App';

/**
 * Hook for managing AI generation history
 * Fetches and filters history by tool type
 */
export const useHistory = (toolId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const fetchHistory = useCallback(async () => {
    if (!toolId) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API}/ai/history`, { withCredentials: true });
      const filtered = res.data.filter((h) => h.tool_type === toolId);
      setHistory(filtered);
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [toolId]);
  
  useEffect(() => {
    if (toolId) {
      fetchHistory();
    }
  }, [toolId, fetchHistory]);
  
  const openHistory = () => setIsOpen(true);
  const closeHistory = () => setIsOpen(false);
  
  const refreshHistory = () => fetchHistory();
  
  return {
    history,
    loading,
    isOpen,
    openHistory,
    closeHistory,
    refreshHistory
  };
};
```

**Testing:**
- [ ] Fetches history on mount
- [ ] Filters by tool_type
- [ ] Loading state works
- [ ] Can refresh manually

#### Step 2.5: Commit Phase 2
```bash
git add .
git commit -m "feat: extract shared hooks for AI tools

- Add useAIGeneration: handles prompt state and API calls
- Add useFileUpload: chunked upload with progress tracking
- Add useDownload: unified download logic for all formats
- Add useHistory: history fetching and filtering

All hooks are tested and ready for integration"
```

---

### Phase 3: Shared Components (3 days)
**Goal:** Create reusable UI components

#### Step 3.1: Create ToolShell Component
**Files to create:**
- `/app/frontend/src/features/ai-tools/components/ToolShell.js`

**Implementation:**
```javascript
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { themeClasses } from '@/design-system/tokens';
import InputSection from './InputSection';
import FileUploadSection from './FileUploadSection';
import OutputSection from './OutputSection';
import HistoryPanel from './HistoryPanel';
import { useAIGeneration } from '../hooks/useAIGeneration';
import { useFileUpload } from '../hooks/useFileUpload';
import { useDownload } from '../hooks/useDownload';
import { useHistory } from '../hooks/useHistory';

/**
 * ToolShell: Universal wrapper for all AI tools
 * Provides standard layout and shared functionality
 * Tools can opt-in/out of features via toolConfig
 */
export default function ToolShell({ 
  toolConfig,
  onBack,
  children // Custom tool-specific UI (optional)
}) {
  const { theme } = useTheme();
  
  // Shared hooks
  const generation = useAIGeneration(toolConfig);
  const fileUpload = useFileUpload(toolConfig.fileUploadConfig);
  const download = useDownload();
  const history = useHistory(toolConfig.id);
  
  // Combine file context with manual context for generation
  const handleGenerateWithFiles = async (overridePrompt, overrideContext, customToolType) => {
    const fileContext = fileUpload.getCombinedContext();
    const fullContext = [overrideContext || generation.context, fileContext]
      .filter(Boolean)
      .join('\n\n');
    
    const result = await generation.handleGenerate(overridePrompt, fullContext, customToolType);
    
    if (result) {
      history.refreshHistory();
    }
    
    return result;
  };
  
  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.container}>
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          <span className="text-sm font-medium">Back to Tools</span>
        </button>
        
        {/* Tool Header */}
        <div className="flex items-center gap-4">
          <div 
            className={`w-14 h-14 rounded-xl ${toolConfig.bg} border ${toolConfig.border} flex items-center justify-center`}
          >
            <toolConfig.icon className={`w-7 h-7 ${toolConfig.color}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-semibold ${themeClasses.heading}`}>
              {toolConfig.label}
            </h1>
            <p className={`text-sm sm:text-base ${themeClasses.subtext}`}>
              {toolConfig.description}
            </p>
          </div>
        </div>
        
        {/* Custom Tool UI (if tool.features.customUI = true) */}
        {toolConfig.features.customUI && children ? (
          typeof children === 'function' ? children({
            generation,
            fileUpload,
            download,
            history,
            handleGenerate: handleGenerateWithFiles
          }) : children
        ) : (
          <>
            {/* Standard Input Section */}
            {toolConfig.features.contextField && (
              <InputSection
                prompt={generation.prompt}
                context={generation.context}
                onPromptChange={generation.setPrompt}
                onContextChange={generation.setContext}
                placeholder={toolConfig.placeholder}
                generating={generation.generating}
                onGenerate={() => handleGenerateWithFiles()}
                onShowHistory={history.openHistory}
                hasHistory={history.history.length > 0}
              />
            )}
            
            {/* File Upload Section */}
            {toolConfig.features.fileUpload && (
              <FileUploadSection
                files={fileUpload.uploadedFiles}
                uploading={fileUpload.uploading}
                uploadProgress={fileUpload.uploadProgress}
                expandedFileIdx={fileUpload.expandedFileIdx}
                onFilesDrop={fileUpload.handleFilesDrop}
                onRemoveFile={fileUpload.removeFile}
                onClearAll={fileUpload.clearAllFiles}
                onToggleExpand={fileUpload.toggleFileExpand}
                config={toolConfig.fileUploadConfig}
              />
            )}
            
            {/* Output Section */}
            {generation.result && (
              <OutputSection
                result={generation.result}
                downloading={download.downloading}
                outputFormats={toolConfig.features.outputFormats}
                onDownload={(format) => download.handleDownload(generation.result, format, toolConfig.label)}
                toolColor={toolConfig.color}
              />
            )}
          </>
        )}
        
        {/* History Panel */}
        {toolConfig.features.history && (
          <HistoryPanel
            isOpen={history.isOpen}
            onClose={history.closeHistory}
            history={history.history}
            loading={history.loading}
            onLoadItem={(item) => {
              generation.setPrompt(item.prompt);
              generation.setResult(item.response);
              history.closeHistory();
            }}
            toolLabel={toolConfig.label}
          />
        )}
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Renders tool header correctly
- [ ] Shows/hides sections based on features config
- [ ] Custom UI slot works for special tools
- [ ] All hooks integrate properly

#### Step 3.2: Create InputSection Component
**Files to create:**
- `/app/frontend/src/features/ai-tools/components/InputSection.js`

**Implementation:**
```javascript
import { Sparkles, Clock } from 'lucide-react';
import { themeClasses } from '@/design-system/tokens';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * InputSection: Reusable prompt and context inputs
 * Used by all standard tools
 */
export default function InputSection({
  prompt,
  context,
  onPromptChange,
  onContextChange,
  placeholder,
  generating,
  onGenerate,
  onShowHistory,
  hasHistory
}) {
  return (
    <div className={`${themeClasses.card} p-6 space-y-4`}>
      {/* Main Prompt */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          What would you like to generate?
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={placeholder}
          className={`min-h-[120px] ${themeClasses.textarea}`}
          disabled={generating}
        />
      </div>
      
      {/* Additional Context */}
      {onContextChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Additional Context (Optional)
          </label>
          <Textarea
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="Any additional information or requirements..."
            className={`min-h-[80px] ${themeClasses.textarea}`}
            disabled={generating}
          />
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={generating || !prompt.trim()}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-full ${themeClasses.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              Generate with AI
            </>
          )}
        </button>
        
        {hasHistory && (
          <button
            onClick={onShowHistory}
            className={`flex items-center gap-2 px-4 h-11 rounded-full ${themeClasses.button}`}
          >
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">History</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Prompt textarea works
- [ ] Context textarea works (when provided)
- [ ] Generate button disabled when empty
- [ ] Loading state shows spinner
- [ ] History button appears when hasHistory=true

#### Step 3.3: Refactor Existing Components
**Files to refactor:**
1. Move `/app/frontend/src/components/ai-tools/FileUploader.js` 
   → `/app/frontend/src/features/ai-tools/components/FileUploadSection.js`
   
2. Move `/app/frontend/src/components/ai-tools/OutputDisplay.js`
   → `/app/frontend/src/features/ai-tools/components/OutputSection.js`
   
3. Move `/app/frontend/src/components/ai-tools/HistoryPanel.js`
   → `/app/frontend/src/features/ai-tools/components/HistoryPanel.js`
   
4. Move `/app/frontend/src/components/ai-tools/ToolSelector.js`
   → `/app/frontend/src/features/ai-tools/components/ToolSelector.js`

**Changes needed:**
- Replace hardcoded colors with `themeClasses`
- Update import paths
- Ensure all use `useTheme()` hook

**Testing:**
- [ ] FileUploadSection: drag-drop works, progress bar updates
- [ ] OutputSection: edit mode, download dropdown
- [ ] HistoryPanel: loads items, click to load
- [ ] ToolSelector: displays all tools, click to select

#### Step 3.4: Commit Phase 3
```bash
git add .
git commit -m "feat: create shared AI Tools components

- Add ToolShell: universal wrapper with opt-in features
- Add InputSection: reusable prompt/context inputs
- Refactor FileUploadSection with theme support
- Refactor OutputSection with theme support
- Refactor HistoryPanel with theme support
- Move ToolSelector to features directory

All components use themeClasses and useTheme hook"
```

---

### Phase 4: Tool Registry (1 day)
**Goal:** Create configuration hub

#### Step 4.1: Create Tool Registry
**Files to create:**
- `/app/frontend/src/features/ai-tools/registry/toolRegistry.js`

**Implementation:**
See "Tool Registry Configuration" section above for full code (300+ lines)

**Testing:**
- [ ] All 6 tools defined
- [ ] getToolConfig() returns correct config
- [ ] getAllTools() returns array of 6 tools
- [ ] Tool colors match existing design

#### Step 4.2: Create AIToolsLayout Router
**Files to create:**
- `/app/frontend/src/features/ai-tools/AIToolsLayout.js`

**Implementation:**
```javascript
import { useState } from 'react';
import ToolSelector from './components/ToolSelector';
import ToolShell from './components/ToolShell';
import { getToolConfig, getAllTools } from './registry/toolRegistry';

/**
 * AIToolsLayout: Main router for AI Tools
 * Manages tool selection and renders appropriate component
 */
export default function AIToolsLayout() {
  const [selectedToolId, setSelectedToolId] = useState(null);
  
  const handleSelectTool = (toolId) => {
    setSelectedToolId(toolId);
  };
  
  const handleBack = () => {
    setSelectedToolId(null);
  };
  
  // Show tool selector if no tool selected
  if (!selectedToolId) {
    return (
      <ToolSelector 
        tools={getAllTools()} 
        onSelectTool={handleSelectTool} 
      />
    );
  }
  
  // Get tool configuration
  const toolConfig = getToolConfig(selectedToolId);
  
  if (!toolConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Tool not found</p>
      </div>
    );
  }
  
  // Render tool component
  const ToolComponent = toolConfig.component;
  
  return (
    <ToolComponent 
      toolConfig={toolConfig}
      onBack={handleBack}
    />
  );
}
```

**Testing:**
- [ ] Shows ToolSelector by default
- [ ] Clicking tool loads correct component
- [ ] Back button returns to selector
- [ ] Tool not found shows error

#### Step 4.3: Update App.js Route
**Files to modify:**
- `/app/frontend/src/App.js`

**Changes:**
```javascript
// Replace:
import AITools from "@/pages/AITools";

// With:
import AIToolsLayout from "@/features/ai-tools/AIToolsLayout";

// Update route:
<Route path="/ai-tools" element={<ProtectedRoute><AIToolsLayout /></ProtectedRoute>} />
```

**Testing:**
- [ ] /ai-tools route loads new layout
- [ ] Tool selection works
- [ ] No errors in console

#### Step 4.4: Commit Phase 4
```bash
git add .
git commit -m "feat: add tool registry and main layout

- Create toolRegistry with all 6 tools configured
- Add AIToolsLayout router component
- Update App.js to use new layout
- Add getToolConfig helper functions"
```

---

### Phase 5: Migrate Simple Tools (2 days)
**Goal:** Migrate tools with no custom UI

#### Step 5.1: Migrate JD Builder
**Files to create:**
- `/app/frontend/src/features/ai-tools/tools/JDBuilder/index.js`
- `/app/frontend/src/features/ai-tools/tools/JDBuilder/JDBuilderTool.js`

**Implementation:**
```javascript
// index.js
export { default } from './JDBuilderTool';

// JDBuilderTool.js
import ToolShell from '../../components/ToolShell';

/**
 * JD Builder Tool
 * Standard tool - uses default ToolShell behavior
 */
export default function JDBuilderTool({ toolConfig, onBack }) {
  return <ToolShell toolConfig={toolConfig} onBack={onBack} />;
}
```

**Testing:**
- [ ] Tool loads from selector
- [ ] Prompt input works
- [ ] Context input works
- [ ] File upload works
- [ ] AI generation works
- [ ] Download works (TXT, PDF, DOCX)
- [ ] History works
- [ ] Light/dark theme works

#### Step 5.2: Migrate Candidate Research
**Files to create:**
- `/app/frontend/src/features/ai-tools/tools/CandidateResearch/index.js`
- `/app/frontend/src/features/ai-tools/tools/CandidateResearch/CandidateResearchTool.js`

**Implementation:**
```javascript
// Same pattern as JD Builder (standard tool)
import ToolShell from '../../components/ToolShell';

export default function CandidateResearchTool({ toolConfig, onBack }) {
  return <ToolShell toolConfig={toolConfig} onBack={onBack} />;
}
```

**Testing:**
- Same checklist as JD Builder

#### Step 5.3: Migrate Client Research
**Files to create:**
- `/app/frontend/src/features/ai-tools/tools/ClientResearch/index.js`
- `/app/frontend/src/features/ai-tools/tools/ClientResearch/ClientResearchTool.js`

**Implementation:**
```javascript
// Same pattern as JD Builder (standard tool)
import ToolShell from '../../components/ToolShell';

export default function ClientResearchTool({ toolConfig, onBack }) {
  return <ToolShell toolConfig={toolConfig} onBack={onBack} />;
}
```

**Testing:**
- Same checklist as JD Builder

#### Step 5.4: Test All Simple Tools Together
**Regression testing:**
- [ ] All 3 tools accessible from selector
- [ ] Each tool generates correctly
- [ ] File uploads work
- [ ] Downloads work
- [ ] History is tool-specific
- [ ] Theme switching works on all tools
- [ ] No console errors

#### Step 5.5: Commit Phase 5
```bash
git add .
git commit -m "feat: migrate simple AI tools to new architecture

- Migrate JD Builder to ToolShell
- Migrate Candidate Research to ToolShell
- Migrate Client Research to ToolShell

All tools tested and working with shared components"
```

---

### Phase 6: Migrate Complex Tools (3 days)
**Goal:** Migrate tools with custom UI

#### Step 6.1: Migrate Search Strategy (has output type selector)
**Files to create:**
- `/app/frontend/src/features/ai-tools/tools/SearchStrategy/index.js`
- `/app/frontend/src/features/ai-tools/tools/SearchStrategy/SearchStrategyTool.js`
- `/app/frontend/src/features/ai-tools/tools/SearchStrategy/OutputTypeSelector.js`

**Implementation:**
```javascript
// SearchStrategyTool.js
import { useState } from 'react';
import ToolShell from '../../components/ToolShell';
import OutputTypeSelector from './OutputTypeSelector';
import { themeClasses } from '@/design-system/tokens';

export default function SearchStrategyTool({ toolConfig, onBack }) {
  const [outputType, setOutputType] = useState('strategy');
  
  // Override backend type based on selection
  const customConfig = {
    ...toolConfig,
    backendType: outputType === 'target-list' ? 'search-strategy-targets' : 'search-strategy'
  };
  
  return (
    <ToolShell toolConfig={customConfig} onBack={onBack}>
      {({ generation, download, history, handleGenerate }) => (
        <div className="space-y-6">
          {/* Custom: Output Type Selector */}
          <OutputTypeSelector value={outputType} onChange={setOutputType} />
          
          {/* Standard: Input Section */}
          <InputSection
            prompt={generation.prompt}
            context={generation.context}
            onPromptChange={generation.setPrompt}
            onContextChange={generation.setContext}
            placeholder={customConfig.placeholder}
            generating={generation.generating}
            onGenerate={() => handleGenerate()}
            onShowHistory={history.openHistory}
            hasHistory={history.history.length > 0}
          />
          
          {/* Standard: Output Section */}
          {generation.result && (
            <OutputSection
              result={generation.result}
              downloading={download.downloading}
              outputFormats={customConfig.features.outputFormats}
              onDownload={(format) => download.handleDownload(generation.result, format, customConfig.label)}
              toolColor={customConfig.color}
            />
          )}
        </div>
      )}
    </ToolShell>
  );
}

// OutputTypeSelector.js
import { themeClasses } from '@/design-system/tokens';

export default function OutputTypeSelector({ value, onChange }) {
  return (
    <div className={`${themeClasses.card} p-4`}>
      <label className="text-sm font-medium text-foreground mb-3 block">Output Type</label>
      <div className="flex gap-3">
        <button
          onClick={() => onChange('strategy')}
          className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
            value === 'strategy'
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : `${themeClasses.button} text-muted-foreground`
          }`}
        >
          <div className="text-left">
            <div className="font-medium mb-1">Search Strategy</div>
            <div className="text-xs opacity-75">Concise, actionable search plan</div>
          </div>
        </button>
        <button
          onClick={() => onChange('target-list')}
          className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
            value === 'target-list'
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : `${themeClasses.button} text-muted-foreground`
          }`}
        >
          <div className="text-left">
            <div className="font-medium mb-1">Target Company List</div>
            <div className="text-xs opacity-75">Tabular list with 15-20 companies</div>
          </div>
        </button>
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Output type selector works
- [ ] "Strategy" mode generates correctly
- [ ] "Target List" mode generates table
- [ ] Backend receives correct tool_type
- [ ] Theme works in both modes

#### Step 6.2: Migrate Candidate Dossier (has format uploader)
**Files to create:**
- `/app/frontend/src/features/ai-tools/tools/CandidateDossier/index.js`
- `/app/frontend/src/features/ai-tools/tools/CandidateDossier/CandidateDossierTool.js`
- `/app/frontend/src/features/ai-tools/tools/CandidateDossier/FormatUploader.js`

**Implementation:**
```javascript
// CandidateDossierTool.js
import ToolShell from '../../components/ToolShell';
import InputSection from '../../components/InputSection';
import FileUploadSection from '../../components/FileUploadSection';
import OutputSection from '../../components/OutputSection';
import FormatUploader from './FormatUploader';
import { useFileUpload } from '../../hooks/useFileUpload';

export default function CandidateDossierTool({ toolConfig, onBack }) {
  // Special: Format file upload (separate from context files)
  const formatUpload = useFileUpload(toolConfig.formatUploadConfig);
  
  return (
    <ToolShell toolConfig={toolConfig} onBack={onBack}>
      {({ generation, fileUpload, download, history, handleGenerate }) => {
        
        // Override handleGenerate to include format file in context
        const handleGenerateWithFormat = async () => {
          let fullContext = generation.context;
          
          // Prepend format sample if uploaded
          if (formatUpload.uploadedFiles.length > 0) {
            const formatText = formatUpload.uploadedFiles[0].extractedText;
            fullContext = `========================================
📋 DESIRED OUTPUT FORMAT (CRITICAL - MUST FOLLOW EXACTLY)
========================================

YOU MUST REPLICATE THIS EXACT FORMAT, STRUCTURE, STYLE, AND SECTION ORDERING:

${formatText}

========================================
END OF FORMAT SAMPLE
========================================

IMPORTANT INSTRUCTIONS:
- Use the EXACT same section headings as shown above
- Follow the SAME ordering of sections
- Match the writing style, tone, and level of detail
- Use the same formatting approach (bullets, paragraphs, metrics presentation)
- Preserve any special structure or flow patterns from the sample

${fullContext}`;
          }
          
          return handleGenerate(null, fullContext);
        };
        
        return (
          <div className="space-y-6">
            {/* Standard: Input Section */}
            <InputSection
              prompt={generation.prompt}
              context={generation.context}
              onPromptChange={generation.setPrompt}
              onContextChange={generation.setContext}
              placeholder={toolConfig.placeholder}
              generating={generation.generating}
              onGenerate={handleGenerateWithFormat}
              onShowHistory={history.openHistory}
              hasHistory={history.history.length > 0}
            />
            
            {/* Standard: Context Files */}
            <FileUploadSection
              files={fileUpload.uploadedFiles}
              uploading={fileUpload.uploading}
              uploadProgress={fileUpload.uploadProgress}
              expandedFileIdx={fileUpload.expandedFileIdx}
              onFilesDrop={fileUpload.handleFilesDrop}
              onRemoveFile={fileUpload.removeFile}
              onClearAll={fileUpload.clearAllFiles}
              onToggleExpand={fileUpload.toggleFileExpand}
              config={toolConfig.fileUploadConfig}
            />
            
            {/* Custom: Format File Uploader */}
            <FormatUploader
              file={formatUpload.uploadedFiles[0]}
              uploading={formatUpload.uploading}
              uploadProgress={formatUpload.uploadProgress}
              onFilesDrop={formatUpload.handleFilesDrop}
              onRemove={() => formatUpload.clearAllFiles()}
            />
            
            {/* Standard: Output Section */}
            {generation.result && (
              <OutputSection
                result={generation.result}
                downloading={download.downloading}
                outputFormats={toolConfig.features.outputFormats}
                onDownload={(format) => download.handleDownload(generation.result, format, toolConfig.label)}
                toolColor={toolConfig.color}
              />
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}

// FormatUploader.js
import { FileText, Upload, X } from 'lucide-react';
import { themeClasses } from '@/design-system/tokens';

export default function FormatUploader({ file, uploading, uploadProgress, onFilesDrop, onRemove }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesDrop(files);
  };
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onFilesDrop(files);
  };
  
  return (
    <div className={`${themeClasses.card} p-6 space-y-4`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Upload Sample Output Format (Optional)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Provide a sample format for the dossier to follow
          </p>
        </div>
      </div>
      
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            uploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="format-file-input"
            disabled={uploading}
          />
          <label htmlFor="format-file-input" className="cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-foreground font-medium">
              {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Word, or TXT (Max 10 MB)</p>
          </label>
          
          {uploading && (
            <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={`${themeClasses.surface} rounded-xl p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.charCount} characters</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-destructive" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
```

**Testing:**
- [ ] Format uploader works
- [ ] Generated output follows sample format
- [ ] Context files still work separately
- [ ] All download formats work

#### Step 6.3: Migrate Talent Scout (completely custom)
**Files to create:**
- `/app/frontend/src/features/ai-tools/tools/TalentScout/index.js`
- `/app/frontend/src/features/ai-tools/tools/TalentScout/TalentScoutTool.js`
- `/app/frontend/src/features/ai-tools/tools/TalentScout/CandidateCard.js`
- `/app/frontend/src/features/ai-tools/tools/TalentScout/FeedbackForm.js`
- `/app/frontend/src/features/ai-tools/tools/TalentScout/CSVExporter.js`

**Implementation:**
```javascript
// TalentScoutTool.js
// Move existing /app/frontend/src/components/ai_tools/TalentScoutTool.js here
// Refactor to use:
// - useAIGeneration hook
// - useDownload hook
// - themeClasses for styling
// - CSV export via CSVExporter component

// Changes needed:
// 1. Replace hardcoded colors with themeClasses
// 2. Use download.handleDownload() for CSV export
// 3. Extract CandidateCard to separate component
// 4. Extract FeedbackForm to separate component
```

**Testing:**
- [ ] Multi-step flow works
- [ ] Candidate cards render correctly
- [ ] Feedback refines search
- [ ] CSV export works
- [ ] Theme works throughout flow

#### Step 6.4: Commit Phase 6
```bash
git add .
git commit -m "feat: migrate complex AI tools with custom UI

- Migrate Search Strategy with OutputTypeSelector
- Migrate Candidate Dossier with FormatUploader
- Migrate Talent Scout with multi-step flow
- Extract CandidateCard, FeedbackForm, CSVExporter components

All tools maintain existing functionality with new architecture"
```

---

### Phase 7: Cleanup & Testing (2 days)
**Goal:** Remove old code, comprehensive testing

#### Step 7.1: Remove Old Files
**Files to delete:**
- `/app/frontend/src/pages/AITools.js` (old 585-line file)
- `/app/frontend/src/components/ai-tools/` (old components - already moved)
- `/app/frontend/src/components/ai_tools/` (old Talent Scout - already moved)

**Verification:**
```bash
# Check no imports reference old files
grep -r "pages/AITools" /app/frontend/src
grep -r "components/ai-tools" /app/frontend/src
grep -r "components/ai_tools" /app/frontend/src

# Should return no results
```

#### Step 7.2: Clean Up Index.css
**Files to modify:**
- `/app/frontend/src/index.css`

**Changes:**
1. Remove all `!important` overrides (lines 104-300)
2. Keep only CSS variables (lines 24-84)
3. Add smooth transitions

**Testing:**
- [ ] Light mode works on all pages
- [ ] Dark mode works on all pages
- [ ] No visual regressions

#### Step 7.3: Comprehensive Testing Checklist
See "Testing Checklist" section below for full list

#### Step 7.4: Update Documentation
**Files to update:**
- `/app/AI_TOOLS_REFACTOR_PLAN.md` (this file - mark as complete)
- `/app/README.md` (add link to refactor plan)
- Create `/app/AI_TOOLS_DEVELOPER_GUIDE.md` (see "Future Maintenance Guide" section)

#### Step 7.5: Commit Phase 7
```bash
git add .
git commit -m "chore: cleanup and finalize AI Tools refactor

- Remove old AITools.js file (585 lines)
- Remove old component files
- Clean up index.css (!important overrides)
- Update documentation
- All tests passing

REFACTOR COMPLETE ✅"
```

---

## ✅ Testing Checklist

### Functional Testing

#### All Tools
- [ ] Tool loads from selector
- [ ] Back button returns to selector
- [ ] Prompt input works
- [ ] Context input works (when available)
- [ ] Generate button triggers API call
- [ ] Loading state shows correctly
- [ ] Result displays after generation
- [ ] History panel opens and loads items
- [ ] Can load from history
- [ ] Theme toggle works (light/dark)

#### Tools with File Upload (JD Builder, Dossier)
- [ ] Can drag-drop files
- [ ] Can click to select files
- [ ] Progress bar updates during upload
- [ ] Text extraction works (PDF, DOCX, TXT)
- [ ] File size validation works (>10MB rejected)
- [ ] File type validation works (wrong types rejected)
- [ ] Can remove individual files
- [ ] Can clear all files
- [ ] Uploaded content included in generation

#### Search Strategy
- [ ] Output type selector works
- [ ] "Strategy" mode generates correct format
- [ ] "Target List" mode generates table
- [ ] Download works for both modes

#### Candidate Dossier
- [ ] Context file upload works
- [ ] Format file upload works (separate)
- [ ] Format sample influences output structure
- [ ] Can upload format without context files
- [ ] Can upload context without format

#### Talent Scout
- [ ] Initial criteria form works
- [ ] Generates 5 candidates
- [ ] Candidate cards display correctly
- [ ] Feedback form works
- [ ] Refinement generates new candidates
- [ ] CSV export works
- [ ] CSV includes all candidate fields

### Download Testing

#### All Formats
- [ ] TXT download works (client-side)
- [ ] PDF download works (server-generated)
- [ ] DOCX download works (server-generated)
- [ ] CSV download works (Talent Scout)
- [ ] Files actually save to disk
- [ ] Filename is correct
- [ ] File content is correct
- [ ] Tables render in PDF/DOCX
- [ ] Markdown formatting preserved

### Theme Testing

#### Dark Mode (Default)
- [ ] Background is `#1a1a1a`
- [ ] Text is white/light grey
- [ ] Cards have subtle border
- [ ] Buttons have hover effect
- [ ] Inputs have visible border
- [ ] Tool color accents visible

#### Light Mode
- [ ] Background is `#e6f4ff` (light blue)
- [ ] Text is dark blue-grey
- [ ] All text is readable
- [ ] Cards have border
- [ ] Buttons have visible contrast
- [ ] Inputs have visible border
- [ ] Tool color accents still visible
- [ ] No white text on light background
- [ ] Dropdown menus readable
- [ ] History panel readable

#### Theme Transition
- [ ] Toggle animates smoothly
- [ ] No flash of wrong colors
- [ ] localStorage saves preference
- [ ] Theme persists on page reload
- [ ] Works across all AI Tools
- [ ] Works on Dashboard, Challenges, Leaderboard

### Performance Testing
- [ ] Tool loads in < 1 second
- [ ] File upload handles 10MB files
- [ ] Generation completes in < 30 seconds
- [ ] Download is instant (TXT) or < 5 seconds (PDF/DOCX)
- [ ] History loads in < 2 seconds
- [ ] No memory leaks when switching tools
- [ ] No console errors

### Accessibility Testing
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA (both themes)
- [ ] Screen reader friendly

### Error Handling
- [ ] Empty prompt shows error toast
- [ ] API failure shows error toast
- [ ] Network error shows error toast
- [ ] File upload error shows error toast
- [ ] Download error shows error toast
- [ ] Daily limit reached shows modal with API key CTA
- [ ] Invalid API key shows helpful message

### Regression Testing
- [ ] Navbar still works
- [ ] Dashboard still works
- [ ] Challenges still works
- [ ] Leaderboard still works
- [ ] Profile pages still work
- [ ] Admin panel still works (if applicable)
- [ ] Authentication still works
- [ ] Logout still works

---

## 📖 Code Patterns & Standards

### Pattern 1: Creating a New Standard Tool

**Example: "Interview Prep" Tool**

**Step 1:** Add to tool registry
```javascript
// /app/frontend/src/features/ai-tools/registry/toolRegistry.js

'interview-prep': {
  id: 'interview-prep',
  label: 'Interview Prep',
  icon: MessageCircle,
  description: 'Generate interview questions and answers',
  placeholder: 'Role, seniority, key skills to assess...',
  ...toolColors['interview-prep'], // Define color scheme
  features: {
    fileUpload: true,
    contextField: true,
    outputFormats: ['txt', 'pdf', 'docx'],
    history: true,
    customUI: false  // Standard tool
  },
  fileUploadConfig: {
    accept: ['.txt', '.pdf', '.doc', '.docx'],
    maxSize: 10,
    multiple: true,
    label: 'Upload Context Documents'
  },
  component: InterviewPrepTool,
  backendType: 'interview-prep'
}
```

**Step 2:** Create tool component
```javascript
// /app/frontend/src/features/ai-tools/tools/InterviewPrep/InterviewPrepTool.js

import ToolShell from '../../components/ToolShell';

export default function InterviewPrepTool({ toolConfig, onBack }) {
  return <ToolShell toolConfig={toolConfig} onBack={onBack} />;
}
```

**Step 3:** Export from index
```javascript
// /app/frontend/src/features/ai-tools/tools/InterviewPrep/index.js

export { default } from './InterviewPrepTool';
```

**Step 4:** Add backend prompt
```python
# /app/backend/routers/ai_tools.py

TOOL_PROMPTS = {
    # ... existing tools
    "interview-prep": "You are an expert talent acquisition specialist. Generate comprehensive interview questions and model answers based on the role requirements provided. Include: Technical Questions, Behavioral Questions, Situational Questions, and Evaluation Criteria for each. IMPORTANT: Provide ONLY the interview content. Do NOT include conversational follow-ups."
}
```

**Done!** Tool is fully functional.

---

### Pattern 2: Creating a Tool with Custom UI

**Example: Tool with toggle option**

```javascript
import { useState } from 'react';
import ToolShell from '../../components/ToolShell';
import InputSection from '../../components/InputSection';
import OutputSection from '../../components/OutputSection';

export default function MyCustomTool({ toolConfig, onBack }) {
  const [customOption, setCustomOption] = useState('option1');
  
  return (
    <ToolShell toolConfig={toolConfig} onBack={onBack}>
      {({ generation, download, history, handleGenerate }) => (
        <div className="space-y-6">
          {/* Custom UI Element */}
          <div className={themeClasses.card}>
            <select 
              value={customOption} 
              onChange={(e) => setCustomOption(e.target.value)}
            >
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
          </div>
          
          {/* Standard Input */}
          <InputSection
            prompt={generation.prompt}
            context={generation.context}
            onPromptChange={generation.setPrompt}
            onContextChange={generation.setContext}
            placeholder={toolConfig.placeholder}
            generating={generation.generating}
            onGenerate={() => handleGenerate(null, `Custom option: ${customOption}\n${generation.context}`)}
            onShowHistory={history.openHistory}
            hasHistory={history.history.length > 0}
          />
          
          {/* Standard Output */}
          {generation.result && (
            <OutputSection
              result={generation.result}
              downloading={download.downloading}
              outputFormats={toolConfig.features.outputFormats}
              onDownload={(format) => download.handleDownload(generation.result, format, toolConfig.label)}
              toolColor={toolConfig.color}
            />
          )}
        </div>
      )}
    </ToolShell>
  );
}
```

---

### Pattern 3: Adding a New Download Format

**Example: Add JSON export**

**Step 1:** Update tool config
```javascript
features: {
  outputFormats: ['txt', 'pdf', 'docx', 'json']  // Add 'json'
}
```

**Step 2:** Update backend endpoint
```python
# /app/backend/routers/ai_tools.py

@router.post("/download")
async def download_document(req: DownloadRequest, user=Depends(get_current_user)):
    # ... existing code
    
    elif req.format == "json":
        return Response(
            content=req.content.encode("utf-8"),
            media_type="application/json; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.json"'},
        )
```

**Step 3:** Update OutputSection component
```javascript
// Add JSON option to dropdown menu
<DropdownMenuItem onClick={() => onDownload("json")}>
  <Download className="w-4 h-4 mr-2" />
  JSON (.json)
</DropdownMenuItem>
```

---

### Pattern 4: Theme-Aware Styling

**✅ DO: Use CSS variables**
```javascript
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground border-border">
<button className="bg-primary text-primary-foreground">
```

**❌ DON'T: Hardcode colors**
```javascript
<div className="bg-[#090914] text-white">
<div className="bg-white/[0.04] text-slate-400">
```

**✅ DO: Use themeClasses**
```javascript
import { themeClasses } from '@/design-system/tokens';

<div className={themeClasses.card}>
<button className={themeClasses.buttonPrimary}>
```

**✅ DO: Conditional rendering with useTheme**
```javascript
import { useTheme } from '@/contexts/ThemeContext';

const { theme, isDark, isLight } = useTheme();

<div className={isDark ? 'shadow-xl' : 'shadow-md'}>
```

---

## 🔮 Future Maintenance Guide

### Adding a New AI Tool (< 30 minutes)

1. **Plan the tool**
   - What's unique about it? (custom UI needed?)
   - What features? (file upload, context field, output formats)
   - What download formats?

2. **Add to tool registry** (5 min)
   - Open `/app/frontend/src/features/ai-tools/registry/toolRegistry.js`
   - Copy an existing tool config
   - Update: id, label, icon, description, placeholder, features
   - Define tool color scheme in `toolColors`

3. **Create tool component** (10 min)
   - Create folder: `/app/frontend/src/features/ai-tools/tools/YourTool/`
   - Create `YourToolTool.js` and `index.js`
   - If standard tool: return `<ToolShell toolConfig={toolConfig} onBack={onBack} />`
   - If custom UI: use render prop pattern from ToolShell

4. **Add backend prompt** (5 min)
   - Open `/app/backend/routers/ai_tools.py`
   - Add tool to `TOOL_PROMPTS` dict
   - Test prompt generates good output

5. **Test** (10 min)
   - Test generation
   - Test file upload (if enabled)
   - Test download (all formats)
   - Test history
   - Test light/dark theme

---

### Modifying Shared Functionality

**Example: Change how file upload works**

**Where to change:**
- `/app/frontend/src/features/ai-tools/hooks/useFileUpload.js`

**Result:** All tools using file upload get the change

**Example: Change download behavior**

**Where to change:**
- `/app/frontend/src/features/ai-tools/hooks/useDownload.js`

**Result:** All tools get the updated download logic

---

### Adding a New Theme

**Example: Add "Dark Blue" theme**

**Step 1:** Define CSS variables
```css
/* /app/frontend/src/index.css */

[data-theme="dark-blue"] {
  --background: 220 40% 8%;        /* Dark blue background */
  --foreground: 210 100% 98%;      /* Light text */
  --card: 220 35% 12%;
  --primary: 200 90% 55%;          /* Lighter blue accent */
  /* ... other variables */
}
```

**Step 2:** Update ThemeToggle to support 3+ themes
```javascript
// /app/frontend/src/components/ThemeToggle.js

const themes = ['dark', 'light', 'dark-blue'];
const [themeIndex, setThemeIndex] = useState(0);

const cycleTheme = () => {
  const nextIndex = (themeIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  setThemeIndex(nextIndex);
  localStorage.setItem('theme', nextTheme);
  applyTheme(nextTheme);
};
```

**Step 3:** Update ThemeContext to handle multiple themes

---

### Troubleshooting Common Issues

#### Issue: Light mode text invisible
**Diagnosis:** Component using hardcoded colors
**Fix:** Replace with `themeClasses` or CSS variables
```javascript
// Before:
<p className="text-slate-400">

// After:
<p className="text-muted-foreground">
```

#### Issue: Download not working
**Diagnosis:** Check browser console for errors
**Fix options:**
1. Backend not returning blob → Check `/api/ai/download` endpoint
2. CORS error → Check CORS headers in FastAPI
3. File not triggering → Check `triggerBrowserDownload()` logic

#### Issue: Tool not appearing in selector
**Diagnosis:** Not registered in tool registry
**Fix:** Add tool to `/app/frontend/src/features/ai-tools/registry/toolRegistry.js`

#### Issue: File upload fails
**Diagnosis:** Check backend logs for extraction errors
**Fix options:**
1. File size too large → Increase `maxSize` in config
2. Unsupported format → Add format to `accept` array
3. Extraction error → Check backend has required libraries (pypdf, python-docx)

---

## 🎓 Best Practices

### Component Organization
```
✅ DO: One component per file
✅ DO: Colocate related components (e.g., CandidateCard.js next to TalentScoutTool.js)
✅ DO: Use descriptive names (InputSection, not Input)
❌ DON'T: Mix multiple components in one file
❌ DON'T: Create deep nesting (max 3 levels)
```

### State Management
```
✅ DO: Keep state as local as possible
✅ DO: Use hooks for shared logic
✅ DO: Lift state only when truly shared
❌ DON'T: Put all state in parent
❌ DON'T: Duplicate state across components
```

### Styling
```
✅ DO: Use CSS variables for colors
✅ DO: Use themeClasses for common patterns
✅ DO: Use Tailwind classes for spacing/layout
❌ DON'T: Use inline styles for colors
❌ DON'T: Use !important
❌ DON'T: Hardcode hex colors
```

### API Calls
```
✅ DO: Use hooks (useAIGeneration, useFileUpload)
✅ DO: Show loading states
✅ DO: Handle errors with user-friendly messages
❌ DON'T: Make API calls directly in components
❌ DON'T: Ignore errors
❌ DON'T: Block UI without feedback
```

---

## 📊 Success Metrics

After completing this refactor, we should achieve:

### Code Quality
- [ ] AI Tools codebase reduced from ~1500 lines to ~800 lines (smaller but organized)
- [ ] Zero `!important` CSS rules
- [ ] Zero hardcoded hex colors in components
- [ ] 100% of components use themeClasses or CSS variables
- [ ] All tools pass linting with no warnings

### User Experience
- [ ] Light mode works perfectly on all tools (0 reported bugs)
- [ ] Downloads work 100% of the time
- [ ] File uploads handle large files (up to 10MB)
- [ ] Theme switching is instant (< 100ms)
- [ ] All tools load in < 1 second

### Developer Experience
- [ ] Adding a new standard tool takes < 30 minutes
- [ ] All tools can be tested independently
- [ ] Clear documentation for all patterns
- [ ] New developers can understand structure in < 1 hour
- [ ] No need to touch existing tools when adding new ones

### Maintenance
- [ ] Bug fixes to shared logic affect all tools
- [ ] Theme changes apply globally
- [ ] Download logic centralized (one place to fix)
- [ ] File upload logic centralized
- [ ] Clear separation of concerns

---

## 📝 Change Log

### December 2024 - Initial Refactor
- ✅ Created ThemeContext with React hook
- ✅ Created design tokens and themeClasses
- ✅ Extracted shared hooks (useAIGeneration, useFileUpload, useDownload, useHistory)
- ✅ Created ToolShell universal wrapper
- ✅ Built tool registry configuration system
- ✅ Migrated all 6 tools to new architecture
- ✅ Removed old AITools.js monolithic file
- ✅ Fixed light mode globally
- ✅ Fixed download functionality

### Future Enhancements (Not in Current Plan)
- [ ] Add TypeScript for type safety
- [ ] Add unit tests for hooks
- [ ] Add E2E tests for critical flows
- [ ] Add analytics tracking per tool
- [ ] Add A/B testing infrastructure
- [ ] Add tool-specific settings
- [ ] Add collaborative features (share generations)

---

## 🆘 Getting Help

### Questions About This Refactor
1. Read this document thoroughly
2. Check the code examples and patterns
3. Look at existing tools for reference
4. Ask the development team

### Reporting Issues
When reporting an issue with the refactor:
1. Which tool is affected?
2. What is the expected behavior?
3. What actually happened?
4. Can you reproduce it? (steps)
5. Browser/device info
6. Screenshots or console errors

### Contributing
When contributing to AI Tools:
1. Read this document first
2. Follow the established patterns
3. Use themeClasses for styling
4. Test in both light and dark mode
5. Update this document if adding new patterns

---

## ✅ Final Checklist Before Considering Refactor Complete

### Code
- [ ] All 6 tools migrated and working
- [ ] Old AITools.js deleted
- [ ] Old component files deleted
- [ ] No hardcoded colors in codebase
- [ ] All imports use new paths
- [ ] No console errors in dev mode
- [ ] No console warnings in dev mode

### Testing
- [ ] All tools work in dark mode
- [ ] All tools work in light mode
- [ ] All downloads work (TXT, PDF, DOCX, CSV)
- [ ] All file uploads work
- [ ] History works for all tools
- [ ] Theme switching smooth
- [ ] No regressions on other pages

### Documentation
- [ ] This document (AI_TOOLS_REFACTOR_PLAN.md) complete
- [ ] Developer guide created
- [ ] Code comments added to complex logic
- [ ] README updated with new structure

### Performance
- [ ] No memory leaks
- [ ] File uploads handle 10MB
- [ ] Downloads complete in < 5 seconds
- [ ] Tool loads in < 1 second
- [ ] History loads in < 2 seconds

### Deployment
- [ ] All changes committed with clear messages
- [ ] Tested in preview environment
- [ ] Backend changes deployed
- [ ] Frontend changes deployed
- [ ] Post-deployment smoke test passed

---

## 🎉 Conclusion

This refactor transforms the AI Tools from a monolithic, hard-to-maintain system into a **modular, scalable, and theme-consistent architecture**. 

### Key Achievements:
1. **Single Source of Truth**: Tool registry defines everything
2. **Shared Logic**: Hooks eliminate duplication
3. **Theme Consistency**: CSS variables + React Context = perfect light/dark mode
4. **Easy to Extend**: Adding a new tool takes < 30 minutes
5. **Maintainable**: Bug fixes in shared logic affect all tools

### What This Enables:
- Add new tools quickly
- Experiment with tool-specific features
- A/B test different tool UIs
- Scale to 20+ tools without chaos
- Maintain consistent UX across all tools

---

**This document is a living guide.** Update it as new patterns emerge or requirements change.

**Last Updated:** December 2024  
**Next Review:** After Phase 7 completion

---
