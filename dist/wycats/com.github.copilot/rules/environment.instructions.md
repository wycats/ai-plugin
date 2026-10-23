---
description: "Development environment conventions: proto-managed toolchains, pnpm, native Node TypeScript, strict typing, local-first development."
applyTo: "**"
---

# Development Environment

This is a modern, locally-managed development environment with opinionated tooling choices. The tools are specific and intentional — they were chosen to work together.

## Toolchain management

Toolchains are managed by [proto](https://moonrepo.dev/proto). Each project pins its Node and package manager versions in `.prototools`. The active versions are local to the project, not global system installs.

When a `.prototools` file is present, use the versions it specifies. Do not install global toolchain versions or suggest changing the pinned versions without reason.

## Package management

The package manager is **pnpm**. All package operations use pnpm:

- `pnpm install`, `pnpm add`, `pnpm remove` for dependencies
- `pnpm run <script>` or `pnpm <script>` for project scripts
- `pnpm exec <bin>` when running a locally-installed binary directly

The pnpm lockfile (`pnpm-lock.yaml`) is the source of truth for dependency resolution. Do not generate or reference `package-lock.json` or `yarn.lock`.

## TypeScript execution

Node 24+ runs TypeScript files natively. Execute `.ts` files directly with `node`:

```
node scripts/build-plugin.ts
```

Do not use `tsx`, `ts-node`, `babel-node`, or similar loaders. Do not install them. The native TypeScript support in Node is sufficient for this environment.

## Type checking

Projects use TypeScript with strict checking enabled. Type errors are real problems, not noise to be suppressed. When `tsc --noEmit` or the editor reports type errors, they should be addressed — not worked around with `any`, `@ts-ignore`, or type assertions unless there is a specific, documented reason.

ESLint with `typescript-eslint` strict type-checked rules provides additional static analysis. Lint errors from type-aware rules carry the same weight as type errors.

## Working directory

Commands run from the workspace root. Do not `cd` into subdirectories to run commands unless the project structure specifically requires it (e.g., a monorepo where a specific package needs to be the working directory). When in doubt, run from the root.

## The environment as a whole

These conventions reinforce each other. Proto manages the toolchain so that Node and pnpm versions are consistent. Pnpm manages dependencies with strict isolation. Node runs TypeScript natively so there's no compilation step for scripts. Strict type checking catches errors early. Working from the root keeps paths predictable.

When something feels like it needs a workaround — a global install, a loader, a type suppression, a directory change — that's usually a signal that the environment's conventions aren't being followed, not that they need to be bypassed.
