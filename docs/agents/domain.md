# Domain Docs

This repository uses a single-context layout: a root `CONTEXT.md` glossary and architectural decisions under `docs/adr/` when present.

Before exploration, read `CONTEXT.md` and any architectural decisions relevant to the change. If these documents do not exist, proceed without inventing decisions or treating their absence as a blocker.

Use the glossary's vocabulary in specifications, tickets, interfaces, and test names. Keep `CONTEXT.md` free of implementation details. If a proposal conflicts with an existing architectural decision, identify the conflict explicitly rather than silently replacing it.

Create architectural decision records only when a decision is costly to reverse, surprising without context, and involves a real tradeoff.
