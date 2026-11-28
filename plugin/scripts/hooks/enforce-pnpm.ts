import { createPolicy } from "@wycats/agent-hooks";

createPolicy({
  name: "pnpm-enforcement",
  tool: "terminal",
  check({ command }) {
    if (!command) return;
    if (/\b(pnpm|pnpx)\b/.test(command)) return;

    if (/\bnpm\b/.test(command)) {
      return {
        deny: `This environment uses pnpm, not npm. Replace "npm" with "pnpm" in the command: ${command}`,
      };
    }

    if (/\bnpx\b/.test(command)) {
      return {
        deny: `This environment uses pnpm. "npx" is always wrong here. Use "pnpm run <script>" or "pnpx" instead. Command was: ${command}`,
      };
    }
  },
});
