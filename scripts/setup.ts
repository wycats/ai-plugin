/**
 * Interactive setup wizard. Asks a few questions, writes config.json,
 * runs the build, and (for VS Code) registers the plugin.
 */

import { parseBuildConfig } from "./build-config.ts";
import { readFile, writeFile, appendFile, access } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync, type ExecFileSyncOptionsWithBufferEncoding } from "node:child_process";
import { platform } from "node:os";
import * as p from "@clack/prompts";
import {
  CLAUDE_CODE_TARGET,
  CODEX_TARGET,
  displayOutputDirectoryForTarget,
  outputPathForTarget,
  VSCODE_TARGET,
} from "./target-output.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const CONFIG_PATH = join(ROOT, "config.json");
const VSCODE_EXAMPLE_PATH = join(ROOT, "config.example.json");
const CC_EXAMPLE_PATH = join(ROOT, "config.claude-code.example.json");
const CODEX_EXAMPLE_PATH = join(ROOT, "config.codex.example.json");

type VSCodeRegistrationOutcome =
  | { status: "registered"; label: string }
  | { status: "skipped" }
  | { status: "registration-cancelled" }
  | { status: "custom-cancelled" }
  | { status: "failed"; label: string; command: string };

const PRESETS: Record<string, Record<string, string | null>> = {
  codex: {
    fast: null,
    balanced: null,
    auxiliary: null,
  },
  copilot: {
    fast: null,
    balanced: null,
    auxiliary: null,
  },
  vercel: {
    fast: "Claude Opus 4.6 Fast (vercel)",
    balanced: "Gemini 3.1 Pro Preview (vercel)",
    auxiliary: "GPT 5.4 (vercel)",
  },
  claude: {
    fast: "opus",
    balanced: "sonnet",
    auxiliary: "haiku",
  },
};

async function configExists(): Promise<boolean> {
  try {
    await access(CONFIG_PATH);
    return true;
  } catch {
    return false;
  }
}

function quoteShellArg(arg: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(arg)) {
    return arg;
  }

  return `'${arg.replaceAll("'", "'\\''")}'`;
}

function formatInstallLocalCommand(args: string[]): string {
  const installArgs =
    args[0] === "scripts/install-local.ts" ? args.slice(1) : args;

  return ["pnpm", "install-local", "--", ...installArgs]
    .map(quoteShellArg)
    .join(" ");
}

function vscodeRegistrationLabel(target: string): string {
  switch (target) {
    case "stable":
      return "Stable VS Code";
    case "insiders":
      return "VS Code Insiders";
    case "custom":
      return "custom VS Code settings";
    default:
      return target;
  }
}

function logExecFileSyncError(err: unknown): void {
  if (typeof err !== "object" || err === null) {
    console.error(err);
    return;
  }

  const maybeOutput = err as {
    stdout?: Buffer;
    stderr?: Buffer;
    message?: string;
  };

  const stderr = maybeOutput.stderr?.toString().trim();
  const stdout = maybeOutput.stdout?.toString().trim();

  if (stderr) {
    console.error(stderr);
  }

  if (stdout) {
    console.error(stdout);
  }

  if (!stderr && !stdout) {
    console.error(maybeOutput.message ?? "Registration command failed.");
  }
}

function vscodeNextSteps(outcome: VSCodeRegistrationOutcome): {
  title: string;
  nextSteps: string;
} {
  switch (outcome.status) {
    case "registered":
      return {
        title: "All done",
        nextSteps: `Reload ${outcome.label} to pick up the plugin.`,
      };
    case "skipped":
      return {
        title: "Setup finished; registration skipped",
        nextSteps: [
          "The plugin was built, but no VS Code settings were changed.",
          "Register later with one of:",
          "  pnpm install-local -- --vscode-channel stable",
          "  pnpm install-local -- --vscode-channel insiders",
          "  pnpm install-local -- --settings <path>",
        ].join("\n"),
      };
    case "registration-cancelled":
      return {
        title: "Setup finished; registration cancelled",
        nextSteps: [
          "The plugin was built, but VS Code settings registration was cancelled.",
          "Rerun setup, choose Skip registration, or register manually with one of:",
          "  pnpm install-local -- --vscode-channel stable",
          "  pnpm install-local -- --vscode-channel insiders",
          "  pnpm install-local -- --settings <path>",
        ].join("\n"),
      };
    case "custom-cancelled":
      return {
        title: "Setup finished; custom registration cancelled",
        nextSteps: [
          "The plugin was built, but custom VS Code settings registration was cancelled.",
          "Rerun setup and choose Stable or Insiders, or register manually:",
          "  pnpm install-local -- --settings <path>",
        ].join("\n"),
      };
    case "failed":
      return {
        title: "Setup finished with registration follow-up needed",
        nextSteps: [
          `The plugin was built, but registration with ${outcome.label} failed.`,
          "Review the installer output above, then rerun:",
          `  ${outcome.command}`,
          "VS Code will not pick up the plugin until registration succeeds.",
        ].join("\n"),
      };
  }
}

async function setup() {
  p.intro("Plugin setup");
  let vscodeRegistrationOutcome: VSCodeRegistrationOutcome | undefined;

  // Check for existing config
  if (await configExists()) {
    const overwrite = await p.confirm({
      message: "config.json already exists. Overwrite it?",
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Setup cancelled. Your existing config.json is unchanged.");
      process.exit(0);
    }
  }

  // 1. Platform
  const target = await p.select({
    message: "What platform are you using?",
    options: [
      { value: "vscode", label: "VS Code", hint: "GitHub Copilot" },
      {
        value: "claude-code",
        label: "Claude Code",
        hint: "builds agents, skills, and hooks in Claude Code format",
      },
      {
        value: "codex",
        label: "Codex",
        hint: "builds a .codex-plugin package with skills",
      },
    ],
  });

  if (p.isCancel(target)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  // 2. Model provider (options depend on target)
  const providerOptions =
    target === CLAUDE_CODE_TARGET
      ? [
          {
            value: "claude",
            label: "Claude models",
            hint: "opus, sonnet, haiku",
          },
          {
            value: "custom",
            label: "Custom",
            hint: "you'll fill in model names yourself",
          },
        ]
      : target === CODEX_TARGET
        ? [
            {
              value: "codex",
              label: "Codex defaults",
              hint: "no specific models — Codex skills do not need model pins",
            },
            {
              value: "custom",
              label: "Custom",
              hint: "you'll fill in model names yourself",
            },
          ]
      : [
          {
            value: "copilot",
            label: "Copilot defaults",
            hint: "no specific models — the platform picks",
          },
          {
            value: "vercel",
            label: "Vercel AI Gateway",
            hint: "Claude, Gemini, GPT via Vercel",
          },
          {
            value: "claude",
            label: "Claude models",
            hint: "opus, sonnet, haiku",
          },
          {
            value: "custom",
            label: "Custom",
            hint: "you'll fill in model names yourself",
          },
        ];

  const provider = await p.select({
    message: "What model provider do you use?",
    options: providerOptions,
  });

  if (p.isCancel(provider)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  // 3. Resolve models
  let models: Record<string, string | null>;

  if (provider === "custom") {
    p.note(
      "Enter model names for each role, or leave blank for platform default.",
      "Custom models",
    );

    const fast = await p.text({
      message: "Fast model (execute, prepare, recon):",
      placeholder: "e.g. claude-opus-4-6",
    });
    if (p.isCancel(fast)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    const balanced = await p.text({
      message: "Balanced model (review):",
      placeholder: "e.g. claude-sonnet-4",
    });
    if (p.isCancel(balanced)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    const auxiliary = await p.text({
      message: "Auxiliary model (slop-linter):",
      placeholder: "e.g. claude-haiku-3",
    });
    if (p.isCancel(auxiliary)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    models = {
      fast: fast || null,
      balanced: balanced || null,
      auxiliary: auxiliary || null,
    };
  } else {
    models = PRESETS[provider];
  }

  // 4. Build config — use the right example for the target
  const examplePath =
    target === CLAUDE_CODE_TARGET
      ? CC_EXAMPLE_PATH
      : target === CODEX_TARGET
        ? CODEX_EXAMPLE_PATH
        : VSCODE_EXAMPLE_PATH;
  const example = parseBuildConfig(JSON.parse(await readFile(examplePath, "utf-8")) as unknown);

  const config = parseBuildConfig({
    $schema: "./config.schema.json",
    target,
    models,
    toolGroups: example.toolGroups,
    ...(example.hookMatchers ? { hookMatchers: example.hookMatchers } : {}),
  });

  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");

  // 5. Build
  const s = p.spinner();
  s.start("Building plugin");
  try {
    execFileSync("node", ["scripts/build.ts"], { cwd: ROOT, stdio: "pipe" });
    s.stop("Plugin built");
  } catch (err) {
    s.stop("Build failed");
    console.error(err);
    process.exit(1);
  }

  // 6. Register / launch
  if (target === VSCODE_TARGET) {
    const registrationTarget = await p.select({
      message: "Register the plugin with which VS Code target?",
      options: [
        {
          value: "stable",
          label: "Stable VS Code",
          hint: "updates Code/User/settings.json",
        },
        {
          value: "insiders",
          label: "VS Code Insiders",
          hint: "updates Code - Insiders/User/settings.json",
        },
        {
          value: "custom",
          label: "Custom settings path",
          hint: "choose an exact settings.json file",
        },
        {
          value: "skip",
          label: "Skip registration",
          hint: "build only; register manually later",
        },
      ],
    });

    if (p.isCancel(registrationTarget)) {
      vscodeRegistrationOutcome = { status: "registration-cancelled" };
      p.log.info("Cancelled VS Code settings registration.");
    } else if (registrationTarget === "skip") {
      vscodeRegistrationOutcome = { status: "skipped" };
      p.log.info("Skipped VS Code settings registration.");
    } else {
      const installArgs = ["scripts/install-local.ts"];

      if (registrationTarget === "custom") {
        const settingsPath = await p.text({
          message: "Path to VS Code settings.json:",
          placeholder: "~/Library/Application Support/Code - Insiders/User/settings.json",
          validate(value) {
            if (value === undefined || value.trim().length === 0) {
              return "Enter a settings path, or go back and choose Skip registration.";
            }

            return undefined;
          },
        });

        if (p.isCancel(settingsPath)) {
          vscodeRegistrationOutcome = { status: "custom-cancelled" };
          p.log.info("Skipped VS Code settings registration.");
        } else {
          installArgs.push("--settings", settingsPath);
        }
      } else {
        installArgs.push("--vscode-channel", registrationTarget);
      }

      if (installArgs.length > 1) {
        const label = vscodeRegistrationLabel(registrationTarget);
        const command = formatInstallLocalCommand(installArgs);

        s.start(`Registering with ${label}`);
        try {
          execFileSync("node", installArgs, {
            cwd: ROOT,
            stdio: "pipe",
          } satisfies ExecFileSyncOptionsWithBufferEncoding);
          vscodeRegistrationOutcome = { status: "registered", label };
          s.stop(`Registered with ${label}`);
        } catch (err) {
          vscodeRegistrationOutcome = { status: "failed", label, command };
          s.stop("Registration failed");
          logExecFileSyncError(err);
        }
      }
    }
  } else if (target === CLAUDE_CODE_TARGET) {
    // Offer to add a shell alias for persistent access
    const pluginDir = outputPathForTarget(ROOT, target as string);
    const aliasLine = `alias claude-plugin='claude --plugin-dir "${pluginDir}"'`;
    const shellRc = join(
      process.env.HOME ?? "",
      platform() === "darwin" ? ".zshrc" : ".bashrc",
    );

    const addAlias = await p.confirm({
      message: `Add a "claude-plugin" shell alias to ${shellRc.replace(process.env.HOME ?? "", "~")}?`,
      initialValue: true,
    });

    if (!p.isCancel(addAlias) && addAlias) {
      try {
        const existing = await readFile(shellRc, "utf-8").catch(() => "");
        if (existing.includes("claude-plugin")) {
          p.log.info("Alias already exists in shell config.");
        } else {
          await appendFile(
            shellRc,
            `\n# Claude Code with plugin\n${aliasLine}\n`,
          );
          p.log.success(
            `Added alias to ${shellRc.replace(process.env.HOME ?? "", "~")}`,
          );
          p.log.info("Run `source ~/.zshrc` or open a new terminal to use it.");
        }
      } catch (err: unknown) {
        p.log.error(`Could not write to ${shellRc}: ${String(err)}`);
      }
    }

    const launch = await p.confirm({
      message: "Launch Claude Code with the plugin now?",
      initialValue: true,
    });

    if (!p.isCancel(launch) && launch) {
      p.outro(`Launching Claude Code...`);
      execFileSync("node", ["scripts/launch-claude.ts"], {
        cwd: ROOT,
        stdio: "inherit",
      });
      return;
    }
  } else {
    p.log.info(
      [
        "Codex plugin built.",
        "To package a shareable local marketplace artifact, run:",
        "  pnpm package-codex",
      ].join("\n"),
    );
  }

  // 7. Done
  const outDir = displayOutputDirectoryForTarget(target as string);

  const vscodeCompletion =
    target === VSCODE_TARGET
      ? vscodeNextSteps(vscodeRegistrationOutcome ?? { status: "skipped" })
      : undefined;

  const nextSteps =
    target === VSCODE_TARGET
      ? (vscodeCompletion?.nextSteps ?? "Reload VS Code to pick up the plugin.")
      : target === CLAUDE_CODE_TARGET
        ? `To launch Claude Code with the plugin:\n  pnpm launch-claude\n\nUse /reload-plugins during a session to pick up rebuilds.`
        : `To package for local Codex testing:\n  pnpm package-codex\n\nThen add the generated local marketplace:\n  codex plugin marketplace add ${ROOT}/out/codex-marketplace\n\nFor the published marketplace:\n  codex plugin marketplace add wycats/vscode-ai-plugin --ref codex-plugin`;

  p.note(
    [
      `Config written to config.json`,
      `Plugin built to ${outDir}/`,
      "",
      nextSteps,
      "",
      "To rebuild after changes:  pnpm build",
      "To auto-rebuild on save:  pnpm watch",
    ].join("\n"),
    vscodeCompletion?.title ?? "All done",
  );

  p.outro("Happy coding!");
}

setup().catch((err: unknown) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
