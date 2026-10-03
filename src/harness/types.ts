import type { ZodType } from "zod";

export type EnsureThreadInput = {
  deliverySubjectId: string;
  perspectiveId?: string;
  participantId: string;
  logicalThreadId: string;
  existingSessionId?: string;
};

export type AgentThreadHandle = {
  logicalThreadId: string;
  sessionId: string;
  recreated: boolean;
};

export type HarnessMetadata = {
  deliverySubjectId: string;
  perspectiveId?: string;
  participantId: string;
  logicalThreadId: string;
  runId: string;
  skillVersion: string;
  domainRevision: number;
};

export type HarnessPrompt<T> = {
  thread: AgentThreadHandle;
  system?: string;
  prompt: string;
  schema: ZodType<T>;
  metadata: HarnessMetadata;
};

export type HarnessResult<T> = {
  output: T;
  sessionId: string;
  provider?: string;
  model?: string;
  rawMetadata?: unknown;
};

export type HarnessStreamPrompt = {
  thread: AgentThreadHandle;
  system?: string;
  prompt: string;
  metadata: HarnessMetadata;
};

export type HarnessEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; payload?: unknown }
  | { type: "done"; sessionId: string }
  | { type: "error"; message: string };

export interface AgentHarness {
  ensureThread(input: EnsureThreadInput): Promise<AgentThreadHandle>;
  prompt<T>(input: HarnessPrompt<T>): Promise<HarnessResult<T>>;
  stream(input: HarnessStreamPrompt): AsyncIterable<HarnessEvent>;
  cancel(runId: string): Promise<void>;
}
