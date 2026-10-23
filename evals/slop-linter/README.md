# Historical Slop Linter evaluation

This directory preserves the retired Slop Linter's [role](slop-linter.agent.md)
and unchanged [suite](cases.json). The role snapshot was copied byte-for-byte
from `agents/slop-linter.agent.md` when Editorial Reader replaced it. It is
historical material outside the packaged resource directories.

`document-review/v1` required structured findings and a complete rewritten
document. Every `delete`, `replace`, or `TODO` action had to remove its exact
quote from the rewrite; `TODO` also had to add a new `TODO(MISSING)` marker.
Cases checked required passages and labels, finding-count limits, preservation,
exclusions, and exact rewrites. The parser rejects duplicate JSON members and
undeclared fields. `scripts/eval/core.test.ts` retains these deterministic tests.

Those assertions describe the old contract. They cannot assess a reader who
retains a quoted passage, asks the writer a question, or investigates a premise
before developing a revision. The current `editorial-reading/v1` capture therefore
has its own assignment and assessment contract.

The suite keeps its original identity and canonical path for interpreting old
reports. Running it against the retired role requires a historical checkout in
which that canonical resource and its projection are available. The archived
snapshot is not registered as a live agent, and the suite is not redirected to
Editorial Reader. Existing runtime results are left untouched by this migration.
