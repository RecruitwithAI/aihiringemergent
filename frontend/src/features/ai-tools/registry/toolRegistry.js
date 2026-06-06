import { FileText, Search, Users, UserSearch, BookUser, Building2 } from 'lucide-react';
import { toolColors } from '@/design-system/tokens';

/**
 * Tool Registry
 * Central configuration for all AI tools
 * 
 * Each tool defines:
 * - Metadata (id, label, icon, description)
 * - Features (fileUpload, contextField, outputFormats, history, customUI)
 * - File upload configuration (if applicable)
 * - Component reference
 * - Backend tool type
 * 
 * Adding a new tool:
 * 1. Add entry to toolRegistry below
 * 2. Create component in /features/ai-tools/tools/YourTool/
 * 3. Import component and add to registry
 * 4. Add backend prompt to /backend/routers/ai_tools.py TOOL_PROMPTS
 */

export const toolRegistry = {
  'jd-builder': {
    id: 'jd-builder',
    label: 'JD Builder',
    icon: FileText,
    description: 'Create professional job descriptions',
    placeholder: 'Role title, seniority, key responsibilities...',
    
    // Tool color scheme
    ...toolColors['jd-builder'],
    
    // Feature flags
    features: {
      fileUpload: true,          // Enable file upload section
      contextField: true,         // Enable additional context textarea
      outputFormats: ['txt', 'pdf', 'docx'],  // Available download formats
      history: true,              // Enable history panel
      customUI: false             // Uses standard ToolShell layout
    },
    
    // File upload configuration
    fileUploadConfig: {
      accept: ['.txt', '.pdf', '.doc', '.docx'],
      maxSize: 10,               // MB
      multiple: true,
      label: 'Upload Context Documents'
    },
    
    // Component reference (will be set when components are created)
    component: null,  // Will be: JDBuilderTool
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
      customUI: true              // Has OutputTypeSelector component
    },
    
    component: null,  // Will be: SearchStrategyTool
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
      contextField: false,        // Uses custom input form
      outputFormats: ['csv'],     // Only CSV export
      history: true,
      customUI: true              // Completely custom multi-step flow
    },
    
    component: null,  // Will be: TalentScoutTool
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
    
    component: null,  // Will be: CandidateResearchTool
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
      customUI: true              // Has FormatUploader component
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
      label: 'Upload Sample Output Format (Optional)'
    },
    
    component: null,  // Will be: CandidateDossierTool
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
    
    component: null,  // Will be: ClientResearchTool
    backendType: 'client-research'
  }
};

/**
 * Get tool configuration by ID
 * @param {string} toolId - Tool identifier
 * @returns {Object|null} Tool configuration or null if not found
 */
export const getToolConfig = (toolId) => {
  return toolRegistry[toolId] || null;
};

/**
 * Get all tools as array
 * @returns {Array<Object>} Array of tool configurations
 */
export const getAllTools = () => {
  return Object.values(toolRegistry);
};

/**
 * Get all tool IDs
 * @returns {Array<string>} Array of tool IDs
 */
export const getToolIds = () => {
  return Object.keys(toolRegistry);
};

/**
 * Check if tool exists
 * @param {string} toolId - Tool identifier
 * @returns {boolean} True if tool exists
 */
export const toolExists = (toolId) => {
  return toolId in toolRegistry;
};
