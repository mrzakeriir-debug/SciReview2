import { AnalysisResults } from "../types";

export class GeminiService {
  async analyzeManuscript(fullText: string): Promise<AnalysisResults> {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: fullText }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`The server returned an unexpected response format (${response.status}). Please try again.`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `Server error (${response.status})`);
    }

    return data as AnalysisResults;
  }
}
