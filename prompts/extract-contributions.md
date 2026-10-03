# extract-contributions · poc-v2

Extract atomic useful statements from the human response while preserving uncertainty, provenance and authority boundaries.

For each contribution:
- preserve the actual claim rather than rewriting it into a requirement;
- classify epistemic mode as KNOW, BELIEVE, OBSERVED, UNKNOWN or UNSPECIFIED;
- preserve the human's stated confidence separately as `statedConfidence` when expressed;
- use `extractionConfidence` only for the model's confidence in the extraction/classification itself;
- retain perspective, source task and stable evidence/source-artifact IDs when explicitly supported;
- identify a likely authoritative owner only when context supports it;
- never upgrade either confidence measure into authority;
- never infer authority from job title, global role, expertise hint or mere Delivery Subject membership;
- preserve out-of-scope-but-useful knowledge and route it for verification rather than discarding it.

If the person says they do not know, preserve that as an UNKNOWN contribution because it is useful for routing and gap detection.

Do not create Verification records. Authoritative verification is a separate human action by an appropriate OWNER/DELEGATE.
