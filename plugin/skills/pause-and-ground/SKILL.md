---
name: pause-and-ground
description: "Use when debugging, recon, review, or incident work has conflicting observations and needs to pause, restate what is known, check whether surfaces are comparable, and hand off to the next investigative move."
---

# Pause and Ground

Pause the investigation and ground what we actually know before explaining it.

This is a user-facing workflow move that composes the hidden
**observational-grounding** and **relational-continuity** stances. Use it when
the conversation is starting to generate causes faster than the observations can
support them.

## Core tension

**Explanation momentum vs. observation stability.** Explanations are useful only
after the observations have a stable referent. When logs, UI, database state,
metrics, review comments, or user-visible behavior seem to disagree, first hold
each observation in the form it was actually seen. Let the cause wait until the
surfaces are known to be speaking about the same thing.

## Workflow

1. Name the pause.
   - Briefly say that the investigation is pausing to ground the observations
     before explaining them.
   - Keep the tone calm and practical; this is a focusing move that preserves
     the work already done.

2. Restate each surface in observation-language.
   - Name what was seen, where it was seen, and what that surface can honestly
     support.
   - Keep interpretation separate from observation. "The UI shows saved" is an
     observation; "the write succeeded" is already an interpretation.

3. Ask what would make the observations comparable.
   - Look for the relation that would let the surfaces bear on the same
     phenomenon: identity, scope, timing, workspace, branch, tenant, region,
     storage location, actor, or request boundary.
   - Use tools to inspect observable facts directly when they are available.
   - Ask the user only for situated context or for information the available
     tools cannot see.

4. Inspect only enough to ground the relation.
   - Keep the pass bounded. Gather just enough evidence to know whether the
     observations are comparable, partially comparable, or talking past each
     other.
   - If a broader trail opens, hand it back to recon after the phenomenon is
     stable.

5. Produce the handoff.
   - State the grounded phenomenon in one or two sentences.
   - Name the remaining uncertainty if the observations are not yet comparable.
   - Recommend the next move: resume recon, form hypotheses, evaluate a
     specific expectation, ask the user for situated context, or stop because
     the contradiction dissolved.

## Output shape

Keep the output compact unless the situation is genuinely complex:

```text
Pause and ground:
- Surface A shows...
- Surface B shows...
- These observations are comparable if...

Stable phenomenon:
...

Next move:
...
```

The form can vary. The invariant is that the next interpretive move receives
observations that can actually bear on the same phenomenon.

## Examples

An event log shows recent requests, but a database read shows no recent turns.
Pause before saying persistence failed. First ground whether the log and the
database read refer to the same conversation, response, workspace, and time
range.

A UI says a setting was saved, but the API response or persisted state appears
unchanged. Pause before blaming caching or the save path. First ground what the
UI state proves, what the API response proves, and whether both surfaces are
scoped to the same account, environment, and version of the setting.

A PR review thread, CI result, and local test run point in different directions.
Pause before deciding which one is authoritative. First ground what each surface
checked, which commit or diff it saw, and what reviewer or automation state it
can actually support.
