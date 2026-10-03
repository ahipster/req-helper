-- Req Helper PoC persistence contract
-- PostgreSQL; current-state tables are authoritative, domain_event is append-only audit history.

create table if not exists delivery_subject (
  id text primary key,
  title text not null,
  initial_signal text not null,
  problem_statement text,
  desired_outcome text,
  status text not null,
  priority text,
  sponsor_id text,
  delivery_lead_id text,
  current_iteration integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists perspective (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  type text not null,
  name text not null,
  description text,
  criticality text not null,
  required boolean not null default false,
  rationale text,
  status text not null
);

create table if not exists perspective_assignment (
  id text primary key,
  perspective_id text not null references perspective(id) on delete cascade,
  user_id text not null,
  relationship text not null,
  required boolean not null default false,
  status text not null,
  unique (perspective_id, user_id, relationship)
);

create table if not exists task (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  type text not null,
  assignee_id text,
  perspective_id text references perspective(id),
  title text not null,
  question text,
  rationale text,
  priority double precision not null default 0,
  blocking boolean not null default false,
  status text not null,
  related_object_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversation_message (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  task_id text references task(id),
  actor_id text,
  actor_type text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists contribution (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  task_id text references task(id),
  author_id text not null,
  perspective_id text references perspective(id),
  statement text not null,
  epistemic_mode text not null,
  ownership_relationship text,
  confidence double precision,
  verification_status text not null,
  likely_authoritative_owner_id text,
  source_message_id text references conversation_message(id),
  created_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists evidence (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  kind text not null,
  source_id text not null,
  excerpt text,
  uri text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists contribution_evidence (
  contribution_id text not null references contribution(id) on delete cascade,
  evidence_id text not null references evidence(id) on delete cascade,
  primary key (contribution_id, evidence_id)
);

create table if not exists contribution_verification (
  id text primary key,
  contribution_id text not null references contribution(id) on delete cascade,
  verifier_id text not null,
  result text not null,
  amended_statement text,
  rationale text,
  created_at timestamptz not null default now()
);

create table if not exists requirement (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  type text not null,
  title text not null,
  statement text not null,
  rationale text,
  priority text not null,
  criticality text not null,
  status text not null,
  owner_id text,
  confidence double precision,
  requires_evaluation boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists requirement_revision (
  requirement_id text not null references requirement(id) on delete cascade,
  revision integer not null,
  statement text not null,
  rationale text,
  status text not null,
  changed_by_actor_id text,
  changed_by_actor_type text not null,
  changed_at timestamptz not null default now(),
  primary key (requirement_id, revision)
);

create table if not exists requirement_source (
  id text primary key,
  requirement_id text not null references requirement(id) on delete cascade,
  source_kind text not null,
  source_id text not null,
  authoritative boolean not null default false,
  unique (requirement_id, source_kind, source_id)
);

create table if not exists knowledge_reference (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  external_type text not null,
  external_system text not null,
  external_id text,
  title text not null,
  uri text,
  version text,
  retrieved_at timestamptz not null,
  summary text,
  relevance double precision,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists proposed_diff (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  knowledge_reference_id text not null references knowledge_reference(id) on delete cascade,
  diff_type text not null,
  before_value jsonb,
  after_value jsonb,
  reason text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists gap (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  description text not null,
  severity text not null,
  perspective_id text references perspective(id),
  required_owner_id text,
  blocking boolean not null default false,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conflict (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  description text not null,
  item_a_type text not null,
  item_a_id text not null,
  item_b_type text not null,
  item_b_id text not null,
  severity text not null,
  owner_ids jsonb not null default '[]'::jsonb,
  blocking boolean not null default false,
  resolution text,
  decision_id text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assumption (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  statement text not null,
  owner_id text,
  confidence double precision,
  validation_method text,
  impact_if_wrong text,
  status text not null,
  created_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists decision_record (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  question text not null,
  alternatives jsonb not null default '[]'::jsonb,
  decision text not null,
  rationale text not null,
  owner_id text not null,
  participant_ids jsonb not null default '[]'::jsonb,
  affected_requirement_ids jsonb not null default '[]'::jsonb,
  supersedes_decision_id text references decision_record(id),
  created_at timestamptz not null default now()
);

create table if not exists dependency (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  from_type text not null,
  from_id text not null,
  to_type text not null,
  to_id text not null,
  type text not null,
  description text,
  owner_id text,
  resolved boolean not null default false,
  blocking boolean not null default false
);

create table if not exists work_package (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  area text not null,
  owner_id text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_package_requirement (
  work_package_id text not null references work_package(id) on delete cascade,
  requirement_id text not null references requirement(id) on delete cascade,
  primary key (work_package_id, requirement_id)
);

create table if not exists work_package_knowledge_reference (
  work_package_id text not null references work_package(id) on delete cascade,
  knowledge_reference_id text not null references knowledge_reference(id) on delete cascade,
  primary key (work_package_id, knowledge_reference_id)
);

create table if not exists acceptance_criterion (
  id text primary key,
  requirement_id text not null references requirement(id) on delete cascade,
  given_text text,
  when_text text,
  then_text text not null,
  verification_type text not null,
  automatable boolean not null default false,
  priority text not null
);

create table if not exists evaluation (
  id text primary key,
  requirement_id text not null references requirement(id) on delete cascade,
  name text not null,
  evaluation_type text not null,
  input_definition text,
  expected_behaviour text not null,
  threshold text,
  failure_behaviour text not null
);

create table if not exists domain_event (
  sequence_id bigserial primary key,
  event_id text not null unique,
  delivery_subject_id text references delivery_subject(id) on delete cascade,
  event_type text not null,
  actor_id text,
  actor_type text not null,
  object_type text,
  object_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists orchestration_run (
  id text primary key,
  delivery_subject_id text not null references delivery_subject(id) on delete cascade,
  workflow_version text not null,
  status text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  error_category text,
  error_message text
);

create table if not exists orchestration_step (
  id text primary key,
  run_id text not null references orchestration_run(id) on delete cascade,
  node_name text not null,
  prompt_version text,
  provider text,
  model text,
  status text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  latency_ms integer,
  input_object_ids jsonb not null default '[]'::jsonb,
  tool_calls jsonb not null default '[]'::jsonb,
  structured_output jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  retry_count integer not null default 0,
  human_interrupt jsonb,
  proposed_mutations jsonb not null default '[]'::jsonb,
  applied_mutations jsonb not null default '[]'::jsonb,
  error_category text,
  error_message text
);

create index if not exists idx_perspective_delivery_subject on perspective(delivery_subject_id);
create index if not exists idx_task_assignee_status on task(assignee_id, status);
create index if not exists idx_requirement_delivery_subject on requirement(delivery_subject_id);
create index if not exists idx_contribution_delivery_subject on contribution(delivery_subject_id);
create index if not exists idx_knowledge_reference_delivery_subject on knowledge_reference(delivery_subject_id);
create index if not exists idx_domain_event_delivery_subject on domain_event(delivery_subject_id, sequence_id);
create index if not exists idx_orchestration_step_run on orchestration_step(run_id, started_at);
