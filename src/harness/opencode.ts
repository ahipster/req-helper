import { createOpencodeClient } from "@opencode-ai/sdk/v2";
import { z } from "zod";
import type {
  AgentHarness,
  AgentThreadHandle,
  EnsureThreadInput,
  HarnessEvent,
  HarnessPrompt,
  HarnessResult,
  HarnessStreamPrompt,
} from "./types.js";

export type OpenCodeHarnessConfig = {
  baseUrl: string;
  providerId?: string;
  modelId?: string;
};

/**
 * Thin OpenCode adapter.
 *
 * Req Helper remains responsible for persistence, thread leases, authoritative
 * Firestore context hydration, authorization, domain commands and audit records.
 * OpenCode is only the reasoning/tool execution harness.
 *
 * The v2 SDK entry point is used because its generated prompt type exposes the
 * structured-output `format` contract used by Req Helper.
 */
export class OpenCodeHarness implements AgentHarness {
  private readonly client: ReturnType<typeof createOpencodeClient>;
  private readonly providerId?: string;
  private readonly modelId?: string;
  private readonly activeRunSession = new Map<string, string>();

  constructor(config: OpenCodeHarnessConfig) {
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
    });
    this.providerId = config.providerId;
    this.modelId = config.modelId;
  }

  async ensureThread(input: EnsureThreadInput): Promise<AgentThreadHandle> {
    const currentGeneration = input.sessionGeneration ?? 0;

    if (input.existingSessionId) {
      try {
        await this.client.session.get(
          { sessionID: input.existingSessionId },
          { throwOnError: true },
        );
        return {
          logicalThreadId: input.logicalThreadId,
          sessionId: input.existingSessionId,
          sessionGeneration: currentGeneration,
          recreated: false,
        };
      } catch {
        // OpenCode session state is explicitly disposable. Recreate below and
        // let the application perform a FULL Firestore-backed hydration.
      }
    }

    const created = await this.client.session.create(
      {
        title: `ReqHelper:${input.deliverySubjectId}:${input.perspectiveId ?? "general"}:${input.participantId}`,
      },
      { throwOnError: true },
    );

    if (!created.data?.id) {
      throw new Error("OpenCode session creation returned no session ID");
    }

    return {
      logicalThreadId: input.logicalThreadId,
      sessionId: created.data.id,
      sessionGeneration: currentGeneration + 1,
      recreated: true,
    };
  }

  async prompt<T>(input: HarnessPrompt<T>): Promise<HarnessResult<T>> {
    const jsonSchema = z.toJSONSchema(input.schema);
    this.activeRunSession.set(input.metadata.runId, input.thread.sessionId);

    try {
      const result = await this.client.session.prompt(
        {
          sessionID: input.thread.sessionId,
          ...(this.providerId && this.modelId
            ? { model: { providerID: this.providerId, modelID: this.modelId } }
            : {}),
          parts: [
            {
              type: "text",
              text: [input.system, input.prompt].filter(Boolean).join("\n\n"),
            },
          ],
          format: {
            type: "json_schema",
            schema: jsonSchema as Record<string, unknown>,
            retryCount: 2,
          },
        },
        { throwOnError: true },
      );

      const info = result.data?.info;
      if (!info) throw new Error("OpenCode prompt returned no assistant message info");

      if (info.error) {
        const structuredError = info.error as unknown as {
          name?: string;
          message?: string;
          data?: { message?: string };
        };
        throw new Error(
          structuredError.data?.message ??
            structuredError.message ??
            structuredError.name ??
            "OpenCode prompt failed",
        );
      }

      const output = input.schema.parse(info.structured);

      return {
        output,
        sessionId: input.thread.sessionId,
        sessionGeneration: input.thread.sessionGeneration,
        provider: info.providerID ?? this.providerId,
        model: info.modelID ?? this.modelId,
      };
    } finally {
      this.activeRunSession.delete(input.metadata.runId);
    }
  }

  async *stream(input: HarnessStreamPrompt): AsyncIterable<HarnessEvent> {
    // OpenCode exposes server events/SSE. Wire those events into assistant-ui in
    // the vertical slice. Keep the interface here so product code does not bind
    // directly to OpenCode event types.
    yield {
      type: "error",
      message: `Streaming adapter not implemented yet for ${input.metadata.runId}`,
    };
  }

  async cancel(runId: string): Promise<void> {
    const sessionId = this.activeRunSession.get(runId);
    if (!sessionId) return;
    await this.client.session.abort(
      { sessionID: sessionId },
      { throwOnError: true },
    );
  }
}
