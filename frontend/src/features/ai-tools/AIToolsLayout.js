import { useState } from 'react';
import { getToolConfig, getAllTools } from './registry/toolRegistry';
import { themeClasses } from '@/design-system/tokens';

/**
 * AIToolsLayout Component
 * Main router for AI Tools section
 * 
 * Responsibilities:
 * - Manage tool selection state
 * - Render ToolSelector when no tool selected
 * - Render selected tool component when tool selected
 * - Handle navigation back to tool selector
 * 
 * This component replaces the monolithic AITools.js (585 lines)
 * 
 * @example
 * // In App.js
 * <Route path="/ai-tools" element={<ProtectedRoute><AIToolsLayout /></ProtectedRoute>} />
 */
export default function AIToolsLayout() {
  const [selectedToolId, setSelectedToolId] = useState(null);
  
  const handleSelectTool = (toolId) => {
    console.log('[AIToolsLayout] Tool selected:', toolId);
    setSelectedToolId(toolId);
  };
  
  const handleBack = () => {
    console.log('[AIToolsLayout] Returning to tool selector');
    setSelectedToolId(null);
  };
  
  // Show tool selector if no tool selected
  if (!selectedToolId) {
    return <ToolSelector tools={getAllTools()} onSelectTool={handleSelectTool} />;
  }
  
  // Get tool configuration
  const toolConfig = getToolConfig(selectedToolId);
  
  if (!toolConfig) {
    return (
      <div className={themeClasses.page}>
        <div className={themeClasses.container}>
          <div className={`${themeClasses.card} p-8 text-center`}>
            <p className={themeClasses.heading}>Tool not found</p>
            <p className={`${themeClasses.subtext} mt-2`}>
              The tool "{selectedToolId}" does not exist.
            </p>
            <button 
              onClick={handleBack}
              className={`mt-4 ${themeClasses.buttonPrimary}`}
            >
              Back to Tools
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render tool component
  // Note: Tool components will be created in Phase 5-6
  // For now, show placeholder
  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.container}>
        <div className="space-y-6">
          {/* Back Button */}
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm">← Back to Tools</span>
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
          
          {/* Placeholder - Tool components will be added in Phase 5-6 */}
          <div className={`${themeClasses.card} p-8 text-center`}>
            <p className={themeClasses.heading}>🚧 Tool Component Coming Soon</p>
            <p className={`${themeClasses.subtext} mt-2`}>
              This tool will be migrated in Phase 5 (Simple Tools) or Phase 6 (Complex Tools)
            </p>
            <p className={`text-xs ${themeClasses.subtext} mt-4`}>
              Tool ID: {toolConfig.id}<br />
              Backend Type: {toolConfig.backendType}<br />
              Features: {Object.entries(toolConfig.features)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => feature)
                .join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ToolSelector Component
 * Grid of tool cards for selection
 * 
 * @param {Object} props
 * @param {Array<Object>} props.tools - Array of tool configurations
 * @param {Function} props.onSelectTool - Tool selection handler
 */
function ToolSelector({ tools, onSelectTool }) {
  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.container}>
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className={`text-3xl sm:text-4xl font-bold ${themeClasses.heading} mb-3`}>
              AI-Powered Tools
            </h1>
            <p className={`text-base sm:text-lg ${themeClasses.subtext}`}>
              Select a tool to get started with AI-powered recruiting
            </p>
          </div>
          
          {/* Tool Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`${themeClasses.card} p-6 text-left transition-all hover:scale-[1.02] ${themeClasses.cardHover}`}
              >
                {/* Tool Icon */}
                <div 
                  className={`w-12 h-12 rounded-xl ${tool.bg} border ${tool.border} flex items-center justify-center mb-4`}
                >
                  <tool.icon className={`w-6 h-6 ${tool.color}`} strokeWidth={1.5} />
                </div>
                
                {/* Tool Info */}
                <h3 className={`text-lg font-semibold ${themeClasses.heading} mb-2`}>
                  {tool.label}
                </h3>
                <p className={`text-sm ${themeClasses.subtext}`}>
                  {tool.description}
                </p>
                
                {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {tool.features.fileUpload && (
                    <span className={`text-xs px-2 py-1 rounded-full ${themeClasses.badgeMuted}`}>
                      📎 File Upload
                    </span>
                  )}
                  {tool.features.outputFormats.includes('csv') && (
                    <span className={`text-xs px-2 py-1 rounded-full ${themeClasses.badgeMuted}`}>
                      📊 CSV Export
                    </span>
                  )}
                  {tool.features.customUI && (
                    <span className={`text-xs px-2 py-1 rounded-full ${themeClasses.badgePrimary}`}>
                      ✨ Interactive
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Footer Note */}
          <div className={`${themeClasses.card} p-4 text-center`}>
            <p className={`text-sm ${themeClasses.subtext}`}>
              💡 <strong>Tip:</strong> Use file uploads to provide additional context for better AI results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
