# Antigravity

The Antigravity target builds the plugin's canonical skills, stances, agent
roles, and persistent guidance into one native plugin. It has its own runtime
adapter because Antigravity and Copilot load and execute agent resources
differently, even when they offer similar editing interfaces.

## Install and update

From a checkout with dependencies installed:

```sh
pnpm install:antigravity
```

This builds `out/antigravity/`, runs `agy plugin validate --strict`, and installs
it with `agy plugin install`. Repeat after pulling source changes. Antigravity
manages the global installation under `~/.gemini/config/plugins/wycats/`.
Start a new conversation, then inspect **Customizations → Installed** or use
`agy plugin list --json` to check discovery.

The installer checks `--agy`, then `ANTIGRAVITY_CLI`, then the bundled executable
in `~/.gemini/bin/`, and finally `agy` on PATH. Paths with spaces are supported.

```sh
pnpm build:antigravity                          # build only
pnpm install:antigravity --dry-run              # build and validate only
pnpm install:antigravity --agy /path/to/agy
pnpm install:antigravity --config config.antigravity.local.json
```

To customize the model or tool mappings, copy `config.antigravity.example.json`
to a local config. Model roles accept `inherit`, `flash_lite`, `flash`, `pro`, or
`null` for the host default. The setup wizard also offers Antigravity.

Updates are explicit, through the install command. This target does not yet
publish an Antigravity marketplace release or run an automatic updater.

## What differs from VS Code

Our `vscode` target configures Copilot. Antigravity uses a separate agent host:

| Resource | This repo's VS Code target | Antigravity target |
| --- | --- | --- |
| Skills | Shared `SKILL.md` format | Same prose and supporting files, with Antigravity activation metadata |
| Agent roles | Copilot names, tool IDs, and model strings | Native agents with `mainAgent`/`subagent`, model tiers, and explicit tool mappings |
| Building together | Generated SessionStart hook | Native `always_on` rule |
| Other instructions | Copilot instruction files | Omitted in this initial target |
| Authored policy/observer hooks | Included through the Copilot hook envelope | Omitted pending event and tool-envelope qualification |
| Installation | Local plugin-location setting or published package | `agy plugin install`, shared global plugin directory |

The default tool mappings cover file reading/search, shell commands, delegation,
and messages. The Recon worker can message its coordinator without receiving the
coordinator's delegation tool. Browser, memory, Exo, and dedicated GitHub/testing
tools need separate mappings; shell commands remain available within host
permissions. Agent definitions without an authored tool list use host defaults.

Stances remain available for contextual discovery. Antigravity documents
`disable-model-invocation` for explicit-only skills, but hiding individual
skills from the slash-command menu is not qualified. We preserve that limitation
in `projection-capabilities.json` rather than change when a stance applies.

Links are rewritten to relative destinations in the generated package, so the
package can move between build and install locations. Composition markers retain
their meaning: activity links request reading at entry, passage links request
reading when the governing prose applies, and references make further reading
available. These are model-directed reads; automatic linked-body preloading has
not been established for this target. A successful build or CLI validation does
not demonstrate that the model followed the guidance in a conversation.

## Sources and verification

- [Antigravity plugin authoring](https://antigravity.google/docs/build-plugins/)
- [Antigravity plugin installation](https://antigravity.google/docs/plugins)
- [Antigravity subagents](https://antigravity.google/docs/subagents)
- [VS Code agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)

The projection tests cover source fidelity, native envelopes, activation,
resource relocation, and invalid-model preflight. CI builds Antigravity on Linux
and Windows. Local installation additionally uses Antigravity's strict validator;
CI does not require an authenticated Antigravity installation.
