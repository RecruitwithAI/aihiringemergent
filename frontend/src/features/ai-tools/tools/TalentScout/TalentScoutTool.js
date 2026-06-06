import { useState } from 'react';
import { ToolShell } from '../../components';
import { themeClasses } from '@/design-system/tokens';
import { Loader2, Download, AlertCircle } from 'lucide-react';

/**
 * Talent Scout Tool
 * Custom multi-step interactive tool for candidate research
 * 
 * Flow:
 * 1. Input criteria form
 * 2. Generate initial candidates
 * 3. Provide feedback
 * 4. Refine and regenerate
 * 5. Export to CSV
 * 
 * @param {Object} props
 * @param {Object} props.toolConfig - Tool configuration from registry
 * @param {Function} props.onBack - Back button handler
 */
export default function TalentScoutTool({ toolConfig, onBack }) {
  const [step, setStep] = useState('input'); // 'input' | 'results' | 'feedback'
  const [formData, setFormData] = useState({
    targetRole: '',
    company: '',
    geography: '',
    compensation: '',
    requirements: '',
  });
  const [candidates, setCandidates] = useState([]);
  const [feedback, setFeedback] = useState('');
  
  return (
    <ToolShell toolConfig={toolConfig} onBack={onBack}>
      {({ generation, download, handleGenerate }) => {
        
        const buildPrompt = (includeFeedback = false) => {
          let prompt = `Research and identify 5 high-potential candidates for:

TARGET ROLE: ${formData.targetRole}
COMPANY: ${formData.company}
GEOGRAPHY: ${formData.geography}
COMPENSATION: ${formData.compensation}
REQUIREMENTS: ${formData.requirements}`;

          if (includeFeedback) {
            prompt += `\n\nPREVIOUS FEEDBACK: ${feedback}\n\nPlease adjust the search based on this feedback.`;
          }

          return prompt;
        };
        
        const handleInitialSearch = async () => {
          const prompt = buildPrompt(false);
          const result = await handleGenerate(prompt);
          if (result) {
            parseCandidates(result.response);
            setStep('results');
          }
        };
        
        const handleRefineSearch = async () => {
          const prompt = buildPrompt(true);
          const result = await handleGenerate(prompt);
          if (result) {
            parseCandidates(result.response);
            setFeedback('');
          }
        };
        
        const parseCandidates = (text) => {
          // Simple parsing - extract candidate info
          // In production, use structured JSON output
          const lines = text.split('\n').filter(l => l.trim());
          const parsed = [];
          let current = {};
          
          lines.forEach(line => {
            if (line.match(/^\d+\./)) {
              if (current.name) parsed.push(current);
              current = { name: line.replace(/^\d+\.\s*/, '') };
            } else if (line.toLowerCase().includes('title:')) {
              current.title = line.split(':')[1]?.trim();
            } else if (line.toLowerCase().includes('company:')) {
              current.company = line.split(':')[1]?.trim();
            } else if (line.toLowerCase().includes('location:')) {
              current.location = line.split(':')[1]?.trim();
            }
          });
          if (current.name) parsed.push(current);
          
          setCandidates(parsed);
        };
        
        const exportToCSV = () => {
          const headers = ['Name', 'Title', 'Company', 'Location'];
          const rows = candidates.map(c => [
            c.name || '',
            c.title || '',
            c.company || '',
            c.location || ''
          ]);
          
          const csv = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
          ].join('\n');
          
          download.handleDownload(csv, 'csv', 'talent-scout-candidates');
        };
        
        return (
          <div className="space-y-6">
            {/* Input Form */}
            {step === 'input' && (
              <div className={`${themeClasses.card} p-6 space-y-4`}>
                <h3 className={`text-lg font-semibold ${themeClasses.heading}`}>
                  Search Criteria
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                      className={themeClasses.input}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Company / Industry
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Tech startups, FAANG"
                      className={themeClasses.input}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Geography
                    </label>
                    <input
                      type="text"
                      value={formData.geography}
                      onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                      placeholder="e.g., San Francisco Bay Area"
                      className={themeClasses.input}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Compensation Range
                    </label>
                    <input
                      type="text"
                      value={formData.compensation}
                      onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                      placeholder="e.g., $150k-$200k"
                      className={themeClasses.input}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Key Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="List key skills, experience, qualifications..."
                    className={`${themeClasses.textarea} min-h-[100px]`}
                  />
                </div>
                
                <button
                  onClick={handleInitialSearch}
                  disabled={generation.generating || !formData.targetRole}
                  className={`w-full ${themeClasses.buttonPrimary} ${
                    generation.generating || !formData.targetRole ? themeClasses.disabled : ''
                  }`}
                >
                  {generation.generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search for Candidates'
                  )}
                </button>
              </div>
            )}
            
            {/* Results & Feedback */}
            {(step === 'results' || step === 'feedback') && (
              <>
                {/* Candidates List */}
                <div className={`${themeClasses.card} p-6 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${themeClasses.heading}`}>
                      Candidate Results ({candidates.length})
                    </h3>
                    <button
                      onClick={exportToCSV}
                      disabled={candidates.length === 0 || download.downloading}
                      className={`${themeClasses.button} text-sm`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                  </div>
                  
                  {candidates.length > 0 ? (
                    <div className="space-y-3">
                      {candidates.map((candidate, idx) => (
                        <div key={idx} className={`${themeClasses.surface} p-4 rounded-lg`}>
                          <h4 className="font-semibold text-foreground">{candidate.name}</h4>
                          {candidate.title && (
                            <p className="text-sm text-muted-foreground">{candidate.title}</p>
                          )}
                          {candidate.company && (
                            <p className="text-sm text-muted-foreground">{candidate.company}</p>
                          )}
                          {candidate.location && (
                            <p className="text-xs text-muted-foreground mt-1">{candidate.location}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className={themeClasses.subtext}>No candidates found. Try adjusting your criteria.</p>
                    </div>
                  )}
                </div>
                
                {/* Feedback Section */}
                <div className={`${themeClasses.card} p-6 space-y-4`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.heading}`}>
                    Refine Search
                  </h3>
                  <p className={`text-sm ${themeClasses.subtext}`}>
                    Provide feedback to adjust the candidate search
                  </p>
                  
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g., 'Focus more on candidates from Series B startups' or 'Need more experience with React'"
                    className={`${themeClasses.textarea} min-h-[80px]`}
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleRefineSearch}
                      disabled={generation.generating || !feedback}
                      className={`flex-1 ${themeClasses.buttonPrimary} ${
                        generation.generating || !feedback ? themeClasses.disabled : ''
                      }`}
                    >
                      {generation.generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        'Refine Search'
                      )}
                    </button>
                    <button
                      onClick={() => setStep('input')}
                      className={themeClasses.button}
                    >
                      New Search
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {/* Raw Output (for debugging) */}
            {generation.result && (
              <details className={`${themeClasses.card} p-6`}>
                <summary className="cursor-pointer text-sm font-medium text-foreground">
                  View Raw Output
                </summary>
                <pre className="mt-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {generation.result}
                </pre>
              </details>
            )}
          </div>
        );
      }}
    </ToolShell>
  );
}
