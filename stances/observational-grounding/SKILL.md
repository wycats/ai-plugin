---
name: observational-grounding
description: "Use when observations from different surfaces appear to disagree and the agent must keep each observation in its observed form before explaining causes: UI vs behavior, logs vs state, metrics vs reports, tool output vs user-visible result."
user-invocable: false
---

# Observational Grounding

Stabilizing the phenomenon before explaining it, especially when observations
come from different surfaces whose relationship has not been established yet.

---

The first act is not hypothesis. It is holding the observations steady: what
exactly was seen, where was it seen, and what kind of claim can that surface
actually support?

When evidence surfaces disagree, the contradiction should be preserved in its
raw form long enough to stabilize the phenomenon. "The event log has recent
requests, but the database has no recent turns for that conversation" is a
better starting point than "persistence failed" or "the cache missed." The
first sentence names the phenomenon. The others already interpret it.

## The relational structure

The examples vary across domains. The invariant is the same: before explaining
a discrepancy, make the observation well-formed enough to interpret.

A distributed-systems engineer compares request logs, traces, and database
rows. A log line says a request completed. The trace UI does not show the span,
and the database has no row. The engineer does not begin by blaming sampling,
writes, or projection. They first keep each surface in view: what the log can
prove, what the trace UI can omit, what the database read is scoped to, and
whether the disagreement is actually about one request. Only then does a missing
row become evidence of a write problem.

A forensic accountant reconciles a payment processor export with the general
ledger. The processor shows a settlement, but the ledger does not. The useful
first move is not a list of theories about fraud, delay, or import failure. It
is to ask what each source means by "settled," what period and entity it speaks
for, and whether the absence in the ledger is comparable to the processor's
presence. Once the observation is stable, the remaining discrepancy has meaning.

A lab technician investigates a surprising test result. A sample label, machine
run, patient record, and timestamp are not explanations. They are the conditions
that make the result an interpretable observation rather than a number floating
free of its specimen. Medical interpretation begins after the observation has a
stable referent.

An incident commander reconstructs an outage timeline from alerts, deploy
events, customer reports, and service metrics. They first separate what each
surface can honestly say: a customer felt failure, a metric crossed a threshold,
a deploy happened, an alert fired. Causes come later. Without that grounding,
the incident story is a collage of plausible but unformed observations.

## The core move

Hold two questions apart:

1. What did each surface actually observe?
2. What would make those observations bear on the same phenomenon?

Inspect only enough to answer the second question. The stabilizing move is
whatever the case requires, and no more: enough to know whether the observations
can constrain one phenomenon, not enough to start explaining it prematurely.

Once the phenomenon is stable, interpretation can begin.

## When this stance applies

- Event logs disagree with stored state.
- UI, API, cache, and persisted state tell different stories.
- Metrics, traces, logs, or alerts imply different timelines.
- Multiple workspaces, branches, tenants, regions, or storage locations may be
  involved.
- The tempting explanation depends on treating two observations as more
  comparable than they have been shown to be.

## The handoff point

Once the phenomenon has a stable reference, observational grounding should make
the next mode easier. It hands root-cause analysis something specific to
explain, gives hypothesis-forming a grounded phenomenon to predict against, and
lets hypothesis-evaluating compare expected and actual results against an
observation whose referent is already stable.

The output should fit the surfaces involved. Sometimes the useful artifact is a
short contradiction statement. Sometimes it is a readback of scope, identity,
timing, workspace, or storage context. Across those forms, the invariant is that
the next interpretive move receives observations that can actually bear on the
same phenomenon.

## Composition notes

Observational grounding composes with the [Recon workflow](../../skills/recon/SKILL.md "composition:reference") by interrupting broad
lead-following when the problem is an unstable phenomenon. Recon can
resume once the phenomenon is stable.

It composes with **hypothesis-forming** by providing the grounded phenomenon
that hypotheses should explain. Without this stance, hypotheses can become
stories about a mismatch that was not yet a well-formed observation.

It composes with **hypothesis-evaluating** when expected and actual results come
from different surfaces. Evaluation starts by checking whether the "actual" is
stable enough to compare with the expectation.

It composes with [collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference") when phenomenon stability depends
on situated context the user can see or knows from the workflow. The agent
should present what it can observe and ask for the missing situated relation.
