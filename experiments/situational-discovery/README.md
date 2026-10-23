# Situational discovery prototype

[INDEX.md](INDEX.md) offers overlapping routes into canonical skills. Its
passages describe situations and relationships; each linked skill remains the
authority for its method. Several passages can reach the same skill. The
[full catalog](CATALOG.md) supports named lookup and needs the index does not
expose.

Two alternative entry points explore different amounts and kinds of context:

| Entry point | Visible words | Directly linked skills |
| --- | ---: | ---: |
| [Situational passages](INDEX.md) | 501 | 19 |
| [A continuous account of the relationships](alternatives/RELATIONSHIPS.md) | 244 | 9 |
| [Worked situations](alternatives/EXAMPLES.md) | 303 | 12 |

All three have the same catalog and canonical bodies behind them. Their length,
coverage, wording and use of examples vary together. The passages remain the
main prototype because they expose more capabilities directly; the experiments
have not established that they produce better answers.

Fresh Luna readers used all three forms to choose evidence and reconsider
inherited explanations. Each reached sound recommendations in the two cases
tested. Each also opened the full catalog, so a smaller initial surface did not
by itself remove that reading cost. Earlier matched comparisons with readers
without local skill text found little overall answer-quality advantage. These
are small exploratory trials with synthetic tasks; host-provided summaries were
excluded by instruction rather than actually removed from context.

Discovery should be judged across the interaction: what the agent notices,
which evidence it seeks, what it loads, and whether the resulting work reflects
what it learned. A plausible skill choice or a correct explanation can still
be followed by an artifact that carries an obsolete interpretation. Trials also
need cases where existing wording or a direct answer already serves the task.

Regenerate the catalog after changing canonical descriptions:

```sh
node experiments/situational-discovery/catalog.ts
```

This experiment leaves installed discovery, invocation policy and target
packaging unchanged. Exact trial snapshots and working records live under
`.runtime/discovery-trial-2026-10-14/`, `.runtime/luna-discovery-2026-10-14/`,
`.runtime/discovery-context-seeds-2026-10-14/`, and
`.runtime/discovery-iteration-2026-10-14/`.
