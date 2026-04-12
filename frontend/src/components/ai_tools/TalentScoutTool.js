import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, UserSearch, ThumbsUp, ThumbsDown, Download, Plus, AlertCircle } from "lucide-react";

export default function TalentScoutTool({ onGenerate, loading, onPromptChange }) {
  const [step, setStep] = useState("input"); // "input" | "initial_results" | "feedback" | "final_results"
  const [formData, setFormData] = useState({
    targetRole: "",
    company: "",
    geography: "",
    compensation: "",
    requiredQualifications: "",
    successFactors: "",
    idealBackground: "",
    exclusions: "",
  });
  const [candidates, setCandidates] = useState([]);
  const [feedbackText, setFeedbackText] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildPrompt = (includeFeedback = false) => {
    let prompt = `TARGET ROLE: ${formData.targetRole}
COMPANY: ${formData.company}
GEOGRAPHY: ${formData.geography}
COMPENSATION: ${formData.compensation}

REQUIRED QUALIFICATIONS / MUST HAVES:
${formData.requiredQualifications}

SUCCESS FACTORS:
${formData.successFactors}

IDEAL BACKGROUND:
${formData.idealBackground}

EXCLUSIONS:
${formData.exclusions}`;

    if (includeFeedback && feedbackText) {
      prompt += `\n\nUSER FEEDBACK ON PREVIOUS RESULTS:
${feedbackText}

Please adjust the candidate search based on this feedback while maintaining the JSON output format.`;
    }

    return prompt;
  };

  const handleInitialSearch = async () => {
    const prompt = buildPrompt(false);
    
    // Update parent's prompt state
    onPromptChange(prompt);
    
    // Call parent's generate function (it will use the prompt from state)
    const result = await onGenerate();
    
    if (result && result.response) {
      try {
        const parsedCandidates = JSON.parse(result.response);
        setCandidates(parsedCandidates);
        setStep("initial_results");
      } catch (e) {
        console.error("Failed to parse candidates:", e);
        alert("Failed to parse candidate data. Please try again.");
      }
    }
  };

  const handleFeedbackNo = () => {
    setStep("feedback");
  };

  const handleFeedbackYes = async () => {
    // Continue with same search path - add 5 more candidates
    const prompt = buildPrompt(false) + `\n\nGenerate 5 MORE candidates following the same successful pattern as before.`;
    
    // Update parent's prompt state
    onPromptChange(prompt);
    
    // Call parent's generate function
    const result = await onGenerate();
    
    if (result && result.response) {
      try {
        const newCandidates = JSON.parse(result.response);
        setCandidates([...candidates, ...newCandidates]);
        setStep("final_results");
      } catch (e) {
        console.error("Failed to parse candidates:", e);
      }
    }
  };

  const handleRefinedSearch = async () => {
    if (!feedbackText.trim()) {
      alert("Please provide feedback before refining the search.");
      return;
    }

    const prompt = buildPrompt(true);
    
    // Update parent's prompt state
    onPromptChange(prompt);
    
    // Call parent's generate function
    const result = await onGenerate();
    
    if (result && result.response) {
      try {
        const newCandidates = JSON.parse(result.response);
        setCandidates(newCandidates);
        setStep("initial_results");
        setFeedbackText("");
      } catch (e) {
        console.error("Failed to parse candidates:", e);
      }
    }
  };

  const handleDownload = (format) => {
    // Convert candidates to appropriate format for download
    let content;
    const filename = `talent_scout_${formData.targetRole.replace(/\s+/g, "_")}`;

    if (format === "csv" || format === "txt") {
      // For CSV and TXT, send JSON string
      content = JSON.stringify(candidates, null, 2);
    } else {
      // For PDF and DOCX, create a formatted document
      content = `# Talent Scout Results\n\n`;
      content += `**Target Role:** ${formData.targetRole}\n`;
      content += `**Company:** ${formData.company}\n`;
      content += `**Geography:** ${formData.geography}\n\n`;
      content += `## Candidates (${candidates.length})\n\n`;

      candidates.forEach((candidate, idx) => {
        content += `### ${idx + 1}. ${candidate.name}\n\n`;
        content += `**Current Title:** ${candidate.current_title}\n`;
        content += `**Current Employer:** ${candidate.current_employer}\n`;
        content += `**Location:** ${candidate.location}\n\n`;
        content += `**Scope:** ${candidate.scope}\n\n`;
        content += `**Achievements:** ${candidate.achievements}\n\n`;
        content += `**Previous Employers:** ${candidate.previous_employers.join(", ")}\n`;
        content += `**Education:** ${candidate.education}\n`;
        content += `**Years in Role:** ${candidate.years_in_role}\n`;
        content += `**Total Experience:** ${candidate.total_experience}\n`;
        content += `**Data Confidence:** ${candidate.data_confidence}\n`;
        if (candidate.verification_notes) {
          content += `**Verification Notes:** ${candidate.verification_notes}\n`;
        }
        content += `\n---\n\n`;
      });
    }

    // Create download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStep("input");
    setCandidates([]);
    setFeedbackText("");
    setFormData({
      targetRole: "",
      company: "",
      geography: "",
      compensation: "",
      requiredQualifications: "",
      successFactors: "",
      idealBackground: "",
      exclusions: "",
    });
  };

  // Render based on current step
  if (step === "input") {
    return (
      <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <UserSearch className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Talent Scout</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Target Role *</Label>
              <Input
                name="targetRole"
                value={formData.targetRole}
                onChange={handleInputChange}
                placeholder="e.g., VP of Engineering"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Company</Label>
              <Input
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="e.g., Tech Startup, Fortune 500"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-slate-300">Geography</Label>
              <Input
                name="geography"
                value={formData.geography}
                onChange={handleInputChange}
                placeholder="e.g., San Francisco Bay Area, Remote US"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-slate-300">Compensation</Label>
              <Input
                name="compensation"
                value={formData.compensation}
                onChange={handleInputChange}
                placeholder="e.g., $250K-$350K + equity"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Required Qualifications / Must Haves *</Label>
            <Textarea
              name="requiredQualifications"
              value={formData.requiredQualifications}
              onChange={handleInputChange}
              placeholder="List the essential qualifications and requirements..."
              className="mt-1.5 min-h-[80px]"
              required
            />
          </div>

          <div>
            <Label className="text-slate-300">Success Factors</Label>
            <Textarea
              name="successFactors"
              value={formData.successFactors}
              onChange={handleInputChange}
              placeholder="What makes someone successful in this role?"
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-slate-300">Ideal Background</Label>
            <Textarea
              name="idealBackground"
              value={formData.idealBackground}
              onChange={handleInputChange}
              placeholder="Describe the ideal career trajectory and background..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-slate-300">Exclusions</Label>
            <Textarea
              name="exclusions"
              value={formData.exclusions}
              onChange={handleInputChange}
              placeholder="Companies, industries, or backgrounds to exclude..."
              className="mt-1.5 min-h-[60px]"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleInitialSearch}
              disabled={loading || !formData.targetRole || !formData.requiredQualifications}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Researching Candidates...
                </>
              ) : (
                <>
                  <UserSearch className="w-4 h-4 mr-2" />
                  Start Candidate Search
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (step === "initial_results" || step === "final_results") {
    return (
      <div className="space-y-4">
        {/* Header with candidate count and actions */}
        <Card className="p-4 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {step === "initial_results" ? "Initial Candidate Research" : "Final Results"}
              </h3>
              <p className="text-sm text-slate-400">
                Found {candidates.length} high-potential candidates
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload("csv")}>
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload("pdf")}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload("docx")}>
                <Download className="w-4 h-4 mr-1" />
                DOCX
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload("txt")}>
                <Download className="w-4 h-4 mr-1" />
                TXT
              </Button>
            </div>
          </div>
        </Card>

        {/* Candidates Table */}
        <Card className="overflow-hidden bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-300">#</TableHead>
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Current Role</TableHead>
                  <TableHead className="text-slate-300">Company</TableHead>
                  <TableHead className="text-slate-300">Location</TableHead>
                  <TableHead className="text-slate-300">Experience</TableHead>
                  <TableHead className="text-slate-300">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate, idx) => (
                  <TableRow key={idx} className="border-white/5">
                    <TableCell className="text-slate-400">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="text-white font-medium">{candidate.name}</div>
                      <div className="text-xs text-slate-400">{candidate.education}</div>
                    </TableCell>
                    <TableCell className="text-slate-300">{candidate.current_title}</TableCell>
                    <TableCell className="text-slate-300">{candidate.current_employer}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{candidate.location}</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {candidate.total_experience}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          candidate.data_confidence === "high"
                            ? "default"
                            : candidate.data_confidence === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {candidate.data_confidence}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Detailed View */}
        <div className="space-y-3">
          {candidates.map((candidate, idx) => (
            <Card key={idx} className="p-5 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-white">{candidate.name}</h4>
                  <p className="text-blue-400">{candidate.current_title} at {candidate.current_employer}</p>
                  <p className="text-sm text-slate-400">{candidate.location}</p>
                </div>
                <Badge
                  variant={
                    candidate.data_confidence === "high"
                      ? "default"
                      : candidate.data_confidence === "medium"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {candidate.data_confidence} confidence
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Scope:</p>
                  <p className="text-slate-300">{candidate.scope}</p>
                </div>

                <div>
                  <p className="text-slate-400 mb-1">Achievements:</p>
                  <p className="text-slate-300">{candidate.achievements}</p>
                </div>

                <div>
                  <p className="text-slate-400 mb-1">Previous Employers:</p>
                  <p className="text-slate-300">{candidate.previous_employers.join(", ")}</p>
                </div>

                <div>
                  <p className="text-slate-400 mb-1">Education:</p>
                  <p className="text-slate-300">{candidate.education}</p>
                </div>

                <div>
                  <p className="text-slate-400 mb-1">Experience:</p>
                  <p className="text-slate-300">
                    {candidate.years_in_role} in current role | {candidate.total_experience} total
                  </p>
                </div>

                {candidate.verification_notes && (
                  <div>
                    <p className="text-slate-400 mb-1">Verification Notes:</p>
                    <p className="text-amber-400 text-xs flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {candidate.verification_notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Feedback Buttons (only show for initial results) */}
        {step === "initial_results" && (
          <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">
              Are these candidates in line with your expectations?
            </h4>
            <div className="flex gap-4">
              <Button
                onClick={handleFeedbackYes}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4 mr-2" />
                )}
                Yes, Continue (Add 5 More)
              </Button>
              <Button
                onClick={handleFeedbackNo}
                variant="outline"
                className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                No, Refine Search
              </Button>
            </div>
          </Card>
        )}

        {/* Final Results Actions */}
        {step === "final_results" && (
          <Card className="p-4 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
            <div className="flex justify-between items-center">
              <p className="text-slate-300">Research complete! You can download the results or start a new search.</p>
              <div className="flex gap-2">
                <Button onClick={handleFeedbackYes} disabled={loading} variant="outline">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add 5 More
                </Button>
                <Button onClick={handleReset} variant="outline">
                  New Search
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (step === "feedback") {
    return (
      <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Provide Feedback to Refine Search</h3>
        <p className="text-slate-400 mb-4">
          What would you like to adjust? (e.g., seniority level, industry focus, geography, specific skills)
        </p>

        <Textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Example: 'Focus more on candidates with SaaS experience' or 'Look for candidates from larger companies (500+ employees)'"
          className="min-h-[120px] mb-4"
        />

        <div className="flex gap-3 justify-end">
          <Button
            onClick={() => setStep("initial_results")}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRefinedSearch}
            disabled={loading || !feedbackText.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refining Search...
              </>
            ) : (
              <>
                <UserSearch className="w-4 h-4 mr-2" />
                Refine Search
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
