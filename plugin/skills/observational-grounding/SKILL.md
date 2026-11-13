---
name: observational-grounding
description: Use when observations seem to disagree, or a conclusion depends on
  an uncertain relationship between what was observed and what it is taken to
  show. Relate the evidence to its source and conditions as you investigate.
user-invocable: false
disable-model-invocation: false
---

# Observational Grounding

Keeping observations connected to what was seen, where it was seen, and what
those conditions allow you to conclude as your understanding changes.

---

An explanation directs attention: it suggests what to inspect and what a
result might mean. Inspection can reveal that the explanation assumed a
relationship the evidence has yet to establish. An event log may show recent
requests while a database query returns no recent turns. Suspecting a failed
write gives you a reason to trace the request; discovering that the query used
a different conversation identity changes what that absence means.

Keep the observation available in the form that supports reconsideration.
"The query returned no rows for this identity and time range" remains useful
when the explanation changes. Recording only "persistence failed" loses the
conditions that would let you examine another possibility.

## The relational structure

These examples vary in what is observed and how it can be checked. In each,
understanding suggests an inspection, and the conditions of the observation
can change that understanding.

A distributed-systems engineer compares a completed-request log with a missing
database row. The log makes a write failure plausible, so the engineer traces
which operation completed and which record it should have produced. Completion
might mean a job was queued; the database might have been read before that job
ran. Establishing those relationships changes what needs explaining. If the
write completed against the same database before the read, the missing row
becomes evidence for a different investigation.

An accountant reconciles a payment processor's settlement with its absence
from the ledger. A suspected import delay directs attention to batch times.
Checking those times reveals that the processor groups transactions by payout
date while the ledger records them by transaction date. The discrepancy may
resolve when the periods are aligned, or a particular missing transaction may
remain. The meaning of "settled" determines which records can answer the
question.

A lab technician investigates a surprising measurement. A possible change in
the sample suggests checking collection times; a possible instrument problem
suggests checking calibration records. The sample label and run record may
show that the comparison involved different specimens. They may instead
establish that the unexpected result occurred under comparable conditions.
Either finding changes which explanation deserves attention and which
measurement would help distinguish the remaining possibilities.

## Grounding during an investigation

What an observation establishes depends on the question being asked. A UI
showing "saved" establishes what the user saw. Whether the value persisted
requires knowing how that indication relates to the write. Matching records
may establish a shared event while leaving its cause uncertain. Preserve those
distinctions as the investigation moves between sources.

Give a possible explanation enough weight to choose a useful check, and let
the result change that explanation. The depth of the check depends on the
decision it could change. An identity or timestamp may settle the relation;
a consequential unresolved mismatch may warrant a longer trace. Once the
evidence supports the next action, proceed with the remaining uncertainty
visible.

A corrected interpretation can change the status of earlier work. If a
measurement used a different workload than assumed, its recorded numbers
remain observations, while the comparison drawn from them needs revision.
Carry that distinction into the conclusion or artifact that will guide the
next reader.

## Composition notes

[Interpretive synthesis](../interpretive-synthesis/SKILL.md "composition:reference")
relates each detail to the developing understanding. Observational grounding
keeps the evidence available to test and revise that understanding. Both can
remain active as [Recon](../recon/SKILL.md "composition:reference")
follows a lead.

Hypothesis-forming gives a possible explanation consequences to inspect;
hypothesis-evaluating compares those expectations with what was observed.
Grounding helps establish what that comparison can support.

Use tools for relations the available sources can establish. When the missing
relation depends on the user's experience or intent,
[collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference")
combines what you can observe with their situated knowledge.
