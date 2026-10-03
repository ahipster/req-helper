import { createOpencodeClient } from "@opencode-ai/sdk";
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
 * Req Helper remains responsible for persistence, thread leases, context
 * construction, authorization, domain commands and audit records. OpenCode is
 * only the reasoning/tool execution harness.
 */
export class OpenCodeHarness implements AgentHarness {
  private readonly client: ReturnType<typeof createOpencodeClient>;
  private readonly providerId?: string;
  private readonly modelId?: string;
  private readonly activeRunSession = new Map<string, string>();

  constructor(config: OpenCodeHarnessConfig) {
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
      throwOnError: true,
    });
    this.providerId = config.providerId;
    this.modelId = config.modelId;
  }

  async ensureThread(input: EnsureThreadInput): Promise<AgentThreadHandle> {
    if (input.existingSessionId) {
      try {
        await this.client.session.get({ path: { id: input.existingSessionId } });
        return {
          logicalThreadId: input.logicalThreadId,
          sessionId: input.existingSessionId,
          recreated: false,
        };
      } catch {
        // Session state is explicitly disposable. Recreate below.
      }
    }

    const created = await this.client.session.create({
      body: {
        title: `ReqHelper:${input.deliverySubjectId}:${input.perspectiveId ?? "general"}:${input.participantId}`,
      },
    });

    const session = ((created as unknown as { data?: { id: string } }).data ?? created) as unknown as {
      id: string;
    };

    return {
      logicalThreadId: input.logicalThreadId,
      sessionId: session.id,
      recreated: true,
    };
  }

  async prompt<T>(input: HarnessPrompt<T>): Promise<HarnessResult<T>> {
    const jsonSchema = z.toJSONSchema(input.schema);
    this.activeRunSession.set(input.metadata.runId, input.thread.sessionId);

    try {
      const result = await this.client.session.prompt({
        path: { id: input.thread.sessionId },
        body: {
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
      });

      const response = result as unknown as {
        data?: {
          info?: {
            structured_output?: unknown;
            error?: { name?: string; message?: string };
            modelID?: string;
            providerID?: string;
          };
        };
      };

      if (response.data?.info?.error) {
        throw new Error(response.data.info.error.message ?? response.data.info.error.name ?? "OpenCode prompt failed");
      }

      const output = input.schema.parse(response.data?.info?.structured_output);

      return {
        output,
        sessionId: input.thread.sessionId,
        provider: response.data?.info?.providerID ?? this.providerId,
        model: response.data?.info?.modelID ?? this.modelId,
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
    await this.client.session.abort({ path: { id: sessionId } });
  }
}
