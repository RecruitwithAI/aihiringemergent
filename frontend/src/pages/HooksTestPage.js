import { useState } from 'react';
import { useAIGeneration, useFileUpload, useDownload, useHistory } from '@/features/ai-tools/hooks';
import { themeClasses } from '@/design-system/tokens';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * HooksTestPage
 * Test component to verify all shared hooks work correctly
 * 
 * Tests:
 * - useAIGeneration: API calls, state management
 * - useFileUpload: File handling, chunked upload
 * - useDownload: All formats (TXT, PDF, DOCX)
 * - useHistory: Fetching, filtering
 */
export default function HooksTestPage() {
  const { theme, isDark } = useTheme();
  const [testStatus, setTestStatus] = useState({});

  // Mock tool config for testing
  const mockToolConfig = {
    id: 'test-tool',
    backendType: 'jd-builder', // Use existing backend tool
    label: 'Test Tool'
  };

  // Initialize hooks
  const generation = useAIGeneration(mockToolConfig);
  const fileUpload = useFileUpload({
    accept: ['.txt', '.pdf', '.docx'],
    maxSize: 10,
    multiple: true
  });
  const download = useDownload();
  const history = useHistory('jd-builder');

  const updateStatus = (test, status, message) => {
    setTestStatus(prev => ({
      ...prev,
      [test]: { status, message, timestamp: new Date().toISOString() }
    }));
  };

  // Test 1: useAIGeneration
  const testAIGeneration = async () => {
    updateStatus('generation', 'running', 'Testing AI generation...');
    
    try {
      generation.setPrompt('Senior Software Engineer, full-stack development, 5+ years experience');
      
      const result = await generation.handleGenerate();
      
      if (result && generation.result) {
        updateStatus('generation', 'success', `Generated ${generation.result.length} characters`);
      } else {
        updateStatus('generation', 'error', 'No result returned');
      }
    } catch (err) {
      updateStatus('generation', 'error', err.message);
    }
  };

  // Test 2: useFileUpload (with manual file input)
  const testFileUpload = async (files) => {
    updateStatus('fileUpload', 'running', 'Testing file upload...');
    
    try {
      await fileUpload.handleFilesDrop(files);
      
      if (fileUpload.uploadedFiles.length > 0) {
        const file = fileUpload.uploadedFiles[0];
        updateStatus('fileUpload', 'success', `Uploaded: ${file.name} (${file.charCount} chars)`);
      } else {
        updateStatus('fileUpload', 'error', 'No files uploaded');
      }
    } catch (err) {
      updateStatus('fileUpload', 'error', err.message);
    }
  };

  // Test 3: useDownload (all formats)
  const testDownload = async (format) => {
    updateStatus(`download-${format}`, 'running', `Testing ${format.toUpperCase()} download...`);
    
    const testContent = generation.result || 'Test content for download\n\nThis is a test document.';
    
    try {
      const success = await download.handleDownload(testContent, format, 'test-document');
      
      if (success) {
        updateStatus(`download-${format}`, 'success', `${format.toUpperCase()} download triggered`);
      } else {
        updateStatus(`download-${format}`, 'error', 'Download failed');
      }
    } catch (err) {
      updateStatus(`download-${format}`, 'error', err.message);
    }
  };

  // Test 4: useHistory
  const testHistory = async () => {
    updateStatus('history', 'running', 'Testing history fetch...');
    
    try {
      await history.fetchHistory();
      
      updateStatus('history', 'success', `Loaded ${history.history.length} history items`);
    } catch (err) {
      updateStatus('history', 'error', err.message);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return '✅';
    if (status === 'error') return '❌';
    if (status === 'running') return '⏳';
    return '⚪';
  };

  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.container}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className={`${themeClasses.card} p-6`}>
            <h1 className={`text-3xl font-bold mb-2 ${themeClasses.heading}`}>
              🧪 Hooks Test Suite
            </h1>
            <p className={themeClasses.subtext}>
              Testing all shared hooks: useAIGeneration, useFileUpload, useDownload, useHistory
            </p>
            <p className={`text-sm mt-2 ${themeClasses.subtext}`}>
              Current Theme: <span className={`font-semibold ${themeClasses.textAccent}`}>{theme}</span> {isDark ? '🌙' : '☀️'}
            </p>
          </div>

          {/* Test 1: useAIGeneration */}
          <div className={`${themeClasses.card} p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>
              1. useAIGeneration Hook
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Test Prompt:</label>
                <input
                  type="text"
                  value={generation.prompt}
                  onChange={(e) => generation.setPrompt(e.target.value)}
                  placeholder="Enter a job description prompt..."
                  className={`w-full ${themeClasses.input}`}
                  disabled={generation.generating}
                />
              </div>
              
              <button
                onClick={testAIGeneration}
                disabled={generation.generating || !generation.prompt}
                className={`${themeClasses.buttonPrimary} ${generation.generating ? themeClasses.disabled : ''}`}
              >
                {generation.generating ? '⏳ Generating...' : '🚀 Test Generation'}
              </button>

              {testStatus.generation && (
                <div className={`p-3 rounded-lg ${themeClasses.surface}`}>
                  <p className="text-sm">
                    {getStatusIcon(testStatus.generation.status)} <strong>Status:</strong> {testStatus.generation.message}
                  </p>
                </div>
              )}

              {generation.result && (
                <div className={`p-4 rounded-lg ${themeClasses.surface} max-h-40 overflow-y-auto`}>
                  <p className="text-sm font-mono">{generation.result.substring(0, 200)}...</p>
                </div>
              )}
            </div>
          </div>

          {/* Test 2: useFileUpload */}
          <div className={`${themeClasses.card} p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>
              2. useFileUpload Hook
            </h2>
            
            <div className="space-y-3">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => testFileUpload(e.target.files)}
                className={themeClasses.input}
                disabled={fileUpload.uploading}
              />

              {fileUpload.uploading && (
                <div className="space-y-2">
                  <p className="text-sm">⏳ Uploading... {fileUpload.uploadProgress}%</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${fileUpload.uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {testStatus.fileUpload && (
                <div className={`p-3 rounded-lg ${themeClasses.surface}`}>
                  <p className="text-sm">
                    {getStatusIcon(testStatus.fileUpload.status)} <strong>Status:</strong> {testStatus.fileUpload.message}
                  </p>
                </div>
              )}

              {fileUpload.uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
                  {fileUpload.uploadedFiles.map((file, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${themeClasses.surface}`}>
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.charCount} characters extracted</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test 3: useDownload */}
          <div className={`${themeClasses.card} p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>
              3. useDownload Hook
            </h2>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Test downloading in different formats:</p>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => testDownload('txt')}
                  disabled={download.downloading}
                  className={`${themeClasses.button} ${download.downloading ? themeClasses.disabled : ''}`}
                >
                  📄 Test TXT
                </button>
                <button
                  onClick={() => testDownload('pdf')}
                  disabled={download.downloading}
                  className={`${themeClasses.button} ${download.downloading ? themeClasses.disabled : ''}`}
                >
                  📕 Test PDF
                </button>
                <button
                  onClick={() => testDownload('docx')}
                  disabled={download.downloading}
                  className={`${themeClasses.button} ${download.downloading ? themeClasses.disabled : ''}`}
                >
                  📘 Test DOCX
                </button>
              </div>

              {['txt', 'pdf', 'docx'].map(format => 
                testStatus[`download-${format}`] && (
                  <div key={format} className={`p-3 rounded-lg ${themeClasses.surface}`}>
                    <p className="text-sm">
                      {getStatusIcon(testStatus[`download-${format}`].status)} <strong>{format.toUpperCase()}:</strong> {testStatus[`download-${format}`].message}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Test 4: useHistory */}
          <div className={`${themeClasses.card} p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>
              4. useHistory Hook
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={testHistory}
                disabled={history.loading}
                className={`${themeClasses.buttonPrimary} ${history.loading ? themeClasses.disabled : ''}`}
              >
                {history.loading ? '⏳ Loading...' : '📜 Test History Fetch'}
              </button>

              {testStatus.history && (
                <div className={`p-3 rounded-lg ${themeClasses.surface}`}>
                  <p className="text-sm">
                    {getStatusIcon(testStatus.history.status)} <strong>Status:</strong> {testStatus.history.message}
                  </p>
                </div>
              )}

              {history.history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent History:</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {history.history.slice(0, 3).map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${themeClasses.surface}`}>
                        <p className="text-sm font-semibold truncate">{item.prompt}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overall Status */}
          <div className={`${themeClasses.card} p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>
              📊 Test Summary
            </h2>
            
            <div className="space-y-2">
              {Object.keys(testStatus).length === 0 ? (
                <p className={themeClasses.subtext}>No tests run yet. Click the test buttons above.</p>
              ) : (
                Object.entries(testStatus).map(([test, data]) => (
                  <div key={test} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{test}:</span>
                    <span className="text-sm">
                      {getStatusIcon(data.status)} {data.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
