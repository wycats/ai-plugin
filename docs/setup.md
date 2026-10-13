# Setup

This plugin provides a set of AI agents, skills, and workflow tools. It works with VS Code (via Copilot), Claude Code, and Codex — you configure it for your environment once, and a build step produces the files your platform needs.

## Quick start

```sh
git clone https://github.com/wycats/vscode-ai-plugin.git
cd vscode-ai-plugin
pnpm install
pnpm run setup
```

The setup wizard asks which platform and model provider you use, writes your `config.json`, builds the plugin, and (for VS Code) asks whether to register Stable, Insiders, a custom settings path, or skip registration. Reload the selected VS Code channel and you're done.

If you prefer to configure manually, copy `config.example.json` to `config.json`, edit it, and run `pnpm build` followed by an explicit local registration command such as `pnpm install-local -- --vscode-channel insiders` or `pnpm install-local -- --settings <path>`.

## How it works

Agent source files (in `agents/`) use abstract names for models and tools instead of hardcoded provider-specific values. For example, an agent says `model: fast` rather than naming a specific model.

Your `config.json` maps those abstract names to concrete values for your environment. The build reads the source files and your config, resolves the names, and writes ready-to-use files to the platform output directory: `out/wycats/` for VS Code, `out/claude-code/` for Claude Code, or `out/codex/` for Codex.

This means the same agent definitions work for everyone — you just change the config.

## VS Code local registration

For VS Code, the build writes the plugin to `out/wycats/`. Local registration adds that output directory to `chat.pluginLocations` in the selected VS Code `settings.json` file. The Agent Plugins 1.0 package discovers its Copilot hooks through `com.github.copilot/hooks/hooks.json`; separate hook registration is unnecessary. The installer removes this checkout's older plugin and hook registrations while preserving unrelated entries.

The registration target is explicit. The installer does not default to Stable VS Code, because many local development sessions run in VS Code Insiders.

### Choose Stable or Insiders

```sh
pnpm install-local -- --vscode-channel stable
pnpm install-local -- --vscode-channel insiders
```

The standard settings paths are:

| OS      | Stable                                                                 | Insiders                                                                            |
| ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| macOS   | `~/Library/Application Support/Code/User/settings.json`                | `~/Library/Application Support/Code - Insiders/User/settings.json`                  |
| Linux   | `${XDG_CONFIG_HOME:-~/.config}/Code/User/settings.json`                | `${XDG_CONFIG_HOME:-~/.config}/Code - Insiders/User/settings.json`                  |
| Windows | `${APPDATA:-~/AppData/Roaming}/Code/User/settings.json`                | `${APPDATA:-~/AppData/Roaming}/Code - Insiders/User/settings.json`                  |

### Use an exact settings path

Use `--settings` when you want full control, including temp fixtures or nonstandard VS Code profiles:

```sh
pnpm install-local -- --settings "~/Library/Application Support/Code - Insiders/User/settings.json"
```

Direct `--settings` and direct `--vscode-channel` are mutually exclusive. If both environment fallbacks and CLI flags are present, precedence is: `--settings`, `VSCODE_SETTINGS_PATH`, `--vscode-channel`, `VSCODE_CHANNEL`.

### Preview without writing

`--dry-run` runs the build, resolves the settings target, and reports stale registrations, already-enabled entries, and entries that would be added. It does not create directories, create settings files, or write changes.

```sh
pnpm install-local -- --dry-run --vscode-channel insiders
pnpm install-local -- --dry-run --settings /tmp/vscode-settings.json
```

Running `pnpm install-local` with no explicit target exits with a helpful error instead of guessing.

## Codex local marketplace

Codex consumes a `.codex-plugin/plugin.json` manifest and discovers skills from the plugin's `skills/` directory. To build just the Codex target:

```sh
pnpm build:codex
```

To package the generated plugin into an ignored local marketplace artifact:

```sh
pnpm package-codex
```

That command writes:

- `out/codex-marketplace/plugin/` — the Codex plugin package
- `out/codex-marketplace/.agents/plugins/marketplace.json` — a local Codex marketplace pointing at `./plugin`

Add the local marketplace and install:

```sh
codex plugin marketplace add ./out/codex-marketplace
codex plugin add wycats-ai-plugin@wycats-ai-plugin
```

Published Codex artifacts are generated from `main` and force-pushed to the
`codex-plugin` branch. Install the remote marketplace from that branch:

```sh
codex plugin marketplace add wycats/vscode-ai-plugin --ref codex-plugin
codex plugin add wycats-ai-plugin@wycats-ai-plugin
```

To refresh the configured Git marketplace after updates:

```sh
codex plugin marketplace upgrade wycats-ai-plugin
```

Then restart Codex. If the installed plugin cache appears stale, remove and
re-add the plugin after upgrading the marketplace.

If you installed the earlier main-branch Codex marketplace, migrate once:

```sh
codex plugin remove wycats-ai-plugin@wycats-ai-plugin
codex plugin marketplace remove wycats-ai-plugin
codex plugin marketplace add wycats/vscode-ai-plugin --ref codex-plugin
codex plugin add wycats-ai-plugin@wycats-ai-plugin
```

No VS Code migration is needed. VS Code still uses root `marketplace.json` and
`dist/wycats/` on `main`.

## Configuring `config.json`

The file has a JSON Schema (`config.schema.json`) that provides validation and autocomplete in VS Code and other editors. The `$schema` line at the top enables this.

### `target`

Which platform you're building for. This determines the output format and platform output directory.

- `"vscode"` — for VS Code with GitHub Copilot; builds to `out/wycats/`
- `"claude-code"` — for Claude Code; builds to `out/claude-code/`
- `"codex"` — for Codex; builds to `out/codex/`

### `models`

Three roles that agents use, mapped to model strings for your provider:

| Role        | What it's for                   | Which agents use it                   |
| ----------- | ------------------------------- | ------------------------------------- |
| `fast`      | Strong reasoning, complex tasks | execute, prepare, recon, recon-worker |
| `balanced`  | Evaluation and review           | review                                |
| `auxiliary` | Supporting tasks, lower cost    | pre-read, slop-linter                 |

Set a role to `null` to leave the model unspecified — the platform picks its default.

**Examples by provider:**

Copilot (no specific models needed):

```json
"models": {
  "fast": null,
  "balanced": null,
  "auxiliary": null
}
```

Vercel AI Gateway:

```json
"models": {
  "fast": "Claude Opus 4.6 Fast (vercel)",
  "balanced": "Gemini 3.1 Pro Preview (vercel)",
  "auxiliary": "GPT 5.4 (vercel)"
}
```

Claude Code:

```json
"models": {
  "fast": "opus",
  "balanced": "sonnet",
  "auxiliary": "haiku"
}
```

### `toolGroups`

Named sets of tool identifiers that agents reference. The defaults in `config.example.json` work for VS Code — you generally don't need to change these unless you're targeting a different platform or want to add/remove specific tools.

Each agent's source file lists the groups it needs (e.g., `tools: [core, agent, browser, memory]`). The build expands group names into concrete tool lists. If an agent lists a name that isn't a group, it passes through unchanged — so agents can mix groups and individual tools.

The default groups:

| Group              | What it provides                                                       |
| ------------------ | ---------------------------------------------------------------------- |
| `core`             | Basic capabilities: workspace access, file reading, search, web, todos |
| `agent`            | Dispatching subagents                                                  |
| `browser`          | Browser interaction                                                    |
| `edit`             | File editing (only the execute agent needs this)                       |
| `memory`           | Persistent memory across sessions                                      |
| `exo`              | Exosuit context tools                                                  |
| `terminal`         | Full terminal: run commands, await output, kill processes              |
| `terminal-minimal` | Just running commands and reading output                               |
| `testing`          | Running tests and inspecting failures                                  |
| `tasks`            | Creating and running VS Code tasks                                     |
| `github`           | GitHub PRs, issues, search, code review                                |

## Keeping up to date

```sh
git pull
pnpm build
```

Then reload VS Code. Your `config.json` is gitignored, so pulls won't overwrite it. If `config.example.json` adds new fields, you may want to merge them into your config.

## Development

To rebuild automatically when source files or config change:

```sh
pnpm watch
```

To validate the plugin structure:

```sh
pnpm validate
```
