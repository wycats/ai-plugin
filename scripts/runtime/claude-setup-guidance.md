---
name: setup-guidance
description: Install, refresh, remove, or repair this plugin's persistent guidance in a project.
argument-hint: "[install|remove|repair] [project directory]"
disable-model-invocation: true
---

Set up the plugin's persistent instructions for the project the user is working
in. This command installs an import in the project's CLAUDE.md; Claude loads the
complete guidance when starting or resuming a conversation. The user's output
style remains available.

Requested operation and project: $ARGUMENTS

Use `install` when no operation was supplied. Use the current working directory
unless the user names another project. Establish the absolute project path before
running the installer, and quote it as one shell argument. If the intended project
is ambiguous, resolve that with the user before writing.

The installer is `${CLAUDE_PLUGIN_ROOT}/scripts/claude-guidance.mjs`. Run:

```sh
node "${CLAUDE_PLUGIN_ROOT}/scripts/claude-guidance.mjs" <operation> --project <absolute-project-path> --dry-run
```

After a successful preview, run the same command without `--dry-run` to complete
the requested operation. Invoking this command authorizes that operation for the
selected project. Leave file ownership, imports, and recovery to the installer.
If it reports a conflict or pending operation, explain the reported condition
and the next action; obtain the user's choice before switching to `repair`.
Repair saves the previous managed files in a recovery directory.

Report the installed or removed paths and any recovery copy. After install or
repair, remind the user to start or resume a Claude conversation to load the
updated guidance. Run this command again after plugin updates to refresh the
export; use `remove` before uninstalling the plugin.
