import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

export interface GeminiGenerateOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName = "gemini-2.0-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  private getModel(options?: { maxTokens?: number; temperature?: number }): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        maxOutputTokens: options?.maxTokens,
        temperature: options?.temperature,
        responseMimeType: "application/json",
      },
    });
  }

  async generateJson(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<unknown> {
    const model = this.getModel(options);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      return JSON.parse(text);
    } catch {
      throw new GeminiJsonParseError("Failed to parse Gemini response as JSON", text);
    }
  }
}

export class GeminiJsonParseError extends Error {
  rawText: string;

  constructor(message: string, rawText: string) {
    super(message);
    this.name = "GeminiJsonParseError";
    this.rawText = rawText;
  }
}

export class GeminiFactory {
  private static client: GeminiClient | null = null;

  static create(apiKey: string, modelName?: string): GeminiClient {
    return new GeminiClient(apiKey, modelName);
  }

  static getOrCreate(apiKey: string, modelName?: string): GeminiClient {
    if (!this.client) {
      this.client = new GeminiClient(apiKey, modelName);
    }
    return this.client;
  }
}
