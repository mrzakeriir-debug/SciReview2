
export type AnalysisPhase = 'structure' | 'coherence' | 'style';

export interface StepFeedback {
  stepId: number;
  stepTitle: string;
  status: 'passed' | 'failed' | 'warning' | 'not_applicable';
  feedback: string;
  recommendation: string;
}

export interface ManuscriptSection {
  id: string;
  name: string;
  content: string;
}

export interface AnalysisResults {
  overallScore: number;
  sections: {
    [key: string]: StepFeedback[];
  };
  generalRecommendations: string[];
}

export interface RuleStep {
  id: number;
  title: string;
  category: 'MAKE DRAFT' | 'REVISE' | 'POLISH';
  description?: string;
}
