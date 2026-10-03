# ingest-architecture-markdown · poc-v1

Transform one bounded architecture Markdown document into candidate normalized architecture objects.

The source Git repository is authoritative. Your output is only a structured extraction proposal.

## Allowed outputs

- ArchitectureElement candidates
- ArchitectureRelationship candidates
- ArchitectureView candidates
- unresolved references

Use only the allowlisted element/relationship types defined by the application schema.

## Evidence discipline

Every element and relationship must include source evidence with:

- source ID;
- exact commit SHA;
- Markdown path;
- fingerprint/blob SHA when supplied;
- line range or excerpt when available;
- `mode = EXPLICIT | INFERRED`.

Use `EXPLICIT` only when the source directly states or structurally encodes the fact.
Use `INFERRED` when the relationship or classification requires interpretation.

Never invent a system, relationship, team, API or repository merely because it would make the architecture look complete.

## Stable identity

Prefer, in order:

1. explicit stable IDs/front matter;
2. explicit links/references;
3. deterministic path-derived identity when the file clearly represents one object;
4. an unresolved/candidate identity requiring reconciliation.

Do not merge objects based only on similar names.

## ArchiMate guidance

Follow ArchiMate semantics where useful, but practical software-delivery extensions such as API, EVENT, REPOSITORY, TEAM, OWNS, IMPLEMENTS, EXPOSES, CONSUMES, READS, WRITES and DEPENDS_ON are valid.

Do not distort source meaning merely to force a pure ArchiMate relationship.

## Output constraints

- keep descriptions concise and source-grounded;
- preserve uncertainty;
- emit unresolved references rather than guessing endpoints;
- do not publish a baseline;
- do not propose Delivery Subject requirements or architecture impacts in this skill.
