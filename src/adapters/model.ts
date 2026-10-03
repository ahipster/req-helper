import type { ZodType } from "zod";

export type ModelMetadata = {
  provider: string;
  model: string;
  promptVersion: string;
};

export type TextGenerationRequest = {
  system: string;
  prompt: string;
  metadata: ModelMetadata;
};

export type StructuredGenerationRequest<T> = TextGenerationRequest & {
  schema: ZodType<T>;
};

export interface ModelGateway {
  generateText(request: TextGenerationRequest): Promise<string>;
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
  streamText(request: TextGenerationRequest): AsyncIterable<string>;
}

/**
 * The PoC should implement exactly one bank-approved provider first.
 * Provider-specific SDK objects must not leak past this boundary.
 */
