
import React, { useState, useRef } from 'react';
import { AnalysisResults } from './types';
import { GeminiService } from './services/geminiService';
import ReviewDashboard from './components/ReviewDashboard';
import { FileText, Search, ShieldCheck, Sparkles, Loader2, ChevronRight, Upload, FileUp, AlertCircle } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = '';

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(' ') + '\n\n';
        }
        extractedText = fullText;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        throw new Error("Unsupported file format. Please upload a PDF or .docx file.");
      }

      if (!extractedText.trim()) {
        throw new Error("Could not extract text from the file. It might be empty or scanned.");
      }

      setInputText(extractedText);
    } catch (err: any) {
      setError(err.message || "Failed to process the document.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Please provide your manuscript text first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const service = new GeminiService();
      const analysisResults = await service.analyzeManuscript(inputText);
      setResults(analysisResults);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResults(null);
    setInputText('');
    setError(null);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SciReview</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-sm text-slate-500 hover:text-indigo-600">Pricing & Billing</a>
            {results && (
              <button 
                onClick={reset}
                className="text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {!results ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Peer Review</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700 font-semibold">
                  <FileText className="w-5 h-5" />
                  Manuscript Content
                </div>
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.docx" 
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={triggerFileUpload}
                    disabled={isExtracting || isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <FileUp className="w-4 h-4 text-indigo-600" />
                    )}
                    {isExtracting ? 'Extracting Text...' : 'Upload PDF/Docx'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  className="w-full h-96 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none font-serif leading-relaxed text-slate-800"
                  placeholder="Paste your title, abstract, introduction, methodology, results, and discussion here, or upload a file above..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                      <div className="space-y-1">
                        <p className="font-medium text-red-800">{error}</p>
                        {error.includes('Settings > Secrets') && (
                          <p className="text-xs text-red-600">
                            Please ensure a valid Google Gemini API key is configured in your project secrets.
                          </p>
                        )}
                      </div>
                    </div>
                    {inputText.trim() && (
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        {isAnalyzing ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-8 text-slate-400 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Structure Check
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Style Review
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Rejection Analysis
                    </div>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !inputText.trim() || isExtracting}
                    className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Manuscript...
                      </>
                    ) : (
                      <>
                        Start Detailed Review
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Features section */}
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              {[
                { title: "40 Step Check", desc: "Rigorous analysis across structure, logic, and polish phases.", icon: Search },
                { title: "Move Detection", desc: "Identifying missing moves in Intro and Discussion sections.", icon: Sparkles },
                { title: "Style Correction", desc: "Refining tenses, word choice, and visual reporting.", icon: ShieldCheck }
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
                  <f.icon className="w-8 h-8 text-indigo-500 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ReviewDashboard results={results} />
        )}
      </main>

      <footer className="py-12 bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            Based on "Rules of thumb for writing research articles" by T. Hengl and M. Gould (2002).
          </p>
          <p className="text-slate-400 text-xs mt-2">
            AI-generated reviews are advisory. Final editorial decisions rest with the researcher.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
