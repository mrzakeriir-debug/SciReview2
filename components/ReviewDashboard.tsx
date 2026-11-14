import React, { useState } from 'react';
import { AnalysisResults, StepFeedback } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Flag, 
  Target, 
  Zap, 
  Sparkles, 
  Download, 
  FileDown,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Copy,
  Check
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import * as FileSaver from 'file-saver';

const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;

interface ReviewDashboardProps {
  results: AnalysisResults;
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'passed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'failed': return <AlertCircle className="w-5 h-5 text-rose-500" />;
    case 'warning': return <Flag className="w-5 h-5 text-amber-500" />;
    default: return <HelpCircle className="w-5 h-5 text-slate-400" />;
  }
};

const StepCard: React.FC<{ feedback: StepFeedback }> = ({ feedback }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-xl transition-all duration-200 ${isOpen ? 'bg-white shadow-md' : 'bg-white hover:bg-slate-50/50'} mb-3 overflow-hidden border-slate-200`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <StatusIcon status={feedback.status} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {feedback.stepId}</span>
            <h4 className="text-sm font-semibold text-slate-900">{feedback.stepTitle}</h4>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="px-12 pb-5 border-t border-slate-100 mt-1 pt-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Analysis</p>
              <p className="text-sm text-slate-700 leading-relaxed">{feedback.feedback}</p>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
              <p className="text-xs font-bold text-indigo-500 uppercase mb-1 tracking-widest">Recommendation</p>
              <p className="text-sm text-indigo-900 leading-relaxed">{feedback.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'make_draft' | 'revise' | 'polish'>('summary');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<'authors' | 'editor' | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getRecommendationBadgeColor = (rec?: string) => {
    switch (rec) {
      case 'Accept as is': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Minor Revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Major Revision': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Reject and Resubmit': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Reject': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const copyToClipboard = (text: string, type: 'authors' | 'editor') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(type);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadWordReport = async () => {
    setIsDownloading(true);
    try {
      const docElements: any[] = [];

      // Main Title
      docElements.push(
        new Paragraph({
          text: "Manuscript Peer Review & Evaluation Report",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Based on Hengl & Gould's 40 Rules of Thumb for Scientific Articles", italics: true, color: "64748B" }),
          ],
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Overall Readiness Score: ", bold: true, size: 28 }),
            new TextRun({ text: `${results.overallScore} / 100`, bold: true, size: 32, color: "4F46E5" }),
          ],
          spacing: { after: 200 },
        })
      );

      // Section: Review Summary (Comments for Authors & Editor)
      if (results.summary) {
        docElements.push(
          new Paragraph({
            text: "EXECUTIVE REVIEW SUMMARY",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Editorial Recommendation: ", bold: true, size: 24 }),
              new TextRun({ 
                text: results.summary.editorialRecommendation || "Revision Needed", 
                bold: true, 
                size: 24, 
                color: "4F46E5" 
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: "Part 1: Comments for Editor (Confidential)",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 150 },
          }),
          ...results.summary.commentsForEditor.split('\n\n').map(paragraph => new Paragraph({
            children: [new TextRun({ text: paragraph, size: 22 })],
            spacing: { after: 200 },
          })),
          new Paragraph({
            text: "Part 2: Review and Comments for Authors",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 150 },
          }),
          ...results.summary.commentsForAuthors.split('\n\n').map(paragraph => new Paragraph({
            children: [new TextRun({ text: paragraph, size: 22 })],
            spacing: { after: 200 },
          })),
          new Paragraph({ 
            text: "", 
            border: { bottom: { color: "CBD5E1", space: 1, value: BorderStyle.SINGLE, size: 2 } },
            spacing: { after: 400 } 
          })
        );
      }

      // Priority Fixes
      docElements.push(
        new Paragraph({
          text: "Priority Recommendations",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        }),
        ...results.generalRecommendations.map(rec => new Paragraph({
          text: rec,
          bullet: { level: 0 },
          spacing: { after: 100 },
        })),
        new Paragraph({
          text: "",
          border: { bottom: { color: "CBD5E1", space: 1, value: BorderStyle.SINGLE, size: 2 } },
          spacing: { after: 400 }
        })
      );

      // Detailed 40 Steps Analysis
      const categoryMap = {
        "make_draft": "Phase 1: Make Draft (Steps 1-22)",
        "revise": "Phase 2: Revise (Steps 23-32)",
        "polish": "Phase 3: Polish (Steps 33-40)"
      };

      for (const [key, title] of Object.entries(categoryMap)) {
        const feedbackList = results.sections[key as keyof typeof results.sections];
        
        docElements.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          })
        );

        feedbackList.forEach(step => {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Step ${step.stepId}: ${step.stepTitle}`, bold: true, size: 24 }),
                new TextRun({ 
                  text: ` [Status: ${step.status.toUpperCase()}]`, 
                  italic: true, 
                  color: step.status === 'passed' ? '10B981' : (step.status === 'failed' ? 'EF4444' : 'F59E0B') 
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Analysis: ", bold: true }), new TextRun(step.feedback)],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Recommendation: ", bold: true, color: "4F46E5" }), new TextRun(step.recommendation)],
              spacing: { after: 200 },
            }),
            new Paragraph({ text: "", border: { bottom: { color: "E2E8F0", space: 1, value: BorderStyle.SINGLE, size: 1 } } })
          );
        });
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docElements,
          }
        ],
      });

      const blob = await Packer.toBlob(doc);
      if (typeof saveAs === 'function') {
        saveAs(blob, "Manuscript_Review_and_Editorial_Report.docx");
      } else {
        throw new Error("File-saver library not loaded correctly.");
      }
    } catch (err) {
      console.error("Error generating Word doc:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Sidebar - Summary & Quick Actions */}
      <div className="lg:col-span-4 space-y-6">
        <div className={`p-8 rounded-2xl border flex flex-col items-center text-center shadow-sm ${getScoreColor(results.overallScore)}`}>
          <div className="text-6xl font-black mb-2 tracking-tighter">{results.overallScore}</div>
          <div className="text-sm font-bold uppercase tracking-widest opacity-80">Overall Readiness Score</div>
          {results.summary?.editorialRecommendation && (
            <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold border ${getRecommendationBadgeColor(results.summary.editorialRecommendation)}`}>
              Verdict: {results.summary.editorialRecommendation}
            </div>
          )}
        </div>

        <button 
          onClick={downloadWordReport}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:bg-slate-300 cursor-pointer"
        >
          {isDownloading ? (
            <Sparkles className="w-5 h-5 animate-spin" />
          ) : (
            <FileDown className="w-5 h-5" />
          )}
          {isDownloading ? "Generating Full Report..." : "Download Review & Report (.docx)"}
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Priority Fixes
          </h3>
          <ul className="space-y-3">
            {results.generalRecommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Rule Compliance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Draft Structure</span>
              <span className="text-lg font-bold">
                {results.sections.make_draft.filter(s => s.status === 'passed').length}/22
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-emerald-400 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${(results.sections.make_draft.filter(s => s.status === 'passed').length / 22) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Coherence</span>
              <span className="text-lg font-bold">
                {results.sections.revise.filter(s => s.status === 'passed').length}/10
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${(results.sections.revise.filter(s => s.status === 'passed').length / 10) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Style Polish</span>
              <span className="text-lg font-bold">
                {results.sections.polish.filter(s => s.status === 'passed').length}/8
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-purple-400 h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${(results.sections.polish.filter(s => s.status === 'passed').length / 8) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Tabs */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 px-5 py-4 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                activeTab === 'summary' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/20' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Editorial Summary
            </button>
            {(['make_draft', 'revise', 'polish'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-5 py-4 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/20' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Editorial Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 serif">Executive Review Report</h2>
                    {results.summary?.editorialRecommendation && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRecommendationBadgeColor(results.summary.editorialRecommendation)}`}>
                        {results.summary.editorialRecommendation}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm">
                    Structured summary reports separated for author revisions and editorial evaluation. Included in the Word document export.
                  </p>
                </div>

                {/* Part 1: Review and Comments for Authors */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Review and Comments for Authors</h3>
                        <p className="text-xs text-slate-500">Feedback, critical observations, and required revisions</p>
                      </div>
                    </div>
                    {results.summary?.commentsForAuthors && (
                      <button 
                        onClick={() => copyToClipboard(results.summary!.commentsForAuthors, 'authors')}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedSection === 'authors' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-6 text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/20">
                    {results.summary?.commentsForAuthors || (
                      <p className="italic text-slate-400">Review comments are generated based on the evaluated manuscript text.</p>
                    )}
                  </div>
                </div>

                {/* Part 2: Comments for Editor */}
                <div className="bg-white rounded-xl border border-amber-200/80 shadow-sm overflow-hidden">
                  <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Comments for Editor (Confidential)</h3>
                        <p className="text-xs text-amber-800">Editorial suitability, novelty assessment, and recommendation</p>
                      </div>
                    </div>
                    {results.summary?.commentsForEditor && (
                      <button 
                        onClick={() => copyToClipboard(results.summary!.commentsForEditor, 'editor')}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedSection === 'editor' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-6 text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-amber-50/10">
                    {results.summary?.commentsForEditor || (
                      <p className="italic text-slate-400">Editorial comments are generated based on the evaluated manuscript text.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Individual Steps Tabs */}
            {activeTab !== 'summary' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 serif">
                    {activeTab === 'make_draft' && "Structural Check: Steps 1-22"}
                    {activeTab === 'revise' && "Coherence Review: Steps 23-32"}
                    {activeTab === 'polish' && "Stylistic Polish: Steps 33-40"}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {activeTab === 'make_draft' && "Ensuring all macro and meso elements are correctly sequenced."}
                    {activeTab === 'revise' && "Checking logic flow, objective-conclusion alignment, and clarity."}
                    {activeTab === 'polish' && "Refining technical details, tenses, and visual integration."}
                  </p>
                </div>

                <div className="space-y-4">
                  {results.sections[activeTab].map((feedback) => (
                    <StepCard key={feedback.stepId} feedback={feedback} />
                  ))}
                </div>
              </>
            )}

            {/* Download CTA Banner */}
            <div className="mt-12 p-8 border-t border-slate-100 flex flex-col items-center justify-center bg-slate-50/50 rounded-b-2xl">
              <FileDown className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Export Complete Evaluation Package</h3>
              <p className="text-slate-500 text-center text-sm max-w-md mb-6">
                Download the complete report containing the <strong>Comments for Authors</strong>, <strong>Comments for Editor</strong>, and all <strong>40-step analyses</strong> as a Word document (.docx).
              </p>
              <button 
                onClick={downloadWordReport}
                disabled={isDownloading}
                className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? <Sparkles className="w-4 h-4 animate-spin text-indigo-600" /> : <Download className="w-4 h-4 text-indigo-600" />}
                {isDownloading ? "Preparing Report..." : "Download Report as .docx"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDashboard;
