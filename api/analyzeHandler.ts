import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';
import fs from 'fs';

// Configure undici global timeouts to prevent socket drops
(async () => {
  try {
    const undici = await import('undici');
    if (undici && undici.setGlobalDispatcher && undici.Agent) {
      undici.setGlobalDispatcher(
        new undici.Agent({
          headersTimeout: 180000,
          bodyTimeout: 180000,
          connectTimeout: 60000,
        })
      );
    }
  } catch {
    // Ignore if undici cannot be customized
  }
})();


function loadLocalEnv() {
  if (fs.existsSync('.env')) {
    try {
      const content = fs.readFileSync('.env', 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (key && val) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore
    }
  }
}

function resolveApiKey(): string {
  loadLocalEnv();
  let apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    for (const [_, val] of Object.entries(process.env)) {
      if (typeof val === 'string') {
        const clean = val.trim().replace(/^["']|["']$/g, '');
        if (clean.startsWith('AIzaSy') || clean.startsWith('AQ.')) {
          apiKey = clean;
          break;
        }
      }
    }
  }

  return apiKey;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithRetry(ai: GoogleGenAI, options: any) {
  // Candidate models with independent quota pools
  const models = [
    options.model || 'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...options,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));

        const isRateLimited =
          err?.status === 429 ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('quota') ||
          errStr.includes('rate limit');

        const isUnavailable =
          err?.status === 503 ||
          errStr.includes('503') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('high demand') ||
          errStr.includes('DEADLINE_EXCEEDED') ||
          errStr.includes('504') ||
          errStr.includes('overloaded');

        if (isRateLimited) {
          console.warn(`Model ${model} hit rate limit (429). Backing off and switching model...`);
          await sleep(2000);
          break; // Switch to the next model with a fresh quota pool
        }

        if (isUnavailable && attempt < 1) {
          console.warn(`Model ${model} unavailable (status 503/504). Retrying in 1.5s...`);
          await sleep(1500 * (attempt + 1));
          continue;
        }

        if (!isUnavailable && !isRateLimited) {
          throw err;
        }

        console.warn(`Model ${model} timed out or unavailable. Trying fallback model...`);
        break;
      }
    }
  }

  throw lastError;
}

const stepFeedbackSchemaItem = {
  type: Type.OBJECT,
  properties: {
    stepId: { type: Type.INTEGER },
    stepTitle: { type: Type.STRING },
    status: { type: Type.STRING },
    feedback: { type: Type.STRING },
    recommendation: { type: Type.STRING },
  },
  required: ['stepId', 'stepTitle', 'status', 'feedback', 'recommendation'],
};

async function analyzeDraftSteps(ai: GoogleGenAI, textSnippet: string) {
  const prompt = `
    Analyze the manuscript below according to the MAKE DRAFT steps (Steps 1 through 22 of Hengl & Gould).
    Keep feedback and recommendations concise (1-2 clear, actionable sentences each).
    Manuscript:
    ---
    ${textSnippet}
    ---
  `;

  const response = await generateContentWithRetry(ai, {
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
          make_draft: {
            type: Type.ARRAY,
            items: stepFeedbackSchemaItem,
          },
        },
        required: ['overallScore', 'make_draft'],
      },
    },
  });

  return JSON.parse(response.text?.trim() || '{}');
}

async function analyzeReviseAndPolishSteps(ai: GoogleGenAI, textSnippet: string) {
  const prompt = `
    Analyze the manuscript below according to the REVISE steps (Steps 23 through 32) and POLISH steps (Steps 33 through 40 of Hengl & Gould).
    Keep feedback and recommendations concise (1-2 clear, actionable sentences each).
    Manuscript:
    ---
    ${textSnippet}
    ---
  `;

  const response = await generateContentWithRetry(ai, {
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          revise: {
            type: Type.ARRAY,
            items: stepFeedbackSchemaItem,
          },
          polish: {
            type: Type.ARRAY,
            items: stepFeedbackSchemaItem,
          },
          generalRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['revise', 'polish', 'generalRecommendations'],
      },
    },
  });

  return JSON.parse(response.text?.trim() || '{}');
}

export async function processManuscriptAnalysis(text: string): Promise<any> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key is configured on the server. Please check Settings > Secrets.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 90000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Limit input text to ~15k characters (~3,000 words) to prevent Token-Per-Minute quota exhaustion
  const textToAnalyze = text.slice(0, 16000);

  // Execute in sequential stages with a short pause to stay within free-tier Requests-Per-Minute burst limits
  const draftResult = await analyzeDraftSteps(ai, textToAnalyze);
  
  await sleep(1000);

  const revisePolishResult = await analyzeReviseAndPolishSteps(ai, textToAnalyze);

  return {
    overallScore: typeof draftResult.overallScore === 'number' ? Math.round(draftResult.overallScore) : 75,
    sections: {
      make_draft: Array.isArray(draftResult.make_draft) ? draftResult.make_draft : [],
      revise: Array.isArray(revisePolishResult.revise) ? revisePolishResult.revise : [],
      polish: Array.isArray(revisePolishResult.polish) ? revisePolishResult.polish : [],
    },
    generalRecommendations: Array.isArray(revisePolishResult.generalRecommendations)
      ? revisePolishResult.generalRecommendations
      : [
          'Review the title and abstract for conciseness and punchiness.',
          'Verify that all methodology statements use past tense and active voice.',
          'Ensure every conclusion directly links back to the original research questions.',
        ],
  };
}

export function formatErrorMessage(err: any): string {
  const errString = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
  let errorMessage = err?.message || 'An error occurred during manuscript analysis.';

  if (
    errString.includes('RESOURCE_EXHAUSTED') ||
    errString.includes('429') ||
    errString.includes('quota') ||
    errString.includes('rate limit')
  ) {
    errorMessage = 'API rate limit or quota reached on the active Gemini key. Please wait a few seconds and click Retry.';
  } else if (
    errString.includes('DEADLINE_EXCEEDED') ||
    errString.includes('504') ||
    errString.includes('Deadline expired')
  ) {
    errorMessage = 'The operation exceeded the processing deadline. Please click Retry.';
  } else if (
    errString.includes('HeadersTimeoutError') ||
    errString.includes('fetch failed') ||
    errString.includes('timeout') ||
    errString.includes('ETIMEDOUT')
  ) {
    errorMessage = 'The analysis request timed out. Please click Retry.';
  } else if (
    errString.includes('API_KEY_INVALID') ||
    errString.includes('API key not valid') ||
    (err?.status === 400 && errString.includes('API key'))
  ) {
    errorMessage = 'The Gemini API key is invalid. Please check or re-enter your API key in the Settings > Secrets panel.';
  } else if (errString.includes('PERMISSION_DENIED') || err?.status === 403) {
    errorMessage = 'Permission denied by Gemini API. Please check your API key permissions in the Settings > Secrets panel.';
  } else if (
    errString.includes('503') ||
    errString.includes('UNAVAILABLE') ||
    errString.includes('high demand') ||
    err?.status === 503
  ) {
    errorMessage = 'The AI model is temporarily experiencing high traffic demand. Please wait a few seconds and click Retry Analysis.';
  }

  return errorMessage;
}
