import { PDFParse } from "pdf-parse";
import { BadRequestError } from "../../shared/errors/index.js";

const ALLOWED_MIME = ["application/pdf"] as const;
const MAX_TEXT_LENGTH = 100_000;
const MIN_TEXT_LENGTH = 100;

export interface ExtractedContent {
  text: string;
  pageCount: number;
}

export class ContentExtractionService {
  async extractPdf(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const parser = new PDFParse({ verbosity: 0, data: new Uint8Array(buffer) });
      const info = await parser.getInfo();
      const textResult = await parser.getText();
      await parser.destroy();

      const text = textResult.text.trim();

      if (text.length < MIN_TEXT_LENGTH) {
        throw new BadRequestError("PDF does not contain enough extractable text to generate a quiz");
      }

      return {
        text: text.slice(0, MAX_TEXT_LENGTH),
        pageCount: info.pages.length,
      };
    } catch (err) {
      if (err instanceof BadRequestError) throw err;
      throw new BadRequestError("Failed to extract text from PDF");
    }
  }

  async extractFromBuffer(buffer: Buffer, mimeType: string): Promise<ExtractedContent> {
    if (mimeType === "application/pdf") {
      return this.extractPdf(buffer);
    }
    throw new BadRequestError(`Unsupported file type for extraction: ${mimeType}`);
  }

  isSupportedMime(mimeType: string): boolean {
    return ALLOWED_MIME.includes(mimeType as typeof ALLOWED_MIME[number]);
  }
}
