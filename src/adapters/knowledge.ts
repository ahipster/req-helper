export type KnowledgeQuery = {
  deliverySubjectId: string;
  text: string;
  types?: string[];
  limit?: number;
};

export type ExternalKnowledgeRef = {
  externalSystem: string;
  externalId?: string;
  uri?: string;
};

export type KnowledgeHit = {
  ref: ExternalKnowledgeRef;
  type: string;
  title: string;
  summary?: string;
  relevance?: number;
  version?: string;
  metadata?: Record<string, unknown>;
};

export type KnowledgeDocument = KnowledgeHit & {
  content: string;
  retrievedAt: string;
};

export interface KnowledgeProvider {
  search(query: KnowledgeQuery): Promise<KnowledgeHit[]>;
  fetch(ref: ExternalKnowledgeRef): Promise<KnowledgeDocument | null>;
  related(ref: ExternalKnowledgeRef): Promise<KnowledgeHit[]>;
}

export class CompositeKnowledgeProvider implements KnowledgeProvider {
  constructor(private readonly providers: KnowledgeProvider[]) {}

  async search(query: KnowledgeQuery): Promise<KnowledgeHit[]> {
    const results = await Promise.all(
      this.providers.map((provider) => provider.search(query)),
    );
    return results
      .flat()
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
      .slice(0, query.limit ?? 20);
  }

  async fetch(ref: ExternalKnowledgeRef): Promise<KnowledgeDocument | null> {
    for (const provider of this.providers) {
      const document = await provider.fetch(ref);
      if (document) return document;
    }
    return null;
  }

  async related(ref: ExternalKnowledgeRef): Promise<KnowledgeHit[]> {
    const results = await Promise.all(
      this.providers.map((provider) => provider.related(ref)),
    );
    return results.flat();
  }
}
