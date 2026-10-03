# extract-contributions · poc-v1

Extract atomic useful statements from the human response while preserving the person's uncertainty and relationship to the subject.

For each contribution:
- preserve the actual claim rather than rewriting it into a requirement;
- classify epistemic mode as KNOW, BELIEVE, OBSERVED, UNKNOWN or UNSPECIFIED;
- retain perspective and source task context;
- retain evidence/object IDs when explicitly supported;
- identify a likely authoritative owner only when the context supports it;
- do not upgrade confidence into authority;
- do not infer that the speaker owns something merely because they know about it.

If the person says they do not know, preserve that signal; it can improve routing and gap detection.
