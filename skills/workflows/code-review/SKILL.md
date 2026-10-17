---
name: code-review
description: "Use when reviewing a patch or pull request: examine how the code
  fulfills the change's purpose, and revisit earlier judgments when details
  change your understanding of the design. For improving existing code's
  expression, use implementation-quality; for reading together, use walkthrough."
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# Code Review

Read the change with an account of what someone should be able to do and how
the code makes that possible. That account helps you judge individual details;
the details can also reveal that you misunderstood the change. Keep
[interpretive synthesis](../../stances/interpretive-synthesis/SKILL.md "composition:load")
active throughout the review. When your understanding changes, return to the
code and judgments that depended on the earlier understanding.

A locally convincing explanation can rest on an assumption nobody established.
An element's cleanup resets its state so it can be reattached later. That makes
sense if the application reuses removed elements. If removal ends the
interaction and each new mount creates a new instance, the reset and the tests
for reconnection promise behavior the application never needed. Checking the
element's actual lifetime changes how you read both the cleanup and its tests.

The reverse can happen when an implementation has outgrown its original use.
A message carries several kinds of configuration update, but cleanup still
decides whether to keep the message by checking for the first kind. Recognizing
the message's broader purpose makes that familiar check suspect. Follow the
remaining contents through cleanup: another update may still need delivery.

These discoveries change which code needs attention. Follow the assumptions
they disturb, including in portions already reviewed. A concern may disappear,
become more serious, or turn out to have affected several decisions. When a
local check settles the concern and leaves the surrounding explanation intact,
continue with that understanding.

Code and tests show the behavior implemented; the intended behavior may also
be established in the request, documentation, or earlier design discussion.
Where a consequential choice remains with the author, use
[collaborative grounding](../../stances/collaborative-grounding/SKILL.md "composition:load")
to explain what the code does and which choice would change your judgment.
During an unattended review, keep conclusions within what the available
evidence establishes.

Explain a concern so the author can reason about it before opening every
referenced function. In the configuration example: consuming one update can
discard another update traveling in the same message. The relevant condition
and execution path should substantiate that explanation. If those details
force a different explanation, revise it. This is
[reader orientation](../../stances/reader-orientation/SKILL.md "composition:reference")
applied to the review itself.

Use the host's review instructions for finding criteria, priorities, and output
format. Keep proposed changes within the review's scope; a revised
understanding can justify a small correction or withdrawing a comment.
